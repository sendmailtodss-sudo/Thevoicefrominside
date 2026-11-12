# Project adoption rules

Read the project orchestration skill [cinematic-production](../cinematic-production/SKILL.md), repository `AGENTS.md`, and the current direct user mandate **before applying this upstream skill**. This directory installs static instructions only. It does not install a renderer, model, service, executable, or working visual effect.

The project mandate and orchestration skill govern operational use. The upstream text remains byte-for-byte intact for provenance; its provider/model IDs, generator CLIs, optional dependencies, approval examples, smoothing, ambient motion, pointer motion and timed reveals do not override current project decisions. Follow higher-priority system/developer instructions as usual. Existing explicit authorization remains valid within its scope; an upstream review gate does not invent a new permission requirement. A real unresolved approval requirement must be explained with its source.

## Current limits

- **Skills first.** Do not start a new film plan, previs, renderer, typography effect, video job, or integration as a side effect of reading/installing this package.
- **Paid-media stop:** no new generation or credit usage now, no purchases, subscriptions or upgrades. Model names and prices in upstream prose are examples, not verified availability, pricing or authorization. Any later authorized generation must use the project's official connected client, current official price/balance, one paid owner, a stable recorded submission ID, and sequential status checks.
- **Strict scroll:** every visible movement is a deterministic function of absolute native scroll position. Stop freezes; upward scroll reverses the same timeline; rapid jumps remain free. No autoplay, wall-clock simulation, damping that continues after input stops, timed reveal/crossfade, ambient loop, or pointer-driven camera is admitted by default. A pure easing function of scroll may shape the path without becoming a second clock.
- Preserve fullscreen desktop/mobile composition, primary navigation and language controls, reachable bottom navigation, semantic content, keyboard focus, reduced motion and usable failure paths. Preserve approved source content and art rights.
- Cover the complete presentation in Norwegian, English and simplified Chinese (`zh-Hans`), with accessible text equivalents. Essential text must not exist only in rendered pixels.
- Validate forward/reverse/fast jump, stop/freeze, reload at depth, resize/rotation, hidden/resume, loading failure, cleanup, accessibility and actual device limits before claiming success. A static instruction package, build or demo is not production evidence.
- A flat video has no scene depth buffer. New particles or 3D text above it do not automatically pass behind filmed brains. Occlusion requires actual depth, geometry or verified foreground masks; do not claim it from an overlay alone.

## Provenance and install boundary

`SOURCE.json` records every copied upstream file's pinned repository, commit, path, byte length and SHA-256, plus the bundled license. Files marked omitted are linked to the same upstream commit and **not installed or executed**. Inline code fences remain documentation only. External links in the upstream reading lists were not all fetched or validated as part of this static installation.

## Package-specific adaptation

Use the persistent-world, authored camera/depth/material, responsive composition, scene ownership, performance and visual-QA criteria as instruction. No Three.js library, WebGL context, models, decoder, demo or conductor script is installed. The upstream `rig.smooth = damp(...)`, real-time clocks, ambient weather, time-based foreground retirement, pointer parallax and timed word stagger are **not admitted** for this journey. Future use must derive every permitted visual channel from exact scroll with reproducible seeded/analytic state. Kage anatomy is an explanatory reference, not the approved subject, template, asset license or visual direction for this project. Upstream approval gates are review guidance; the orchestration skill and current explicit user mandate determine which approvals are already satisfied.

## Pinned resources deliberately not installed

- [demo/index.html](https://github.com/MengTo/Skills/blob/d6324a05ca03ce5f6cdba519318d92176dbc43d2/agent-skills/web-design/build-threejs-scroll-worlds/demo/index.html) — not installed; not executed.
- [references/scroll-conductor.js](https://github.com/MengTo/Skills/blob/d6324a05ca03ce5f6cdba519318d92176dbc43d2/agent-skills/web-design/build-threejs-scroll-worlds/references/scroll-conductor.js) — not installed; not executed.

## Uninstalled or unverified dependencies

- Three.js runtime/loaders/compressed asset decoders, future version-specific choice (not installed)
- threejs (sibling skill, not installed)
- cinematic-scroll-storytelling (sibling skill, not installed)
