-- =====================================================================
-- Segundo Cérebro | Fase 1 (MVP): Inbox, Canais, Campanhas, Criativos, Tarefas
-- Uso pessoal (1 utilizador). RLS ativo em todas as tabelas.
-- Guardar como: supabase/migrations/001_fase1_schema.sql
-- =====================================================================

-- ---------- Tipos (estados) ----------
create type campaign_status as enum ('planeada', 'em_teste', 'ativa', 'pausada', 'encerrada');
create type creative_status  as enum ('ideia', 'em_producao', 'pronto', 'no_ar', 'esgotado');
create type task_status      as enum ('a_fazer', 'em_curso', 'feito');
create type task_priority    as enum ('baixa', 'media', 'alta');

-- ---------- Função para atualizar updated_at ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Canais (Facebook Ads, Instagram, Google Meu Negócio, ...) ----------
create table channels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  area        text not null default 'marketing',  -- permite crescer para outras áreas
  objective   text,
  routine     text,                                -- rotina mínima do canal
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- Inbox (captura rápida) ----------
create table inbox_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content     text not null,
  source      text,                                -- ex.: 'telemovel', 'web', 'whatsapp'
  processed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Campanhas ----------
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  channel_id    uuid references channels(id) on delete set null,
  name          text not null,
  objective     text,                              -- leads, mensagens, remarketing...
  status        campaign_status not null default 'planeada',
  daily_budget  numeric(10,2),
  start_date    date,
  end_date      date,
  audience      text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Criativos ----------
create table creatives (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id   uuid references campaigns(id) on delete set null,
  title         text not null,
  format        text,                              -- video, imagem, carrossel...
  hypothesis    text,                              -- o que queres testar
  status        creative_status not null default 'ideia',
  due_date      date,                              -- data limite de entrega
  file_url      text,
  result_notes  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Tarefas ----------
create table tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title          text not null,
  status         task_status not null default 'a_fazer',
  priority       task_priority not null default 'media',
  due_date       date,
  recurrence     text,                             -- ex.: 'diaria', 'semanal:sexta' (Fase 3)
  channel_id     uuid references channels(id)    on delete set null,
  campaign_id    uuid references campaigns(id)   on delete set null,
  creative_id    uuid references creatives(id)   on delete set null,
  inbox_item_id  uuid references inbox_items(id) on delete set null,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- Índices ----------
create index idx_inbox_pending      on inbox_items (user_id, processed, created_at desc);
create index idx_campaigns_status   on campaigns (user_id, status);
create index idx_creatives_due      on creatives (user_id, status, due_date);
create index idx_creatives_campaign on creatives (campaign_id);
create index idx_tasks_due          on tasks (user_id, status, due_date);

-- ---------- RLS + triggers em todas as tabelas ----------
do $$
declare
  t text;
begin
  foreach t in array array['channels', 'inbox_items', 'campaigns', 'creatives', 'tasks']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "owner_all" on %I for all
         using (user_id = auth.uid())
         with check (user_id = auth.uid())', t);
    execute format(
      'create trigger trg_%s_updated before update on %I
         for each row execute function set_updated_at()', t, t);
  end loop;
end;
$$;

-- ---------- Marcar data de conclusão automaticamente ----------
create or replace function set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'feito' and old.status is distinct from 'feito' then
    new.completed_at = now();
  elsif new.status <> 'feito' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_tasks_completed
  before update on tasks
  for each row execute function set_task_completed_at();

-- =====================================================================
-- SEED DOS CANAIS (correr UMA vez no SQL Editor, depois de criares o teu utilizador)
-- =====================================================================
-- insert into channels (user_id, name, objective)
-- select u.id, c.name, c.objective
-- from auth.users u
-- cross join (values
--   ('Facebook Ads',          'Gerar contactos/orçamentos'),
--   ('Instagram',             'Presença e prova social'),
--   ('Google Meu Negócio',    'Avaliações e contactos locais'),
--   ('Site',                  'Converter visitas em pedidos'),
--   ('Sistema',               'Gestão interna e dados'),
--   ('Remarketing',           'Recuperar contactos que não fecharam')
-- ) as c(name, objective)
-- limit 6;
