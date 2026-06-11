

// Configurações gerais de API e estado da aplicação
const TICKETS_API = '/api/tickets';
const USERS_API = '/api/users';

let currentUser = null;
let allTickets = [];
let allUsers = [];
let activeDragCard = null;

// Mapeamento dos contêineres e colunas do Kanban no DOM
const kanbanContainers = {
  todo: document.getElementById('container-todo'),
  in_progress: document.getElementById('container-in_progress'),
  review: document.getElementById('container-review'),
  done: document.getElementById('container-done')
};

const columnCounts = {
  todo: document.getElementById('count-todo'),
  in_progress: document.getElementById('count-in_progress'),
  review: document.getElementById('count-review'),
  done: document.getElementById('count-done')
};

// Inicialização do painel e carregamento das permissões de usuário
document.addEventListener('DOMContentLoaded', async () => {
  // Inicialização do Modo Escuro
  initTheme();

  currentUser = await checkAuth();
  if (!currentUser) return; 

  
  document.getElementById('navUserName').innerText = currentUser.name;
  document.getElementById('navUserInitials').innerText = getInitials(currentUser.name);
  
  const isTech = currentUser.role === 'tech';
  const roleLabel = isTech ? 'Técnico de TI' : 'Cliente';
  document.getElementById('navUserRoleBadge').innerText = roleLabel;
  
  
  const techAssignGroup = document.getElementById('techAssignGroup');
  if (isTech) {
    techAssignGroup.style.display = 'block';
  } else {
    techAssignGroup.style.display = 'none';
  }

  
  const banner = document.getElementById('roleAlertBanner');
  const bannerText = document.getElementById('roleAlertText');
  banner.style.display = 'flex';
  if (isTech) {
    banner.className = 'alert alert-success';
    bannerText.innerHTML = `<strong>Acesso Técnico:</strong> Você pode arrastar os chamados para alterar o status, atribuir responsáveis e gerenciar toda a fila Kanban.`;
  } else {
    banner.className = 'alert alert-success';
    banner.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    banner.style.borderColor = 'rgba(59, 130, 246, 0.2)';
    bannerText.innerHTML = `<strong>Acesso Cliente:</strong> O painel Kanban está no modo leitura (bloqueado para arrastar). Você pode abrir chamados e atualizar/excluir chamados criados por você.`;
  }

  
  await loadUsers();
  await loadTickets();
});


