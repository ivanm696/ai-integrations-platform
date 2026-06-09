# AI Integrations Platform

A full-stack web application for managing AI provider integrations and building AI-powered projects — built with React, Vite, TypeScript, Tailwind CSS and Supabase.

## Features

- 🔐 **Authentication** — Sign up / sign in via Supabase Auth
- 🔌 **Integrations** — Connect API keys from OpenAI, Anthropic, Google, Mistral and more
- 📁 **Projects** — Create AI projects from templates (Chatbot, Code Generator, Image Generator, Data Analyzer, Blank)
- 🎮 **Playground** — Test prompts interactively in the browser via WebContainer
- 📊 **Dashboard** — Usage stats, recent activity, execution logs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Icons | Lucide React |
| Routing | React Router v7 |

## Quick Start

```bash
git clone https://github.com/ivanm696/ai-integrations-platform.git
cd ai-integrations-platform
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase credentials from [supabase.com/dashboard](https://supabase.com/dashboard).

```bash
npm run dev   # → http://localhost:5173
```

## Database Setup

Run the migration in your Supabase SQL editor:

```bash
# File: supabase/migrations/20260604194825_create_ai_integrations_platform.sql
```

Or via Supabase CLI:

```bash
npx supabase db push
```

## Project Structure

```
src/
├── components/
│   ├── AuthForm.tsx       # Login / Register form
│   └── Layout.tsx         # App shell (sidebar + topbar)
├── hooks/
│   └── useAuth.ts         # Supabase auth hook
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── types.ts           # TypeScript types (AIProvider, Integration, Project...)
├── pages/
│   ├── Dashboard.tsx      # Stats + recent activity
│   ├── Integrations.tsx   # AI provider API keys management
│   ├── Projects.tsx       # Project list + create from template
│   └── Playground.tsx     # Interactive AI prompt tester
└── App.tsx                # Routes + ProtectedRoute guard
supabase/
└── migrations/            # PostgreSQL schema (ai_providers, integrations, projects, logs)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |

## License

MIT © 2026 ivanm696
