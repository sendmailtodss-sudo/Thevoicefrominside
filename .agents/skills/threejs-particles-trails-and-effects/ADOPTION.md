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

This is a **specialist instruction source**, not a universal renderer or fallback. Its canonical implementation explicitly requires **Three.js r185**, `three/webgpu`, TSL, completed `renderer.init()` and a genuine `renderer.backend.isWebGPUBackend === true`. None is installed, upgraded, provisioned or proven available by copying these files. WebGL/mobile compatibility and accessible/static alternatives must be designed and tested separately; this skill does not establish them.

The representation-first analytic/immutable-spawn option, explicit depth/HDR/output ownership, stable seeded identity, discontinuity reset and resource-accounting criteria are relevant for future review. Stateful elapsed-time gravity, recurrent compute and accumulating trail histories are not substitutes for a seekable, reversible scroll timeline. No GPU code is executed. The conditional sibling system-owner skills and the trail-ring oracle script are **not installed**. The script is linked upstream below; its correctness is not claimed or tested by this installation.

## Pinned resources deliberately not installed

- [scripts/trail-ring-oracle.mjs](https://github.com/linegel/threejs-complete-set-of-skill/blob/e3c9563a070b214aa73b84d1ea6026c9ec4db6cb/skills/threejs-particles-trails-and-effects/scripts/trail-ring-oracle.mjs) — not installed; not executed.

## Uninstalled or unverified dependencies

- Three.js r185 WebGPURenderer + TSL and genuine WebGPU backend (canonical path; not installed or capability-tested)
- threejs-choose-skills (not installed)
- threejs-dynamic-surface-effects (conditional; not installed)
- threejs-rain-snow-and-wet-surfaces (conditional; not installed)
- threejs-procedural-motion-systems (conditional; not installed)
- threejs-image-pipeline / threejs-bloom (conditional; not installed)
- threejs-compatibility-fallbacks (not installed)
