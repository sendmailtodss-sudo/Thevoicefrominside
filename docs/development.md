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

## Dreamina media workshop

Open /verksted/dreamina/ in the private preview. Export a UTF-8 prompt, open Dreamina, generate there and download the result. Import a decodable PNG, JPEG or MP4 up to 50 MiB. Imports remain in project-specific IndexedDB on this origin and browser profile. Download a backup before clearing browser data. Import establishes no proof of origin and does not publish anything.

For programmatic operation on a private Node 24 host, follow https://dreamina.capcut.com/ai-tool/install and authenticate the official CLI as the operator. Keep CLI account state outside the checkout, in a private persistent home. Optionally set DREAMINA_BIN in the host environment. No web token is needed. Run these from the project root:
Copy .env.example to ../dreamina.env outside the source tree, set the canvas UUID from `dreamina-canvas canvas ls`, and select models and supported settings from `dreamina-canvas model list --type image` or `video`. The official installer currently supplies dreamina-canvas. Use `dreamina-canvas auth status` and `dreamina-canvas auth login` if needed. In a persistent cloud host use the same variables in its environment settings. Keep the OAuth profile on the private host.
- `node --env-file=../dreamina.env scripts/dreamina.mjs plan-image "your prompt"` validates without remote generation. Use draft-image to save a node without running it. Video has corresponding plan-video and draft-video commands.
- For a paid generation use image or video followed by the quoted prompt and a fresh submission UUID. Record the UUID first. The CLI manages credit confirmation interactively.
- Run status with that same UUID; download with the resulting resource ID. The CLI writes private results to local-data/dreamina/CANVAS_UUID/RESOURCE_ID.media. File type is detected from the content when importing. No arbitrary download URL is accepted.
- After timeout, rate limit or uncertain submission query status before further action. No automatic retries or automatic confirmation. Webhooks and account-specific numeric rate limits were not verified.

The contributor preview has no live accounts or media bindings. This terminal integration uses OS account access. Production hosting is separately managed.
