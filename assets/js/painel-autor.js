// =====================================================================
// PAINEL-AUTOR.JS — lógica completa do painel do autor
// =====================================================================

let dashProfile = null;
let dashBooks = [];         // livros do autor com capítulos
let activeChaptersBookId = null;

document.addEventListener('DOMContentLoaded', async () => {
  dashProfile = await requireAuthor();
  if (!dashProfile) return;

  await initHeader('author');
  initFooter();

  document.getElementById('open-profile-btn').addEventListener('click', openProfileModal);
  document.getElementById('add-chapter-btn').addEventListener('click', addChapter);
  document.getElementById('save-edit-book-btn').addEventListener('click', saveEditBook);
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('edit-capa-url').addEventListener('input', () => updateImgPreview('edit-capa-url', 'edit-cover-preview'));
  document.getElementById('profile-avatar-url').addEventListener('input', () => updateImgPreview('profile-avatar-url', 'profile-avatar-preview'));
  document.getElementById('profile-bio').addEventListener('input', (e) => {
    document.getElementById('bio-char-count').textContent = `${e.target.value.length}/500 caracteres`;
  });
  document.getElementById('new-chapter-gratis').addEventListener('change', (e) => {
    document.getElementById('new-chapter-preco').disabled = e.target.checked;
  });

  await loadDashboard();
});

/* ---------------------------------------------------------------------
   CARREGAR DADOS
   --------------------------------------------------------------------- */
async function loadDashboard() {
  const { data: books, error } = await supabaseClient
    .from('books')
    .select('id, titulo, categoria, capa_url, status, preco_total, created_at, chapters(id, titulo, ordem, preco_capitulo, is_free)')
    .eq('autor_id', dashProfile.id)
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('books-list').innerHTML = `<p class="text-muted">Não foi possível carregar as suas obras.</p>`;
    return;
  }

  dashBooks = (books || []).map((b) => ({ ...b, chapters: (b.chapters || []).sort((x, y) => x.ordem - y.ordem) }));

  // Recarrega saldo atualizado
  const { data: freshProfile } = await supabaseClient.from('profiles').select('*').eq('id', dashProfile.id).single();
  if (freshProfile) dashProfile = freshProfile;

  renderStats();
  renderBooksList();
}

function renderStats() {
  const totalLivros = dashBooks.length;
  const totalCapitulos = dashBooks.reduce((sum, b) => sum + b.chapters.length, 0);

  document.getElementById('stats-grid').innerHTML = `
    <div class="card stat-card">
      <div class="stat-card__icon" style="background-color:var(--amber-100);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-700);"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div>
        <p class="stat-card__label">Saldo Total</p>
        <p class="stat-card__value">${formatMZN(dashProfile.saldo_carteira)}</p>
      </div>
    </div>
    <div class="card stat-card">
      <div class="stat-card__icon" style="background-color:var(--emerald-100);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--emerald-700);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div>
        <p class="stat-card__label">Obras</p>
        <p class="stat-card__value">${totalLivros}</p>
      </div>
    </div>
    <div class="card stat-card">
      <div class="stat-card__icon" style="background-color:rgba(59,130,246,.15);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#3b82f6;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div>
        <p class="stat-card__label">Capítulos</p>
        <p class="stat-card__value">${totalCapitulos}</p>
      </div>
    </div>
  `;
}

