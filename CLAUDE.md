@AGENTS.md

# Segundo Cérebro

Webapp **pessoal** (um único utilizador) para organizar o fluxo de trabalho de alguém que
acumula várias responsabilidades. Não é um produto para terceiros. Pode vir a ser open source.

O problema que resolve: tarefas, notas e calendário vivem em ferramentas separadas e nenhuma
cobre o fluxo real. Aqui tudo está ligado (uma tarefa sabe de que campanha, criativo, canal ou
item da inbox veio).

O projeto cresce **por módulos**. O único módulo implementado é **Marketing**, centrado no
ciclo dos anúncios:

> Planear → Produzir criativos → Acompanhar → Decidir → Aprender

Canais de marketing: Facebook Ads, Instagram, Google Meu Negócio, Site, Sistema (ferramenta
interna) e Remarketing.

Outros módulos (operações, finanças, …) virão depois. O modelo de dados já o permite
(ex.: `channels.area`), mas **não implementar nada fora do módulo atual**.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (base `@base-ui/react`)
- Dados locais: IndexedDB via Dexie. **Supabase ainda não** (não instalar pacotes Supabase).
- PWA instalável: `src/app/manifest.ts`, ícones em `public/icons/`, `public/sw.js`.
- Deploy futuro: Vercel. Repositório: GitHub, branch `main`.

## Regra de arquitetura: camada de dados

Os ecrãs **nunca** importam Dexie nem `src/lib/data/dexie-*`. Importam só de `@/lib/data`.

```
supabase/migrations/001_fase1_schema.sql   ← fonte de verdade do esquema
src/lib/data/
  types.ts             tipos que espelham EXATAMENTE o SQL (snake_case, enums → union types)
  repository.ts        interface Repository (contrato que qualquer backend cumpre)
  dexie-db.ts          esquema IndexedDB (mesmas tabelas do SQL)
  dexie-repository.ts  implementação local, tudo assíncrono
  seed.ts              dados fictícios para a primeira abertura
  current-user.ts      utilizador fixo simulado (sem login)
  index.ts             ÚNICO ponto de exportação: `export const repo`
src/lib/hooks/         hooks de leitura para os ecrãs (usam `repo`)
```

- Trocar para Supabase = criar `supabase-repository.ts` e mudar **só** `index.ts`.
- Ao mudar o esquema: primeiro nova migração SQL, depois `types.ts`, depois `dexie-db.ts`
  (nova `version()`), depois o repositório.
- IDs: `crypto.randomUUID()`. Timestamps: ISO 8601 (`new Date().toISOString()`).
  Colunas `date`: `YYYY-MM-DD` em hora local. `numeric` → `number`.
- O repositório replica o comportamento dos triggers do SQL: `updated_at` em cada update e
  `completed_at` quando uma tarefa passa a/deixa de estar `feito`.
- Depois de uma escrita, o repositório emite um evento de alteração e os hooks voltam a ler.

## Convenções

- Interface em **português de Portugal**. Código, nomes de ficheiros e commits em inglês.
  Valores de estado ficam como no SQL (`a_fazer`, `em_producao`, …). Os rótulos legíveis
  vêm de `src/lib/labels.ts`.
- Rotas em português: `/` (Hoje), `/inbox`, `/criativos`, `/campanhas`, `/tarefas`.
- Mobile-first: alvos de toque com pelo menos 44px, navegação inferior fixa, sem animações
  pesadas.
- Simples antes de bonito. Não adicionar bibliotecas sem necessidade clara.
- Tema claro/escuro: classe `dark` no `<html>`, definida por um script inline antes do primeiro
  paint, guardada em `localStorage` (`theme`).
- Páginas que leem dados são Client Components (`"use client"`), porque os dados vivem no
  browser.

## Segurança e privacidade (repositório público)

- Nunca incluir segredos, chaves, dados reais, nomes de clientes ou empresas, nem informação
  pessoal em código, seeds, comentários ou documentação. O seed é 100% fictício.
- `.env*` está no `.gitignore` (exceto `.env.example`). Antes de cada commit, confirmar que
  não há `.env` nem chaves no stage.
- Commits pequenos e claros. Não fazer push sem confirmação.

## Fases

| Fase | Conteúdo |
|------|----------|
| 0 | Fundação (projeto, camada de dados, PWA, layout) |
| 1 | MVP local do módulo Marketing: inbox, tarefas, campanhas, criativos, ecrã Hoje |
| 2 | Revisões semanais com decisão obrigatória + log de aprendizagens |
| 3 | Calendário e lembretes (inclui `tasks.recurrence`) |
| 4 | Integrações: Meta Ads API, Google Calendar, sistema interno |
| 5 | Outros módulos/áreas |

A ligação ao Supabase entra **depois** de a Fase 1 estar em uso real.

## Comandos

```bash
npm run dev          # http://localhost:3000
npm run dev:lan      # acessível na rede local (telemóvel)
npm run lint
npm run build
```

Nota: o projeto pode estar num disco exFAT. O macOS cria ficheiros `._*`, que estão ignorados
no git.
