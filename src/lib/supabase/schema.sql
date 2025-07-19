
-- ### SETUP INICIAL ###

-- Ativar a extensão http para chamadas HTTP (se necessário para webhooks, etc.)
create extension if not exists http with schema extensions;
-- Ativar a extensão pg_cron para tarefas agendadas (se necessário)
create extension if not exists pg_cron with schema extensions;
-- Ativar o JWT para a gestão de utilizadores do Supabase
create extension if not exists pgjwt with schema extensions;
-- Ativar UUIDs para identificadores únicos
create extension if not exists "uuid-ossp" with schema extensions;

-- ### CRIAÇÃO DAS TABELAS ###

-- Tabela de Confrarias
create table if not exists public.confrarias (
    id bigint primary key generated always as identity,
    name text not null,
    motto text,
    region text not null,
    seal_url text,
    seal_hint text
);
comment on table public.confrarias is 'Armazena as informações sobre as confrarias gastronómicas.';

-- Tabela de Descobertas
create table if not exists public.discoveries (
    id bigint primary key generated always as identity,
    slug text not null unique,
    title text not null,
    description text not null,
    editorial text not null,
    region text not null,
    type text not null,
    confraria_id bigint references public.confrarias(id),
    image_url text,
    image_hint text,
    address text,
    website text,
    phone text
);
comment on table public.discoveries is 'O coração da aplicação: os tesouros gastronómicos.';

-- Tabela de Selos (ligação entre utilizador e descoberta)
create table if not exists public.seals (
    id bigint primary key generated always as identity,
    user_id uuid not null references auth.users(id) on delete cascade,
    discovery_id bigint not null references public.discoveries(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint seals_unique_user_discovery unique (user_id, discovery_id)
);
comment on table public.seals is 'Regista quando um utilizador concede um "selo de confrade" a uma descoberta.';

-- Tabela de Submissões de novas descobertas
create table if not exists public.submissions (
    id bigint primary key generated always as identity,
    user_id uuid not null references auth.users(id) on delete cascade,
    discovery_title text not null,
    editorial text,
    region text,
    type text,
    confraria_id bigint references public.confrarias(id),
    links text,
    status text default 'Pendente' not null, -- Pendente, Aprovado, Rejeitado
    date date not null
);
comment on table public.submissions is 'Submissões de novas descobertas feitas pelos utilizadores para revisão.';

-- Tabela de Perfis de Utilizador (estende auth.users)
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    region text
);
comment on table public.users is 'Armazena dados de perfil adicionais para os utilizadores.';


-- ### FUNÇÕES E TRIGGERS ###

-- Função para criar um perfil de utilizador automaticamente após o registo em auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, region)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'region');
  return new;
end;
$$;

-- Trigger que chama a função handle_new_user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ### VIEWS (Vistas) ###

-- View para contagem de selos por descoberta (mais eficiente que um join)
create or replace view public.discovery_seal_counts as
select
    discovery_id,
    count(id) as seal_count
from
    public.seals
group by
    discovery_id;
comment on view public.discovery_seal_counts is 'Conta quantos selos cada descoberta tem.';


-- ### POLÍTICAS DE ROW LEVEL SECURITY (RLS) ###

-- Ativar RLS em todas as tabelas
alter table public.confrarias enable row level security;
alter table public.discoveries enable row level security;
alter table public.seals enable row level security;
alter table public.submissions enable row level security;
alter table public.users enable row level security;

-- Limpar políticas antigas antes de criar novas
drop policy if exists "Allow public read access" on public.confrarias;
drop policy if exists "Allow public read access" on public.discoveries;
drop policy if exists "Allow logged-in users to create seals" on public.seals;
drop policy if exists "Allow owner to view their own seals" on public.seals;
drop policy if exists "Allow owner to delete their own seals" on public.seals;
drop policy if exists "Allow logged-in users to create submissions" on public.submissions;
drop policy if exists "Allow owner to view their own submissions" on public.submissions;
drop policy if exists "Allow owner to view their own profile" on public.users;
drop policy if exists "Allow users to update their own profile" on public.users;


-- Políticas para CONFRARIAS (leitura pública)
create policy "Allow public read access" on public.confrarias for select
using (true);

-- Políticas para DISCOVERIES (leitura pública)
create policy "Allow public read access" on public.discoveries for select
using (true);

-- Políticas para SEALS (requer autenticação)
create policy "Allow logged-in users to create seals" on public.seals for insert
to authenticated with check (auth.uid() = user_id);

create policy "Allow owner to view their own seals" on public.seals for select
using (auth.uid() = user_id);

create policy "Allow owner to delete their own seals" on public.seals for delete
using (auth.uid() = user_id);

-- Políticas para SUBMISSIONS (requer autenticação)
create policy "Allow logged-in users to create submissions" on public.submissions for insert
to authenticated with check (auth.uid() = user_id);

create policy "Allow owner to view their own submissions" on public.submissions for select
using (auth.uid() = user_id);

-- Políticas para USERS/PROFILES (requer autenticação)
create policy "Allow owner to view their own profile" on public.users for select
using (auth.uid() = id);

create policy "Allow users to update their own profile" on public.users for update
using (auth.uid() = id);


-- FIM DO SCRIPT

