# Architecture decision matrix

Status: researched recommendation, not an approved implementation or measured result. Current user constraints outrank optional techniques in existing skills. The full approved journey remains in scope; this matrix does not reduce it to a generic number of scenes.

## Non-negotiable presentation contract

The authored state is `F(progress, locale, viewportComposition, fixedSeed, contentVersion, qualityTier)`. Progress comes from absolute native document scroll, not wheel delta, pointer position, accumulated elapsed time, a smoothed scroll proxy or animation history. An easing curve may shape a local segment as a pure function. Its output at the same input remains identical. Quality tier and composition are explicit inputs, held stable while inspecting a state; an adaptive quality governor must not produce idle changes or silently make a reverse capture differ. [W01, W02, W09a, W51]

Separate **requested**, **ready** and **presented** state. An encoded video timestamp is not a decoded-frame identity. Web media seeking can finish asynchronously; `requestVideoFrameCallback` supplies the presented frame's media timestamp but is not a promise of immediate or frame-exact control. Strict freeze means a decoder completion must not quietly move the picture after the last admitted input presentation. Cache late results; publish on the next admitted input. If a late-result presentation is intentionally permitted later, record that as an explicit weakening of the brief, not as compliance. [W03–W06]

There is an unavoidable availability tradeoff. With missing resources, the implementation cannot promise both immediate exact target-state display and zero post-stop change. Keep the last complete composite, or show an authored static unavailable state with content access. Mark the target unpresented. Prewarming, smaller assets and analytic geometry reduce this occurrence; they do not abolish network and decoder latency. Test cold and warm behavior separately.

## Representation comparison

| Representation | Deterministic reverse and freeze | Photographic finish | Words between brains, depth and exact locales | Principal cost | Decision and proof gate |
| --- | --- | --- | --- | --- | --- |
| Ordered still-image sequence drawn to canvas | Explicit frame index; reverse independent of prior frames once ready. Late image decode still requires commit gating. | Offline frames can carry authored lighting and camera. | Baked words require separate locale assets and are inaccessible alone. Runtime words require matching camera and depth/masks per frame. | Transfer, decode work and decoded-memory residency; many files. | Strong candidate where frame identity is essential and a bounded mobile window fits budgets. Demonstrate random access, frame manifest and memory eviction. |
| Paused HTML video, seek by absolute progress | Requested time is deterministic; returned pixels are asynchronous, frame-quantized and codec/decoder dependent. Reverse seeks are possible without negative playback. | Efficient photographic compression. | Flat plate has no usable 3D scene depth or camera; new type does not acquire filmed occlusion automatically. | GOP/keyframe seek latency, stale decode races, dual-decoder transition cost, browser variance. | Conditional for existing photographic segments. Must pass actual-pixel freeze and reverse tests on target devices. Reject if late idle catch-up is needed to appear correct. |
| Real-time Three.js analytic world | Direct evaluation from progress supports arbitrary seeks; deterministic seed and no temporal history required. | Depends on available models, material/light quality and device budget; no guarantee of film realism. | Shared camera, brain geometry, glyph-particle geometry and depth test provide direct spatial integration. Locale-specific glyph targets remain exact. | Geometry/texture assets, authoring, shader compilation, GPU fill/overdraw, context loss and fallback. | Preferred candidate for the neural mechanism, subject to mobile validation and art direction. Current local r170 is a WebGL2 route; r185 WebGPU instructions are not drop-in. |
| Hybrid plate plus real-time spatial layer | Only if all layers publish the same ready progress/version atomically; slowest layer controls readiness. | Allows photographic plate with exact runtime type. | Requires camera export/match plus proxy occluders, calibrated depth or foreground masks at each frame. A normal MP4 is insufficient. | Calibration, multiple assets, crop transforms, compositing/color/depth agreement, harder diagnostics. | Use only where a specific plate advantage justifies the cost and necessary scene data exists. Without it, call it an overlay, not solved world-space integration. |
| Semantic HTML with composed stills | Normal scrolling and direct state navigation; no cinematic motion required. | Static art can retain intent. | Complete exact words and meaning in all locales; no false claim of a spatial effect. | Translation, readable layout, still selection and link integrity. | Required complete access path for reduced motion, unavailable rendering and deliberate skip. |

No renderer is a blanket choice for the entire journey. Retain approved media where it meets its acceptance gate. Do not substitute an untested real-time world merely because it sounds more advanced.

## Media and scene ownership

| Component | Required owner | Evidence needed |
| --- | --- | --- |
| Native scroll, chapters, URLs | One conductor | Same canonical progress after forward/reverse, deep link and viewport change; no trapped wheel or compulsory viewing delays. |
| Brain forms, camera and occlusion | Shared 3D scene, or named camera/depth/mask plate pipeline | Occlusion pair with word visibly behind then in front; camera and crop calibration at several progress points. |
| Exact words and particle targets | Approved locale copy + licensed font + deterministic glyph sampler | Source-string equality, glyph coverage, shaped masks/targets, readable formed state and same particles returning into streams. |
| Photographic frame | Bounded sequence loader or paused decoder manager | Asset hash, frame/timestamp manifest, actual presented-frame evidence, stale-request rejection. |
| Color, transparency and bloom | One compositor/output conversion owner | Linear-light assumptions recorded, bloom-off image, no double tone mapping, no halo used to hide incorrect depth. |
| Semantic reading and controls | Native HTML | All content and actions remain usable without WebGL, motion, image delivery or JavaScript enhancement. |

CSS3D transforms can provide perspective but do not automatically share the WebGL depth buffer. A depth texture records a render's depth; merely creating one does not infer a photographed scene's geometry. Set depth convention, near/far planes, units, camera matrices, crop, frame identity, transparency policy and color encoding for every handoff. [W14–W18, W46]

## Recommendation in priority order

1. Keep the present semantic navigation/content foundation and native-scroll model. Document strict freeze as an actual-pixel contract, including deferred media results and all CSS/shader effects.
2. Specify the neural segment as a coherent scene with true spatial ownership. Use analytic particles and font-derived targets; no elapsed-time compute, accumulated trail history, smoothing or fresh random samples.
3. Evaluate a real-time r170-compatible WebGL2 path against sequence and calibrated hybrid choices using the same approved mechanism and budget. Treat an upgrade as its own later decision. No runtime is added by this research.
4. Preserve photographic segments conditionally. Future local measurement decides whether video scrubbing can meet strict stop/reverse on phones, or whether selected segments need bounded sequences or static fallback.
5. Make NO/EN/zh-Hans content completeness, small-screen framing, keyboard/skip and reduced motion acceptance gates before judging visual polish. Deliver visual evidence separately from technical pass/fail.

Sources are identified in [SOURCE-REGISTER.md](SOURCE-REGISTER.md). Detailed future tests: [BROWSER-TESTS-AND-BUDGETS.md](BROWSER-TESTS-AND-BUDGETS.md).
