# Primary sources and evidence boundaries

Retrieved 2026-11-12 from public official sites or official raw GitHub repositories. Facts below are paraphrased; the skill workflows are original synthesis. Versioned Blender links refer to **4.5 LTS documentation**; they do not select or install Blender. OpenCV uses its 4.x documentation. Other rolling documents are retrieval snapshots, not release pins. Full source-byte hashes are recorded in the research manifest; source snapshots are evidence records, not executable dependencies.

Yale is an originating university teaching source for its own film analysis lessons. Adobe is an official editing-tool vendor tutorial, not a scientific optics source. Technical claims about calibration, rendering, encoding and browser behavior rely on the relevant official technical sources. No source proves project-specific production quality, compatibility, performance or available render passes.

## C01 — OpenCV 4.x, Camera Calibration

[OpenCV: Camera Calibration](https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html)

Defines intrinsics, extrinsics, distortion, known image/world correspondences, calibration and reprojection error. RGB pixels alone are not a calibration dataset with known world geometry.

Retrieved: 2026-11-12. Source snapshot SHA-256: `f2be50360f3bb8a7c639071efa3df083f4ebcd1310c61630407ad65a2991516a`.

## C02 — COLMAP, Tutorial

[Tutorial — COLMAP](https://colmap.github.io/tutorial.html)

SfM reconstructs structure/cameras from overlapping images; capture guidance calls for useful texture, similar illumination, overlap and viewpoint changes rather than only rotation. Supports reconstruction prerequisites and failure checks.

Retrieved: 2026-11-12. Source snapshot SHA-256: `405715573a82646857b097a0ac119cbd4089f1e08d0d62e17d1cfdf7f4a86795`.

## B01 — Blender 4.5 LTS, Cameras

[Cameras - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/cameras.html)

Perspective, focal length/FOV, shift, sensor fit and size, clipping, focus and aperture. Supports explicit camera metadata and differentiating a moving camera from a focal-length change.

Retrieved: 2026-11-12. Source snapshot SHA-256: `689145d3adb8adc10ddc387699e05275b1ee25fad838a4cbe9809a734bad8443`.

## B02 — Blender 4.5 LTS, Tracking Camera

[Camera - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/sidebar/track/camera.html)

Camera presets do not include principal point or distortion coefficients; sensor width, pixel aspect, lens and distortion models must be known or estimated. A named camera preset does not establish all intrinsics.

Retrieved: 2026-11-12. Source snapshot SHA-256: `434afbd597d28ac3e96f4d3a54fc1c83f7e86318f069f03d721481f5efe17462`.

## B03 — Blender 4.5 LTS, Track properties

[Track - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/sidebar/track/track.html)

Tracking channel/motion-model and track properties. Supports inspecting the chosen tracking model rather than assuming all tracked features are equivalent.

Retrieved: 2026-11-12. Source snapshot SHA-256: `9d731a0e9cf4f89347f613fb230b84eed7af2fb387207b9ea4a02e5146d6e8bf`.

## B04 — Blender 4.5 LTS, Solve

[Solve - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/toolbar/solve.html)

Rotation-only tripod footage cannot determine real 3D feature positions; refinement needs plausible initial intrinsics; cleanup uses reprojection error and orientation/scale tools. Strong primary evidence for the RGB-versus-calibrated-3D distinction.

Retrieved: 2026-11-12. Source snapshot SHA-256: `074a0275e9e7ffb0cc7ca40f7aef596f7a2c453ac4a86a14fce5b719271924e1`.

## B05 — Blender 4.5 LTS, Color Management

[Color Management - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/color_management.html)

Scene-linear processing, display/view transforms, input image spaces, non-color data and OpenColorIO roles/configuration. Establishes that data maps must not be treated as ordinary color images.

Retrieved: 2026-11-12. Source snapshot SHA-256: `377abccb3602d70a70bf28a5207e86a4819eda1cd772c446127bb0c39ac59ea1`.

## B06 — Blender 4.5 LTS, Render Passes

[Passes - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/layers/passes.html)

Defines Z, position, normals, motion vectors, masks and lighting channels with engine-specific restrictions. Z/position/index passes are not antialiased; pass availability and blur/transparency behavior differ. Documentation is not evidence that a particular asset contains a pass.

Retrieved: 2026-11-12. Source snapshot SHA-256: `f49da17ee069af63ebd4725b8543c653bef025e473fb953c830dfdadce19daab`.

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

## B13 — Blender 4.5 LTS, Track Editing

[Track - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/movie_clip/tracking/clip/editing/track.html)

Official tracking operators and solve-related workflow. Auxiliary reading for future matchmove work, not evidence that any current plate is solvable.

Retrieved: 2026-11-12. Source snapshot SHA-256: `3fa368654dff2552da1fe37c4d4b0c840bcd038754dd343d98bb01bb8ba8206c`.

## B14 — Blender 4.5 LTS, Alpha Convert

[Alpha Convert Node - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/compositing/types/converter/alpha_convert.html)

Blender render/compositing convention is premultiplied alpha; some color operations use straight alpha and require conversion back. Supports explicit alpha convention and edge checks.

Retrieved: 2026-11-12. Source snapshot SHA-256: `45b7e24c8f35c297d1d03af793293cb5cc3283addd89cc69da10db9b40f3b583`.

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

## X01 — OpenEXR, Technical Introduction

[Technical Introduction to OpenEXR — OpenEXR Documentation](https://openexr.com/en/latest/TechnicalIntroduction.html)

Named channels, HALF/FLOAT/UINT, premultiplied conventions, optional deep samples and lossy/lossless compression modes. The format can hold data but cannot create absent data.

Retrieved: 2026-11-12. Source snapshot SHA-256: `0ad4e36e111a391059904c8feb912a2f2a7c3cf2ea50b6353da5812fbffbc531`.
