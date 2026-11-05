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
