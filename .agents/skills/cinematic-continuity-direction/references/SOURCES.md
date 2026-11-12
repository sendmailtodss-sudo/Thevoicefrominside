# Primary sources and evidence boundaries

Retrieved 2026-11-12 from public official sites or official raw GitHub repositories. Facts below are paraphrased; the skill workflows are original synthesis. Versioned Blender links refer to **4.5 LTS documentation**; they do not select or install Blender. OpenCV uses its 4.x documentation. Other rolling documents are retrieval snapshots, not release pins. Full source-byte hashes are recorded in the research manifest; source snapshots are evidence records, not executable dependencies.

Yale is an originating university teaching source for its own film analysis lessons. Adobe is an official editing-tool vendor tutorial, not a scientific optics source. Technical claims about calibration, rendering, encoding and browser behavior rely on the relevant official technical sources. No source proves project-specific production quality, compatibility, performance or available render passes.

## F05 — Yale Film Analysis, Part 4: Editing

[Part 4: Editing – Film Analysis](https://filmanalysis.yale.edu/editing/)

Yale’s own instructional definitions of continuity editing, screen direction/axis, eyeline/graphic/action matches, dissolves, long takes and rhythm. Supports continuity vocabulary. The workflow for scroll cinema is original synthesis.

Retrieved: 2026-11-12. Source snapshot SHA-256: `63b42c09950076905491b74a4c4b6b6b2ff5abd959aa1e9f5f8c30adf4b4ad9b`.

## F06 — Yale Film Analysis, Part 3: Cinematography

[Part 3: Cinematography – Film Analysis](https://filmanalysis.yale.edu/cinematography/)

Yale’s own teaching on framing, camera movement, exposure, focus and depth of field. Used for craft vocabulary; use calibration/camera documentation for exact optics rather than treating simplified teaching shorthand as a projection model.

Retrieved: 2026-11-12. Source snapshot SHA-256: `1429d5720d7c24f093ed74fc1cac3b7bb15eeb6f73a85d69c8d57b109e252aac`.

## F02 — Adobe, Match cut

[Match cut: What is a match cut in film and how to create one | Adobe](https://www.adobe.com/creativecloud/video/discover/match-cut.html)

Official editing-tool vendor explanation of graphic, action and audio matches; supports distinction between matching imagery and matching action. Marketing/tutorial content is not a calibrated-camera authority; film anecdotes were not used as technical evidence.

Retrieved: 2026-11-12. Source snapshot SHA-256: `999df3003cd340f2965e224cb0ff872dfe407e9648c896e43bc906e1eedf4d83`.

## B01 — Blender 4.5 LTS, Cameras

[Cameras - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/cameras.html)

Perspective, focal length/FOV, shift, sensor fit and size, clipping, focus and aperture. Supports explicit camera metadata and differentiating a moving camera from a focal-length change.

Retrieved: 2026-11-12. Source snapshot SHA-256: `689145d3adb8adc10ddc387699e05275b1ee25fad838a4cbe9809a734bad8443`.

## B02 — Blender 4.5 LTS, Tracking Camera

[Camera - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/sidebar/track/camera.html)

Camera presets do not include principal point or distortion coefficients; sensor width, pixel aspect, lens and distortion models must be known or estimated. A named camera preset does not establish all intrinsics.

Retrieved: 2026-11-12. Source snapshot SHA-256: `434afbd597d28ac3e96f4d3a54fc1c83f7e86318f069f03d721481f5efe17462`.

## B04 — Blender 4.5 LTS, Solve

[Solve - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/toolbar/solve.html)

Rotation-only tripod footage cannot determine real 3D feature positions; refinement needs plausible initial intrinsics; cleanup uses reprojection error and orientation/scale tools. Strong primary evidence for the RGB-versus-calibrated-3D distinction.

Retrieved: 2026-11-12. Source snapshot SHA-256: `074a0275e9e7ffb0cc7ca40f7aef596f7a2c453ac4a86a14fce5b719271924e1`.

## C01 — OpenCV 4.x, Camera Calibration

[OpenCV: Camera Calibration](https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html)

Defines intrinsics, extrinsics, distortion, known image/world correspondences, calibration and reprojection error. RGB pixels alone are not a calibration dataset with known world geometry.

Retrieved: 2026-11-12. Source snapshot SHA-256: `f2be50360f3bb8a7c639071efa3df083f4ebcd1310c61630407ad65a2991516a`.

## C02 — COLMAP, Tutorial

[Tutorial — COLMAP](https://colmap.github.io/tutorial.html)

SfM reconstructs structure/cameras from overlapping images; capture guidance calls for useful texture, similar illumination, overlap and viewpoint changes rather than only rotation. Supports reconstruction prerequisites and failure checks.

Retrieved: 2026-11-12. Source snapshot SHA-256: `405715573a82646857b097a0ac119cbd4089f1e08d0d62e17d1cfdf7f4a86795`.

## B05 — Blender 4.5 LTS, Color Management

[Color Management - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/color_management.html)

Scene-linear processing, display/view transforms, input image spaces, non-color data and OpenColorIO roles/configuration. Establishes that data maps must not be treated as ordinary color images.

Retrieved: 2026-11-12. Source snapshot SHA-256: `377abccb3602d70a70bf28a5207e86a4819eda1cd772c446127bb0c39ac59ea1`.

## A01 — ACES, ACEScg Specification

[ACEScg Specification - ACES Documentation](https://docs.acescentral.com/encodings/acescg/)

AP1 floating-point linear working space designed for CGI/rendering/compositing. Supports distinguishing working-space choice from display encoding and input relabeling.

Retrieved: 2026-11-12. Source snapshot SHA-256: `6c0dde71aabed9249b240eb617aa8f5bafd4af5d1bb84950c3ab99f44e3378f0`.

## A02 — OpenColorIO, Config Syntax

[Config syntax](https://opencolorio.readthedocs.io/en/latest/guides/authoring/overview.html)

A central configuration defines roles, scene/display spaces, views and looks. Supports a versioned shared color contract rather than unrelated per-tool assumptions.

Retrieved: 2026-11-12. Source snapshot SHA-256: `43e9495192f7c7cc519d8bd629f0ef54e384c96d79a228ee36d237c9190625f3`.

## A03 — ACES, System Overview

[ACES System - ACES Documentation](https://docs.acescentral.com/background/overview/)

Disparate sources use input transforms into a common scene-referred system and output transforms for displays. ACES is a documented option, not a required look or proof of recovered raw radiance.

Retrieved: 2026-11-12. Source snapshot SHA-256: `26f937bdfc1aa2651737a0684282d6f680b4f1373bad4270296c6394019497de`.

## T01 — Three.js, PerspectiveCamera

[PerspectiveCamera - Three.js Docs](https://threejs.org/docs/pages/PerspectiveCamera.html)

Uses vertical FOV; provides aspect, film gauge/offset, view offsets and projection updates. Supports explicit DCC/browser projection mapping.

Retrieved: 2026-11-12. Source snapshot SHA-256: `123788f1b199fe484238efb95732dafa5daabb7843f289649227e035bf9d95ef`.
