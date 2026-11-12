---
name: plate-matchmove-compositing
description: Establish camera, geometry, tracking, matte, color, and finishing evidence before integrating 3D objects or effects into photoreal filmed or generated plates.
---

# Plate matchmove and compositing

This original guidance applies to integration of CGI, text, particles, portals, or product art into a photoreal plate. It does not turn RGB into a calibrated scene by assumption. Use only after the actual vision and production authorization have defined the shot.

## Begin with a truthful asset inventory

For each plate, record origin, version/hash, rights, dimensions, crop, frame count, frame rate or explicit presentation timestamps, color/transfer metadata, alpha convention, known lens/camera data, and available auxiliary data. A generated still is one frame; a generated video is a sequence of RGB samples unless evidence shows more.

Make a capability table with three states: **present and inspected**, **derivable with a defined method**, and **unknown or unavailable**. Include camera, depth, object masks, clean plate, geometry, normals, motion vectors, material separation, and light/shadow information. Do not ask downstream code to consume a pass merely because a renderer elsewhere can create that kind of pass.

Check temporal stability first: anatomy, faces, hands, tools, text, cloth, prison bars, wall texture, rigid edges, reflections, cast shadows, and unwanted camera cuts. A tracking solver is not a cure for a wall that changes shape between frames. Repair or reject a plate whose errors defeat the intended integration.

## Choose the smallest sufficient spatial model

| Intended insertion | Minimum plausible model | Do not overclaim |
|---|---|---|
| Graphic fixed to one rigid flat wall | Valid planar track/homography plus foreground masks | A plane track does not describe depth away from that wall |
| Object in a moving perspective shot | Verified camera solve plus scale/orientation and supporting scene geometry | A low average solve error alone does not prove all image regions align |
| Small parallax within a limited still view | Explicit layered/depth-assisted projection with repaired hidden regions | One estimated depth image is not complete 3D and does not contain unseen pixels |
| Effect behind bars, hands, hair, or cloth | Frame-aligned geometry/depth and/or carefully authored mattes | One coarse depth image cannot represent all semitransparent overlapping samples |
| Print on strongly deforming cloth | Deforming surface correspondence and self-occlusion, or a real garment mesh | Four-corner tracking cannot model a knot |
| Large camera travel or disocclusion | Reconstructed/authored 3D, additional views, or a fully precomposited shot | Invented hidden surfaces are an artistic construction, not measured recovery |

## Establish camera and tracking

1. Separate rigid background features from people, deforming fabric, smoke, specular reflections and changing shadows. Track stable features distributed across the image and useful depth ranges. Inspect actual tracks; automated confidence is not sufficient.
2. Obtain or estimate the correct lens model, focal length/FOV, principal point, pixel aspect, sensor/crop, and distortion. Preserve the coordinate mapping through every resize/crop. If the physical camera is available, use an appropriate calibration workflow with known patterns and multiple views rather than guessing metadata.
3. Undistort consistently for tracking and compositing when that is the selected workflow, and redistort the final integrated result once. Document overscan and image bounds. Do not undistort the plate while leaving the overlay in distorted coordinates.
4. Solve with suitable viewpoint variation. A purely rotating camera cannot establish actual feature depth. Lack of parallax, repetitive bars, textureless walls, rolling shutter, changing focal length, nonrigid generated geometry, or independently moving backgrounds can invalidate the model.
5. Orient and scale the reconstruction using defensible anchors: floor, walls, known distances, and camera height where known. Distinguish absolute scale from arbitrary reconstruction scale.
6. Examine reprojection error over time and across the image, not only an average. Check horizon, foreground/background parallax, rigid lines, and attached test geometry in the intended insertion region. A solve can fit one area and drift in another.
7. Record camera matrices, projection conventions, dimensions, frame correspondence, world axes/units, distortion, and crop for handoff. Verify a known point projects to the same pixels in the recipient renderer before integration work expands.

Generated RGB may be visually consistent enough for this workflow, or may not be. Treat solvability as a tested result. A prompt specifying “35 mm lens” is a creative request, not verified camera intrinsics.

## Build only the required geometry and masks

Use proxy geometry for walls, floors, bars, foreground people or cloth only where it matches the visible image and intended camera envelope. Proxy quality is judged at occlusion/contact boundaries, not by polygon count. Camera projection onto a proxy can preserve the plate appearance but fails when new views reveal absent pixels; repair or restrict that range explicitly.

Rotoscopy may be necessary even with a good solve. Separate occluders with independently changing overlap. Track coarse motion, then refine shapes and edge behavior frame by frame where needed. Account for motion blur, defocus, hair, translucent fabric, and holes. Do not hard-key a soft edge or blur every matte equally.

Choose shadow/reflection integration based on the shot. A new object often needs contact shadow, cast shadow, reflected light, ambient occlusion, reflection and atmosphere. A shadow catcher is useful only if its geometry/light match the plate and the chosen renderer can export the needed result. A glowing particle or portal over footage may require a separately authored relighting treatment; the footage cannot automatically receive real-time 3D light.

## Composite with defined data semantics

Use an explicitly identified working space. Convert color inputs using appropriate transforms; leave depth, normals, IDs, UVs, masks and vector data in their defined data representation. Do not grade non-color maps. Document whether the plate is scene-referred or already display-rendered; do not claim clipped highlights can be recovered by changing a tag.

Inspect exported channels rather than trusting filenames. For every auxiliary image record meaning, units, range, coordinate convention, near/far mapping if applicable, filtering, alpha and sampling. Camera-space Z, Euclidean camera distance, normalized device depth and inverse depth are different quantities. A compositor or shader must not compare them without conversion.

Single-depth compositing is insufficient at transparency, motion blur, defocus and mixed-depth pixels. Use validated mattes, coverage-aware methods, or actual available deep data when justified. Cryptomatte is a rendered identification/coverage mechanism, not a universal tool to recover object IDs from arbitrary RGB. Never label inferred depth or segmentation as an original rendered pass.

Handle alpha consistently. Blender uses premultiplied alpha for rendering/compositing; some color operations require unpremultiplication followed by premultiplication. Check edge fringes over both light and dark backgrounds. Do not divide by zero alpha naïvely or treat glow with zero alpha as automatically invalid. Keep the chosen convention explicit in browser delivery.

Match optical behavior after spatial integration: resolution, sharpness, lens blur, depth of field, aberration if actually present, grain/noise, and compression. Add artifacts in measured amounts to match the plate, not as a preset layer to hide mistakes. Grain and noise must be fixed by story sample if the picture must freeze.

## Finishing review

Inspect original plate, integration, and difference/edge views at the intended display scale. Freeze starts, ends, overlap changes, thin foreground edges, and the worst frame of every track. Test reverse and random access using the same frame-coordinate correspondence for every layer. A background frame from one timestamp with a mask from another is a failed composite even if each file is correct.

Deliver a source plate/master, revision manifest, camera/crop contract, actual auxiliary-channel inventory, track/roto provenance, color transform choices, projection-check evidence, known validity envelope, and accepted limitations. Keep clean intermediates and the finished master separate from web encodes.

## Evidence and limits

Read [the self-contained source reference](references/SOURCES.md): C01–C02 and B01–B04 for reconstruction/camera; B10–B14 for masks/planar tracking/alpha; B05–B06, B11, A01–A03 and X01 for color and channels. These references describe capabilities and limits, not successful execution on this project's assets. This research phase has not established a viable solve, render passes, or a browser compositor.
