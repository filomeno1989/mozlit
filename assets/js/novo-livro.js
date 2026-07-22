// =====================================================================
// NOVO-LIVRO.JS — lógica do formulário de criação de obra
// =====================================================================

const CATEGORIAS_LIVRO = ['Ficção', 'Poesia', 'Drama', 'Contos', 'Romance', 'História', 'Ensaio'];
let categoriaEscolhida = 'Ficção';
let authorProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  authorProfile = await requireAuthor();
  if (!authorProfile) return;

  await initHeader('author');
  initFooter();
  renderCategoryPicker();

  document.getElementById('capa_url').addEventListener('input', updateCoverPreview);
  document.getElementById('new-book-form').addEventListener('submit', handleSubmit);
});

function renderCategoryPicker() {
  const wrap = document.getElementById('category-picker');
  wrap.innerHTML = CATEGORIAS_LIVRO.map(
    (cat) => `<button type="button" class="pill ${cat === categoriaEscolhida ? 'is-active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');
  wrap.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      categoriaEscolhida = btn.dataset.cat;
      renderCategoryPicker();
    });
  });
}

function updateCoverPreview() {
  const url = document.getElementById('capa_url').value;
  const preview = document.getElementById('cover-preview');
  if (url) {
    preview.src = url;
    preview.classList.remove('hidden');
    preview.onerror = () => preview.classList.add('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const errorBox = document.getElementById('new-book-error');
  const submitBtn = document.getElementById('new-book-submit');
  errorBox.classList.add('hidden');

  const titulo = document.getElementById('titulo').value.trim();
  const sinopse = document.getElementById('sinopse').value.trim();
  const capa_url = document.getElementById('capa_url').value.trim();
  const preco_total = parseFloat(document.getElementById('preco_total').value) || 0;

  if (!titulo || !sinopse) {
    errorBox.textContent = 'Título e sinopse são obrigatórios.';
    errorBox.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Criando...';

  const { error } = await supabaseClient.from('books').insert({
    titulo,
    sinopse,
    categoria: categoriaEscolhida,
    capa_url: capa_url || '/assets/img/placeholder-cover.svg',
    preco_total,
    status: 'RASCUNHO',
    autor_id: authorProfile.id,
  });

  if (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Criar Obra';
    return;
  }

  window.location.href = 'painel-autor.html';
}
