// =====================================================================
// AUTENTICAÇÃO — funções usadas em todas as páginas
// =====================================================================

/**
 * Devolve a sessão atual (ou null se ninguém estiver logado).
 */
async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

/**
 * Devolve o "profile" completo (nome, papel, saldo...) do usuário logado.
 * Devolve null se não houver ninguém logado.
 */
async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) {
    console.error('Erro ao carregar perfil:', error);
    return null;
  }
  return data;
}

/**
 * Cria uma conta nova (leitor ou escritor) e já entra com ela.
 * role: 'LEITOR' | 'ESCRITOR'
 */
async function registerUser({ nome, email, senha, telefone = '', role = 'LEITOR' }) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, telefone, role } },
  });
  if (error) throw new Error(traduzErroAuth(error));
  return data;
}

/**
 * Entra com email e senha.
 */
async function loginUser({ email, senha }) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw new Error(traduzErroAuth(error));
  return data;
}

/**
 * Sai da conta.
 */
async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

/**
 * Traduz as mensagens de erro do Supabase para português simples.
 */
function traduzErroAuth(error) {
  const msg = (error && error.message) || '';
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('User already registered')) return 'Este email já está cadastrado.';
  if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email')) return 'Email inválido.';
  return msg || 'Ocorreu um erro. Tente novamente.';
}

/**
 * Protege uma página: se ninguém estiver logado, manda para o login.
 * Use no topo de páginas como carteira.html, biblioteca.html, etc.
 */
async function requireLogin() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

/**
 * Protege uma página de autor: exige login E papel ESCRITOR ou ADMIN.
 */
async function requireAuthor() {
  const profile = await getCurrentProfile();
  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }
  if (profile.role !== 'ESCRITOR' && profile.role !== 'ADMIN') {
    alert('Apenas escritores e administradores podem acessar esta página.');
    window.location.href = 'index.html';
    return null;
  }
  return profile;
}
