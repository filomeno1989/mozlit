# MozLit — Guia Rápido (sem programação)

Este site já está pronto e configurado para o seu projeto Supabase. Siga estes passos, na ordem.

---

## Passo 1 — Criar as tabelas no Supabase (só uma vez)

1. Acesse **https://supabase.com/dashboard** e abra o seu projeto.
2. No menu esquerdo, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `supabase-schema.sql` (está nesta mesma pasta), copie **todo** o conteúdo e cole no editor.
5. Clique em **Run** (ou `Ctrl+Enter`).
6. Se aparecer "Success", está tudo pronto. As tabelas `profiles`, `books`, `chapters`, `transactions`, `library_items` e `comments` foram criadas.

> Se aparecer algum erro, tire um print e me envie que eu ajudo a corrigir.

## Passo 2 — Confirmar o login por email

Por padrão o Supabase pode pedir confirmação por email antes do usuário conseguir entrar. Para testar mais rápido:

1. No painel, vá em **Authentication → Providers → Email**.
2. Se quiser desativar a confirmação (só para testes), desmarque **"Confirm email"**.
3. Isso pode ser reativado depois, quando o site estiver no ar de verdade.

## Passo 3 — Testar o site no seu computador

Você pode simplesmente abrir o arquivo `index.html` clicando duas vezes nele — ele já vai funcionar e se conectar ao Supabase (as chaves já estão configuradas em `assets/js/supabase-config.js`).

## Passo 4 — Subir para o GitHub

1. Vá até o seu repositório em **https://github.com/literaturamz2026-com/MozLit**
2. Substitua o conteúdo antigo por todos os arquivos desta pasta (`index.html`, `login.html`, a pasta `assets/`, etc.)
   - Pode fazer isso arrastando os arquivos direto na interface web do GitHub ("Add file → Upload files"), sem precisar de linha de comando.
3. Confirme o envio ("Commit changes").

## Passo 5 — Hospedar o site (gratuito)

A forma mais simples, sem programação:

### Opção A — GitHub Pages (recomendado, gratuito, direto do seu repositório)
1. No repositório, vá em **Settings → Pages**.
2. Em "Source", escolha a branch `main` e a pasta `/root`.
3. Clique em **Save**. Em alguns minutos o site estará em `https://literaturamz2026-com.github.io/MozLit/`.

### Opção B — Netlify (também gratuito, arrastar e soltar)
1. Acesse **https://app.netlify.com**
2. Clique em "Add new site → Deploy manually"
3. Arraste a pasta inteira do site (`mozlit-site`) para a área indicada.
4. Pronto — o Netlify te dá um link público na hora.

---

## Como o site está organizado

```
mozlit-site/
├── index.html            → Página inicial (lista de livros)
├── login.html             → Entrar
├── registo.html           → Criar conta
├── livro.html              → Detalhe de um livro (compra de capítulos/livro completo)
├── leitor.html             → Leitura de um capítulo (com marca d'água)
├── biblioteca.html         → "Minha Biblioteca" (o que o leitor comprou)
├── carteira.html           → Saldo e carregamento (M-Pesa / NIB)
├── painel-autor.html       → Painel do escritor (criar/editar obras e capítulos)
├── novo-livro.html         → Formulário de nova obra
├── supabase-schema.sql     → Script que cria as tabelas no Supabase (rode uma vez)
└── assets/
    ├── css/style.css       → TODO o visual do site (cores, fontes, espaçamentos)
    ├── js/
    │   ├── supabase-config.js  → Suas chaves do Supabase (já preenchido)
    │   ├── auth.js              → Login/registo/sessão
    │   ├── app.js                → Cabeçalho, rodapé, modo escuro, formatação
    │   ├── comments.js           → Comentários dos capítulos
    │   └── (um arquivo .js por página, com o mesmo nome da página)
    └── img/                  → Logotipo e imagem padrão de capa
```

## Como editar coisas simples

- **Mudar textos**: abra o `.html` da página em qualquer editor de texto (ou até no Bloco de Notas) e altere o texto entre as tags.
- **Mudar cores**: tudo está no topo do arquivo `assets/css/style.css`, na seção `:root { ... }` — por exemplo `--amber-600: #d97706;` é o dourado principal do site.
- **Mudar o nome do site**: procure "MozLit" nos arquivos `.html` e em `assets/js/app.js`.

## Se precisar de mim de novo

Você pode voltar a esta conversa (ou abrir uma nova) e me pedir para:
- Adicionar uma página nova
- Mudar cores, fontes ou layout
- Adicionar uma funcionalidade nova (ex: avaliações, favoritos, pesquisa)
- Ajudar a resolver um erro que aparecer

Basta descrever o que precisa, sem se preocupar com termos técnicos.
