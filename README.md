![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Node](https://img.shields.io/badge/node-22.14.0-brightgreen)
![Status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

# Recipes Saver

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [License](#license)

## Project Description

Recipes Saver centralizes text-only cooking instructions sourced from arbitrary URLs and lets authenticated users safely store structured records. Imports run through an asynchronous LLM-powered worker that normalizes titles, ingredients, preparation steps, and optional cook time, surfaces retry status or errors, and logs metadata for observability. Users can also create, update, search, and delete recipes manually while every view stays local-first and focused on searchable ingredients.

## Tech Stack

### Frontend

- [Astro](https://astro.build/) — SSR framework with React islands
- [React](https://react.dev/) — interactive UI components
- [TypeScript](https://www.typescriptlang.org/) — type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) — accessible Dialog, Tooltip, Label components
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — form state management and schema validation
- [dnd-kit](https://dndkit.com/) — drag-and-drop for sortable lists
- [Heroicons](https://heroicons.com/) — icons

### Backend

- [Supabase](https://supabase.com/) Postgres with row-level security, built-in auth, and supabase-js ^2.91.0 for recipe CRUD, metadata tracking, and per-user isolation

### AI Extraction

- [OpenRouter](https://openrouter.ai/) unified model API drives the background worker that scrapes remote recipe URLs, normalizes data, and retries up to three times before surfacing failures

### CI/CD & Hosting

- [GitHub Actions](https://github.com/features/actions) — linting, formatting, testing, and builds
- [Cloudflare Pages](https://pages.cloudflare.com/) — deployment target
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — Cloudflare local preview and deployment

### Testing

- [Vitest](https://vitest.dev/) — unit and integration tests
- [Playwright](https://playwright.dev/) — end-to-end and visual testing

### Tooling

- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — formatting and code quality
- [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) — pre-commit hooks for `.ts`, `.tsx`, `.astro`, and other assets

## Getting Started Locally

### Prerequisites

- [Node.js 22.14.0](https://nodejs.org/) (as specified in `.nvmrc`) managed with `nvm`
- A Supabase project with credentials for Postgres and Auth
- OpenRouter credentials or equivalent LLM endpoint to power recipe imports

### Setup

1. `nvm install && nvm use`
2. `npm install`
3. `cp .env.example .env` and update the Supabase, OpenRouter, and any other required variables
4. `npm run dev` to start the Astro dev server

## Available Scripts

| Command                         | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| `npm run dev`                   | Start the Astro dev server with hot reload               |
| `npm run dev:e2e`               | Start the dev server in test mode                        |
| `npm run build`                 | Build the site for production                            |
| `npm run lint`                  | Run ESLint checks                                        |
| `npm run lint:fix`              | Fix ESLint issues automatically                          |
| `npm run format`                | Run Prettier across the repo                             |
| `npm run test`                  | Run unit and integration tests with Vitest               |
| `npm run test:ui`               | Run Vitest with interactive UI                           |
| `npm run test:coverage`         | Run Vitest with coverage report                          |
| `npm run test:e2e`              | Run end-to-end tests with Playwright                     |
| `npm run test:e2e:ui`           | Run Playwright tests with interactive UI                 |
| `npm run astro`                 | Expose the Astro CLI for manual commands                 |
| `npx wrangler pages dev ./dist` | Preview the production build in a Cloudflare environment |

## Project Structure

```
.
├── public/                          # Public static assets
├── src/
│   ├── assets/                      # Internal static assets
│   ├── components/
│   │   ├── auth/                    # Auth components (LoginForm, RegisterForm, UserMenu)
│   │   ├── recipes/                 # Recipe feature components
│   │   │   ├── detail/              # Recipe detail sub-components
│   │   │   ├── hooks/               # Custom hooks (useRecipeList, useRecipeCreate, etc.)
│   │   │   ├── types/               # Recipe-specific types
│   │   │   └── utils/               # Formatters, schemas, helpers
│   │   └── ui/                      # shadcn/ui primitives (Button, Dialog, Input, etc.)
│   ├── db/                          # Supabase client and database types
│   ├── layouts/                     # Astro layouts
│   ├── lib/
│   │   ├── services/
│   │   │   ├── ai/                  # OpenRouter AI service
│   │   │   └── recipes/             # Recipe CRUD service layer
│   │   └── validation/              # Auth validation schemas
│   ├── middleware/                   # Astro middleware (auth guard)
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/                # Auth API endpoints (login, register, logout)
│   │   │   └── recipes/             # Recipe API endpoints (CRUD, import)
│   │   ├── auth/                    # Auth pages (login, register)
│   │   └── recipes/                 # Recipe detail pages ([id])
│   ├── styles/                      # Global CSS
│   ├── test/                        # Test setup and utilities
│   └── types.ts                     # Shared types (entities, DTOs)
├── e2e/                             # Playwright E2E tests
└── .cursor/rules/                   # AI development rules
```

## Project Scope

### In Scope

- Text-only recipes with structured titles, ingredient lists, preparation steps, and optional cook time stored per user
- LLM-powered imports that validate single recipes, log failures or retries, and represent processing status in the UI
- Manual creation, editing, deletion, and ingredient keyword search that mirror imported recipe validation
- Authentication via email/password so every recipe collection stays private to the signed-in user

## License

MIT
