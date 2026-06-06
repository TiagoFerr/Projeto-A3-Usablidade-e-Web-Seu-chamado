

// Configurações da API de Autenticação
const AUTH_API = '/api/auth';

// Funções para exibição de alertas e mensagens
function showAlert(boxId, message, type = 'danger') {
  const alertBox = document.getElementById(boxId);
  if (!alertBox) return;

  alertBox.style.display = 'flex';
  alertBox.className = `alert alert-${type}`;
  alertBox.innerHTML = `
    <i class="ri-${type === 'danger' ? 'error-warning' : 'checkbox-circle'}-line"></i>
    <span>${message}</span>
  `;

  
  const cardBody = alertBox.closest('.modal-body') || alertBox.closest('.auth-card');
  if (cardBody) {
    cardBody.scrollTop = 0;
  }
}

function clearAlert(boxId) {
  const alertBox = document.getElementById(boxId);
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }
}

// Controle de alternância de abas (Login / Cadastro)
function switchTab(mode) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const authSubtitle = document.getElementById('authSubtitle');
  const toggleQuestion = document.getElementById('toggleQuestion');
  const toggleLink = document.getElementById('toggleLink');

  clearAlert('alertBox');

  if (mode === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    authSubtitle.innerText = 'Acesse o sistema de suporte de TI';
    toggleQuestion.innerText = 'Ainda não tem cadastro?';
    toggleLink.innerText = 'Criar conta';
    toggleLink.setAttribute('onclick', "switchTab('register')");
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    authSubtitle.innerText = 'Crie sua conta corporativa';
    toggleQuestion.innerText = 'Já tem cadastro?';
    toggleLink.innerText = 'Fazer Login';
    toggleLink.setAttribute('onclick', "switchTab('login')");
  }
}

function toggleAuthMode() {
  const isLoginActive = document.getElementById('tabLogin').classList.contains('active');
  switchTab(isLoginActive ? 'register' : 'login');
}


// Processamento de envio de formulários (Login / Cadastro)
async function handleLogin(event) {
  event.preventDefault();
  clearAlert('alertBox');

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btnSubmit = document.getElementById('btnLoginSubmit');

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = 'Conectando... <i class="ri-loader-4-line ri-spin"></i>';

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao autenticar.');
    }

    showAlert('alertBox', 'Login realizado com sucesso! Redirecionando...', 'success');
    
    
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1200);

  } catch (err) {
    showAlert('alertBox', err.message);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Entrar no Painel <i class="ri-arrow-right-line"></i>';
  }
}


async function handleRegister(event) {
  event.preventDefault();
  clearAlert('alertBox');

  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const role = document.getElementById('regRole').value;
  const password = document.getElementById('regPassword').value;
  const btnSubmit = document.getElementById('btnRegisterSubmit');

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = 'Cadastrando... <i class="ri-loader-4-line ri-spin"></i>';

  try {
    const response = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password })
    });

    
    
    
    
    
    
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao criar conta.');
    }

    showAlert('alertBox', 'Cadastro efetuado com sucesso! Entrando...', 'success');

    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1200);

  } catch (err) {
    showAlert('alertBox', err.message);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Criar Conta <i class="ri-user-add-line"></i>';
  }
}


// Encerramento de sessão (Logout)
async function handleLogout() {
  const confirmLogout = confirm('Tem certeza de que deseja sair da sua conta?');
  if (!confirmLogout) return;
  try {
    await fetch(`${AUTH_API}/logout`, { method: 'POST' });
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/index.html';
  }
}

// Verificação de sessão ativa e controle de acesso de rota
async function checkAuth() {
  const currentPath = window.location.pathname;

  try {
    const response = await fetch(`${AUTH_API}/me`);
    const data = await response.json();

    if (response.ok && data.user) {
      
      if (currentPath.includes('index.html') || currentPath === '/' || currentPath === '/login') {
        window.location.href = '/dashboard.html';
      }
      return data.user;
    } else {
      
      if (currentPath.includes('dashboard.html') || currentPath === '/dashboard') {
        window.location.href = '/index.html';
      }
    }
  } catch (err) {
    console.error('Auth check error:', err);
    if (currentPath.includes('dashboard.html') || currentPath === '/dashboard') {
      window.location.href = '/index.html';
    }
  }
  return null;
}

// Execução da validação de autenticação ao carregar a página
if (window.location.pathname.includes('dashboard.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });
}

// Sistema de Notificações flutuantes (Toast)
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'ri-checkbox-circle-line';
  if (type === 'warning') iconClass = 'ri-alert-line';
  if (type === 'danger') iconClass = 'ri-error-warning-line';
  if (type === 'info') iconClass = 'ri-information-line';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="ri-close-line"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 4000);
}
