// =====================================================================
// HOME.JS — lógica da página inicial (index.html)
// =====================================================================

const CATEGORIAS = ['Ficção', 'Poesia', 'Drama', 'Contos', 'Romance', 'História', 'Ensaio'];
let categoriaAtiva = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initHeader('home');
  initFooter();
  renderCategoryFilters();
  loadBooks();
});

function renderCategoryFilters() {
  const wrap = document.getElementById('category-filters');
  const allBtn = `<button class="pill pill-cat ${!categoriaAtiva ? 'is-active' : ''}" data-cat="">Todas</button>`;
  const catBtns = CATEGORIAS.map(
    (cat) => `<button class="pill pill-cat ${cat === categoriaAtiva ? 'is-active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');
  wrap.innerHTML = allBtn + catBtns;

  wrap.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat || null;
      categoriaAtiva = cat === categoriaAtiva ? null : cat;
      renderCategoryFilters();
      loadBooks();
    });
  });
}

async function loadBooks() {
  const grid = document.getElementById('book-grid');
  const empty = document.getElementById('empty-state');
  const title = document.getElementById('section-title');
  const count = document.getElementById('book-count');

  title.textContent = categoriaAtiva || 'Todos os Livros';
  grid.innerHTML = renderSkeletons(10);
  empty.classList.add('hidden');

  // Livros publicados (+ dados do autor), filtrando por categoria se houver
  let query = supabaseClient
    .from('books')
    .select('id, titulo, sinopse, capa_url, categoria, preco_total, autor:profiles(id, nome)')
    .eq('status', 'PUBLICADO')
    .order('created_at', { ascending: false });

  if (categoriaAtiva) query = query.eq('categoria', categoriaAtiva);

  const { data: books, error } = await query;

  if (error) {
    console.error(error);
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    count.textContent = '';
    return;
  }

  count.textContent = `${books.length} obras`;

  if (books.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  grid.innerHTML = books.map(renderBookCard).join('');
}

function renderBookCard(book) {
  const hasCover = book.capa_url && !book.capa_url.includes('placeholder-cover');
  const autorNome = book.autor?.nome || 'Autor desconhecido';

  return `
    <a href="livro.html?id=${book.id}" class="card card-soft book-card">
      <div class="book-card__cover">
        ${hasCover
          ? `<img src="${escapeHtml(book.capa_url)}" alt="${escapeHtml(book.titulo)}">`
          : `<div class="book-card__placeholder">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
               <h3 style="font-weight:600; font-size:.875rem; line-height:1.25;">${escapeHtml(book.titulo)}</h3>
             </div>`
        }
        <span class="badge badge-amber book-card__badge-cat">${escapeHtml(book.categoria)}</span>
        ${book.preco_total > 0 ? `<span class="book-card__badge-price">${formatMZN(book.preco_total)}</span>` : ''}
      </div>
      <div class="book-card__body">
        ${hasCover ? `<p class="book-card__title">${escapeHtml(book.titulo)}</p>` : ''}
        <p class="book-card__author">por ${escapeHtml(autorNome)}</p>
        <p class="book-card__synopsis">${escapeHtml(book.sinopse)}</p>
      </div>
    </a>
  `;
}

function renderSkeletons(n) {
  return Array.from({ length: n }).map(() => `
    <div class="card">
      <div class="book-card__cover skeleton"></div>
      <div class="card__content">
        <div class="skeleton" style="height:.75rem; width:60%; margin-bottom:.5rem;"></div>
        <div class="skeleton" style="height:.75rem; width:100%;"></div>
      </div>
    </div>
  `).join('');
}
