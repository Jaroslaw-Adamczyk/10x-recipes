# Technology Stack (English translation)

## Frontend – Astro 5 with React 19, TypeScript 5, Tailwind 4, and shadcn/ui

- **Astro 5** (latest major release per the official WithAstro docs) keeps pages fast by shipping zero JavaScript by default, leaving React islands only where needed for interactivity.
- **React 19.1.1** drives the interactive pieces that Astro defers to client bundles, giving us modern hooks, Suspense boundaries, and full support for the shadcn/ui component library.
- **TypeScript 5** provides static typing across server and client code; it pairs with Astro’s `tsconfig` presets so both `.astro` and `.tsx` files share a single type system.
- **Tailwind 4.1.13** handles utility-first styling, letting us abstract spacing, typography, and responsive states from within Astro or React components.
- **Shadcn/ui** (the latest release aligned with Tailwind 4) supplies accessible, pre-built React components for forms, modals, dialogs, etc., so we don’t hand-roll common controls.

## Backend – Supabase Postgres + auth + supabase-js v2

- **Supabase** is our open-source, Postgres-based backend. The docs highlight the supabase-js v2 client as the current stable release, which covers authentication, row-level security, real-time subscriptions, migrations, and storage without managing infrastructure ourselves.
- Supabase’s hosted Postgres, built-in auth, and logging satisfy the PRD’s requirements for secure credentials, per-user recipe tables, and centralized import/error metadata.

## AI – OpenRouter unified model API

- **OpenRouter** exposes a single API that normalizes WebSocket/HTTP requests across hundreds of models. The official docs describe how every request mirrors the OpenAI chat schema while adding provider routing, fallbacks, and tool hooks, making it a reliable LLM extraction worker source for recipe imports.
- OpenRouter’s API design lets us swap models or throttle requests without rewriting the extractor, and its cost-control options fit the PRD’s requirement for observation/logging of retries and errors.

## CI/CD and Hosting

- **GitHub Actions** orchestrates the CI/CD pipelines described in the PRD, building the Astro site, running lint/format checks, and optionally deploying preview builds for every recipe flow.
- **DigitalOcean** hosts the Dockerized stack once we’re ready to ship, pairing with Supabase’s managed services and keeping deployment/recovery straightforward for the MVP timeframe.
