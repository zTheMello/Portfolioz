-- Rode UMA vez em: Supabase > SQL Editor > New query > Run.
-- Cria as tabelas do portfólio, as regras de acesso e o espaço de imagens.

create table if not exists portfolio_projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'web design',   -- usada pelo filtro: web design | web development | applications
  subtitulo text,                                  -- texto pequeno no card (ex.: Landing Page)
  imagem text,
  link text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists portfolio_feedbacks (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  texto text not null,
  foto text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists portfolio_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  logo text,
  link text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

-- Qualquer pessoa LÊ (o site público); só quem está logado ESCREVE (o painel).
do $$
declare t text;
begin
  foreach t in array array['portfolio_projetos', 'portfolio_feedbacks', 'portfolio_clientes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "leitura publica" on %I', t);
    execute format('create policy "leitura publica" on %I for select using (true)', t);
    execute format('drop policy if exists "escrita admin" on %I', t);
    execute format('create policy "escrita admin" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Espaço público para as imagens enviadas pelo painel.
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "portfolio leitura" on storage.objects;
drop policy if exists "portfolio envio" on storage.objects;
create policy "portfolio leitura" on storage.objects for select using (bucket_id = 'portfolio');
create policy "portfolio envio" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio');

-- IMPORTANTE: em Authentication > Sign In / Providers, desligue "Allow new users to sign up"
-- e crie o seu usuário em Authentication > Users. Senão qualquer pessoa poderia criar conta e editar o site.