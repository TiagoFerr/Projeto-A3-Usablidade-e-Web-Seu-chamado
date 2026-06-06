/**
   Seu Chamado - Kanban Board & Ticket Operations
   Implements HTML5 Drag and Drop, Filtering, Modals, and API synchronization
 */

const TICKETS_API = '/api/tickets';
const USERS_API = '/api/users';

let currentUser = null;
let allTickets = [];
let allUsers = [];
let activeDragCard = null;

// DOM Elements
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

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await checkAuth();
  if (!currentUser) return; // checkAuth will redirect if session is invalid

  // Update nav profile
  document.getElementById('navUserName').innerText = currentUser.name;
  document.getElementById('navUserInitials').innerText = getInitials(currentUser.name);
  
  const isTech = currentUser.role === 'tech';
  const roleLabel = isTech ? 'Técnico de TI' : 'Cliente';
  document.getElementById('navUserRoleBadge').innerText = roleLabel;
  
  // Show/Hide open assign field in create modal
  const techAssignGroup = document.getElementById('techAssignGroup');
  if (isTech) {
    techAssignGroup.style.display = 'block';
  } else {
    techAssignGroup.style.display = 'none';
  }

  // Set visual feedback banner based on user role (Nielsen Heuristic #1)
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

  // Load initial data
  await loadUsers();
  await loadTickets();
});

// Helper: Get Initials
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Load users list for assignment selectors
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

// Populate Assignment Dropdowns (Nielsen Heuristic #6 Recognition)
function populateUserDropdowns() {
  const createAssigneeSelect = document.getElementById('ticketAssignee');
  const detailAssigneeSelect = document.getElementById('detailAssigneeSelect');

  // Clear previous options except the default ones
  createAssigneeSelect.innerHTML = '<option value="">Não atribuído</option>';
  detailAssigneeSelect.innerHTML = '<option value="">Não atribuído</option>';

  allUsers.forEach(user => {
    // We can assign to anyone, but techs are highlighted
    const label = user.role === 'tech' ? `${user.name} (Técnico)` : user.name;
    const optionHTML = `<option value="${user.id}">${label}</option>`;
    createAssigneeSelect.insertAdjacentHTML('beforeend', optionHTML);
    detailAssigneeSelect.insertAdjacentHTML('beforeend', optionHTML);
  });
}

// Load Tickets from API
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