function renderBooksList() {
  const listEl = document.getElementById('books-list');
  if (dashBooks.length === 0) {
    listEl.innerHTML = `<p class="text-muted" style="padding:1rem 0;">Nenhuma obra criada ainda.</p>`;
    return;
  }

  listEl.innerHTML = dashBooks.map((livro) => {
    const hasCover = livro.capa_url && !livro.capa_url.includes('placeholder-cover');
    const capitulosPagos = livro.chapters.filter((c) => !c.is_free).length;
    const receitaEstimada = livro.chapters.filter((c) => !c.is_free).reduce((s, c) => s + Number(c.preco_capitulo), 0);

    return `
      <div class="book-row mb-2" style="margin-bottom:.75rem;">
        <div class="flex gap-3" style="align-items:center; min-width:0;">
          ${hasCover
            ? `<img src="${escapeHtml(livro.capa_url)}" class="book-row__cover" alt="">`
            : `<div class="book-row__cover" style="background-color:var(--muted); display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted-foreground);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`
          }
          <div style="min-width:0;">
            <div class="flex gap-2" style="align-items:center;">
              <h3 style="font-weight:500; font-size:.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(livro.titulo)}</h3>
              <span class="badge ${livro.status === 'PUBLICADO' ? 'badge-amber' : 'badge-muted'}">${livro.status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}</span>
            </div>
            <p class="text-muted" style="font-size:.75rem; margin-top:.125rem;">
              ${escapeHtml(livro.categoria)} — ${livro.chapters.length} cap. (${capitulosPagos} pagos)
              ${livro.preco_total > 0 ? ` — Completo: ${formatMZN(livro.preco_total)}` : ''}
              — Receita: ${formatMZN(receitaEstimada)}
            </p>
          </div>
        </div>
        <div class="flex gap-2" style="flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" data-chapters-btn="${livro.id}">Capítulos</button>
          <button class="btn btn-ghost btn-sm btn-icon" data-edit-btn="${livro.id}" title="Editar">✎</button>
          ${livro.status !== 'PUBLICADO' ? `<button class="btn btn-outline btn-sm" style="color:var(--emerald-700);" data-publish-btn="${livro.id}">Publicar</button>` : ''}
          <button class="btn btn-ghost btn-sm btn-icon" data-delete-btn="${livro.id}" style="color:var(--destructive);" title="Excluir">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-chapters-btn]').forEach((b) => b.addEventListener('click', () => openChaptersModal(b.dataset.chaptersBtn)));
  listEl.querySelectorAll('[data-edit-btn]').forEach((b) => b.addEventListener('click', () => openEditModal(b.dataset.editBtn)));
  listEl.querySelectorAll('[data-publish-btn]').forEach((b) => b.addEventListener('click', () => publishBook(b.dataset.publishBtn)));
  listEl.querySelectorAll('[data-delete-btn]').forEach((b) => b.addEventListener('click', () => deleteBook(b.dataset.deleteBtn)));
}

/* ---------------------------------------------------------------------
   PUBLICAR / EXCLUIR
   --------------------------------------------------------------------- */
async function publishBook(bookId) {
  const { error } = await supabaseClient.from('books').update({ status: 'PUBLICADO' }).eq('id', bookId);
  if (error) { alert(error.message); return; }
  await loadDashboard();
}

async function deleteBook(bookId) {
  if (!confirm('Tem certeza que deseja excluir este livro?')) return;
  const { error } = await supabaseClient.from('books').delete().eq('id', bookId);
  if (error) { alert(error.message); return; }
  await loadDashboard();
}

/* ---------------------------------------------------------------------
   MODAL: CAPÍTULOS
   --------------------------------------------------------------------- */
function openChaptersModal(bookId) {
  activeChaptersBookId = bookId;
  const book = dashBooks.find((b) => b.id === bookId);
  if (!book) return;

  document.getElementById('chapters-modal-title').textContent = `Capítulos — ${book.titulo}`;
  renderExistingChapters(book);
  document.getElementById('new-chapter-titulo').value = '';
  document.getElementById('new-chapter-conteudo').value = '';
  document.getElementById('new-chapter-preco').value = '0';
  document.getElementById('new-chapter-gratis').checked = false;
  document.getElementById('new-chapter-preco').disabled = false;

  openModal('chapters-modal');
}

function renderExistingChapters(book) {
  const el = document.getElementById('chapters-existing');
  if (book.chapters.length === 0) {
    el.innerHTML = `<p class="text-muted" style="font-size:.875rem; padding:.5rem 0;">Nenhum capítulo.</p>`;
    return;
  }
  el.innerHTML = book.chapters.map((ch) => `
    <div class="flex-between" style="padding:.5rem; border-radius:var(--radius-sm); background-color:var(--muted); font-size:.875rem; margin-bottom:.25rem;">
      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        <span class="text-muted" style="font-family:var(--font-mono); font-size:.75rem; margin-right:.5rem;">${String(ch.ordem + 1).padStart(2, '0')}</span>
        ${escapeHtml(ch.titulo)}
        ${ch.is_free ? `<span class="badge badge-muted" style="margin-left:.5rem;">Grátis</span>` : ''}
      </span>
      <span class="text-muted" style="font-size:.75rem; flex-shrink:0; margin-left:.5rem;">${ch.is_free ? 'Grátis' : formatMZN(ch.preco_capitulo)}</span>
    </div>
  `).join('');
}

