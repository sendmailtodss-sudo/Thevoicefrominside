# Developing the website

The public website is [thevoicefrominside.dev](https://thevoicefrominside.dev), hosted on Vercel since 11 November 2026. The old ChatGPT Sites deployment is a historical rollback reference. The hosted reading experience does not depend on a ChatGPT subscription.

Use Node.js 24 LTS. The preview and build use Node's standard library; no frontend framework or paid service is required.

```sh
npm ci
npm test
npm run check
npm run build
npm run dev
```

Open <http://localhost:8080>. Set `PORT` if that port is occupied. Stop the process with Ctrl+C. The preview serves `public/`, so source edits appear on reload. `npm run build` creates a separate `dist/` tree; it does not publish anything.

## Working with any editor or AI assistant

Clone or download the contributor repository, or use a Git bundle supplied by the maintainer. Read `AGENTS.md`, create a branch or separate worktree, and run the commands above. A local editor and terminal are sufficient; ChatGPT, Codex and other AI tools are optional. Access to an AI assistant depends on that provider's account terms, while the website can still run without it.

Give a collaborator the focused task, relevant public files, reproduction steps and expected Norwegian/English behavior. Keep changes reviewable, and hand back the commit or patch with the checks actually run. Use synthetic examples and retain approved text and artwork. Keep private production content and credentials outside the public checkout and AI prompts unless separately authorized.

For application changes, run the relevant tests, source check and build, plus browser checks for affected routes. For documentation-only edits, verify links, stated commands and the diff; a full application test run is unnecessary unless the instructions or code changed.

## GitHub Codespaces

1. On the repository, choose **Code → Codespaces → Create codespace on main**.
2. Wait for the Node 24 development container and `npm ci` to finish.
3. Run `npm run dev` in its terminal.
4. Open port **8080** from the **Ports** panel. Keep its visibility private.
5. Run `npm test` and `npm run build` before submitting a focused pull request.

The repository provides this configuration. Creating a hosted Codespace still depends on the contributor's GitHub access and available quota; no running Codespace or paid plan is provisioned by this repository.

## What the preview contains

The contributor distribution derives from the earlier website source and includes later reviewed application changes. Selected editorial pages use explicitly labeled example material; approved public artwork and media are included where released. Private manuscripts, case-document downloads, unreleased original artwork, contact logs, service data and production credentials remain separately managed. Missing images display an SVG marked as an example; missing PDFs return 404. The full private production source must not be replaced by this sanitized checkout.

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

## Portable frontend and production release

`public/` contains the browser application. `npm run build` copies it to `dist/client/`; that directory is the portable frontend output. A static host must serve nested directory-index routes, the correct media types and video byte ranges. Check direct links, language routes, downloads, gallery navigation and security headers on any proposed host.

The same build also writes `dist/server/` with Cloudflare Worker modules and a generated configuration containing placeholder bindings. This is backend source for review, not an operational Vercel backend. Moving the static files does not move databases, uploaded media, identity, payments or submission processing. Those services require their own implementation, migration and verification.

This repository has no tracked Vercel deployment configuration or automatic production deployment. A commit, a passing test, a Codespaces preview and a local build are not publication receipts. Production website changes use the maintainer's separately managed source and authorized release process. Reconcile contributor changes with the approved production content, retain a rollback artifact, and verify the actual deployment before switching traffic. Do not upload private deployment configuration or copy private operational instructions into this repository. See [independent hosting](independent-hosting.md) for the handover boundary.


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

The contributor home pages include a scroll-controlled visual journey. The available public clips and approved artwork are included under `public/assets/journey/`; the selected original images retain their existing ownership and terms. The city scenes are explicitly marked as temporary AI illustrations: their shirt prints are not faithful reproductions. The surveillance sequence is an edited approximation, and some creator recording and sending actions remain unfinished. Images and video are illustrative, not documentary recordings.

Use the existing preview command above. The server supports byte ranges for local MP4 files, allowing forward and reverse seeking without any live service. Sound starts off; keyboard navigation, motion controls, reduced-motion and a no-JavaScript fallback remain available. The preview is still noindex and all `/api/` routes remain disabled. This repository is a sanitized contributor distribution, not a complete mirror of production editorial content or a production deployment.

## Historical private opening preview

The earlier private scroll prototype is no longer mounted on the home page. The preview server still supports its optional local media routes for development and legacy integrations: set `DREAMINA_PREVIEW_VIDEO=/absolute/private/path/opening.mp4` for `/__private-preview/opening.mp4`, or `DREAMINA_PREVIEW_DIR=/absolute/private/scenes` for `/__private-preview/scenes/NAME.mp4`. Either setting binds the server to 127.0.0.1 and exposes the specified files read-only with byte ranges. Setting these variables does not replace the current public journey. Do not expose a forwarded port publicly: anyone who can reach it can retrieve the configured private media. Private trials are not automatically approved artwork.

### Input-controlled journey

The confirmed 11 November design replaces idle playback and loops with a fully
reversible timeline. Every main-journey MP4 remains paused; its decoded time,
word positions, binary stream, light aperture and progress indicator derive
from the current scroll position. Stopping input holds the frame and effects;
scrolling up reverses the same timeline. There are no forced viewing delays.
The separate opt-in film player and user-activated gallery/VR are independent
controls, not autonomous main-journey playback.

The opening begins with a small point before Big Bang. Its invitation disappears
when scrolling starts and returns at the origin. The primary language selector
is in the persistent header and offers Norsk, English and 简体中文. Scene and
URL query/hash state are retained when changing language within the journey.
The new fixed Chinese control dictionary supplements the existing editorial
and Cantonese dictionaries; it does not replace or certify all website text.

Use `scripts/apply-scroll-opening.mjs` for the bounded homepage migration on the
maintainer's separately managed full-content source. It relocates the existing
entrance block after the visual opening and changes only named opening anchors;
original text elsewhere must remain byte-identical. Run it after the existing
public-entrance patch. See [journey transitions](journey-transitions.md) for media
limits and checks.

Regression checks should hold an actual decoded video and the neural chapter
stationary for at least 1.5 seconds and compare pixels as well as currentTime.
Seek forward and back through every enabled MP4; check desktop/mobile, all three
journey languages, language changes, artwork inspection, keyboard navigation,
resize, skip links and reduced motion. An unchanged scroll value or a mocked
ended event alone does not establish a frozen visual presentation.
