let posts = [];
let users = [];
let nextPostId = 200;   // IDs locais para posts criados pelo usuário
let nextUserId = 20;    // IDs locais para usuários criados pelo usuário

async function fetchPosts() {
  document.getElementById('posts-list').innerHTML =
    `<div class="loader"><div class="spinner"></div><span>Carregando posts…</span></div>`;

  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!res.ok) throw new Error('Erro na requisição');

    posts = await res.json();
    document.getElementById('stat-posts').textContent = posts.length;
    renderPosts(posts);
    showToast('Posts carregados com sucesso!', 'success');

  } catch (e) {
    document.getElementById('posts-list').innerHTML =
      `<div class="empty">
        <div class="empty-icon"></div>
        <p>Erro ao carregar posts.<br><small>${e.message}</small></p>
      </div>`;
    showToast('Erro ao carregar posts.', 'error');
  }
}

async function fetchUsers() {
  document.getElementById('users-list').innerHTML =
    `<div class="loader"><div class="spinner"></div><span>Carregando usuários…</span></div>`;

  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!res.ok) throw new Error('Erro na requisição');

    users = await res.json();
    document.getElementById('stat-users').textContent = users.length;
    populateUserSelect();
    renderUsers(users);
    showToast('Usuários carregados com sucesso!', 'success');

  } catch (e) {
    document.getElementById('users-list').innerHTML =
      `<div class="empty">
        <div class="empty-icon">⚠️</div>
        <p>Erro ao carregar usuários.<br><small>${e.message}</small></p>
      </div>`;
    showToast('Erro ao carregar usuários.', 'error');
  }
}


// ============================================================
//  RENDER — Gera o HTML dos cards na tela
// ============================================================

