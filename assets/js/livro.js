// =====================================================================
// LIVRO.JS — lógica da página de detalhe do livro (livro.html?id=...)
// =====================================================================

const bookId = new URLSearchParams(window.location.search).get('id');
let currentProfile = null;
let purchasedChapterIds = new Set();
let ownsFullBook = false;
let currentBook = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentProfile = await initHeader('book-detail');
  initFooter();

  if (!bookId) {
    renderNotFound();
    return;
  }

  await loadBook();
  if (currentProfile) await loadPurchases();
  renderBookDetail();
});

async function loadBook() {
  const { data, error } = await supabaseClient
    .from('books')
    .select(`
      id, titulo, sinopse, capa_url, categoria, status, preco_total,
      autor:profiles(id, nome, biografia, avatar_url),
      chapters(id, titulo, ordem, preco_capitulo, is_free)
    `)
    .eq('id', bookId)
    .single();

  if (error || !data) {
    currentBook = null;
    return;
  }
  data.chapters = (data.chapters || []).sort((a, b) => a.ordem - b.ordem);
  currentBook = data;
}

async function loadPurchases() {
  const { data, error } = await supabaseClient
    .from('library_items')
    .select('chapter_id, book_id, tipo')
    .eq('user_id', currentProfile.id);

  if (error || !data) return;
  purchasedChapterIds = new Set(data.map((i) => i.chapter_id).filter(Boolean));
  ownsFullBook = data.some((i) => i.tipo === 'LIVRO_COMPLETO' && i.book_id === bookId);
}

function hasAccess(chapter) {
  return chapter.is_free || purchasedChapterIds.has(chapter.id) || ownsFullBook;
}

function renderNotFound() {
  document.getElementById('book-detail-root').innerHTML = `
    <div class="text-center py-16">
      <p class="text-muted">Livro não encontrado.</p>
      <a href="index.html" class="btn btn-link mt-2">← Voltar</a>
    </div>
  `;
}

function renderBookDetail() {
  const root = document.getElementById('book-detail-root');
  if (!currentBook) return renderNotFound();

  const book = currentBook;
  const hasCover = book.capa_url && !book.capa_url.includes('placeholder-cover');
  const isOwnBook = currentProfile && currentProfile.id === book.autor?.id;
  const freeCount = book.chapters.filter((c) => c.is_free).length;

  root.innerHTML = `
    <a href="index.html" class="btn btn-ghost btn-sm mb-6">← Voltar</a>

    <div class="flex gap-4 mb-8" style="flex-wrap:wrap; align-items:flex-start;">
      <div style="width:16rem; flex-shrink:0; max-width:100%;">
        ${hasCover
          ? `<img src="${escapeHtml(book.capa_url)}" alt="${escapeHtml(book.titulo)}" style="width:100%; aspect-ratio:3/4; object-fit:cover; border-radius:var(--radius-lg); border:1px solid var(--border);">`
          : `<div style="width:100%; aspect-ratio:3/4; border-radius:var(--radius-lg); background:linear-gradient(to bottom right, rgba(146,64,14,.3), rgba(120,53,15,.4)); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem; text-align:center; border:1px solid var(--amber-200);">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:rgba(180,83,9,.5); margin-bottom:1rem;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
               <h2 style="font-weight:700; font-size:1.125rem;">${escapeHtml(book.titulo)}</h2>
             </div>`
        }
      </div>

      <div style="flex:1; min-width:250px;">
        <span class="badge badge-amber-soft mb-2" style="margin-bottom:.75rem;">${escapeHtml(book.categoria)}</span>
        <h1 style="font-size:1.75rem; font-weight:700; margin-bottom:.5rem;">${escapeHtml(book.titulo)}</h1>

        <div class="flex gap-3 mb-4" style="align-items:center;">
          ${book.autor?.avatar_url
            ? `<img src="${escapeHtml(book.autor.avatar_url)}" alt="${escapeHtml(book.autor.nome)}" style="width:2.5rem; height:2.5rem; border-radius:999px; object-fit:cover; border:2px solid var(--amber-200);">`
            : `<div class="avatar-circle" style="width:2.5rem; height:2.5rem; border:2px solid var(--amber-200);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`
          }
          <div>
            <p style="font-weight:500; font-size:.875rem;">por ${escapeHtml(book.autor?.nome || 'Desconhecido')}</p>
            ${book.autor?.biografia ? `<p class="text-muted" style="font-size:.75rem; max-width:28rem;">${escapeHtml(book.autor.biografia)}</p>` : ''}
          </div>
        </div>

        <p class="text-muted mb-4" style="font-size:.875rem; line-height:1.6;">${escapeHtml(book.sinopse)}</p>

        <div class="flex gap-4 mb-4" style="font-size:.875rem;">
          <span class="text-muted">${book.chapters.length} capítulos</span>
          <span class="text-muted">${freeCount} gratuitos</span>
        </div>

        ${!isOwnBook && !ownsFullBook && book.preco_total > 0 && currentProfile ? `
          <div class="card mb-4" style="border-color:var(--amber-200); background-color:var(--amber-50);">
            <div class="card__content flex-between">
              <div class="flex gap-3" style="align-items:center;">
                <div style="padding:.5rem; border-radius:var(--radius-md); background-color:var(--amber-100);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-700);"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
                </div>
                <div>
                  <p style="font-weight:500; font-size:.875rem;">Comprar Livro Completo</p>
                  <p class="text-muted" style="font-size:.75rem;">Acesso a todos os capítulos — presentes e futuros</p>
                </div>
              </div>
              <button class="btn btn-primary" id="buy-full-book-btn">${formatMZN(book.preco_total)}</button>
            </div>
          </div>
        ` : ''}

        ${ownsFullBook ? `
          <div class="flex gap-2 mb-4" style="align-items:center; padding:.75rem; border-radius:var(--radius-md); background-color:var(--emerald-50); border:1px solid var(--emerald-100);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--emerald-700);"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span style="font-size:.875rem; font-weight:500; color:var(--emerald-700);">Você possui o livro completo — todos os capítulos desbloqueados</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="card">
      <div class="card__header"><p class="card__title">Capítulos</p></div>
      <div class="card__content" id="chapters-list">
        ${book.chapters.length === 0
          ? `<p class="text-muted" style="padding:1rem 0;">Nenhum capítulo disponível ainda.</p>`
          : book.chapters.map(renderChapterRow).join('')
        }
      </div>
    </div>
  `;

  const buyFullBtn = document.getElementById('buy-full-book-btn');
  if (buyFullBtn) buyFullBtn.addEventListener('click', handleBuyFullBook);

  document.querySelectorAll('[data-chapter-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const chId = btn.dataset.chapterAction;
      const chapter = book.chapters.find((c) => c.id === chId);
      handleChapterClick(chapter);
    });
  });
}

