# Creator animation research — 5 November 2026

The goal is a scroll-controlled scene with lifelike adult creators of varied appearances and clothing. Each performs a different creative action, turns in unison, holds hands, and displays the exact corresponding artwork on a white T-shirt. The current production scene uses photographic cutouts and is not full skeletal animation.

## Evidence from a local prototype

- Evaluated [3d-gen](https://github.com/olatunde85/3d-gen) at commit `fbf8a59` (MIT code, MakeHuman CC0 assets; check the repository's individual license and attribution notices).
- Built a locally generated rigged character with a white shirt and a test print attached to the upper spine; exported a GLB with the existing generic talk action.
- Blender evaluation and a private Three.js browser harness showed the rig and print responding to scroll on desktop and an emulated mobile viewport.
- The prototype is not production-ready: the person still has a game-like appearance; the print is a flat panel rather than a cloth-integrated graphic; visible shirt artefacts need investigation; the motion is a generic talking action, not painting, writing, spraying, sculpting, rapping or filming. Synchronized turning and hand contact between eight people remain untested.
- The prototype GLB is roughly 13.8 MB for one person before optimization. Test on physical mobile devices before considering a larger scene.

## Next useful work

Find and evaluate realistic, appropriately licensed rigged assets and the specific creative-action motion clips. Prove one motion with a correct artwork that deforms with the shirt; check quality, license, file size and runtime. Extend to a coordinated group only after the single-person proof passes. Preserve a reduced-motion and non-WebGL path and never represent buying or other closed services as active.

This document records research, not an assertion that a realistic animation is completed or published.

## Follow-up: recorded creative movements

CMU subject 79 includes take 79_31 (writing on a chalkboard), 79_43 (painting), and 79_78 (taking a movie). These BVH recordings were downloaded from [Shriinivas/cmubvh](https://github.com/Shriinivas/cmubvh/tree/main/Sequence-076-080/79) and retargeted locally using the 3d-gen mocap pipeline. A private GLB prototype contains all three actions. The painting action was also combined with the exact artwork panel attached to the torso rig and tested in a local Three.js scroll harness at desktop and emulated mobile sizes.

This is an engineering proof, not a finished realistic scene: character appearance remains game-like, the flat artwork panel does not deform naturally with the shirt, the props and independent eight-person choreography are not implemented, and physical mobile performance has not been measured. Verify the source terms for any production use; do not assume code licenses also cover models or motion data. CMU's requested acknowledgment: The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

## Follow-up: availability and asset inspection — 6 November 2026

- The published Site is version 48; its existing photographic cutouts remain distinct from articulated human animation. Production was not changed in this research check.
- The local three-motion GLB was inspected structurally: one skin, one mesh and three named animation clips (writing, painting and filming); 9,468,764 bytes. The separate painting-and-print GLB has a skin, two meshes including a distinct artwork panel, and a painting clip; 16,917,888 bytes. Structural inspection does not establish natural appearance, correct hand/prop contact or mobile performance.
- [HSRD-100](https://huggingface.co/datasets/digitalrealitylab/HSRD-100) describes CC BY 4.0 photogrammetric OBJ scans, attribution and participant consent for data collection. The samples are static, not ready-to-animate actors; clothing and rights for this particular public use require further review.
- [Style-SALAD Motion Studio](https://huggingface.co/spaces/JoaoK90/Controllable_Human_Motion_Generation) reported a running ZeroGPU Space and an accessible Gradio configuration. Its card says the model checkpoint is CC BY-NC-ND 4.0 despite MIT application code; this is not cleared for the planned commercial clothing context. The Hugging Face MCP parameter lookup returned HTTP 404, and no animation generation was run. A running Space does not demonstrate available personal GPU quota.
- The authenticated Hugging Face account is non-Pro. Its identity endpoint did not expose a credit balance; no available balance or refreshed quota was inferred and no paid inference was attempted.

Next: find usable realistic rigged bodies and transferable creative-motion clips with terms suitable for the actual use; integrate cloth-conforming artwork and verify natural movement and performance before publication.

## Prototype: conforming a print to the shirt — 7 November 2026

A private Blender experiment subdivides the artwork panel to 484 vertices, projects each vertex onto the shirt surface, and transfers nearby shirt skinning weights. All vertices found a shirt intersection. The evaluation uses existing motion at frames 1, 24 and 60; every vertex has normalized weights, multiple bones influence the mesh, and vertex displacement between frames 1 and 24 was measured at up to 0.00686 Blender units. The maximum distance to a body vertex in those frames was below 0.017 units. These checks are approximate; they do not establish absence of clipping, true cloth simulation, visual fidelity, browser rendering, or acceptable mobile performance.

The avatar still looks game-like and is not the photorealistic human requested. This is a private engineering prototype, not a deployed Site feature. The next steps are a suitable licensed realistic rig, verified identity and print alignment, creative motions with props and coordinated timing, and real browser/mobile performance and accessibility testing.
