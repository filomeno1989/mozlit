// =====================================================================
// LEITOR.JS — lógica da página de leitura de capítulo
// (leitor.html?capitulo=ID&livro=ID)
// =====================================================================

const params = new URLSearchParams(window.location.search);
const chapterId = params.get('capitulo');
const bookIdParam = params.get('livro');
let readerProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  readerProfile = await initHeader('reader');
  initFooter();

  // Só quem comprou (ou capítulo grátis) pode ler — a segurança real
  // vem das regras RLS no Supabase; isto é só a experiência de tela.
  if (!chapterId) return renderError('Capítulo não encontrado.');

  const chapter = await loadChapter();
  if (!chapter) return renderError('Capítulo não encontrado ou você ainda não tem acesso a ele.');

  renderWatermark();
  renderChapter(chapter);
  blockCopyAndRightClick();
  await renderComments(chapterId, chapter.livro.autor_id);
});

async function loadChapter() {
  const { data, error } = await supabaseClient
    .from('chapters')
    .select('id, titulo, conteudo, ordem, is_free, livro:books(id, titulo, autor_id)')
    .eq('id', chapterId)
    .single();
  if (error || !data) return null;
  return data;
}

function renderError(msg) {
  document.getElementById('reader-root').innerHTML = `
    <div class="container-md py-16 text-center">
      <p style="color:var(--destructive); margin-bottom:1rem;">${escapeHtml(msg)}</p>
      <a href="livro.html?id=${bookIdParam || ''}" class="btn btn-outline">← Voltar ao livro</a>
    </div>
  `;
}

function renderWatermark() {
  const wm = document.getElementById('watermark');
  const nome = readerProfile ? readerProfile.nome : 'Leitor';
  let html = '';
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 4; col++) {
      html += `<span style="top:${row * 10}%; left:${col * 30 - 5}%;">${escapeHtml(nome)} — MozLit</span>`;
    }
  }
  wm.innerHTML = html;
}

function renderChapter(chapter) {
  const root = document.getElementById('reader-root');
  root.innerHTML = `
    <div class="reader-topbar">
      <div class="reader-topbar__bar">
        <a href="livro.html?id=${chapter.livro.id}" class="btn btn-ghost btn-sm">← Voltar</a>
        <span class="text-muted" style="font-size:.75rem; max-width:40%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(chapter.livro.titulo)}</span>
        <button class="icon-btn" onclick="toggleTheme()" title="Modo noturno">
          <svg id="theme-icon-reader" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
        </button>
      </div>
    </div>

    <article class="reader-article ereader-protected">
      <header>
        <h1>${escapeHtml(chapter.titulo)}</h1>
        <p class="chapter-meta">Capítulo ${chapter.ordem + 1} — ${escapeHtml(chapter.livro.titulo)}</p>
      </header>
      <div class="reader-content">
        ${formatChapterContent(chapter.conteudo)}
      </div>
    </article>

    <div class="container-md flex-between" style="padding-bottom:1rem;">
      <a href="livro.html?id=${chapter.livro.id}" class="btn btn-outline btn-sm">← Índice</a>
      <span class="text-muted" style="font-size:.75rem;">Fim do capítulo</span>
    </div>
  `;
  document.getElementById('comments-root').classList.remove('hidden');
}

/**
 * Converte o texto simples do capítulo em parágrafos/títulos/citações,
 * igual ao formato usado no editor do painel do autor:
 *   linha começando com "## " → subtítulo (h2)
 *   linha começando com "### " → subtítulo menor (h3)
 *   linha começando com "> "  → citação
 *   linha em branco           → espaço
 *   qualquer outra linha      → parágrafo normal
 */
function formatChapterContent(conteudo) {
  return (conteudo || '').split('\n').map((line) => {
    if (!line.trim()) return '<br>';
    if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
    if (line.startsWith('> ')) return `<blockquote><p>${escapeHtml(line.slice(2))}</p></blockquote>`;
    return `<p>${escapeHtml(line)}</p>`;
  }).join('');
}

function blockCopyAndRightClick() {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  const article = document.querySelector('.reader-article');
  if (!article) return;
  article.addEventListener('copy', (e) => e.preventDefault());
  article.addEventListener('cut', (e) => e.preventDefault());
  article.addEventListener('dragstart', (e) => e.preventDefault());
}