function renderChapterRow(chapter) {
  const owned = hasAccess(chapter);
  return `
    <div class="flex-between" style="padding:.75rem; border:1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius:var(--radius-md); margin-bottom:.5rem;">
      <div class="flex gap-3" style="align-items:center; min-width:0;">
        <span class="text-muted" style="font-family:var(--font-mono); font-size:.75rem; width:1.5rem; flex-shrink:0;">${String(chapter.ordem + 1).padStart(2, '0')}</span>
        <span style="font-weight:500; font-size:.875rem;">${escapeHtml(chapter.titulo)}</span>
        ${chapter.is_free ? `<span class="badge badge-muted">Grátis</span>` : ''}
        ${ownsFullBook && !chapter.is_free ? `<span class="badge badge-emerald-soft">Incluído</span>` : ''}
      </div>
      <div class="flex gap-2" style="align-items:center; flex-shrink:0;">
        ${owned
          ? `<a href="leitor.html?capitulo=${chapter.id}&livro=${bookId}" class="btn btn-ghost btn-sm" style="color:var(--amber-700);">Ler →</a>`
          : `<span style="font-size:.875rem; font-weight:500; color:var(--amber-700);">${formatMZN(chapter.preco_capitulo)}</span>
             <button class="btn btn-primary btn-sm" data-chapter-action="${chapter.id}">Comprar</button>`
        }
      </div>
    </div>
  `;
}

async function handleChapterClick(chapter) {
  if (!currentProfile) { window.location.href = 'login.html'; return; }
  if (hasAccess(chapter)) {
    window.location.href = `leitor.html?capitulo=${chapter.id}&livro=${bookId}`;
    return;
  }
  try {
    await callRpc('comprar_capitulo', { p_chapter_id: chapter.id });
    purchasedChapterIds.add(chapter.id);
    window.location.href = `leitor.html?capitulo=${chapter.id}&livro=${bookId}`;
  } catch (err) {
    alert(err.message || 'Erro ao comprar o capítulo.');
  }
}

async function handleBuyFullBook() {
  if (!currentProfile) { window.location.href = 'login.html'; return; }
  try {
    await callRpc('comprar_livro_completo', { p_book_id: bookId });
    ownsFullBook = true;
    await loadBook();
    renderBookDetail();
  } catch (err) {
    alert(err.message || 'Erro ao comprar o livro.');
  }
}