// Funções utilitárias auxiliares
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Carregamento de dados do Servidor (API)
async function loadUsers() {
  try {
    const response = await fetch(USERS_API);
    if (response.ok) {
      allUsers = await response.json();
      populateUserDropdowns();
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

function populateUserDropdowns() {
  const createAssigneeSelect = document.getElementById('ticketAssignee');
  const detailAssigneeSelect = document.getElementById('detailAssigneeSelect');

  
  createAssigneeSelect.innerHTML = '<option value="">Não atribuído</option>';
  detailAssigneeSelect.innerHTML = '<option value="">Não atribuído</option>';

  allUsers.forEach(user => {
    
    const label = user.role === 'tech' ? `${user.name} (Técnico)` : user.name;
    const optionHTML = `<option value="${user.id}">${label}</option>`;
    createAssigneeSelect.insertAdjacentHTML('beforeend', optionHTML);
    detailAssigneeSelect.insertAdjacentHTML('beforeend', optionHTML);
  });
}

async function loadTickets() {
  try {
    const response = await fetch(TICKETS_API);
    if (response.ok) {
      allTickets = await response.json();
      renderBoard();
    } else {
      console.error('Failed to load tickets');
    }
  } catch (err) {
    console.error('Error loading tickets:', err);
  }
}

// Renderização do Quadro Kanban e filtros de pesquisa
function renderBoard() {
  
  Object.keys(kanbanContainers).forEach(status => {
    kanbanContainers[status].innerHTML = '';
  });

  const searchVal = document.getElementById('searchFilter').value.toLowerCase().trim();
  const categoryVal = document.getElementById('categoryFilter').value;
  const priorityVal = document.getElementById('priorityFilter').value;

  const filteredTickets = allTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchVal) || 
                          ticket.description.toLowerCase().includes(searchVal);
    const matchesCategory = categoryVal === '' || ticket.category === categoryVal;
    const matchesPriority = priorityVal === '' || ticket.priority === priorityVal;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Atualizar painel de métricas corporativas
  updateMetrics(allTickets);
  
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };

  filteredTickets.forEach(ticket => {
    const card = createTicketCard(ticket);
    const status = ticket.status;
    if (kanbanContainers[status]) {
      kanbanContainers[status].appendChild(card);
      counts[status]++;
    }
  });

  
  Object.keys(columnCounts).forEach(status => {
    columnCounts[status].innerText = counts[status];
    
    
    if (counts[status] === 0) {
      const emptyMsg = `
        <div class="empty-column-message">
          <i class="ri-folder-open-line"></i>
          <span>Nenhum chamado</span>
        </div>
      `;
      kanbanContainers[status].innerHTML = emptyMsg;
    }
  });
}


// Construção do elemento HTML de cada cartão de chamado
function createTicketCard(ticket) {
  const isTech = currentUser.role === 'tech';
  const card = document.createElement('div');
  
  card.className = 'ticket-card';
  card.setAttribute('id', `ticket-${ticket.id}`);
  card.setAttribute('data-id', ticket.id);
  
  
  if (isTech) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  } else {
    card.setAttribute('draggable', 'false');
    card.style.cursor = 'pointer';
  }

  
  card.addEventListener('click', (e) => {
    
    if (card.classList.contains('dragging')) return;
    openDetailsModal(ticket);
  });

  
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const priorityClass = `priority-${ticket.priority}`;
  
  
  const categoryLabels = { hardware: 'Hardware', software: 'Software', network: 'Rede', other: 'Geral' };
  const catLabel = categoryLabels[ticket.category] || 'Geral';
  const catDotClass = `category-dot ${ticket.category || 'other'}`;

  
  const lockIconHTML = !isTech ? '<i class="ri-lock-line" title="Kanban em modo leitura"></i> ' : '';

  
  const assigneeInitial = ticket.assignee_name ? getInitials(ticket.assignee_name) : '?';
  const assigneeName = ticket.assignee_name ? ticket.assignee_name : 'Não Atribuído';
  const assigneeAvatarHTML = ticket.assignee_name 
    ? `<div class="ticket-assignee-avatar" title="Atribuído a: ${assigneeName}">${assigneeInitial}</div>` 
    : `<div class="ticket-assignee-avatar" style="border-style: dashed; color: var(--text-muted);" title="Não Atribuído"><i class="ri-user-add-line"></i></div>`;

  const dateStr = formatDate(ticket.created_at);

  const sla = getSlaInfo(ticket);
  const slaBadgeHTML = `<span class="sla-tag ${sla.class}" style="font-size: 0.58rem; padding: 1px 4px;"><i class="${sla.icon}"></i> ${sla.text}</span>`;

  card.innerHTML = `
    <div class="ticket-badges">
      <span class="ticket-badge ${priorityClass}">${priorityLabels[ticket.priority]}</span>
      ${slaBadgeHTML}
      <span class="category-tag">
        ${lockIconHTML}<span class="${catDotClass}"></span> ${catLabel}
      </span>
    </div>
    <h4 class="ticket-title">${escapeHTML(ticket.title)}</h4>
    <p class="ticket-desc-snippet">${escapeHTML(ticket.description)}</p>
    <div class="ticket-footer">
      <div class="ticket-assignee">
        ${assigneeAvatarHTML}
        <span>${escapeHTML(assigneeName.split(' ')[0])}</span>
      </div>
      <span class="ticket-date">${dateStr}</span>
    </div>
  `;

  return card;
}


function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// Aplicação dos filtros de busca do painel
function applyFilters() {
  renderBoard();
}

