# Developing the website

Use Node.js 24 LTS. The preview and build use Node's standard library; no frontend framework or paid service is required.

```sh
npm ci
npm test
npm run build
npm run dev
```

Open <http://localhost:8080>. Set `PORT` if that port is occupied. Stop the process with Ctrl+C. The preview serves `public/`, so source edits appear on reload. `npm run build` creates a separate `dist/` tree; it does not publish anything.

## GitHub Codespaces

1. On the repository, choose **Code → Codespaces → Create codespace on main**.
2. Wait for the Node 24 development container and `npm ci` to finish.
3. Run `npm run dev` in its terminal.
4. Open port **8080** from the **Ports** panel. Keep its visibility private.
5. Run `npm test` and `npm run build` before submitting a focused pull request.

The repository provides this configuration. Creating a hosted Codespace still depends on the contributor's GitHub access and available quota; no running Codespace or paid plan is provisioned by this repository.

## What the preview contains

The developer distribution starts from version 34's browser and Worker application code. Selected editorial pages and artwork use explicitly labeled example material. Original manuscripts, case-document downloads, artwork binaries, contact logs and production credentials are not part of this distribution. Missing images display an SVG marked as an example; missing PDFs return 404.

The development server serves browser interfaces only. It does **not** run the Worker backend. Every `/api/` request returns `503` with `error: "development-disabled"`; submissions, login, collaboration delivery, payments and real account data are therefore unavailable. Non-API write requests return `405`. No API request is forwarded to the live website. The browser policy also limits fetch connections to this preview's own origin.

The Worker source and database migrations remain available for code review and isolated tests. Tests use synthetic data. Integrating a backend, identity provider, storage or payment provider is a separate task requiring explicit configuration and review; do not attach production bindings just to make a preview screen appear active.

## Useful starting points

- `public/`: page templates, styles and browser interactions.
- `worker/`: backend modules, not invoked by `npm run dev`.
- `drizzle/`: database schema migrations.
- `tests/`: isolated checks and preview-server security tests.
- `scripts/dev.mjs`: read-only local HTTP server.
- `scripts/build.mjs`: local build entry point.

Keep edits focused. Check both Norwegian and English routes, narrow mobile layouts, keyboard navigation and reduced-motion behavior where relevant. Preserve the distinction between a functional interface prototype and a service that is actually open.

## Publication

This repository has no automatic production deployment. A commit, a passing test, a Codespaces preview and a local build are not publication receipts. Production website changes require the maintainer's explicit release workflow and approval. Do not upload private deployment configuration or copy private operational instructions into this repository.


## 5 November contributor update

The generic interface, navigation, gallery and application code were refreshed from the source revision recorded in [source provenance](source-provenance.json). The 27 approved gallery images and their depth resources are included. Reading-page fixtures and sanitized search and translation data remain examples, so this is not a complete production content mirror. Private case files and manuscripts remain excluded; the preview keeps services disabled.
