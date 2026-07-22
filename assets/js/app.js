// =====================================================================
// APP.JS — cabeçalho, rodapé, modo escuro e funções usadas em todas
// as páginas. Chame `initHeader('home')` no final de cada página,
// passando o nome da página atual para destacar o link certo no menu.
// =====================================================================

const NAV_ITEMS = [
  { view: 'home',      href: 'index.html',        label: 'Início',            auth: false, roles: null },
  { view: 'library',   href: 'biblioteca.html',    label: 'Minha Biblioteca',  auth: true,  roles: null },
  { view: 'wallet',    href: 'carteira.html',      label: 'Carteira',          auth: true,  roles: null },
  { view: 'author',    href: 'painel-autor.html',  label: 'Painel do Autor',   auth: true,  roles: ['ESCRITOR', 'ADMIN'] },
];

/* ---------------------------------------------------------------------
   MODO ESCURO
   --------------------------------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem('mozlit_theme');
  const isDark = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = !isDark;
  document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  localStorage.setItem('mozlit_theme', next ? 'dark' : 'light');
  updateThemeIcon(next);
}

function updateThemeIcon(isDark) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.innerHTML = isDark
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>' // sol
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>'; // lua
}

/* ---------------------------------------------------------------------
   CHAMADAS RPC (funções do banco) — o supabase-js não "lança" erro
   sozinho, então esta função converte { data, error } em exceção,
   para podermos usar try/catch normalmente em todas as páginas.
   --------------------------------------------------------------------- */
async function callRpc(fnName, params) {
  const { data, error } = await supabaseClient.rpc(fnName, params);
  if (error) throw new Error(error.message || 'Ocorreu um erro. Tente novamente.');
  return data;
}

/* ---------------------------------------------------------------------
   FORMATAÇÃO
   --------------------------------------------------------------------- */
function formatMZN(valor) {
  const n = Number(valor) || 0;
  return n.toFixed(2) + ' MZN';
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d`;
  return new Date(dateStr).toLocaleDateString('pt-MZ');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* ---------------------------------------------------------------------
   CABEÇALHO (montado dinamicamente conforme login/papel do usuário)
   --------------------------------------------------------------------- */
async function initHeader(currentView) {
  initTheme();

  const profile = await getCurrentProfile();
  const headerRoot = document.getElementById('site-header');
  if (!headerRoot) return;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.auth && !profile) return false;
    if (item.roles && (!profile || !item.roles.includes(profile.role))) return false;
    return true;
  });

  const desktopLinks = visibleItems.map((item) => `
    <a href="${item.href}" class="nav-link ${item.view === currentView ? 'is-active' : ''}">${item.label}</a>
  `).join('');

  const mobileLinks = visibleItems.map((item) => `
    <a href="${item.href}" class="nav-link ${item.view === currentView ? 'is-active' : ''}">${item.label}</a>
  `).join('');

  const canPublish = profile && (profile.role === 'ESCRITOR' || profile.role === 'ADMIN');

  const rightSide = profile ? `
    ${canPublish ? `<a href="novo-livro.html" class="btn btn-ghost btn-sm" style="display:none" id="publish-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Publicar</a>` : ''}
    <button class="icon-btn" onclick="toggleTheme()" title="Alternar tema">
      <svg id="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></svg>
    </button>
    <span class="text-muted" style="font-size:.875rem; display:none" id="balance-display">${formatMZN(profile.saldo_carteira)}</span>
    <button class="icon-btn" onclick="logoutUser()" title="Sair">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    </button>
  ` : `
    <button class="icon-btn" onclick="toggleTheme()" title="Alternar tema">
      <svg id="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></svg>
    </button>
    <a href="login.html" class="btn btn-primary btn-sm">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Entrar
    </a>
  `;

  headerRoot.innerHTML = `
    <div class="site-header__bar">
      <button class="icon-btn menu-toggle" onclick="openMobileDrawer()" aria-label="Abrir menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>

      <a href="index.html" class="brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span class="brand__text">MozLit</span>
      </a>

      <nav class="main-nav">${desktopLinks}</nav>

      <div class="header-actions">${rightSide}</div>
    </div>

    <div class="mobile-drawer" id="mobile-drawer">
      <div class="mobile-drawer__backdrop" onclick="closeMobileDrawer()"></div>
      <div class="mobile-drawer__panel">
        <div class="mobile-drawer__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-600)"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          MozLit
        </div>
        <nav class="mobile-nav">${mobileLinks}</nav>
        <div style="padding-top:1.5rem; border-top:1px solid var(--border); margin-top:2rem;">
          ${profile ? `
            <p class="text-muted" style="font-size:.75rem; margin-bottom:.75rem;">${escapeHtml(profile.nome)}</p>
            <button class="btn-link" style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--destructive)" onclick="logoutUser()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sair
            </button>
          ` : `
            <a href="login.html" class="btn btn-outline btn-block">Entrar</a>
          `}
        </div>
      </div>
    </div>
  `;

  updateThemeIcon(document.documentElement.getAttribute('data-theme') === 'dark');
  return profile;
}

function openMobileDrawer() { document.getElementById('mobile-drawer').classList.add('is-open'); }
function closeMobileDrawer() { document.getElementById('mobile-drawer').classList.remove('is-open'); }

/* ---------------------------------------------------------------------
   RODAPÉ — mesmo texto em todas as páginas
   --------------------------------------------------------------------- */
function initFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="container">
      <p>MozLit — Plataforma Literária Moçambicana</p>
      <p>Leitura, Publicação e Monetização</p>
    </div>
  `;
}
