---
name: deterministic-scroll-presentation
description: Guide for native absolute-scroll cinematic experiences whose entire visible motion freezes and reverses reproducibly. Use for future architecture or implementation only within the active user authorization.
---

# Deterministic native-scroll presentation

## Scope and outcome

Preserve the user's full scene order, words, artworks and available-content boundary. This skill adds no dependency and grants no permission to generate, spend, deploy or replace approved content. During a research/skills-only task, deliver instructions and evidence only. The measurable outcome of later implementation is that a user can stop anywhere, reverse, jump to a chapter, change language and reach content without losing control.

## One state model

Define a pure evaluator over absolute native scroll progress, locale, viewport composition, fixed seed, content revision and a declared quality tier. Use stable chapter IDs and chapter-local fractions; do not infer identity from translated labels. Measure section start and usable scroll span from actual layout. Clamp overscroll and protect zero-length sections. Keep the stage in normal flow with a sticky visual region and a reachable end. [W01, W02, W51]

At rest, there is no elapsed-time input. A `requestAnimationFrame` may coalesce a real scroll or declared state-change render; its timestamp is not an animation clock. Do not reschedule it indefinitely. Eliminate `deltaTime` integration, damping, inertial camera catch-up, pointer parallax, autoplay, looping animated images, CSS keyframes/transitions, timed opacity effects, changing grain, blinking cursors inside the presentation, fresh random samples and history-based feedback. A fixed pseudorandom identity per particle is acceptable; wall-clock randomness is not. [W09a]

Native touch momentum can continue changing scroll after a finger lifts. The visual follows actual scroll until it settles. This is different from a renderer continuing after scroll itself has stopped. Measure and report both. Do not intercept wheel/touch to fake a new scroll system. Preserve browser scrolling, scrollbar dragging, Page Up/Down, Space, Home/End and zoom. Controls may jump native scroll to authored positions without a timed smooth-scroll animation.

## Requested, ready and presented state

For each request, retain canonical progress, input epoch, scene asset revision, locale revision and composition revision. Resolve the complete set of visible resources. Commit a composite only when its dependencies represent the same state. A slow background must not be displayed beneath already advanced text or masks.

Maintain a separate presented state. Controls can indicate requested location, but do not label a retained old picture as the newly presented scene. Show a static localized loading/unavailable status where necessary and let the user skip. Asset readiness updates may fill a cache without changing the visible presentation. Under the strict contract, a completion received after the final admitted input-triggered paint must not create idle catch-up. The next admitted input may use it. An explicit retry, locale change, layout change or initial readiness presentation is a declared state event, not a secret motion clock.

A video `currentTime` write starts seeking. `seeked`, `readyState`, `currentSrc` and request-generation checks help reject stale work, but copying the requested timestamp into a `decodedTime` variable proves no frame identity. Use `requestVideoFrameCallback` metadata where available and actual captures in the test harness; its timing is still best effort. `fastSeek` deliberately trades precision for speed and is unsuitable as the exact-frame oracle. [W03–W06]

Map sequence progress to an explicit bounded frame index. For constant frame rate, define endpoint behavior precisely; for variable frame rate, use a timestamp manifest. A universal `duration - 1/30` assumes a frame rate that must be established, not guessed. A window of decoded stills supports direct identity but introduces misses on long jumps. Coalesce requests to the latest desired state; bound concurrency and reject stale responses. An image cannot be drawn reliably before it is decoded. [W32, W47]

If an asset is absent, do not fabricate synchrony. Retain a complete valid frame or switch through an explicit user action to a static accessible view. Report that the target state has not been presented. There is no general guarantee of immediate arbitrary cold access.

## Scene and timeline authoring

Store camera poses, object transforms, material parameters, light strengths, word phases and transition coefficients as functions of chapter progress. Curves should have explicit endpoints and continuity where the brief requires it. Differentiable easing may avoid velocity discontinuities without introducing an autonomous time source. Camera position, target/orientation, projection, depth and particles must share the same progress. An animation mixer must use absolute authored time, with clip/action state validated for random access; elapsed `update(dt)` accumulation is disallowed. r170 `AnimationMixer.setTime` exists, but its interaction with time scales, weights, looping and externally scheduled fades still needs testing. [W14, W33]

Trails must be reconstructed from fixed samples of an analytic path or immutable event data at the requested progress. A trail made by appending previous rendered positions depends on traversal history and fails direct-seek equivalence. Disable temporal antialiasing/history accumulation unless it can be proven deterministic from the same state without running after stop. Grain, dither, bloom, stars, binary flow, light pulses and UI progress are also motion channels.

## Layout and lifecycle

Reserve image dimensions and font space. Load the needed exact font before calculating glyph targets; remeasure layout through an explicit revision when fonts, orientation or viewport change. Preserve chapter ID and local fraction across recomposition instead of pretending that the same document pixel means the same narrative state after a resize. Do not repeatedly rewrite scroll in response to browser toolbar changes and create a feedback loop. Test stable-small viewport and dynamic-visible viewport strategies on actual phones. [W24, W40]

When hidden or offscreen, stop optional fetch, decode and render work. On resume, reevaluate the current absolute state, not the elapsed hidden interval. Dispose media listeners, abortable requests, image bitmaps, textures, geometries, materials, render targets and animation callbacks when leaving the experience. Late callbacks must carry a disposed/generation check. [W12a, W35, W47]

## Required future evidence

Run the fixed-progress, immediate-stop/late-decode, reverse-history, fast-jump, boundary, resize, deep-link, locale, failure and cleanup protocol in [the test plan](../cinematic-production/references/web/BROWSER-TESTS-AND-BUDGETS.md). Record requested state and actual presented-frame evidence separately. An unchanged progress number, mocked media event or passing pure-function test cannot establish frozen pixels.

Source IDs refer to [the fresh source register](../cinematic-production/references/web/SOURCE-REGISTER.md).
