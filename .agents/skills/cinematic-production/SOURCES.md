# Verified production references

Reviewed on 12 November 2026. The five specialist instruction packages are
locally installed with pinned sources, licenses and file hashes in their own
`SOURCE.json`. The runtime libraries and commercial editors are not installed
by this package.

| Source | Role | Treatment |
| --- | --- | --- |
| [fal.ai community cinematography](https://github.com/fal-ai-community/skills/blob/ca79376d624d244e601f9182fa80b5bf66efec9c/skills/cinematography/SKILL.md) | Concrete shot, camera, lens, blocking and light direction | MIT instruction package; its genmedia commands are not our provider interface |
| [MengTo Scroll World Storytelling](https://github.com/MengTo/Skills/blob/d6324a05ca03ce5f6cdba519318d92176dbc43d2/agent-skills/web-design/scroll-world-storytelling/SKILL.md) | Whole journey and renderer selection | MIT instruction package; chapter-count suggestions do not replace the actual brief |
| [MengTo Scroll-Scrubbed Visual Sequence](https://github.com/MengTo/Skills/blob/d6324a05ca03ce5f6cdba519318d92176dbc43d2/agent-skills/web-design/scroll-scrubbed-visual-sequence/SKILL.md) | Native reversible media timeline | MIT instruction package; no implicit smoothing |
| [MengTo Build Three.js Scroll Worlds](https://github.com/MengTo/Skills/blob/d6324a05ca03ce5f6cdba519318d92176dbc43d2/agent-skills/web-design/build-threejs-scroll-worlds/SKILL.md) | Shared camera, space, materials, lighting and depth | MIT instruction package; damping/ambient/pointer motion excluded by project contract |
| [Three.js particles, trails and effects](https://github.com/linegel/threejs-complete-set-of-skill/blob/e3c9563a070b214aa73b84d1ea6026c9ec4db6cb/skills/threejs-particles-trails-and-effects/SKILL.md) | Analytic particles, representation, depth, transparency and HDR ownership | ISC instruction package; its r185 WebGPU path is a specialist prerequisite, not a universal installed runtime |
| [Official Remotion skills](https://github.com/remotion-dev/skills/tree/7e541aa4d7361dfaca0780a565a47307eb7bdfbb) | Frame-based editing, sequencing, transitions, matting and 3D | Read-only external reference; no skill text/runtime copied or render license assumed |
| [Official GSAP ScrollTrigger skill](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-scrolltrigger/SKILL.md) | Optional scroll/timeline implementation guidance | Read-only reference; no GSAP dependency added |
| [Higgsfield Cinema Studio](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio) | Director controls, shot settings, references and global style | Official product guide; web capability is not proof of MCP access |
| [Higgsfield storyboard and shot list](https://higgsfield.ai/blog/script-to-ai-storyboard-shot-list) | Visual beats and shot planning | Official production guide |
| [Higgsfield camera control](https://higgsfield.ai/blog/ai-video-camera-control) | Camera path, movement, optics and endpoints | Official production guide; generative repeatability does not establish browser determinism |
| [Higgsfield footage VFX](https://higgsfield.ai/blog/vfx_4k) | Source-plate preservation and timed editing direction | Official VFX guide; tool and export capabilities must be verified |

The official article's `seedance-footage-vfx` instruction package was also read
and installed in the operator's private user-skill directory for its advertised
Skills use. Its original text is not redistributed in this public repository.
The package refers to two absent upstream files (`dialogue-timing.md` and
`first-frame.md`); those procedures are not claimed as installed. Current model
schemas, the main journey's motion contract and any production hold take
priority over its Seedance 2.0 examples and optional ambient action.

Other search candidates were not installed: the retrieved storyboard-cheatcode
file uses outdated Higgsfield example calls and conflicting workflow defaults;
the indexed muapi cinema-director file returned HTTP 404 at the cited commit;
unverified license or runtime claims are not treated as an installed capability.

The project-owned editing, web-direction and Higgsfield-control references are
original operational checklists. They do not reproduce Remotion skill text or
grant new rights to any project code, writing or artwork.
