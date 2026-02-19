![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Node](https://img.shields.io/badge/node-22.14.0-brightgreen)
![Status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

# Recipes Saver

## Table of Contents

- [Project description](#project-description)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Project description

Recipes Saver centralizes text-only cooking instructions sourced from arbitrary URLs and lets authenticated users safely store structured records. Imports run through an asynchronous LLM-powered worker that normalizes titles, ingredients, preparation steps, and optional cook time, surfaces retry status or errors, and logs metadata for observability. Users can also create, update, search, and delete recipes manually while every view stays local-first and focused on searchable ingredients.

## Tech stack

- **Frontend:** Astro 5 pages with React 19 islands, Tailwind 4 utility styling, TypeScript 5 typing, and shadcn/ui components where forms, modals, and dialogs need accessibility.
- **Backend:** Supabase Postgres with row-level security, built-in auth, and the supabase-js v2 client for recipe CRUD, metadata tracking, and per-user isolation.
- **AI extraction:** OpenRouter unified model API drives the background worker that scrapes remote recipe URLs, normalizes data, and retries up to three times before surfacing failures.
- **CI/CD & hosting:** GitHub Actions handles linting, formatting, and builds, while the stack is deployed to **Cloudflare Pages**.
- **Wrangler:** Used for Cloudflare deployment and local preview of the production environment.
- **Testing:** Vitest and React Testing Library for unit and integration testing, Playwright for end-to-end (E2E) and visual testing, and Supabase CLI for security (RLS) testing.
- **Tooling:** ESLint, Prettier, and lint-staged enforce formatting and code quality across `.ts`, `.tsx`, `.astro`, and other assets.

## Getting started locally

### Prerequisites

- [Node.js 22.14.0](https://nodejs.org/) (as specified in `.nvmrc`) managed with `nvm`
- A Supabase project with credentials for Postgres and Auth
- OpenRouter credentials or equivalent LLM endpoint to power recipe imports

### Setup

1. `nvm install && nvm use`
2. `npm install`
3. `cp .env.example .env` and update the Supabase, OpenRouter, and any other required variables
4. `npm run dev` to start the Astro dev server

## Available scripts

- `npm run dev` – start the Astro dev server with hot reload
- `npm run build` – build the static site for production
- `npm run preview` – serve the production build locally
- `npm run lint` – run ESLint checks
- `npm run lint:fix` – fix lint issues automatically
- `npm run format` – run Prettier across the repo
- `npm run astro` – expose the Astro CLI for manual commands

## Project scope

### In scope

- Text-only recipes with structured titles, ingredient lists, preparation steps, and optional cook time stored per user
- LLM-powered imports that validate single recipes, log failures or retries, and represent processing status in the UI
- Manual creation, editing, deletion, and ingredient keyword search that mirror imported recipe validation
- Authentication via email/password so every recipe collection stays private to the signed-in user

### Out of scope

- Multimedia assets (images, video, audio) or rich formatting beyond plain text
- Social features such as sharing, ratings, or comments
- Advanced search (synonyms, fuzzy matching) and calendar/meal planning integrations
- Recovery flows, MFA, or federated logins during the MVP phase

## Project status

Currently in MVP mode: the priority is a local-first experience where authenticated users can import validated recipes, view structured fields, search by normalized ingredients, and delete or recreate entries. Observability focuses on logging worker retries, statuses, and errors, while the UI shutters processing entries until they resolve. Success metrics include weekly adoption targets, ≥95% import reliability within three retries, 90% ingredient search effectiveness, and clear deletion confirmations.

## License

Not yet specified. Please add a `LICENSE` file or update this section once a license is chosen.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework
- [Vitest](https://vitest.dev/) - Blazing fast unit test framework
- [Playwright](https://playwright.dev/) - Reliable end-to-end testing for modern web apps

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run unit and integration tests with Vitest
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npx wrangler pages dev ./dist` - Preview the production build locally in a Cloudflare environment

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
