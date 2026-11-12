# Primary sources and evidence boundaries

Retrieved 2026-11-12 from public official sites or official raw GitHub repositories. Facts below are paraphrased; the skill workflows are original synthesis. Versioned Blender links refer to **4.5 LTS documentation**; they do not select or install Blender. OpenCV uses its 4.x documentation. Other rolling documents are retrieval snapshots, not release pins. Full source-byte hashes are recorded in the research manifest; source snapshots are evidence records, not executable dependencies.

Yale is an originating university teaching source for its own film analysis lessons. Adobe is an official editing-tool vendor tutorial, not a scientific optics source. Technical claims about calibration, rendering, encoding and browser behavior rely on the relevant official technical sources. No source proves project-specific production quality, compatibility, performance or available render passes.

## B07 — Blender 4.5 LTS, UV Unwrapping Introduction

[Introduction - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/modeling/meshes/uv/unwrapping/introduction.html)

UV coordinates associate texture image coordinates with mesh faces; seams and unwrap quality control placement/distortion. Supports attaching print to the garment surface.

Retrieved: 2026-11-12. Source snapshot SHA-256: `2e9b0d79f6a64f487037b287a5c8d5872b44cc0fc6fccb0e38a378dd04a76e37`.

## B08 — Blender 4.5 LTS, Cloth Introduction

[Introduction - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/physics/cloth/introduction.html)

Cloth is a deforming physics system applied to a mesh. General context; not a promise of successful knot simulation or browser export.

Retrieved: 2026-11-12. Source snapshot SHA-256: `011fe19a43836c52e8b028fdd04e37c08da57ce9f8c19e91206bbe3168aba89f`.

## B09 — Blender 4.5 LTS, Baking Physics Simulations

[Baking Physics Simulations - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/physics/baking.html)

Baking stores simulation results for repeatable playback/rendering. Cache step greater than one may produce interpolation different from the original simulation. Supports baking plus sampling verification.

Retrieved: 2026-11-12. Source snapshot SHA-256: `989da60519a28680ee2652f33108b4f50d668cdb3b60d1bda7d18c59e5b9ff5a`.

## B10 — Blender 4.5 LTS, Masking Introduction

[Introduction - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/masking/introduction.html)

Masks support rotoscopy and isolation, can animate with shape keys and be parented to tracking markers. Supports explicit matte work for foreground occlusion.

Retrieved: 2026-11-12. Source snapshot SHA-256: `cb9a7947ea82df4a2f2b6bb2c598a85c3e0e39f31b4f4eed010928f470b3d99f`.

## B11 — Blender 4.5 LTS, Cryptomatte Node

[Cryptomatte Node - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/compositing/types/mask/cryptomatte.html)

Uses actual rendered Cryptomatte information to select objects/materials, with limitations including unsupported volume objects. Not an RGB-only segmentation or depth-recovery tool.

Retrieved: 2026-11-12. Source snapshot SHA-256: `9be65c0adc8b25c81a341a18b846a99d791c7f21ec1bf9a29c8504f4c5793a0d`.

## B12 — Blender 4.5 LTS, Plane Track

[Plane Track - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/sidebar/track/plane_track.html)

A plane track can display/derive an image of a flat surface. The preview alone is not a final composite. Supports limiting planar techniques to their valid surfaces.

Retrieved: 2026-11-12. Source snapshot SHA-256: `8d8640cb6dfc770a6a1f14b777d7b2c5a108ac78bbb497ff73494ac05ed78a84`.

## B18 — Blender 4.5 LTS, Cloth Collisions

[Collisions - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/physics/cloth/settings/collisions.html)

Object and self-collision, quality/distance tradeoffs, baking and correction of cached simulation. Supports real fold contact/self-occlusion and the need to inspect penetrations.

Retrieved: 2026-11-12. Source snapshot SHA-256: `f9d2648e19c52d509da326ee73cdd216371df21be6979831984ca90856526cbf`.

## B19 — Blender 4.5 LTS, UV Warp Modifier

[UV Warp Modifier - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/modeling/modifiers/modify/uv_warp.html)

Documents a specific UV transformation tool. Optional implementation reference only; moving UVs is not automatically the correct way to attach a print to deforming material.

Retrieved: 2026-11-12. Source snapshot SHA-256: `2e4c6e78ed0befd84bca167191ad0301415d8670d5d4db2a6a265dc96ac688f0`.

## B20 — Blender 4.5 LTS, Normal Map Node

[Normal Map Node - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/shader_nodes/vector/normal_map.html)

Normal-map handling and coordinate-space requirements. Supports micro-surface shading only, together with the explicit geometric distinction in B21.

Retrieved: 2026-11-12. Source snapshot SHA-256: `6b41aae8e5d40e6b39c676193a3d07a1370e61099268e63512acfb8af0db122f`.

## B21 — Blender 4.5 LTS, Displacement

[Displacement - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/materials/components/displacement.html)

Bump changes shading without altering the mesh; true displacement changes geometry and requires detail/memory. Supports requiring geometric folds/knots rather than a shading-only imitation.

Retrieved: 2026-11-12. Source snapshot SHA-256: `61b9628b14045c8be0cab68045383b841d38aafc022ee5b12b57f9296c60e967`.

## T01 — Three.js, PerspectiveCamera

[PerspectiveCamera - Three.js Docs](https://threejs.org/docs/pages/PerspectiveCamera.html)

Uses vertical FOV; provides aspect, film gauge/offset, view offsets and projection updates. Supports explicit DCC/browser projection mapping.

Retrieved: 2026-11-12. Source snapshot SHA-256: `123788f1b199fe484238efb95732dafa5daabb7843f289649227e035bf9d95ef`.

## T02 — Three.js, BufferGeometry

[BufferGeometry - Three.js Docs](https://threejs.org/docs/pages/BufferGeometry.html)

Stores vertex attributes including positions, normals and UVs. Supports a stable particle/geometry representation; does not itself define an animation or guarantee performance.

Retrieved: 2026-11-12. Source snapshot SHA-256: `3a18bf6f55c51b064b59f0c2439866b12297ef1fa80a67ceb8b3c8cc077349b7`.

## T03 — Three.js, ShaderMaterial

[ShaderMaterial - Three.js Docs](https://threejs.org/docs/pages/ShaderMaterial.html)

Custom WebGL shaders receive uniforms/attributes; updating uniforms updates their available values. Allows a progress-uniform design, but does not force determinism or supply a ready particle effect.

Retrieved: 2026-11-12. Source snapshot SHA-256: `6bbeca961b1f4c1bce8a49e8ec6a721d652a73df8367fd40e099f8f63d953cca`.

## P01 — Khronos, glTF 2.0 Specification

[glTF™ 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)

Defines mesh attributes, transforms, skinning, morph targets and sampled animation interpolation. An arbitrary DCC cloth cache is not thereby a standard interoperable glTF animation payload; actual exporter/runtime support must be tested.

Retrieved: 2026-11-12. Source snapshot SHA-256: `3240a8d0b80355fc61ddf73001e0cb8643160880eda2054730f655d0fb0260f3`.
