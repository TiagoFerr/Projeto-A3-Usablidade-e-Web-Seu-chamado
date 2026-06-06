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

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
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

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    // Validate role
    const accountRole = role === 'tech' ? 'tech' : 'client';

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já está sendo utilizado.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.toLowerCase().trim(), accountRole, passwordHash]
    );

    const user = newUser.rows[0];

    // Create and sign JWT with role
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso!', user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao registrar.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha e-mail e senha.' });
    }

    // Find user
    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = userQuery.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Create and sign JWT with role
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

// Logout User
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout realizado com sucesso.' });
});

// Get Current Logged-in User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});


// ==========================================
// USER ENDPOINTS (For assigning tickets)
// ==========================================

// Get All Users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email FROM users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
  }
});


// ==========================================
// TICKET CRUD ENDPOINTS
// ==========================================

// Get All Tickets
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

// Create Ticket
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

    res.status(201).json({ message: 'Chamado criado com sucesso!', ticket: result.rows[0] });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Erro ao criar chamado.' });
  }
});

// Update Ticket Details
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

    res.json({ message: 'Chamado atualizado com sucesso!', ticket: result.rows[0] });
  } catch (err) {
    console.error('Update ticket error:', err);
    res.status(500).json({ error: 'Erro ao atualizar chamado.' });
  }
});

// Update Ticket Status specifically (Optimized for Kanban Drag and Drop)
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

    const result = await db.query(
      `UPDATE tickets 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    res.json({ message: 'Status do chamado atualizado!', ticket: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Erro ao atualizar status do chamado.' });
  }
});

// Delete Ticket
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

// Catch-all route to serve the frontend pages if accessed directly without extensions
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Initialize database and then start listening
db.initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database on startup:', err);
  process.exit(1);
});
