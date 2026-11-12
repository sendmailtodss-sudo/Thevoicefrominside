---
name: spatial-particle-typography
description: Guide for exact multilingual words that form from particle streams between brains in a shared 3D world and reabsorb along authored paths, controlled only by absolute scroll.
---

# Spatial particle typography

## Observable mechanism

The required image is a causal transformation: identifiable streams move between brains; a bounded subset of their particles converges into exact glyphs; the words become readable at different authored depths and angles; those same particles leave the glyphs and rejoin streams. A text label translated over a brain movie does not establish this mechanism. Do not replace the mechanism with a glow, crossfade or unrelated cloud.

For each phrase record approved string ID and locale, source and destination brain anchors, incoming and outgoing world paths, formation/reading/reabsorption progress ranges, word plane position and orientation, physical dimensions, depth band, font revision, particle identities and seed. This is a representation contract, not a new storyboard or permission to generate assets. Preserve the existing approved sequence.

## Select the actual renderer and version

The read-only local bundle reports Three.js r170. Its WebGLRenderer is WebGL2 based; r170 explicitly rejects WebGL1 contexts. Existing r185 WebGPU/TSL specialist instructions are a different dependency and backend contract. Do not mix APIs from these versions or imply that reading an upstream skill installs them. Pin any later runtime and asset decoders and separately validate the exact deployed bundle. [W39, W50, W50a]

A WebGL2 analytic path can use buffer attributes/instanced geometry and a custom ShaderMaterial. Immutable particle attributes encode stable identity, source-path parameters, glyph target, outgoing-path parameters and phase thresholds. The shader receives progress and declared scene inputs. Buffer geometry and instancing APIs establish possible representations; they do not establish capacity or performance on a phone. [W15, W18, W41]

## Exact glyphs and multilingual formation

Use the same approved locale catalog for visible typography and its semantic HTML equivalent. Preserve complete strings, punctuation, capitalization, Unicode characters and requested line breaks. Do not rely on a video generator to spell text or translate it. Use a licensed font with all Norwegian/English diacritics and the actual Simplified Chinese glyph set. A script tag and a fallback font are not evidence of exact glyph coverage. Preserve font licensing and revisions. Noto Sans CJK is one researched OFL-licensed candidate, not a selected or installed font. [W23, W24, W45a]

Prepare glyph shapes from the exact approved font and string, either as stable sampled outlines/masks or as atlas geometry. The eventual pipeline must account for shaping, kerning, punctuation and each locale's line layout. If browser canvas is used to build a mask, wait for the exact font, apply its metrics explicitly and verify the rendered mask rather than treating code-point count as width. Browser/system font rasterization can vary; precomputed versioned target data makes content repeatability easier, but it is still a future asset-production step, not work performed by this skill. [W24, W49]

Distribute particles according to glyph silhouette and stroke density, with stable seeds. Chinese strokes need enough sampling density to remain distinct at the displayed size; the same particles-per-character rule as Latin is not justified. Do not cut words or remove strokes to meet a particle budget. Lower surrounding decoration or use a composed static alternative instead. Use locale-specific target geometry and readable layouts. Keep an accessible exact phrase list in document order.

A formed state may use a matching outline/coverage layer for readability only if it is the same font-derived glyph surface, same world pose, same depth and same scroll-controlled phase. It must not pop in as an unrelated floating label. The formation/reabsorption mechanism must remain visible with this layer and bloom disabled. Final copy and translations require language review; current dictionaries are not certified by their existence.

## Analytic particle lifecycle

For particle `i`, define incoming path `A_i(u)`, glyph target `G_i` and outgoing path `B_i(u)` in consistent world coordinates. Piecewise phase functions blend through incoming flow, target convergence, readable hold and outgoing flow as functions of absolute normalized progress. Their endpoints must coincide. Hold duration is a scroll interval, never an elapsed-time delay. Reverse evaluates the same function at lower progress; it is not a separate reverse simulation.

Use immutable seeds for path scatter and stable identity. If curls or noise are desired, evaluate a deterministic field from world position/identity and progress, never from wall-clock time. Do not integrate velocities or spawn based on frames elapsed. Reconstruct each visible trail from a bounded set of path samples at the current progress. Prefer authored trajectories and simple ribbon geometry over history buffers. A sudden jump must give the same trail as a continuous traversal to that point.

Record particle allocation per phrase and the total active population. Locale changes are explicit state changes: atomically replace target data at the same chapter fraction, without a timed translation morph or a burst of uninitialized particles. Avoid code-point-by-code-point stagger that assumes linguistic word boundaries or splits combining sequences.

## Camera, depth and occlusion

Use one scene camera for brains, particles, word planes and depth-producing geometry. Store camera position, orientation/target, FOV, aspect, near/far and each locale/viewport composition variant. Update the projection when its inputs change. Vary word placement and angle deliberately; do not camera-billboard every word if the intended effect requires different world orientations. Check readability at each formed interval and keep the camera from cutting through glyph planes. [W14]

Opaque brains should establish depth. Transparent glowing particles normally depth-test against them; choose depth-write and blend behavior explicitly. Disabling particle depth writes can avoid particles incorrectly masking one another, but does not solve all transparent ordering or intersections. Three.js object sorting cannot perfectly sort all intersecting transparent geometry or arbitrary particles within one draw. Use smaller depth groups, restrained opacity, opaque/alpha-tested structure where useful, and inspect overlaps. `renderOrder` alone cannot create physical occlusion. [W11a, W16]

A flat plate requires a separate camera match and proxy geometry, depth pass or foreground masks synchronized to the same frame and crop. Calibrate near/far conventions, nonlinear versus linear depth, image UVs and object boundaries. Use multiple masks/depth layers if text must weave among separate filmed brains; one foreground cutout may be insufficient. A guessed depth map can reveal edge halos or incorrect ordering. Label approximations and test them. Creating a DepthTexture in Three.js does not extract depth from the plate. [W17]

Keep one color pipeline: identify sRGB display textures versus linear/non-color data, keep light/emission operations consistent, and own the final tone-map/output conversion once. Particle positions, depth, masks and glyph-distance fields are data, not color. Bloom is optional finishing, not evidence of correct anatomy, readable text or occlusion. [W13b]

## Mobile and acceptance

Author portrait camera and phrase placement instead of applying a blind crop to landscape. Maintain all words and brain relationships; reduce background particle density, screen resolution and postprocessing first. Test full occlusion and every formed phrase in NO, EN and zh-Hans with bloom off. Record front/behind examples, target geometry/string hashes, direct-seek equivalence, freezes, per-frame CPU/GPU measurements and memory-accounting estimates. Provide stills plus exact semantic text on unsupported WebGL2, reduced motion or resource failure. No performance or visual acceptance is claimed by this research.

Sources: [register](../cinematic-production/references/web/SOURCE-REGISTER.md). Tests and proposed budgets: [protocol](../cinematic-production/references/web/BROWSER-TESTS-AND-BUDGETS.md).
