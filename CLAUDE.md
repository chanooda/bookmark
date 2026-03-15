# Overview

This project is a website (default page) and Chrome extension to improve Chrome browser bookmark management. This app provides the following features:

1. common
    - Bookmark tagging
    - Chrome browser bookmark sync
2. website (default page)
    - Various views (list, grid, card) to see your bookmarks at a glance
    - Search
3. extension
    - A Chrome extension that provides a UI for easily adding and editing bookmarks

## After edit code (CRITICAL)

All four steps are mandatory after every code change. **NO EXCEPTIONS — you MUST complete all steps regardless of how small the change is:**

1. `pnpm check` — lint and format check
2. `pnpm check-types` — TypeScript type check
3. `pnpm --filter @bookmark/web test` — run tests (all must pass; fix failures before finishing)
4. **MANDATORY: verify no runtime errors occur. If any runtime error is found, you MUST fix it before finishing. Never consider a task done while runtime errors exist.**

## worktree path

`.worktrees/` (project-local, hidden)

## Skills usage rules

### Before starting any feature or creative work

- Use the `brainstorming` skill to explore intent and requirements before implementation
- Use the `writing-plans` skill when given a spec or multi-step task, before touching code
- Use the `feature-dev` skill for guided feature development

### Bug fixing

When a bug occurs, always use the `systematic-debugging` skill before proposing any fix.

### Frontend development

When working on React or Next.js:

- Use the `composition-patterns` skill for component architecture and composition patterns
- Use the `react-best-practices` skill for performance optimization and best practices

### Publishing / UI

When publishing or building UI:

- Use the `frontend-design` skill to create production-grade interfaces
- After completion, verify with the `web-design-guidelines` skill

### Git workflow

- Use the `commit-commands:commit` skill to create commits
- Use the `commit-commands:commit-push-pr` skill to commit, push, and open a PR

## package installation and library usage rules

### package installation

- Always use safe, stable latest versions
- Never use experimental or alpha versions unless explicitly required

### library usage (CRITICAL)

- **MUST use context7 MCP to check official documentation before installing or initializing any library**
- Follow the official documentation exactly as provided by context7 MCP
- This ensures correct setup and prevents configuration errors

### CLI-based libraries (CRITICAL)

**NEVER manually write code or configuration that an official tool can generate.** Always find and use the official method first:

1. If a CLI exists → use it (including init, generate, add, migrate commands)
2. If no CLI → find an official template or example (e.g., GitHub template repos) and follow it exactly
3. Only write manually what no official tool covers

Use context7 MCP to check official documentation before any setup. If the documentation or CLI handles a specific environment (e.g., monorepo), find and follow the version for that environment.

Examples:

- shadcn ui init: `pnpm dlx shadcn@latest init` / add: `pnpm dlx shadcn@latest add [component]` / monorepo template: <https://github.com/shadcn-ui/ui/tree/main/templates/monorepo-next>
- nestjs: `nest generate [module|controller|service|...]`
- drizzle-orm: `drizzle-kit generate` / `drizzle-kit migrate`

## develop environment spec (CRITICAL)

**MUST apply the following environment configuration when setting up any new app or package in this project. These are mandatory and must not be skipped or replaced with alternatives.**

- tsconfig(frontend): `@chanooda/typescript-config-frontend`
- biome(frontend): `@chanooda/biome-config-frontend@0.0.2`
- test: vitest, playwright
- git hook: lefthook

## Tech stack

### Frontend

- react@latest, tailwindcss@latest, shadcn ui@latest
- @tanstack/react-query@latest, zustand@latest
- zod@latest, react-hook-form@latest
- Architecture: FSD (Feature-Sliced Design)

### Backend

- nestjs@latest, drizzle-orm@latest, sqlite

## Assets

- Icons are stored in component form in the packages/ui/src/icons folder.
