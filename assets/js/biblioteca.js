// =====================================================================
// BIBLIOTECA.JS — lógica da página "Minha Biblioteca"
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const session = await requireLogin();
  if (!session) return;

  await initHeader('library');
  initFooter();
  await loadLibrary(session.user.id);
});

async function loadLibrary(userId) {
  const root = document.getElementById('library-root');

  const { data: items, error } = await supabaseClient
    .from('library_items')
    .select(`
      id, tipo, book_id, chapter_id,
      chapter:chapters(id, titulo, ordem, livro:books(id, titulo, capa_url))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    root.innerHTML = `<p class="text-muted">Não foi possível carregar a sua biblioteca.</p>`;
    return;
  }

  const fullBookIds = [...new Set(items.filter((i) => i.tipo === 'LIVRO_COMPLETO').map((i) => i.book_id))];
  let fullBooks = [];
  if (fullBookIds.length > 0) {
    const { data: books } = await supabaseClient
      .from('books')
      .select('id, titulo, capa_url')
      .in('id', fullBookIds);
    fullBooks = books || [];
  }

  const individualChapters = items.filter(
    (i) => i.chapter && !fullBookIds.includes(i.chapter.livro.id)
  );

  const isEmpty = fullBooks.length === 0 && individualChapters.length === 0;

  if (isEmpty) {
    root.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <p class="mb-2">Sua biblioteca está vazia.</p>
        <p class="text-muted" style="font-size:.875rem; margin-bottom:1rem;">Compre livros ou capítulos para vê-los aqui.</p>
        <a href="index.html" class="btn btn-outline">Explorar Obras</a>
      </div>
    `;
    return;
  }

  let html = '';

  if (fullBooks.length > 0) {
    html += `
      <section class="section">
        <div class="flex gap-2 mb-4" style="align-items:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-600);"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h2 style="font-size:1.125rem; font-weight:600;">Livros Completos</h2>
          <span class="badge badge-emerald-soft">${fullBooks.length}</span>
        </div>
        <div class="book-grid" style="grid-template-columns:repeat(2,1fr);">
          ${fullBooks.map(renderFullBookCard).join('')}
        </div>
      </section>
    `;
  }

  if (individualChapters.length > 0) {
    html += `
      <section class="section">
        <div class="flex gap-2 mb-4" style="align-items:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-600);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <h2 style="font-size:1.125rem; font-weight:600;">Capítulos Avulsos</h2>
          <span class="badge badge-muted">${individualChapters.length}</span>
        </div>
        <div class="card">
          <div class="card__content" style="padding:.5rem;">
            ${individualChapters.map(renderChapterItem).join('')}
          </div>
        </div>
      </section>
    `;
  }

  root.innerHTML = html;
}

function renderFullBookCard(book) {
  const hasCover = book.capa_url && !book.capa_url.includes('placeholder-cover');
  return `
    <a href="livro.html?id=${book.id}" class="card book-card">
      <div class="book-card__cover">
        ${hasCover
          ? `<img src="${escapeHtml(book.capa_url)}" alt="${escapeHtml(book.titulo)}">`
          : `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(to bottom right, rgba(146,64,14,.2), rgba(120,53,15,.4));"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:rgba(180,83,9,.5);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`
        }
        <span class="badge badge-emerald" style="position:absolute; top:.5rem; left:.5rem;">Completo</span>
      </div>
      <div class="book-card__body">
        <p class="book-card__title">${escapeHtml(book.titulo)}</p>
        <p class="book-card__author">Todos os capítulos</p>
      </div>
    </a>
  `;
}

function renderChapterItem(item) {
  const ch = item.chapter;
  return `
    <a href="leitor.html?capitulo=${ch.id}&livro=${ch.livro.id}" class="flex-between" style="padding:.75rem; border-radius:var(--radius-md); text-decoration:none;">
      <div class="flex gap-3" style="align-items:center; min-width:0;">
        <div style="width:2rem; height:2rem; border-radius:var(--radius-sm); background-color:var(--amber-100); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber-700);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div style="min-width:0;">
          <p style="font-weight:500; font-size:.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(ch.titulo)}</p>
          <p class="text-muted" style="font-size:.75rem;">${escapeHtml(ch.livro.titulo)}</p>
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted-foreground); flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
    </a>
  `;
}
