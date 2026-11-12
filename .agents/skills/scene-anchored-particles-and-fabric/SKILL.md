---
name: scene-anchored-particles-and-fabric
description: Plan and verify real particle typography and artwork on deforming fabric with deterministic progress control, shared camera projection, physical occlusion, and honest asset requirements.
---

# Scene-anchored particles and printed fabric

Use this original guidance when an effect must exist within a photoreal scene and retrace exactly under reverse scroll. It describes future authorized production, not a claim that assets, exports, or renderer features already exist.

## Shared contract

Every visible state is evaluated from an absolute story coordinate and fixed asset revision. Camera, geometry, particles, cloth, masks, lighting, focus and finishing must use the same coordinate/frame correspondence. No effect may free-run on wall-clock time, integrate using elapsed time, follow an input with damping, or trigger an independent playback on entry.

Seed all stochastic choices once from stable identifiers. Do not regenerate random points on redraw, viewport resize, reversing direction, remount or segment re-entry. A render loop can service presentation without changing the scene at an unchanged story coordinate. This requirement also applies to procedural noise, dithering and postprocessing jitter if they visibly change the image.

## Particle typography means particle correspondence

Before implementation, approve wording, font, glyph outlines, line breaks, placement, formation/dissolution spans, legibility distance, physical size, light behavior and the relationship to the story. Respect font/artwork rights. Do not substitute a flat word that fades in over an unrelated dust animation.

Prepare a stable population with particle ID, seed, start/target/end positions, size, material and optional trajectory parameters. Sample actual glyph outlines or surfaces at an appropriate density, preserving counters, stroke weight and consistent visual coverage. If particles form a solid-looking word, inspect both the silhouette and internal density at the final output scale.

Define a direct mapping for each particle. For example, a local phase can be `v_i = clamp((u - a_i) / (b_i - a_i), 0, 1)`, with `a_i` and `b_i` fixed per particle. A trajectory `P_i(v_i)` then maps the scatter position through an authored curve to the glyph position. A second range can carry the same IDs away. Curves, seeded offsets and analytic noise can create complexity without stateful integration. Any settling or swirl is a curve in story progress, never a post-scroll spring.

This is a design pattern, not a required shader implementation. Choose an analytic path, sampled animation cache, or offline-rendered sequence only after confirming the needed data and target runtime. If simulation produces the desired motion, bake it and prove arbitrary sample access. Playing a simulation backwards by negating its time step is not a reliable substitute.

Formation and dissolution should be physically legible: trajectories originate in plausible space, not at arbitrary screen edges unless approved. Opacity can reveal tiny particles or support material transitions, but the particle positions must actually account for the word's construction/destruction. Stable IDs prevent a reverse journey from reassembling a different word cloud.

## Put the effect in the scene

Use world or object-local coordinates and the same camera projection as the surroundings. A screen-facing glyph plane can still be a world-space object if that is the approved staging; a screen-fixed overlay is a different effect. Verify parallax and apparent size while the camera moves. Define whether the word is attached to a wall, free in air, tied to a creator's gesture, or part of a portal.

Apply depth testing against genuine scene geometry or a verified proxy. For plates, provide correctly registered depth/mattes or precompose the effect. Test front/behind crossings at bars, fingers, garment edges and the portal plane. Flat alpha layers do not by themselves allow individual particles to pass around a foreground object.

Match focus, exposure, white balance, motion blur, atmosphere, and sharpness. If particles glow, define how their energy affects nearby surfaces; a glowing sprite without expected spill can look pasted on. Avoid assuming every particle casts a shadow or illuminates the scene unless the renderer and performance budget support it. For transparent particles, test sorting, additive accumulation, opaque occlusion, depth writing, overdraw and halo artifacts. Reduced count is a quality choice that must preserve letter recognition.

Decide how particle size behaves with perspective. World-size particles should generally project smaller with distance; fixed pixel sizes can create a UI-like result. Check the closest point for oversized sprites, the farthest for shimmer, and portrait crops for lost words. Do not dynamically replace the population while stopped just to improve quality.

## Artwork belongs to the garment surface

Choose between an authored/reconstructed garment, a filmed garment with tracked replacement, or a fully finished precomposited plate. Do not claim one is equivalent to another without checking the needed camera and deformation envelope.

For a mesh route:

1. Build or obtain a garment with credible cut, seams, thickness where visible, folds, knot structure and contact with body/hands/support. Knot geometry must explain which cloth runs over and under which other part.
2. Define the artwork in stable garment UV/rest coordinates. Keep artwork position and scale tied to the same material points as the mesh deforms; prevent swimming and accidental mirrored/repeated print.
3. Treat ink as a material treatment. Preserve relevant fabric shading and weave; change base color and, when justified by the print process, roughness, micro-normal or thickness. Avoid making all ink emissive or replacing fabric illumination with flat unlit color.
4. Let garment geometry, depth and self-occlusion hide printed areas inside folds and knots. Do not project the full graphic over an occluding fold to protect logo legibility. If the composition needs more readable art, change the approved fold/pose/camera, not the occlusion rules.
5. Use real geometry for large folds, knots, edges and silhouette. Bump/normal detail can represent weave and fine wrinkles but cannot create a missing silhouette or a true cavity. True displacement has geometric/memory cost and still requires the right underlying shape.
6. Resolve contact and self-intersection. A cloth simulator may need self-collision, suitable resolution and solver quality; a stable hand-authored or sculpted pose can be better for a static garment. Simulating a knot is not automatically more reliable than authoring its correct topology.
7. If it moves, bake or author its deformation and verify the export path. Standard glTF supports transforms, skinning and morph weights, but is not a universal arbitrary cloth-cache format. Do not promise that a DCC physics cache will export as a working browser garment. Choose supported morph/skin data, a separately validated cache representation, or finished frames.

For a plate route, use deforming-surface correspondence with enough local structure to follow folds, plus separate mattes for overlapping cloth, hands and knot loops. A planar homography can cover a sufficiently flat local patch; it cannot represent the entire nonplanar garment. New fabric revealed during motion requires known texture content. Preserve the original shading where appropriate, but understand that multiplying art onto RGB cannot automatically recover separate albedo, light and specular components.

## Bake and sample responsibly

Bake simulation results after approved settings and protect the source revision. Record frame/sample range and sampling interval. An animation cache with skipped samples may interpolate differently from the source; examine collision and silhouette between samples, not only at them. Linear morph interpolation can cut through cloth even when both endpoint meshes are valid.

Author every dependent element against the same absolute progress: body, hands, garment, print, particles, light spill and foreground masks. Fix frame-index rounding conventions and boundary ownership. The same progress reached by any path must select the same state.

## Acceptance evidence

For particles, provide frozen formation, readable word, dissolution and occlusion-crossing frames, plus matching forward/reverse/direct-jump states. Verify that the word is genuinely built from moving particle positions. For fabric, provide close views of the fold/knot, the same artwork points through deformation, physical overlap, contact shadows, reverse/jump samples, and the responsive crop.

Inspect temporal stability at the final delivery size. A paused image must not sparkle or change grain. Count/resource limits, transparency mode, geometry format and supported device tier remain production measurements, not claims established by this skill.

## Sources

Read [the self-contained source reference](references/SOURCES.md). B07, B09, B18 and B21 ground UV, baking, cloth and geometric displacement; B10–B12 ground plate-mask/track limits; T01–T03 and P01 describe relevant 3D representations. The particular deterministic typography design is original synthesis built around the user's motion invariant.
