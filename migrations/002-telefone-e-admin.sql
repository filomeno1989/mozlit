-- =====================================================================
-- MIGRAÇÃO 002 — Adiciona campo de telefone + trigger atualizado
-- Rode isto no SQL Editor do Supabase (New query → colar → Run).
-- Seguro rodar mesmo se já tiver dados — não apaga nada.
-- =====================================================================

-- 1. Adiciona a coluna "telefone" na tabela de perfis (se ainda não existir)
alter table public.profiles
  add column if not exists telefone text not null default '';

-- 2. Atualiza a função que cria o perfil automaticamente no registo,
--    para também salvar o telefone informado no formulário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, telefone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    new.email,
    coalesce(new.raw_user_meta_data->>'telefone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'LEITOR')
  );
  return new;
end;
$$;

-- (o trigger "on_auth_user_created" já criado no schema original continua
--  funcionando normalmente, só a função por trás dele foi atualizada)


-- =====================================================================
-- COMO TORNAR UM USUÁRIO ADMINISTRADOR
-- =====================================================================
-- 1. Primeiro, registe-se normalmente no site (como Leitor ou Escritor)
--    usando o email que você quer que seja o admin.
-- 2. Depois, rode o comando abaixo no SQL Editor, TROCANDO o email
--    pelo email que você usou no registo:

update public.profiles
set role = 'ADMIN'
where email = 'filomeno1989@gmail.com';

-- 3. Para confirmar que funcionou, rode:
-- select nome, email, role from public.profiles where email = 'filomeno1989@gmail.com';
