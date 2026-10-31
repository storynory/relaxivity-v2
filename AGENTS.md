# AGENTS.md — Sveltia Starter

## Purpose

A reusable SvelteKit project for content-driven websites, edited through Sveltia CMS.

The starter's architecture is an enduring design principle, not merely an initial scaffold. As this project develops into a specialised website, preserve its collection-driven, configuration-first approach. New features should build on the existing generic mechanisms wherever practical, rather than gradually replacing them with collection-specific code. Any departure from these principles should be deliberate, justified and discussed before implementation.

The aim is to make it easy to build different websites, experiment with layouts and colour schemes, and rearrange content without rewriting the underlying system.

**This is a foundation, not a framework intended to anticipate every future requirement.**

## Architecture

- Sveltia CMS YAML configuration defines collections and editing fields.
- The generator produces collection definitions, TypeScript types and template registries.
- Content is stored in Markdown, YAML or JSON files.
- Shared server-side loaders read and prepare content.
- Blocks provide reusable page sections and can be configured through the CMS.
- Svelte components handle presentation and layout.
- Keep content and CMS configuration as independent of SvelteKit as reasonably practical, allowing another renderer such as Astro in future.

## Important files

- `scripts/generator/` — CMS generator and supporting utilities.
- `src/lib/server/content.ts` — content loading and preparation.
- `src/lib/server/blocks.ts` — block loading and selection.
- `src/lib/content/` — file reading, Markdown rendering and relationship resolution.
- `src/lib/templates/` — detail templates.
- `src/lib/list-templates/` — collection listing templates.
- `src/lib/generated/` — generated code; do not edit manually.
- `static/admin/` — Sveltia CMS configuration and admin interface.
- `content/` — site content and settings; `static/uploads/` — source media.
- `src/lib/server/public-routes.ts` — public collection selection, draft filtering and route entries.
- `scripts/images/` — image processing and manifest generation.

## Development principles

1. Prefer straightforward TypeScript, idiomatic Svelte 5 and existing SvelteKit features.
2. Reuse existing functions and libraries before adding new abstractions.
3. Avoid duplicate data pipelines, unnecessary dependencies and premature optimisation.
4. Keep functions small, readable and understandable to a developer maintaining the project manually.
5. Avoid hard-coding assumptions about particular collections or websites.
6. Do not add features or refactor unrelated code without being asked.
7. Preserve existing CMS behaviour, generated interfaces and public routes.
8. Keep presentation choices flexible; individual projects may use different colour schemes, typography and block designs.
9. Prefer small, independently testable changes over broad rewrites.

## Content and configuration principles

- **Ordinary editorial changes must not require editing application code.** Headings, introductions, descriptions, labels, SEO metadata and other editorial content belong in content files or YAML configuration, not hard-coded in Svelte or TypeScript.
- **Fixed interface labels may remain in components.** Words such as Play, Pause, Next and Search do not need to be configurable unless there is a practical requirement. The restriction on hard-coded text applies to editorial content and settings that a publisher would reasonably expect to change.
- **New content collections must be definable entirely in YAML**, using the existing generic content engine, routes and templates. Adding a collection should not require hand-written TypeScript, Svelte components or routes.
- **Presentation belongs in reusable Svelte templates.** Collections define a default presentation template. Individual records may override that default with a compatible template selected through Sveltia. Template selection should not require new routes or custom loaders.
- **Maintain a single source of truth.** Do not duplicate editorial values or configuration across files.
- **Prefer existing mechanisms over new abstractions.** Before introducing specialised routes, loaders or configuration systems, check whether the existing collection, template or block architecture already supports the requirement.
- **Keep specialised functionality separate.** Audio playback, playlists and other application-specific behaviour should not unnecessarily complicate the generic content engine.
- **Preserve simplicity.** A change should make the system easier to understand and maintain, not merely add more configurability.

These principles should guide future implementations and code reviews.

## Content-loading conventions

- `getAll()` supports an optional raw-record selector.
- Filter, sort and limit records before expensive Markdown rendering and relationship resolution when practical.
- Preserve prepared records for consumers requiring rendered content or resolved relationships.
- `getAll()` and `getOne()` read folder collections; `getSettings()` reads files-based documents. They do not filter drafts automatically; public routes and blocks apply that policy.
- Do not introduce caching unless there is a measured need.

## Generator conventions

- Collection schemas live in `static/admin/collections/*.yml`; `static/admin/config.yml` holds shared CMS settings.
- `npm run dev` and `npm run build` run image processing and the CMS generator before Vite. Rerun generation after schema or template changes.
- The CMS generator also updates the marked collection-link section in `static/admin/index.html`; edit its source YAML rather than those links.
- Preserve deterministic generated output.
- Use `writeIfChanged()` to avoid rewriting unchanged generated files.
- Do not maintain separate manual lists of collections or templates when the generator can derive them from existing configuration or declarations.

## Working procedure

- Inspect existing code before proposing changes.
- Explain significant architectural changes before implementing them.
- Make the smallest change that solves the problem.
- Preserve unrelated working-tree changes.
- Run relevant checks and tests after edits.
- Review and explain the diff.
- State any assumptions or remaining limitations.

## Validation

Use the existing project scripts, including:

- `npm run check`
- `npm test`
- `npm run build`
- `npm run test:routes` — checks links in `build/`; run after `npm run build`.

The site uses static prerendering (`vite.config.ts`, `src/routes/+layout.ts`). The homepage is a Page selected in site settings and served at `/`.

Do not assume passing tests proves every behavioural detail; add focused regression tests when changing loaders, generators or routing.