// Controle e manipulação de Arrastar e Soltar (Drag and Drop)
function handleDragStart(e) {
  activeDragCard = this;
  this.classList.add('dragging');
  // Carry card ID inside dataTransfer
  e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  activeDragCard = null;
  // Clean all drag-over visual highlights on columns
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function allowDrop(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
  // Find column ancestor
  const col = e.target.closest('.kanban-column');
  if (col) {
    col.classList.add('drag-over');
  }
}

function dragLeave(e) {
  const col = e.target.closest('.kanban-column');
  // Check if we are leaving the column container rather than cards inside it
  if (col && !col.contains(e.relatedTarget)) {
    col.classList.remove('drag-over');
  }
}

async function handleDrop(e) {
  e.preventDefault();
  
  const col = e.target.closest('.kanban-column');
  if (!col) return;

  col.classList.remove('drag-over');

  const ticketId = e.dataTransfer.getData('text/plain');
  const newStatus = col.getAttribute('data-status');

  if (!ticketId || !newStatus) return;

  // Optimistic UI update (Nielsen Heuristic #1)
  const ticket = allTickets.find(t => t.id == ticketId);
  if (ticket && ticket.status !== newStatus) {
    const oldStatus = ticket.status;
    ticket.status = newStatus;
    renderBoard();

    // Call API to persist state
    try {
      const response = await fetch(`${TICKETS_API}/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status.');
      }
      showToast('Status do chamado atualizado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status do chamado.', 'danger');
      // Revert if API fails
      ticket.status = oldStatus;
      renderBoard();
    }
  }
}

// Gerenciamento de modais e validação de formulários
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  if (modalId === 'createModal') {
    validateFormOnInput();
    setupValidationBlurListeners();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  if (modalId === 'createModal') {
    document.getElementById('createTicketForm').reset();
    clearAlert('modalAlert');
    resetFormValidation();
  }
  if (modalId === 'detailsModal') {
    document.getElementById('newCommentContent').value = '';
    updateCommentCharCount();
  }
}

function closeModalConfirm(modalId) {
  if (modalId === 'createModal') {
    const title = document.getElementById('ticketTitle').value.trim();
    const desc = document.getElementById('ticketDesc').value.trim();
    if (title || desc) {
      const discard = confirm('Você começou a preencher o chamado. Tem certeza de que deseja descartar este rascunho? O conteúdo digitado será perdido.');
      if (!discard) return;
    }
  }
  closeModal(modalId);
}

function openCreateModal() {
  openModal('createModal');
}

// Validação em tempo real do formulário (Prevenção de erros e recuperação)
function validateFormOnInput() {
  const titleInput = document.getElementById('ticketTitle');
  const descInput = document.getElementById('ticketDesc');
  const btnSubmit = document.getElementById('btnSubmitTicket');

  if (!titleInput || !descInput || !btnSubmit) return;

  const title = titleInput.value;
  const desc = descInput.value;

  // Update Counters
  document.getElementById('titleCharCount').innerText = `${title.length} / 150`;
  document.getElementById('descCharCount').innerText = `${desc.length} / 1000`;

  // Validation logic
  const isTitleValid = title.trim().length >= 5;
  const isDescValid = desc.trim().length >= 10;

  // Enable/Disable Confirm button based on validation status
  btnSubmit.disabled = !(isTitleValid && isDescValid);

  // Dynamically hide errors if they correct it
  if (isTitleValid) {
    titleInput.classList.remove('input-error');
    document.getElementById('titleError').style.display = 'none';
  }
  if (isDescValid) {
    descInput.classList.remove('input-error');
    document.getElementById('descError').style.display = 'none';
  }
}

// Setup Blur events so validation errors only show when tabbed out (prevents early warnings)
function setupValidationBlurListeners() {
  const titleInput = document.getElementById('ticketTitle');
  const descInput = document.getElementById('ticketDesc');

  if (!titleInput || !descInput) return;

  // Use distinct named functions to avoid duplicate listeners on reopen
  if (!titleInput.dataset.hasBlurListener) {
    titleInput.addEventListener('blur', () => {
      const isTitleValid = titleInput.value.trim().length >= 5;
      if (!isTitleValid && titleInput.value.length > 0) {
        titleInput.classList.add('input-error');
        document.getElementById('titleError').style.display = 'block';
      }
    });
    titleInput.dataset.hasBlurListener = 'true';
  }

  if (!descInput.dataset.hasBlurListener) {
    descInput.addEventListener('blur', () => {
      const isDescValid = descInput.value.trim().length >= 10;
      if (!isDescValid && descInput.value.length > 0) {
        descInput.classList.add('input-error');
        document.getElementById('descError').style.display = 'block';
      }
    });
    descInput.dataset.hasBlurListener = 'true';
  }
}

function resetFormValidation() {
  const titleInput = document.getElementById('ticketTitle');
  const descInput = document.getElementById('ticketDesc');
  
  if (titleInput) titleInput.classList.remove('input-error');
  if (descInput) descInput.classList.remove('input-error');
  
  const titleErr = document.getElementById('titleError');
  const descErr = document.getElementById('descError');
  
  if (titleErr) titleErr.style.display = 'none';
  if (descErr) descErr.style.display = 'none';
  
  const titleCnt = document.getElementById('titleCharCount');
  const descCnt = document.getElementById('descCharCount');
  
  if (titleCnt) titleCnt.innerText = '0 / 150';
  if (descCnt) descCnt.innerText = '0 / 1000';
}

// Create Ticket submit handler
async function handleCreateTicket(event) {
  event.preventDefault();
  clearAlert('modalAlert');

  const title = document.getElementById('ticketTitle').value;
  const description = document.getElementById('ticketDesc').value;
  const priority = document.getElementById('ticketPriority').value;
  const category = document.getElementById('ticketCategory').value;
  
  // Only techs can pre-assign directly on creation
  const assignedSelect = document.getElementById('ticketAssignee');
  const assigned_to = assignedSelect ? assignedSelect.value : '';

  const btnSubmit = document.getElementById('btnSubmitTicket');
  btnSubmit.disabled = true;
  btnSubmit.innerText = 'Salvando...';

  try {
    const response = await fetch(TICKETS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, category, assigned_to })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar chamado.');
    }

    closeModal('createModal');
    showToast('Chamado criado com sucesso!', 'success');
    await loadTickets();

  } catch (err) {
    showAlert('modalAlert', err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = 'Criar Chamado';
  }
}

// Detalhes do chamado (Visualização, alteração de status/atribuição e exclusão)
let activeDetailsTicketId = null;

function openDetailsModal(ticket) {
  activeDetailsTicketId = ticket.id;
  
  const isTech = currentUser.role === 'tech';
  const isCreator = ticket.created_by === currentUser.id;

  // Set text contents
  document.getElementById('detailModalTitle').innerText = `Chamado #${ticket.id}: ${ticket.title}`;
  document.getElementById('detailDescription').innerText = ticket.description;
  
  // Status layout
  const statusLabels = { todo: 'Pendente', in_progress: 'Em Atendimento', review: 'Em Revisão', done: 'Concluído' };
  const detailStatusText = document.getElementById('detailStatusText');
  detailStatusText.innerText = statusLabels[ticket.status] || ticket.status;
  detailStatusText.className = `detail-value ticket-badge priority-${ticket.status === 'todo' ? 'low' : ticket.status === 'done' ? 'low' : 'medium'}`; // quick styling
  
  // Priority Layout
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const detailPriority = document.getElementById('detailPriority');
  detailPriority.innerText = priorityLabels[ticket.priority] || ticket.priority;
  detailPriority.className = `detail-value ticket-badge priority-${ticket.priority}`;

  // SLA Layout inside Modal
  const sla = getSlaInfo(ticket);
  const detailSlaStatus = document.getElementById('detailSlaStatus');
  detailSlaStatus.innerText = sla.text;
  detailSlaStatus.className = `detail-value sla-tag ${sla.class}`;

  // Category Layout
  const categoryLabels = { hardware: 'Hardware', software: 'Software', network: 'Rede', other: 'Geral' };
  document.getElementById('detailCategory').innerText = categoryLabels[ticket.category] || 'Geral';
  
  // Date and Creator info
  document.getElementById('detailCreator').innerText = ticket.creator_name || 'Desconhecido';
  
  const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  document.getElementById('detailDate').innerText = new Date(ticket.created_at).toLocaleDateString('pt-BR', dateOptions);

  // Assignee Management
  const detailAssigneeName = document.getElementById('detailAssigneeName');
  const detailAssigneeSelect = document.getElementById('detailAssigneeSelect');
  
  if (ticket.assigned_to) {
    detailAssigneeName.innerText = ticket.assigned_name || ticket.assignee_name;
  } else {
    detailAssigneeName.innerText = 'Não atribuído';
  }

  // Permissões de Design baseadas no cargo (Nielsen Heuristic #3)
  if (isTech) {
    // Technicians can re-assign directly
    detailAssigneeName.style.display = 'none';
    detailAssigneeSelect.style.display = 'inline-block';
    detailAssigneeSelect.value = ticket.assigned_to || '';
  } else {
    detailAssigneeName.style.display = 'inline-block';
    detailAssigneeSelect.style.display = 'none';
  }

  // Delete control: Allowed for Techs or the Client creator
  const btnDelete = document.getElementById('btnDeleteTicket');
  if (isTech || isCreator) {
    btnDelete.style.display = 'inline-flex';
  } else {
    btnDelete.style.display = 'none';
  }

  // Move status dropdown for clients (since they cannot drag and drop)
  const detailStatusSelect = document.getElementById('detailStatusSelect');
  
  if (isTech || isCreator) {
    detailStatusText.style.display = 'none';
    detailStatusSelect.style.display = 'inline-block';
    detailStatusSelect.value = ticket.status;
  } else {
    detailStatusText.style.display = 'inline-block';
    detailStatusSelect.style.display = 'none';
  }

  // Toggle Subtasks Form visibility based on role
  const addSubtaskForm = document.getElementById('addSubtaskForm');
  if (isTech) {
    addSubtaskForm.style.display = 'flex';
  } else {
    addSubtaskForm.style.display = 'none';
  }

  // Load activities, comments and subtasks
  loadModalDetails(ticket.id);

  openModal('detailsModal');
}

// Handle change in Assignee Dropdown (Tech only)
async function handleAssigneeChange(event) {
  if (!activeDetailsTicketId) return;
  const newAssigneeId = event.target.value;

  const ticket = allTickets.find(t => t.id === activeDetailsTicketId);
  if (!ticket) return;

  const originalAssignee = ticket.assigned_to;
  
  // Optimistic UI update
  ticket.assigned_to = newAssigneeId ? parseInt(newAssigneeId) : null;
  const selectedUserObj = allUsers.find(u => u.id == newAssigneeId);
  ticket.assignee_name = selectedUserObj ? selectedUserObj.name : null;
  renderBoard();

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        category: ticket.category,
        status: ticket.status,
        assigned_to: newAssigneeId || null
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar responsável.');
    }
    showToast('Responsável atualizado com sucesso!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro ao atualizar responsável.', 'danger');
    // Revert on failure
    ticket.assigned_to = originalAssignee;
    const oldUserObj = allUsers.find(u => u.id == originalAssignee);
    ticket.assignee_name = oldUserObj ? oldUserObj.name : null;
    renderBoard();
    
    // Refresh modal selects
    document.getElementById('detailAssigneeSelect').value = originalAssignee || '';
  }
}

// Handle change in Status Dropdown
async function handleStatusChange(event) {
  if (!activeDetailsTicketId) return;
  const newStatus = event.target.value;

  const ticket = allTickets.find(t => t.id === activeDetailsTicketId);
  if (!ticket) return;

  const originalStatus = ticket.status;

  // Optimistic update
  ticket.status = newStatus;
  renderBoard();
  
  // Also update badge color inside modal
  const statusLabels = { todo: 'Pendente', in_progress: 'Em Atendimento', review: 'Em Revisão', done: 'Concluído' };
  const detailStatusText = document.getElementById('detailStatusText');
  if (detailStatusText) {
    detailStatusText.innerText = statusLabels[newStatus];
    detailStatusText.className = `detail-value ticket-badge priority-${newStatus === 'todo' ? 'low' : newStatus === 'done' ? 'low' : 'medium'}`;
  }

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar status.');
    }
    showToast('Status do chamado atualizado com sucesso!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro ao atualizar status do chamado.', 'danger');
    // Revert
    ticket.status = originalStatus;
    renderBoard();
    document.getElementById('detailStatusSelect').value = originalStatus;
    if (detailStatusText) {
      detailStatusText.innerText = statusLabels[originalStatus];
      detailStatusText.className = `detail-value ticket-badge priority-${originalStatus === 'todo' ? 'low' : originalStatus === 'done' ? 'low' : 'medium'}`;
    }
  }
}

