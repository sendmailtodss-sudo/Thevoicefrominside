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

## Cinematic journey in the contributor preview

The Norwegian and English home pages now include the published scroll-driven visual journey. The available public clips and approved artwork are included under `public/assets/journey/`; the selected original images retain their existing ownership and terms. The city scenes are explicitly marked as temporary AI illustrations: their shirt prints are not faithful reproductions. The surveillance sequence is an edited approximation, and some creator recording and sending actions remain unfinished. Images and video are illustrative, not documentary recordings.

Use the existing preview command above. The server supports byte ranges for local MP4 files, allowing forward and reverse seeking without any live service. Sound starts off; keyboard navigation, motion controls, reduced-motion and a no-JavaScript fallback remain available. The preview is still noindex and all `/api/` routes remain disabled. This repository is a sanitized contributor distribution, not a complete mirror of production editorial content or a production deployment.

## Historical private opening preview

The opening prototype can use an explicitly supplied local MP4 without adding it to the repository. On a private machine run `DREAMINA_PREVIEW_VIDEO=/absolute/private/path/opening.mp4 PORT=8769 npm run dev`. In this mode the preview server binds to 127.0.0.1 only and exposes that one selected file through a read-only range-enabled route. The media is not included in the build. Treat any forwarded port as access to the private clip. Without the file, the opening displays its fallback. The scroll prototype seeks through the clip and uses a separately animated star overlay; additional approved media, seamless stage transitions and an original scene-synchronized soundtrack remain future work.

For the multi-scene private journey, put individually named MP4s in a private directory outside the checkout and run `DREAMINA_PREVIEW_DIR=/absolute/private/scenes PORT=8770 npm run dev`. The server binds to loopback and serves only files in that directory, with byte ranges for seeking. Missing scenes display a labeled placeholder. Never expose a forwarded port publicly: anyone with access can retrieve the private media. The sequence is a work-in-progress and its AI trials are not approved artwork. Code fades and animated stars do not establish seamless continuity, correct identities, or rights clearance.
