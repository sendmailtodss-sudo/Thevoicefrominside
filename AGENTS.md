# Contributor and agent guidance

This is the public developer distribution of Stemmen fra innsiden / The Voice from Inside. Read `README.md` and `docs/development.md` before changing behavior.

- Use Node 24 and the existing dependency-free structure. Run `npm test` and `npm run build` for relevant code changes.
- Preserve Norwegian, English and Simplified Chinese journey/navigation coverage, accessible non-3D alternatives, keyboard controls, mobile layouts and reduced-motion behavior.
- Use synthetic data in tests and examples. Do not add credentials, production service bindings, private manuscripts, case files, contact logs or private personal information.
- Public project identity is Innsatt 2601-46. Do not infer or add personal social accounts.
- Keep live services disabled in the local preview. A screen, mock, test or build is not evidence that a service is operational.
- Do not deploy, send mail, schedule social posts, purchase services or activate payment/submission integrations as a side effect of development.
- Preserve approved editorial text and redactions. Keep changes to application code separate from requests to change writing or artwork rights.
- Explain what changed, why, and which checks actually ran. Report limitations directly.
- For video references, use `.agents/skills/youtube-video-analysis/SKILL.md` and its executable helper. Inspect actual timestamped frames before describing a scene; preserve access failures and distinguish stills, playback, captions and inference.

Historical private operational instructions and launch logs are intentionally outside this repository. They are not required to develop with its example data.

## Additive changes must not alter existing parts

- A new element (page, scene, hero, style sheet, script) may only style and script itself. Its selectors must be scoped to its own class or data attribute; it must not restyle, hide, reorder or disable existing scenes, pages or controls.
- Performance or responsiveness work changes how content loads, never which content exists. Do not disable, remove or replace a scene, text or feature unless the user asked for that exact removal in the current request.
- The enabled journey order is locked by `tests/journey-assets.test.mjs`; change it only together with a recorded user decision. `tests/hero-scope.test.mjs` keeps the landing hero scoped.
- Before publishing, compare the journey before and after the change at several scroll positions; anything that differs outside the new element is a regression to fix, not a side effect to report.

## Cinematic production

For cinematic journeys, film, spatial web design, VFX, editing or media-provider work, read `.agents/skills/cinematic-production/SKILL.md` before planning or changing the experience. Read only the specialists it selects and their project adoption notes. A skill is workflow guidance; installation does not train a model, install a renderer, connect a provider or establish visual competence.

The mission is an authored, award-contender cinematic experience. Preserve the complete approved narrative, artwork, language coverage and accessibility. Begin with the strongest feasible dynamic visual approach; choose simplifications from measured device or access constraints and evidence, not habit or generic templates.

Follow this order: fresh primary-source research; review, verify and activate the relevant skills; reread the user's vision and available source attachments; conduct an informed visual Grill using examples the user can actually see; implement only after the required creative alignment. Reuse already settled decisions and existing authorization. Record inaccessible sources and unresolved choices explicitly. A research/setup task does not authorize a storyboard, prototype, generation or deployment.

The main journey uses absolute native scroll as its single motion clock: stopping freezes; reversing reconstructs the same state; direct jumps seek directly. All moving channels, including camera, particles, typography, transitions and media, must obey this contract. Any separately operated player or gallery needs its own explicit boundary.

Respect the latest production hold and spending authorization. One named owner integrates shared code; one named owner submits authorized paid jobs. Keep private briefs, case material, account state and operational ledgers outside the public repository. Report installation, activation, visual acceptance, testing and publication as separate evidence-backed states.