// Handle ticket deletion
async function handleDeleteTicket() {
  if (!activeDetailsTicketId) return;

  const confirmDelete = confirm('Tem certeza de que deseja excluir permanentemente este chamado?');
  if (!confirmDelete) return;

  const btnDelete = document.getElementById('btnDeleteTicket');
  btnDelete.disabled = true;
  btnDelete.innerText = 'Excluindo...';

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir chamado.');
    }

    closeModal('detailsModal');
    showToast('Chamado excluído com sucesso!', 'success');
    await loadTickets();

  } catch (err) {
    showToast(err.message, 'danger');
    btnDelete.disabled = false;
    btnDelete.innerHTML = '<i class="ri-delete-bin-line"></i> Excluir Chamado';
  }
}


// ==========================================================================
// ENRIQUECIMENTO: CONTROLES DE TEMA, MÉTRICAS, SLA, COMENTÁRIOS E SUBTAREFAS
// ==========================================================================

// 1. Controle de Tema (Modo Escuro / Claro)
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    updateThemeIcon(true);
  } else {
    document.body.classList.remove('dark-mode');
    updateThemeIcon(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  showToast(`Modo ${isDark ? 'Escuro' : 'Claro'} ativado.`, 'info');
}

function updateThemeIcon(isDark) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    if (isDark) {
      icon.className = 'ri-sun-line';
      icon.setAttribute('title', 'Ativar Modo Claro');
    } else {
      icon.className = 'ri-moon-line';
      icon.setAttribute('title', 'Ativar Modo Escuro');
    }
  }
}