function renderPosts(list) {
  const container = document.getElementById('posts-list');

  if (!list.length) {
    container.innerHTML =
      `<div class="empty"><div class="empty-icon">📭</div><p>Nenhum post encontrado.</p></div>`;
    return;
  }

  container.innerHTML = `<div class="grid">${list.map(post => `
    <div class="card" id="post-card-${post.id}">
      <div class="card-id">
        POST #${post.id} &nbsp;
        <span class="badge badge-blue">User ${post.userId}</span>
      </div>
      <div class="card-title">${escHtml(capitalize(post.title))}</div>
      <div class="card-body">${escHtml(post.body)}</div>
      <div class="card-actions">
        <button class="btn btn-edit btn-sm"   onclick="editPost(${post.id})">✏ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost(${post.id})">🗑 Remover</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderUsers(list) {
  const container = document.getElementById('users-list');

  if (!list.length) {
    container.innerHTML =
      `<div class="empty"><div class="empty-icon">👻</div><p>Nenhum usuário encontrado.</p></div>`;
    return;
  }

  container.innerHTML = `<div class="grid">${list.map(u => `
    <div class="card" id="user-card-${u.id}">
      <div class="card-id">
        USER #${u.id} &nbsp;
        <span class="badge badge-purple">${escHtml(u.username)}</span>
      </div>
      <div class="card-title">${escHtml(u.name)}</div>
      <div class="user-info">
        <div class="row">📧 <strong>${escHtml(u.email)}</strong></div>
        ${u.phone    ? `<div class="row"> <strong>${escHtml(u.phone)}</strong></div>`        : ''}
        ${u.website  ? `<div class="row"> <strong>${escHtml(u.website)}</strong></div>`      : ''}
        ${u.company?.name  ? `<div class="row"> <strong>${escHtml(u.company.name)}</strong></div>` : ''}
        ${u.address?.city  ? `<div class="row"> <strong>${escHtml(u.address.city)}</strong></div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn btn-edit btn-sm"   onclick="editUser(${u.id})">✏ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">🗑 Remover</button>
      </div>
    </div>`).join('')}
  </div>`;
}


// ============================================================
//  FILTER — Filtragem em tempo real pela caixa de busca
// ============================================================

function filterPosts() {
  const search = document
    .getElementById('search-posts')
    .value
    .trim()
    .toLowerCase();

  if (!search) {
    renderPosts(posts);
    return;
  }

  const filtered = posts.filter(post =>
    post.title.toLowerCase().includes(search) ||
    post.body.toLowerCase().includes(search)
  );

  renderPosts(filtered);
}

function filterUsers() {
  const q = document.getElementById('search-users').value.toLowerCase();
  renderUsers(
    users.filter(u =>
      u.name.toLowerCase().includes(q)     ||
      u.email.toLowerCase().includes(q)    ||
      u.username.toLowerCase().includes(q)
    )
  );
}


// ============================================================
//  MODAL — Abertura e fechamento dos formulários
// ============================================================

function openModal(type) {
  // Limpa os campos conforme o modal aberto
  if (type === 'add-post') {
    document.getElementById('modal-post-title').textContent = 'Novo Post';
    document.getElementById('post-title').value   = '';
    document.getElementById('post-body').value    = '';
    document.getElementById('post-edit-id').value = '';
  }

  if (type === 'add-user') {
    document.getElementById('modal-user-title').textContent = 'Novo Usuário';
    document.getElementById('user-name').value     = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-email').value    = '';
    document.getElementById('user-company').value  = '';
    document.getElementById('user-edit-id').value  = '';
  }

  document.getElementById(`modal-${type}`).classList.add('open');
}

function closeModal(type) {
  document.getElementById(`modal-${type}`).classList.remove('open');
}

// Fecha o modal ao clicar na área escura ao redor
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});


// ============================================================
//  CRUD — POSTS  (Create, Read, Update, Delete)
// ============================================================

function savePost() {
  const title  = document.getElementById('post-title').value.trim();
  const body   = document.getElementById('post-body').value.trim();
  const userId = parseInt(document.getElementById('post-userId').value) || 1;
  const editId = document.getElementById('post-edit-id').value;

  if (!title || !body) {
    showToast('Preencha título e corpo!', 'error');
    return;
  }

  if (editId) {
    // Atualiza post existente
    const idx = posts.findIndex(p => p.id == editId);
    if (idx !== -1) {
      posts[idx].title  = title;
      posts[idx].body   = body;
      posts[idx].userId = userId;
    }
    showToast('Post atualizado!', 'success');

  } else {
    // Cria novo post local
    const newPost = { id: nextPostId++, userId, title, body };
    posts.unshift(newPost);

    const addedEl = document.getElementById('stat-added');
    addedEl.textContent = parseInt(addedEl.textContent) + 1;
    showToast('Post adicionado!', 'success');
  }

  closeModal('add-post');
  filterPosts();
}

function editPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  document.getElementById('modal-post-title').textContent = 'Editar Post';
  document.getElementById('post-title').value   = post.title;
  document.getElementById('post-body').value    = post.body;
  document.getElementById('post-edit-id').value = post.id;
  document.getElementById('post-userId').value  = post.userId;
  document.getElementById('modal-add-post').classList.add('open');
}

const index = posts.findIndex(p => p.id === id);

if (index !== -1) {
    posts.splice(index, 1);
}


// ============================================================
//  CRUD — USUÁRIOS  (Create, Read, Update, Delete)
// ============================================================

function saveUser() {
  const name     = document.getElementById('user-name').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const email    = document.getElementById('user-email').value.trim();
  const company  = document.getElementById('user-company').value.trim();
  const editId   = document.getElementById('user-edit-id').value;

  if (!name || !username || !email) {
    showToast('Preencha nome, username e e-mail!', 'error');
    return;
  }

  if (editId) {
    // Atualiza usuário existente
    const idx = users.findIndex(u => u.id == editId);
    if (idx !== -1) {
      users[idx].name     = name;
      users[idx].username = username;
      users[idx].email    = email;
      users[idx].company  = { name: company };
    }
    showToast('Usuário atualizado!', 'success');

  } else {
    // Cria novo usuário local
    users.unshift({
      id: nextUserId++,
      name,
      username,
      email,
      company: { name: company },
      phone: '',
      website: '',
      address: {}
    });
    document.getElementById('stat-users').textContent = users.length;
    populateUserSelect();
    showToast('Usuário adicionado!', 'success');
  }

  closeModal('add-user');
  filterUsers();
}

function editUser(id) {
  const u = users.find(u => u.id === id);
  if (!u) return;

  document.getElementById('modal-user-title').textContent = 'Editar Usuário';
  document.getElementById('user-name').value     = u.name;
  document.getElementById('user-username').value = u.username;
  document.getElementById('user-email').value    = u.email;
  document.getElementById('user-company').value  = u.company?.name || '';
  document.getElementById('user-edit-id').value  = u.id;
  document.getElementById('modal-add-user').classList.add('open');
}

function deleteUser(id) {
  users = users.filter(u => u.id !== id);
  document.getElementById('stat-users').textContent = users.length;
  populateUserSelect();
  filterUsers();
  showToast('Usuário removido.', 'success');
}


// ============================================================
//  HELPERS — Funções utilitárias reutilizáveis
// ============================================================

/** Preenche o <select> de usuários no formulário de posts */
function populateUserSelect() {
  const sel = document.getElementById('post-userId');
  sel.innerHTML = users
    .map(u => `<option value="${u.id}">${u.id} — ${u.name}</option>`)
    .join('');
}

/** Alterna entre as abas Posts e Usuários */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  btn.classList.add('active');
}

/** Exibe uma notificação temporária no canto inferior direito */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');

  // Ajusta classes mantendo controle previsível
  toast.classList.remove('success', 'error');
  toast.classList.add(type);
  icon.textContent = type === 'success' ? '✓' : '✕';
  document.getElementById('toast-msg').textContent = msg;

  toast.classList.add('show');
  clearTimeout(toast.timeout);

toast.timeout = setTimeout(() => {
    toast.classList.remove('show');
}, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

fetchPosts();
fetchUsers();