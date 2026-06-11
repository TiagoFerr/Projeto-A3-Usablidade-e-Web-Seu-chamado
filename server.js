// Importações e configurações gerais do servidor
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Configuração de middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificação de token de acesso (JWT)
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Por favor, faça login.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
  }
};

// Rotas de Autenticação e Usuários
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const accountRole = role === 'tech' ? 'tech' : 'client';

    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já está sendo utilizado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.toLowerCase().trim(), accountRole, passwordHash]
    );

    const user = newUser.rows[0];

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso!', user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao registrar.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha e-mail e senha.' });
    }

    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = userQuery.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login bem-sucedido!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao fazer login.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout realizado com sucesso.' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email FROM users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
  }
});

// Rotas para gerenciamento de chamados (Tickets)
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        creator.name as creator_name,
        creator.email as creator_email,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM tickets t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({ error: 'Erro ao buscar chamados.' });
  }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, category, assigned_to } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    const assignedVal = assigned_to ? parseInt(assigned_to) : null;

    const result = await db.query(
      `INSERT INTO tickets (title, description, priority, category, created_by, assigned_to, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'todo') 
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        priority || 'medium',
        category || 'other',
        req.user.id,
        assignedVal
      ]
    );

    const ticket = result.rows[0];

    // Log automatic activity for ticket creation
    await db.query(
      'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
      [ticket.id, req.user.id, 'Chamado criado']
    );

    if (assignedVal) {
      const assigneeQuery = await db.query('SELECT name FROM users WHERE id = $1', [assignedVal]);
      const assigneeName = assigneeQuery.rows[0] ? assigneeQuery.rows[0].name : 'Desconhecido';
      await db.query(
        'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
        [ticket.id, req.user.id, `Responsável inicial definido como ${assigneeName}`]
      );
    }

    res.status(201).json({ message: 'Chamado criado com sucesso!', ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Erro ao criar chamado.' });
  }
});

app.put('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category, assigned_to, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    const assignedVal = assigned_to ? parseInt(assigned_to) : null;

    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }
    const oldTicket = ticketCheck.rows[0];

    const result = await db.query(
      `UPDATE tickets 
       SET title = $1, description = $2, priority = $3, category = $4, assigned_to = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        priority || 'medium',
        category || 'other',
        assignedVal,
        status || 'todo',
        id
      ]
    );

    const newTicket = result.rows[0];

    // Log priority change
    if (oldTicket.priority !== newTicket.priority) {
      const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
      await db.query(
        'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
        [id, req.user.id, `Prioridade alterada de ${priorityLabels[oldTicket.priority] || oldTicket.priority} para ${priorityLabels[newTicket.priority] || newTicket.priority}`]
      );
    }
    
    // Log category change
    if (oldTicket.category !== newTicket.category) {
      const categoryLabels = { hardware: 'Hardware', software: 'Software', network: 'Rede', other: 'Geral' };
      await db.query(
        'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
        [id, req.user.id, `Categoria alterada de ${categoryLabels[oldTicket.category] || oldTicket.category} para ${categoryLabels[newTicket.category] || newTicket.category}`]
      );
    }

    // Log status change
    if (oldTicket.status !== newTicket.status) {
      const statusLabels = { todo: 'Pendente', in_progress: 'Em Atendimento', review: 'Em Revisão', done: 'Concluído' };
      await db.query(
        'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
        [id, req.user.id, `Status alterado de ${statusLabels[oldTicket.status] || oldTicket.status} para ${statusLabels[newTicket.status] || newTicket.status}`]
      );
    }

    // Log assignee change
    if (oldTicket.assigned_to !== newTicket.assigned_to) {
      if (newTicket.assigned_to) {
        const assigneeQuery = await db.query('SELECT name FROM users WHERE id = $1', [newTicket.assigned_to]);
        const assigneeName = assigneeQuery.rows[0] ? assigneeQuery.rows[0].name : 'Desconhecido';
        await db.query(
          'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
          [id, req.user.id, `Responsável alterado para ${assigneeName}`]
        );
      } else {
        await db.query(
          'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
          [id, req.user.id, 'Responsável removido (não atribuído)']
        );
      }
    }

    res.json({ message: 'Chamado atualizado com sucesso!', ticket: newTicket });
  } catch (err) {
    console.error('Update ticket error:', err);
    res.status(500).json({ error: 'Erro ao atualizar chamado.' });
  }
});

