# Segundo Cérebro

Webapp pessoal (mobile-first, PWA) para ligar tarefas, inbox, campanhas e criativos de marketing
num só sítio. Os dados ficam guardados localmente no browser (IndexedDB).

Contexto, arquitetura e fases: ver [CLAUDE.md](CLAUDE.md).

## Correr localmente

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:lan      # também acessível no telemóvel, na mesma rede Wi-Fi
```

Na primeira abertura são criados dados de exemplo fictícios.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Dexie (IndexedDB)