// Render tickets on the Kanban Board
function renderBoard() {
  // Clear columns
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

  // Track counts per column
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };

  filteredTickets.forEach(ticket => {
    const card = createTicketCard(ticket);
    const status = ticket.status;
    if (kanbanContainers[status]) {
      kanbanContainers[status].appendChild(card);
      counts[status]++;
    }
  });

  // Update header counters (Nielsen Heuristic #1 Status visibility)
  Object.keys(columnCounts).forEach(status => {
    columnCounts[status].innerText = counts[status];
    
    // If column has 0 cards, display an empty state placeholder
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

// Create Card HTML Element
function createTicketCard(ticket) {
  const isTech = currentUser.role === 'tech';
  const card = document.createElement('div');
  
  card.className = 'ticket-card';
  card.setAttribute('id', `ticket-${ticket.id}`);
  card.setAttribute('data-id', ticket.id);
  
  // DRAG AND DROP ACCESS CONTROL: Only technicians can drag cards!
  if (isTech) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  } else {
    card.setAttribute('draggable', 'false');
    card.style.cursor = 'pointer';
  }

  // Handle card click to view details (Nielsen Heuristic #7)
  card.addEventListener('click', (e) => {
    // Prevent trigger if they are dragging
    if (card.classList.contains('dragging')) return;
    openDetailsModal(ticket);
  });

  // Priority Badge layout
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const priorityClass = `priority-${ticket.priority}`;
  
  // Category layout
  const categoryLabels = { hardware: 'Hardware', software: 'Software', network: 'Rede', other: 'Geral' };
  const catLabel = categoryLabels[ticket.category] || 'Geral';
  const catDotClass = `category-dot ${ticket.category || 'other'}`;

  // Usability Lock Icon for Clients (Nielsen Heuristics #1 & #5)
  const lockIconHTML = !isTech ? '<i class="ri-lock-line" title="Kanban em modo leitura"></i> ' : '';

  // Assignee layout
  const assigneeInitial = ticket.assignee_name ? getInitials(ticket.assignee_name) : '?';
  const assigneeName = ticket.assignee_name ? ticket.assignee_name : 'Não Atribuído';
  const assigneeAvatarHTML = ticket.assignee_name 
    ? `<div class="ticket-assignee-avatar" title="Atribuído a: ${assigneeName}">${assigneeInitial}</div>` 
    : `<div class="ticket-assignee-avatar" style="border-style: dashed; color: var(--text-muted);" title="Não Atribuído"><i class="ri-user-add-line"></i></div>`;

  const dateStr = formatDate(ticket.created_at);

  card.innerHTML = `
    <div class="ticket-badges">
      <span class="ticket-badge ${priorityClass}">${priorityLabels[ticket.priority]}</span>
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

// Helpers for HTML Escaping & Date Formatting
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

// Filters implementation
function applyFilters() {
  renderBoard();
}

// ==========================================
// HTML5 DRAG & DROP EVENT HANDLERS (TECHS)
// ==========================================
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
    } catch (err) {
      console.error(err);
      // Revert if API fails
      ticket.status = oldStatus;
      renderBoard();
    }
  }
}

// ==========================================
// MODALS MANAGEMENT & USABILITY VALIDATION
// ==========================================
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

// Live Validation (Heuristic #5 Error Prevention & Heuristic #9 Recovery)
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
    // Refresh tickets list
    await loadTickets();

  } catch (err) {
    showAlert('modalAlert', err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = 'Criar Chamado';
  }
}

// ==========================================
// TICKET DETAILS MODAL (VIEW / EDIT / DELETE)
// ==========================================
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
  const detailStatus = document.getElementById('detailStatus');
  detailStatus.innerText = statusLabels[ticket.status] || ticket.status;
  detailStatus.className = `detail-value ticket-badge priority-${ticket.status === 'todo' ? 'low' : ticket.status === 'done' ? 'low' : 'medium'}`; // quick styling
  
  // Priority Layout
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const detailPriority = document.getElementById('detailPriority');
  detailPriority.innerText = priorityLabels[ticket.priority] || ticket.priority;
  detailPriority.className = `detail-value ticket-badge priority-${ticket.priority}`;

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
  const clientMoveSelector = document.getElementById('clientMoveSelector');
  const detailStatusSelect = document.getElementById('detailStatusSelect');
  
  if (isTech) {
    // Techs can use drag and drop, but we can also display status switcher
    clientMoveSelector.style.display = 'flex';
    detailStatusSelect.value = ticket.status;
  } else if (isCreator) {
    // Client who created it can move it (e.g. to mark as resolved or ask for review)
    clientMoveSelector.style.display = 'flex';
    detailStatusSelect.value = ticket.status;
  } else {
    clientMoveSelector.style.display = 'none';
  }

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
  } catch (err) {
    console.error(err);
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
  const detailStatus = document.getElementById('detailStatus');
  detailStatus.innerText = statusLabels[newStatus];

  try {
    const response = await fetch(`${TICKETS_API}/${activeDetailsTicketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar status.');
    }
  } catch (err) {
    console.error(err);
    // Revert
    ticket.status = originalStatus;
    renderBoard();
    document.getElementById('detailStatusSelect').value = originalStatus;
    detailStatus.innerText = statusLabels[originalStatus];
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
    await loadTickets();

  } catch (err) {
    alert(err.message);
    btnDelete.disabled = false;
    btnDelete.innerHTML = '<i class="ri-delete-bin-line"></i> Excluir Chamado';
  }
}
