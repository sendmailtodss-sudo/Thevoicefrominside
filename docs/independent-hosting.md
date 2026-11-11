# Independent hosting and shared development

The public website is [thevoicefrominside.dev](https://thevoicefrominside.dev), hosted on Vercel since 11 November 2026. Its reading pages, gallery and browser experience run independently of ChatGPT. The former ChatGPT Sites deployment is a historical rollback reference, not the current publication address.

The public repository is a sanitized contributor distribution. It contains application code, example reading content and approved public media. Full approved production writing, private uploads, service data and hosting configuration are separately managed. A source-code checkout alone is not a backup of the complete site or its data.

## Local work without a ChatGPT subscription

Node 24, Git and an editor are sufficient to inspect, edit, test and build this application. Clone or download the repository, or use a maintainer-supplied Git bundle, then follow the [development guide](development.md). Codex and other AI assistants can work on the same files and branches when their own provider access permits; none is a runtime dependency of the hosted website. Hosting and optional AI services have separate account and pricing terms.

1. Read `AGENTS.md` and `docs/development.md`; start from the current reviewed source in a separate branch or worktree.
2. Run `npm ci` and `npm run dev` for the local preview. Keep private material, operational logs and credentials outside the public repository.
3. For code changes, run the relevant tests, `npm run check` and `npm run build`, with browser checks for affected Norwegian/English, keyboard and mobile journeys. Check links and the diff for documentation-only changes.
4. Hand over a focused commit or patch and validation results. Push only with authorized repository access and review the preview produced by the maintainer's release process. A local commit or successful build does not prove a push or publication.

## What is portable

The frontend is ordinary HTML, CSS, JavaScript and media in `public/`. The build copies it to `dist/client/`, which can be served by a suitable static host. Preserve nested directory-index URLs, content types, video byte-range support and security headers when changing hosts.

`dist/server/` contains Cloudflare Worker modules and generated placeholder binding configuration. It is not a ready Vercel backend. The local preview deliberately closes `/api/*`; moving the frontend does not supply accounts, verified identity, payments, public submissions, database records or uploaded media. Existing backend code and schemas can support future implementation after the required service configuration and tests.

## Production handover

The maintainer manages the full production source and deployment configuration separately from this contributor export. Reconcile reviewed application changes with the approved production content; do not overwrite production reading pages with contributor examples. Preserve licensed assets, redactions and private access boundaries.

Keep a complete release artifact and rollback copy. Verify direct links, downloads, video seeking, gallery navigation and response headers on the actual deployment. Inventory and back up any databases and object storage separately. Until independently implemented and tested, account, submission and payment routes remain closed.

Use the owner's authorized release process for deployment and domain assignment. Keep hosting credentials in the owner's account, outside Git; never copy another developer's OAuth profile. Domain registration and email hosting are separate, so a domain does not itself establish a working mailbox.