// 2. Cálculo e Atualização das Estatísticas/Métricas
function updateMetrics(tickets) {
  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'done').length;
  const critical = tickets.filter(t => t.priority === 'high' && t.status !== 'done').length;
  
  const resolvedPercent = total > 0 ? Math.round((resolved / total) * 100) : 0;

  document.getElementById('metricTotal').innerText = total;
  document.getElementById('metricResolvedPercent').innerText = `${resolvedPercent}%`;
  document.getElementById('metricResolvedCount').innerText = resolved;
  document.getElementById('metricCritical').innerText = critical;

  // Distribuição de categorias
  const categories = { hardware: 0, software: 0, network: 0, other: 0 };
  tickets.forEach(t => {
    const cat = t.category || 'other';
    if (categories.hasOwnProperty(cat)) {
      categories[cat]++;
    } else {
      categories.other++;
    }
  });

  const categoryLabels = { hardware: 'Hardware', software: 'Software', network: 'Rede', other: 'Geral' };
  const container = document.getElementById('categoryDistributionContainer');
  if (container) {
    container.innerHTML = '';

    Object.keys(categories).forEach(cat => {
      const count = categories[cat];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const barClass = `category-progress-bar-fill ${cat}`;
      
      const progressHTML = `
        <div style="margin-bottom: 4px; width: 100%;">
          <div class="category-progress-item">
            <span>${categoryLabels[cat]}</span>
            <strong>${count} (${pct}%)</strong>
          </div>
          <div class="category-progress-bar-bg">
            <div class="${barClass}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', progressHTML);
    });
  }

  // Distribuição de prioridades
  const priorities = { high: 0, medium: 0, low: 0 };
  tickets.forEach(t => {
    const prio = t.priority || 'medium';
    if (priorities.hasOwnProperty(prio)) {
      priorities[prio]++;
    } else {
      priorities.medium++;
    }
  });

  const priorityLabels = { high: 'Alta / Crítica', medium: 'Média', low: 'Baixa' };
  const priorityColors = { high: '#ef4444', medium: '#fb923c', low: '#3b82f6' };
  const priorityContainer = document.getElementById('statsPriorityDistribution');
  if (priorityContainer) {
    priorityContainer.innerHTML = '';
    Object.keys(priorities).forEach(prio => {
      const count = priorities[prio];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const progressHTML = `
        <div style="margin-bottom: 4px; width: 100%;">
          <div class="category-progress-item">
            <span>${priorityLabels[prio]}</span>
            <strong>${count} (${pct}%)</strong>
          </div>
          <div class="category-progress-bar-bg">
            <div class="category-progress-bar-fill" style="width: ${pct}%; background-color: ${priorityColors[prio]};"></div>
          </div>
        </div>
      `;
      priorityContainer.insertAdjacentHTML('beforeend', progressHTML);
    });
  }

  // Distribuição de status
  const statuses = { todo: 0, in_progress: 0, review: 0, done: 0 };
  tickets.forEach(t => {
    const status = t.status || 'todo';
    if (statuses.hasOwnProperty(status)) {
      statuses[status]++;
    } else {
      statuses.todo++;
    }
  });

  const statusLabels = { todo: 'Pendentes', in_progress: 'Em Atendimento', review: 'Em Revisão', done: 'Concluídos' };
  const statusColors = { todo: '#64748b', in_progress: '#2563eb', review: '#fb923c', done: '#10b981' };
  const statusContainer = document.getElementById('statsStatusDistribution');
  if (statusContainer) {
    statusContainer.innerHTML = '';
    Object.keys(statuses).forEach(stat => {
      const count = statuses[stat];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const progressHTML = `
        <div style="margin-bottom: 4px; width: 100%;">
          <div class="category-progress-item">
            <span>${statusLabels[stat]}</span>
            <strong>${count} (${pct}%)</strong>
          </div>
          <div class="category-progress-bar-bg">
            <div class="category-progress-bar-fill" style="width: ${pct}%; background-color: ${statusColors[stat]};"></div>
          </div>
        </div>
      `;
      statusContainer.insertAdjacentHTML('beforeend', progressHTML);
    });
  }
}

// 3. Auxiliares e Lógica de SLA
function getSlaInfo(ticket) {
  const prioritySLALimits = {
    high: 4 * 60 * 60 * 1000,     // 4 horas
    medium: 24 * 60 * 60 * 1000,  // 24 horas
    low: 72 * 60 * 60 * 1000      // 72 horas
  };

  const limitMs = prioritySLALimits[ticket.priority] || prioritySLALimits.medium;
  const creationTime = new Date(ticket.created_at).getTime();
  const limitTime = creationTime + limitMs;
  const now = Date.now();

  if (ticket.status === 'done') {
    const resolutionTime = new Date(ticket.updated_at).getTime();
    if (resolutionTime <= limitTime) {
      return { text: 'SLA Resolvido', class: 'sla-normal', icon: 'ri-checkbox-circle-line' };
    } else {
      return { text: 'Resolvido c/ Atraso', class: 'sla-breached', icon: 'ri-error-warning-line' };
    }
  }

  const remainingMs = limitTime - now;

  if (remainingMs < 0) {
    return { text: 'SLA Estourado', class: 'sla-breached', icon: 'ri-error-warning-line' };
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (remainingMs < 1 * 60 * 60 * 1000) {
    return { text: `SLA: ${remainingMinutes}m restando`, class: 'sla-warning', icon: 'ri-time-line' };
  }

  return { text: `SLA: ${remainingHours}h ${remainingMinutes}m`, class: 'sla-normal', icon: 'ri-time-line' };
}

// 4. Carregamento de Detalhes Complementares do Modal (Atividades, Comentários, Subtarefas)
async function loadModalDetails(ticketId) {
  document.getElementById('commentsList').innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Carregando comentários...</p>';
  document.getElementById('activitiesTimeline').innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Carregando histórico...</p>';
  document.getElementById('subtasksList').innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Carregando subtarefas...</p>';

  try {
    const [commentsRes, activitiesRes, subtasksRes] = await Promise.all([
      fetch(`${TICKETS_API}/${ticketId}/comments`),
      fetch(`${TICKETS_API}/${ticketId}/activities`),
      fetch(`${TICKETS_API}/${ticketId}/subtasks`)
    ]);

    if (commentsRes.ok) {
      const comments = await commentsRes.json();
      renderComments(comments);
    }
    
    if (activitiesRes.ok) {
      const activities = await activitiesRes.json();
      renderActivities(activities);
    }

    if (subtasksRes.ok) {
      const subtasks = await subtasksRes.json();
      renderSubtasks(subtasks);
    }
  } catch (err) {
    console.error('Error loading ticket sub-details:', err);
  }
}

// Renders
function renderComments(comments) {
  const list = document.getElementById('commentsList');
  list.innerHTML = '';
  
  if (comments.length === 0) {
    list.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Nenhuma mensagem enviada.</p>';
    return;
  }

  comments.forEach(c => {
    const isTech = c.user_role === 'tech';
    const roleBadge = isTech ? '<span class="comment-author-badge">Técnico</span>' : '';
    const dateStr = new Date(c.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const bubbleClass = `comment-bubble ${isTech ? 'tech-comment' : ''}`;
    
    const commentHTML = `
      <div class="${bubbleClass}">
        <div class="comment-header">
          <span class="comment-author">${escapeHTML(c.user_name)}${roleBadge}</span>
          <span class="comment-date">${dateStr}</span>
        </div>
        <div class="comment-content">${escapeHTML(c.content)}</div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', commentHTML);
  });
  
  list.scrollTop = list.scrollHeight;
}

