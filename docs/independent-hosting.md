# Independent hosting and shared development

The migration target is GitHub for version control and Vercel for hosting, using
the project domain `thevoicefrominside.dev`. Hosting must not require a ChatGPT
subscription. Codex and other development tools can continue to work on the same
repository; collaborators contribute through branches and pull requests.

This document describes the target workflow, not a completed production migration.
The current public repository is a sanitized contributor distribution. It is not
a backup of all production writing, database records, uploaded media or identity
configuration. Preserve the separately managed production content and its access
restrictions when preparing a release.

## Working together

1. Fetch the current branch before starting. Read `AGENTS.md` and
   `docs/development.md`; use a separate branch or worktree for each change.
2. Develop locally with Node 24 and `npm run dev`. Keep real personal information,
   operational logs and credentials outside the public repository.
3. Run `npm run check`, `npm test` and `npm run build`, with browser checks for
   affected journeys, Norwegian and English routes, keyboard and mobile use.
4. Review changes in the existing pull request and a protected Vercel preview.
   Keep production domain assignment and promotion separate from development.

Preview hosting and CI credentials belong to the owner's accounts. Do not copy
another developer's OAuth profile or put provider tokens in a commit. Codex is an
optional development tool, not a runtime dependency of the hosted website.

## Before switching the domain

Verify the complete production export and retain a rollback copy. Test direct
links, downloads, video seeking, gallery navigation and response headers on the
actual deployment. Inventory existing database and object-storage data before
migration; a source-code archive alone does not back them up.

Replace hosting-specific identity assertions with independently verified
sessions and preserve server-side authorization. Until those dependencies are
implemented and tested, preview API and authentication routes must remain closed.
A reading-only preview is not evidence that accounts, submissions, moderation,
payments or storage have migrated.

Keep the existing site available during verification. Change production routing
only through the owner's authorized release process, after the candidate has
passed the required checks. Domain registration and email hosting are separate:
registering the domain does not create a mailbox.