async function addChapter() {
  const book = dashBooks.find((b) => b.id === activeChaptersBookId);
  if (!book) return;

  const titulo = document.getElementById('new-chapter-titulo').value.trim();
  const conteudo = document.getElementById('new-chapter-conteudo').value.trim();
  const is_free = document.getElementById('new-chapter-gratis').checked;
  const preco_capitulo = is_free ? 0 : (parseFloat(document.getElementById('new-chapter-preco').value) || 0);

  if (!titulo || !conteudo) {
    alert('Título e conteúdo são obrigatórios.');
    return;
  }

  const nextOrdem = book.chapters.length;

  const { error } = await supabaseClient.from('chapters').insert({
    titulo, conteudo, preco_capitulo, is_free, ordem: nextOrdem, livro_id: book.id,
  });

  if (error) { alert(error.message); return; }

  await loadDashboard();
  openChaptersModal(activeChaptersBookId); // reabre atualizado
}

/* ---------------------------------------------------------------------
   MODAL: EDITAR OBRA
   --------------------------------------------------------------------- */
let editingBookId = null;

function openEditModal(bookId) {
  const book = dashBooks.find((b) => b.id === bookId);
  if (!book) return;
  editingBookId = bookId;

  document.getElementById('edit-titulo').value = book.titulo;
  document.getElementById('edit-sinopse').value = ''; // carregado abaixo
  document.getElementById('edit-capa-url').value = book.capa_url || '';
  document.getElementById('edit-preco-total').value = book.preco_total || 0;
  updateImgPreview('edit-capa-url', 'edit-cover-preview');

  // busca a sinopse completa (não vem na listagem resumida)
  supabaseClient.from('books').select('sinopse').eq('id', bookId).single().then(({ data }) => {
    if (data) document.getElementById('edit-sinopse').value = data.sinopse || '';
  });

  openModal('edit-book-modal');
}

async function saveEditBook() {
  if (!editingBookId) return;
  const titulo = document.getElementById('edit-titulo').value.trim();
  const sinopse = document.getElementById('edit-sinopse').value.trim();
  const capa_url = document.getElementById('edit-capa-url').value.trim();
  const preco_total = parseFloat(document.getElementById('edit-preco-total').value) || 0;

  const { error } = await supabaseClient.from('books').update({
    titulo, sinopse, capa_url: capa_url || '/assets/img/placeholder-cover.svg', preco_total,
  }).eq('id', editingBookId);

  if (error) { alert(error.message); return; }

  closeModal('edit-book-modal');
  await loadDashboard();
}

/* ---------------------------------------------------------------------
   MODAL: PERFIL DO AUTOR
   --------------------------------------------------------------------- */
function openProfileModal() {
  document.getElementById('profile-bio').value = dashProfile.biografia || '';
  document.getElementById('profile-avatar-url').value = dashProfile.avatar_url || '';
  document.getElementById('bio-char-count').textContent = `${(dashProfile.biografia || '').length}/500 caracteres`;
  updateImgPreview('profile-avatar-url', 'profile-avatar-preview');
  openModal('profile-modal');
}

async function saveProfile() {
  const biografia = document.getElementById('profile-bio').value;
  const avatar_url = document.getElementById('profile-avatar-url').value.trim();

  const { error } = await supabaseClient.from('profiles').update({ biografia, avatar_url }).eq('id', dashProfile.id);
  if (error) { alert(error.message); return; }

  dashProfile.biografia = biografia;
  dashProfile.avatar_url = avatar_url;
  closeModal('profile-modal');
}

/* ---------------------------------------------------------------------
   AJUDANTES DE MODAL / PRÉVIA DE IMAGEM
   --------------------------------------------------------------------- */
function openModal(id) { document.getElementById(id).classList.add('is-open'); }
function closeModal(id) { document.getElementById(id).classList.remove('is-open'); }

function updateImgPreview(inputId, imgId) {
  const url = document.getElementById(inputId).value;
  const img = document.getElementById(imgId);
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
    img.onerror = () => img.classList.add('hidden');
  } else {
    img.classList.add('hidden');
  }
}