function renderActivities(activities) {
  const container = document.getElementById('activitiesTimeline');
  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Nenhum histórico registrado.</p>';
    return;
  }

  activities.forEach(act => {
    const dateStr = new Date(act.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const userName = act.user_name ? act.user_name : 'Sistema';
    const isSystem = !act.user_name;
    const itemClass = `timeline-item ${isSystem ? 'system' : ''}`;
    
    const activityHTML = `
      <div class="${itemClass}">
        <span class="timeline-time">${dateStr}</span>
        <div class="timeline-text">
          <span class="timeline-user">${escapeHTML(userName)}</span> ${escapeHTML(act.action_desc)}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', activityHTML);
  });
}

function renderSubtasks(subtasks) {
  const list = document.getElementById('subtasksList');
  list.innerHTML = '';
  
  const isTech = currentUser.role === 'tech';

  if (subtasks.length === 0) {
    list.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px 0;">Nenhuma subtarefa criada.</p>';
    return;
  }

  subtasks.forEach(s => {
    const checked = s.is_completed ? 'checked' : '';
    const completedClass = s.is_completed ? 'completed' : '';
    const disabled = !isTech ? 'disabled' : '';
    
    const deleteBtn = isTech 
      ? `<button class="btn-delete-subtask" onclick="handleDeleteSubtask(${s.id})" title="Remover subtarefa"><i class="ri-delete-bin-line"></i></button>`
      : '';

    const subtaskHTML = `
      <div class="subtask-item">
        <label class="subtask-checkbox-group ${completedClass}">
          <input type="checkbox" ${checked} ${disabled} onchange="handleToggleSubtask(${s.id}, this.checked)">
          <span>${escapeHTML(s.title)}</span>
        </label>
        ${deleteBtn}
      </div>
    `;
    list.insertAdjacentHTML('beforeend', subtaskHTML);
  });
}

// 5. Handlers de Eventos
async function handleAddComment(event) {
  event.preventDefault();
  if (!activeDetailsTicketId) return;

  const textarea = document.getElementById('newCommentContent');
  const content = textarea.value.trim();
  const btn = document.getElementById('btnSubmitComment');

  if (!content) return;

  btn.disabled = true;
  btn.innerText = 'Enviando...';

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (response.ok) {
      textarea.value = '';
      updateCommentCharCount();
      await loadModalDetails(activeDetailsTicketId);
    } else {
      const data = await response.json();
      showToast(data.error || 'Erro ao enviar comentário.', 'danger');
    }
  } catch (err) {
    console.error('Error posting comment:', err);
    showToast('Erro ao enviar comentário.', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Enviar Mensagem';
  }
}

function updateCommentCharCount() {
  const textarea = document.getElementById('newCommentContent');
  const countSpan = document.getElementById('commentCharCount');
  if (textarea && countSpan) {
    countSpan.innerText = `${textarea.value.length} / 1000`;
  }
}

async function handleAddSubtask(event) {
  event.preventDefault();
  if (!activeDetailsTicketId) return;

  const input = document.getElementById('newSubtaskTitle');
  const title = input.value.trim();
  if (!title) return;

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (response.ok) {
      input.value = '';
      await loadModalDetails(activeDetailsTicketId);
    } else {
      const data = await response.json();
      showToast(data.error || 'Erro ao adicionar subtarefa.', 'danger');
    }
  } catch (err) {
    console.error('Error posting subtask:', err);
    showToast('Erro ao adicionar subtarefa.', 'danger');
  }
}

async function handleToggleSubtask(subtaskId, isCompleted) {
  if (!activeDetailsTicketId) return;

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: isCompleted })
    });

    if (response.ok) {
      await loadModalDetails(activeDetailsTicketId);
    } else {
      showToast('Erro ao atualizar subtarefa.', 'danger');
      await loadModalDetails(activeDetailsTicketId);
    }
  } catch (err) {
    console.error('Error toggling subtask:', err);
    showToast('Erro ao atualizar subtarefa.', 'danger');
  }
}

async function handleDeleteSubtask(subtaskId) {
  if (!activeDetailsTicketId) return;
  
  const confirmDel = confirm('Deseja excluir esta subtarefa?');
  if (!confirmDel) return;

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await loadModalDetails(activeDetailsTicketId);
    } else {
      showToast('Erro ao excluir subtarefa.', 'danger');
    }
  } catch (err) {
    console.error('Error deleting subtask:', err);
    showToast('Erro ao excluir subtarefa.', 'danger');
  }
}

// 6. Controle de Abas, Histórico Geral e Links de Timeline
function switchDashboardTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  const activeContent = document.getElementById(`tab-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  if (tabId === 'logs') {
    loadGlobalActivities();
  }
}

async function loadGlobalActivities() {
  const timeline = document.getElementById('globalActivitiesTimeline');
  if (!timeline) return;

  timeline.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px 0;">Carregando histórico...</p>';

  try {
    const response = await fetch('/api/activities');
    if (!response.ok) {
      throw new Error('Falha ao carregar histórico.');
    }
    const activities = await response.json();
    
    if (activities.length === 0) {
      timeline.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px 0;">Nenhum histórico registrado no sistema.</p>';
      return;
    }

    timeline.innerHTML = '';
    activities.forEach(act => {
      const dateStr = new Date(act.created_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const userName = act.user_name ? act.user_name : 'Sistema';
      const isSystem = !act.user_id;
      const itemClass = `global-timeline-item ${isSystem ? 'system' : ''}`;
      
      const ticketRefHTML = act.ticket_id
        ? `<a href="#" class="global-timeline-ticket-ref" onclick="event.preventDefault(); openTicketFromTimeline(${act.ticket_id})">
            <i class="ri-ticket-2-line"></i> #${act.ticket_id} - ${escapeHTML(act.ticket_title)}
           </a>`
        : '';

      const html = `
        <div class="${itemClass}">
          <div class="global-timeline-card">
            <div class="global-timeline-header">
              <span class="global-timeline-user">${escapeHTML(userName)}</span>
              <span class="global-timeline-time">${dateStr}</span>
            </div>
            <div class="global-timeline-body">
              ${escapeHTML(act.action_desc)}
            </div>
            ${ticketRefHTML}
          </div>
        </div>
      `;
      timeline.insertAdjacentHTML('beforeend', html);
    });
  } catch (err) {
    console.error('Error loading global activities:', err);
    timeline.innerHTML = '<p style="font-size: 0.8rem; color: var(--color-danger); text-align: center; padding: 20px 0;">Erro ao carregar histórico global.</p>';
  }
}

function openTicketFromTimeline(ticketId) {
  const ticket = allTickets.find(t => t.id == ticketId);
  if (ticket) {
    openDetailsModal(ticket);
  } else {
    loadTickets().then(() => {
      const t = allTickets.find(x => x.id == ticketId);
      if (t) {
        openDetailsModal(t);
      } else {
        showToast('Chamado não encontrado.', 'danger');
      }
    });
  }
}
