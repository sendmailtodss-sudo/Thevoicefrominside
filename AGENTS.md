# Contributor and agent guidance

This is the public developer distribution of Stemmen fra innsiden / The Voice from Inside. Read `README.md` and `docs/development.md` before changing behavior.

- Use Node 24 and the existing dependency-free structure. Run `npm test` and `npm run build` for relevant code changes.
- Preserve Norwegian and English navigation, accessible non-3D alternatives, keyboard controls, mobile layouts and reduced-motion behavior.
- Use synthetic data in tests and examples. Do not add credentials, production service bindings, private manuscripts, case files, contact logs or private personal information.
- Public project identity is Innsatt 2601-46. Do not infer or add personal social accounts.
- Keep live services disabled in the local preview. A screen, mock, test or build is not evidence that a service is operational.
- Do not deploy, send mail, schedule social posts, purchase services or activate payment/submission integrations as a side effect of development.
- Preserve approved editorial text and redactions. Keep changes to application code separate from requests to change writing or artwork rights.
- Explain what changed, why, and which checks actually ran. Report limitations directly.
- For video references, use `.agents/skills/youtube-video-analysis/SKILL.md` and its executable helper. Inspect actual timestamped frames before describing a scene; preserve access failures and distinguish stills, playback, captions and inference.
- For cinematic journeys, film production, editing, VFX, spatial web design or Higgsfield operation, read `.agents/skills/cinematic-production/SKILL.md` and the relevant specialist's `ADOPTION.md` before planning or implementation. These instruction packages do not authorize spending, install a renderer or override the user's current production hold.

Historical private operational instructions and launch logs are intentionally outside this repository. They are not required to develop with its example data.