app.patch('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }
    const oldStatus = ticketCheck.rows[0].status;

    const result = await db.query(
      `UPDATE tickets 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (oldStatus !== status) {
      const statusLabels = { todo: 'Pendente', in_progress: 'Em Atendimento', review: 'Em Revisão', done: 'Concluído' };
      await db.query(
        'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
        [id, req.user.id, `Status alterado de ${statusLabels[oldStatus] || oldStatus} para ${statusLabels[status] || status}`]
      );
    }

    res.json({ message: 'Status do chamado atualizado!', ticket: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Erro ao atualizar status do chamado.' });
  }
});

app.delete('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    await db.query('DELETE FROM tickets WHERE id = $1', [id]);
    res.json({ message: 'Chamado excluído com sucesso.' });
  } catch (err) {
    console.error('Delete ticket error:', err);
    res.status(500).json({ error: 'Erro ao excluir chamado.' });
  }
});

// GET latest global activities
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.name as user_name, u.role as user_role, t.title as ticket_title
      FROM ticket_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tickets t ON a.ticket_id = t.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch all activities error:', err);
    res.status(500).json({ error: 'Erro ao buscar atividades globais.' });
  }
});

// Rotas de Comentários, Atividades e Subtarefas
// GET comments for a ticket
app.get('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Erro ao buscar comentários do chamado.' });
  }
});

// POST a comment on a ticket
app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'O conteúdo do comentário não pode estar vazio.' });
    }

    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    const result = await db.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, content.trim()]
    );

    // Fetch the new comment with user details
    const newComment = await db.query(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    // Also register an activity log for the comment
    await db.query(
      'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
      [id, req.user.id, 'Adicionou um comentário']
    );

    res.status(201).json(newComment.rows[0]);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Erro ao enviar comentário.' });
  }
});

// GET activities for a ticket
app.get('/api/tickets/:id/activities', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM ticket_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = $1
      ORDER BY a.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch activities error:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico de atividades.' });
  }
});

// GET subtasks for a ticket
app.get('/api/tickets/:id/subtasks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM ticket_subtasks WHERE ticket_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch subtasks error:', err);
    res.status(500).json({ error: 'Erro ao buscar subtarefas do chamado.' });
  }
});

// POST a subtask on a ticket (Techs only)
app.post('/api/tickets/:id/subtasks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (req.user.role !== 'tech') {
      return res.status(403).json({ error: 'Apenas técnicos podem gerenciar subtarefas.' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'O título da subtarefa não pode estar vazio.' });
    }

    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    const result = await db.query(
      'INSERT INTO ticket_subtasks (ticket_id, title) VALUES ($1, $2) RETURNING *',
      [id, title.trim()]
    );

    // Also register an activity log for the subtask
    await db.query(
      'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
      [id, req.user.id, `Adicionou subtarefa: "${title.trim()}"`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create subtask error:', err);
    res.status(500).json({ error: 'Erro ao criar subtarefa.' });
  }
});

// PUT (toggle) a subtask (Techs only)
app.put('/api/tickets/:id/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { id, subtaskId } = req.params;
    const { is_completed } = req.body;

    if (req.user.role !== 'tech') {
      return res.status(403).json({ error: 'Apenas técnicos podem gerenciar subtarefas.' });
    }

    const subtaskCheck = await db.query('SELECT * FROM ticket_subtasks WHERE id = $1 AND ticket_id = $2', [subtaskId, id]);
    if (subtaskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarefa não encontrada.' });
    }

    const result = await db.query(
      'UPDATE ticket_subtasks SET is_completed = $1 WHERE id = $2 RETURNING *',
      [!!is_completed, subtaskId]
    );

    const subtask = result.rows[0];
    const statusText = subtask.is_completed ? 'Concluiu' : 'Desmarcou';

    // Also register an activity log for the subtask toggle
    await db.query(
      'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
      [id, req.user.id, `${statusText} a subtarefa: "${subtask.title}"`]
    );

    res.json(subtask);
  } catch (err) {
    console.error('Toggle subtask error:', err);
    res.status(500).json({ error: 'Erro ao atualizar subtarefa.' });
  }
});

// DELETE a subtask (Techs only)
app.delete('/api/tickets/:id/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    if (req.user.role !== 'tech') {
      return res.status(403).json({ error: 'Apenas técnicos podem gerenciar subtarefas.' });
    }

    const subtaskCheck = await db.query('SELECT * FROM ticket_subtasks WHERE id = $1 AND ticket_id = $2', [subtaskId, id]);
    if (subtaskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarefa não encontrada.' });
    }

    const subtask = subtaskCheck.rows[0];

    await db.query('DELETE FROM ticket_subtasks WHERE id = $1', [subtaskId]);

    // Also register an activity log for the subtask deletion
    await db.query(
      'INSERT INTO ticket_activities (ticket_id, user_id, action_desc) VALUES ($1, $2, $3)',
      [id, req.user.id, `Removeu a subtarefa: "${subtask.title}"`]
    );

    res.json({ message: 'Subtarefa excluída com sucesso.' });
  } catch (err) {
    console.error('Delete subtask error:', err);
    res.status(500).json({ error: 'Erro ao excluir subtarefa.' });
  }
});


// Rotas para servir páginas estáticas do frontend
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Inicialização do banco de dados e início do servidor
db.initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database on startup:', err);
  process.exit(1);
});
