// =====================================================================
// COMMENTS.JS — módulo reutilizável de comentários (usado no leitor.html)
// Chame: await renderComments(chapterId, bookAuthorId)
// =====================================================================

let _commentsChapterId = null;
let _commentsBookAuthorId = null;
let _commentsProfile = null;

async function renderComments(chapterId, bookAuthorId) {
  _commentsChapterId = chapterId;
  _commentsBookAuthorId = bookAuthorId;
  _commentsProfile = await getCurrentProfile();

  const root = document.getElementById('comments-root');
  root.innerHTML = `
    <div class="comments-section__divider">
      <div class="comments-section__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted-foreground);"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <span>Comentários <span id="comments-count" class="text-muted" style="font-weight:400; font-size:.875rem;"></span></span>
      </div>

      <div id="comment-form-area"></div>
      <div id="reply-form-area"></div>
      <div id="comments-list"></div>
    </div>
  `;

  renderCommentForm();
  await loadComments();
}

function renderCommentForm() {
  const area = document.getElementById('comment-form-area');
  if (!_commentsProfile) {
    area.innerHTML = `
      <div class="mb-6" style="padding:1rem; border-radius:var(--radius-md); background-color:var(--muted); text-align:center;">
        <p class="text-muted" style="font-size:.875rem;">
          <a href="login.html" class="btn-link" style="font-weight:500;">Entre na sua conta</a> para deixar um comentário.
        </p>
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <div class="comment-form mb-6">
      <div class="avatar-circle">${escapeHtml(_commentsProfile.nome.charAt(0).toUpperCase())}</div>
      <div style="flex:1;">
        <div class="field" style="margin-bottom:.5rem;">
          <textarea id="new-comment-text" rows="3" maxlength="1000" placeholder="Partilhe a sua opinião sobre este capítulo..."></textarea>
        </div>
        <div class="flex-between">
          <span class="text-muted" id="comment-char-count" style="font-size:.6875rem;">0/1000</span>
          <button class="btn btn-primary btn-sm" id="submit-comment-btn">Comentar</button>
        </div>
      </div>
    </div>
  `;

  const textarea = document.getElementById('new-comment-text');
  textarea.addEventListener('input', () => {
    document.getElementById('comment-char-count').textContent = `${textarea.value.length}/1000`;
  });
  document.getElementById('submit-comment-btn').addEventListener('click', submitNewComment);
}

async function loadComments() {
  const listEl = document.getElementById('comments-list');
  listEl.innerHTML = `<p class="text-muted" style="padding:1rem 0;">Carregando comentários...</p>`;

  const { data: allComments, error } = await supabaseClient
    .from('comments')
    .select('id, conteudo, created_at, user_id, parent_id, user:profiles(id, nome, role)')
    .eq('chapter_id', _commentsChapterId)
    .order('created_at', { ascending: false });

  if (error || !allComments) {
    listEl.innerHTML = `<p class="text-muted" style="padding:1rem 0;">Não foi possível carregar os comentários.</p>`;
    return;
  }

  const topLevel = allComments.filter((c) => !c.parent_id);
  const repliesByParent = {};
  allComments.filter((c) => c.parent_id).forEach((c) => {
    (repliesByParent[c.parent_id] = repliesByParent[c.parent_id] || []).push(c);
  });
  // respostas em ordem cronológica (mais antigas primeiro)
  Object.values(repliesByParent).forEach((arr) => arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));

  const totalReplies = allComments.length - topLevel.length;
  document.getElementById('comments-count').textContent =
    `(${topLevel.length}${totalReplies > 0 ? ` · ${totalReplies} respostas` : ''})`;

  if (topLevel.length === 0) {
    listEl.innerHTML = `
      <div class="text-center" style="padding:2rem 0;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:color-mix(in srgb, var(--muted-foreground) 30%, transparent); margin:0 auto .5rem;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <p class="text-muted" style="font-size:.875rem;">Ainda sem comentários.</p>
        <p class="text-muted" style="font-size:.75rem;">Seja o primeiro a partilhar a sua opinião.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = topLevel.map((c) => renderCommentBlock(c, repliesByParent[c.id] || [])).join('');
  attachCommentEvents();
}

function renderCommentBlock(comment, replies) {
  return `
    <div>
      ${renderSingleComment(comment, false)}
      ${replies.length > 0 ? `
        <div class="comment-replies">
          ${replies.map((r) => renderSingleComment(r, true)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSingleComment(comment, isReply) {
  const canDelete = _commentsProfile && (
    _commentsProfile.id === comment.user_id ||
    _commentsProfile.id === _commentsBookAuthorId ||
    _commentsProfile.role === 'ADMIN'
  );
  const roleBadge = comment.user?.role === 'ADMIN'
    ? `<span class="badge badge-outline" style="font-size:.625rem; padding:0 .375rem; height:1rem;">Admin</span>`
    : comment.user?.role === 'ESCRITOR'
      ? `<span class="badge badge-outline" style="font-size:.625rem; padding:0 .375rem; height:1rem;">Autor</span>`
      : '';

  return `
    <div class="comment-item" style="${isReply ? 'border-bottom:none; padding:.75rem 0;' : ''}">
      <div class="avatar-circle">${escapeHtml((comment.user?.nome || '?').charAt(0).toUpperCase())}</div>
      <div style="flex:1; min-width:0;">
        <div class="flex gap-2" style="align-items:center; flex-wrap:wrap;">
          <span class="comment-item__name">${escapeHtml(comment.user?.nome || 'Usuário')}</span>
          ${roleBadge}
          <span class="text-muted" style="font-size:.75rem;">${timeAgo(comment.created_at)}</span>
        </div>
        <p class="comment-item__text">${escapeHtml(comment.conteudo)}</p>
        <div class="comment-item__actions">
          <button data-reply-to="${comment.id}" data-reply-name="${escapeHtml(comment.user?.nome || 'Usuário')}">↩ Responder</button>
          ${canDelete ? `<button data-delete-comment="${comment.id}">🗑 Eliminar</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function attachCommentEvents() {
  document.querySelectorAll('[data-reply-to]').forEach((btn) => {
    btn.addEventListener('click', () => showReplyForm(btn.dataset.replyTo, btn.dataset.replyName));
  });
  document.querySelectorAll('[data-delete-comment]').forEach((btn) => {
    btn.addEventListener('click', () => deleteComment(btn.dataset.deleteComment));
  });
}

async function submitNewComment() {
  if (!_commentsProfile) { window.location.href = 'login.html'; return; }
  const textarea = document.getElementById('new-comment-text');
  const conteudo = textarea.value.trim();
  if (!conteudo) return;

  const btn = document.getElementById('submit-comment-btn');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await supabaseClient.from('comments').insert({
    conteudo, chapter_id: _commentsChapterId, user_id: _commentsProfile.id,
  });

  btn.disabled = false;
  btn.textContent = 'Comentar';

  if (error) { alert(error.message); return; }
  textarea.value = '';
  document.getElementById('comment-char-count').textContent = '0/1000';
  await loadComments();
}

function showReplyForm(parentId, parentName) {
  if (!_commentsProfile) { window.location.href = 'login.html'; return; }
  const area = document.getElementById('reply-form-area');
  area.innerHTML = `
    <div class="mb-4" style="margin-left:2.75rem; padding:.75rem; border-radius:var(--radius-md); background-color:var(--muted); border:1px solid var(--border);">
      <div class="flex gap-2 mb-2" style="align-items:center; font-size:.75rem;">
        <span class="text-muted">A responder a <strong style="color:var(--foreground);">${escapeHtml(parentName)}</strong></span>
        <button class="btn-link" style="margin-left:auto; font-size:.75rem;" onclick="document.getElementById('reply-form-area').innerHTML=''">Cancelar</button>
      </div>
      <div class="field" style="margin-bottom:.5rem;">
        <textarea id="reply-text" rows="2" maxlength="1000" placeholder="Escreva a sua resposta..." autofocus></textarea>
      </div>
      <div style="text-align:right;">
        <button class="btn btn-primary btn-sm" id="submit-reply-btn">Responder</button>
      </div>
    </div>
  `;
  document.getElementById('submit-reply-btn').addEventListener('click', () => submitReply(parentId));
  document.getElementById('reply-text').focus();
}

async function submitReply(parentId) {
  const textarea = document.getElementById('reply-text');
  const conteudo = textarea.value.trim();
  if (!conteudo) return;

  const btn = document.getElementById('submit-reply-btn');
  btn.disabled = true;

  const { error } = await supabaseClient.from('comments').insert({
    conteudo, chapter_id: _commentsChapterId, user_id: _commentsProfile.id, parent_id: parentId,
  });

  if (error) { alert(error.message); btn.disabled = false; return; }
  document.getElementById('reply-form-area').innerHTML = '';
  await loadComments();
}

async function deleteComment(commentId) {
  if (!confirm('Eliminar este comentário?')) return;
  const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
  if (error) { alert(error.message); return; }
  await loadComments();
}
