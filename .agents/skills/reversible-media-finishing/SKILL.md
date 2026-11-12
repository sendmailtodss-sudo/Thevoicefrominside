---
name: reversible-media-finishing
description: Prepare and validate finished cinematic media for exact progress-based reverse and random access, with explicit frame identity, decoding tradeoffs, color, memory, and no autonomous catch-up.
---

# Reversible media and finishing

Use this original guidance when a cinematic asset must be driven by absolute scroll progress rather than a playback clock. Research and planning do not authorize encoding, rendering, package installation or production. Do not claim any codec, pass, device tier or exact-seek behavior has been validated until it has.

## Define exactness before selecting a format

Separate five facts:

1. Requested story progress.
2. The intended discrete frame or continuous scene state.
3. Data available in memory or on disk/network.
4. The frame actually decoded and uploaded.
5. The frame actually presented with its dependent overlays.

Setting `currentTime` proves only that a seek was requested. A callback or media event is not automatically a proof that the intended frame was displayed with all other layers in the same paint.

Create a deterministic mapping from story progress to an explicit frame index or PTS. Choose and document rounding, endpoints and segment ownership. For a constant-frame-rate master with `N` samples, map to valid indexes `0…N-1`; never seek to the theoretical instant beyond the final frame. For variable-frame-rate media use its timestamp table, not an invented uniform cadence.

Fast scrolling may skip intermediate frames. It must not enqueue a backlog to be played afterward. Reverse scrolling requests decreasing indexes; it is not implemented by a negative playback clock. At unchanged progress, camera, plate, particles, masks, lighting, grain and all other visible content stay unchanged.

## Choose a delivery family through measurements

| Family | Strength | Limitation to test |
|---|---|---|
| Frame-addressed image sequence | Direct frame identity, natural backward/random ordering, no temporal prediction dependency | Network request count, decode latency, compressed bytes, decoded memory, GPU upload and resolution |
| All-intra video | Independent coded pictures reduce temporal dependency work | Bitrate/file size, codec support, demux index, seek/decode/presentation latency remain |
| Short-GOP video | Better compression with bounded dependency spans | Decode-forward work on random/backward requests, keyframe placement, open-GOP dependencies, reorder delay |
| Long-GOP video | Good sequential compression | Often poor random/reverse responsiveness; must not be presumed acceptable |
| Sampled 3D/analytic scene | Shared geometry/camera/depth and no video-seek dependency | Asset authoring, GPU workload, appearance, animation/cache formats and device support |
| Precomposited segments plus 3D | Can localize difficult content and preserve true depth elsewhere | Cross-segment and cross-renderer frame/color/camera synchronization |

“All I frames” is not a universal guarantee of codec-level random-access semantics. Verify the chosen codec's actual independently decodable access points, flags and dependency behavior. A guessed encoder flag cannot replace inspection. For compressed sources, locate a valid preceding random-access point and decode required chunks in decode order, then select/present the target by presentation timestamp. Do not feed dependent frames in reverse compressed order.

## Mastering contract

Keep an original finishing master before web compression. Record source revision, dimensions, frame rate or timestamp table, frame count, handle frames, shot boundaries, color primaries, transfer function, matrix/range where applicable, alpha convention and expected output display. Preserve camera and matte alignment if delivery uses multiple layers.

Where linear float intermediates are warranted and genuinely available, OpenEXR is suitable for named channels. Choose compression and precision appropriate to the channels; some EXR compression modes are lossy. Do not assume an EXR contains depth or IDs. Web delivery is a separate conversion with a deliberate view/output transform.

Align every independently encoded auxiliary layer to exactly the same frame count, timebase, dimensions, crop and endpoint convention. Check alpha and mask compression carefully; chroma subsampling and inter-frame errors can damage small lettering and matte edges. A conventional web video format may not carry alpha in the same way across browsers. Select a tested combination or precompose; do not presume transparent MP4 portability.

## Encoding evaluation, not a universal command

Once production is authorized, make representative candidate encodes from a difficult short master, varying GOP/access-point spacing, intra versus inter coding, B-frame/reorder behavior, resolution, frame density and bitrate/quality. Inspect the actual output with an available tool such as ffprobe: timestamps, frame types/key flags, timebase, duration, count, dimensions, pixel format and color tags. Encoder options are codec-specific.

In FFmpeg, `-g` describes GOP size, `-bf` relates to B frames, and libx264 has its own documented options [E02]. These are evaluation controls, not proof of low latency. `+faststart` moves MP4 metadata to the beginning [E03]; it helps startup metadata availability but does not shorten a GOP or eliminate decoding work. HTTP byte-range delivery and indexing also need verification in the eventual deployment environment.

Do not use `fastSeek()` for an exact-frame claim: it explicitly trades precision [E09]. Do not rely on broad negative `playbackRate` support [E11]. Standard `currentTime` seeks and media event timing need empirical presentation checks [E10]. The source documentation reviewed on 2026-11-12 does not support repeating older claims about currentTime timer rounding as a universal fact.

## Presentation and asynchronous work

Maintain one target story state. A request receives an identity/revision; an obsolete decode result must not overwrite a newer target. Coalesce superseded work. Decoder queues, worker messages and texture uploads must not produce visible catch-up after the input stops.

Define a presentation boundary tied to a sampled scroll update and the normal display cycle. If the required asset is not ready by that boundary, do not invent a policy that silently animates toward it later. Under the strict freeze contract, late frame or quality replacement while stopped is itself a visible change. Possible future choices include pre-ready lower-resolution coverage, an adequate preloaded working set, or a more compact directly evaluable representation. Any loading or readiness gate must be designed explicitly and must not restrict freely moving through the page as an accidental implementation side effect.

If multiple layers depend on a plate frame, commit them as a consistent state. Avoid updating the 3D camera to progress `u2` while the video remains at `u1`. A canvas/WebGL composition with selected decoded frames gives different control from a browser-owned video layer; neither should be called atomic without a measured presentation test.

`requestVideoFrameCallback` exposes `mediaTime`, `presentedFrames` and timing metadata, but the official documentation notes it can arrive a display refresh late [E06]. Use it as evidence/instrumentation, not as a latency guarantee.

With WebCodecs, check `VideoDecoder.isConfigSupported()` for the actual config. No particular codec is mandated. Decode queues can saturate, and retained `VideoFrame` objects can stall decoding. Close unused frames promptly. `configure()` and `flush()` require the next decoded chunk to be a key chunk; `reset()` discards configuration and pending work [E04]. Do not flush every requested frame and then feed an arbitrary dependent frame. WebCodecs does not remove the need for a container demuxer and dependency/PTS index.

## Memory and quality budgets

Budget decoded data, not only download bytes. A 1920×1080 RGBA8 image is about 7.91 MiB before overhead; 120 such frames are about 949 MiB. A 3840×2160 RGBA8 image is about 31.64 MiB. GPU textures, duplicate CPU buffers, decoder surfaces and browser overhead add more. Decoder-native formats may use less memory, but do not assume every later stage preserves that saving.

Use explicit retention limits and release rules. Prefetch both directions within the allowed budget, but do not claim a finite neighborhood covers an arbitrary jump. A coverage fallback must be a ready visual representation of the target, not old-frame playback disguised as smoothing. Changing LOD or quality while stopped must obey the same visible-state contract.

Balance temporal sampling against slow-scroll stepping and storage. Higher source fps gives denser temporal samples but does not create continuous time. Frame interpolation can introduce morphing and inconsistency; do not assume it improves fast motion, hands, fabric, text or reverse sampling without inspection.

## Finishing and acceptance

Check the finished master and each delivery encode for anatomy, face/hand stability, tool contact, cloth overlap, artwork, particle readability, block artifacts, color banding, matte fringes, and frame discontinuities. Inspect every cut boundary as frozen images. Match browser delivery against the documented output transform; metadata alone does not prove displayed color.

Motion blur needs a deliberate policy. A baked blurred frame can remain blurred while the interface is stopped, like a paused film frame. It cannot continuously change its blur with wall-clock time. Velocity-dependent real-time blur may give different images at the same progress depending on input history; that conflicts with exact retracing unless the product explicitly permits it. A progress-authored shutter representation avoids that history dependence but still needs visual approval.

Once authorized, test ordered forward/backward samples, repeated same-progress samples, large direct jumps, direction changes, boundaries, resize/crop, background-tab return, and a long stop. Record intended frame index, presented PTS/frame identity, stale-result rejection, time-to-ready/present, memory, dropped/skipped states and device/browser configuration. Use frozen frame hashes or visual comparisons for deterministic assets, with an appropriate tolerance for known color/render differences.

No route passes solely because it looks smooth in one forward desktop demonstration. Report exact failures and limits; do not claim universal instant seeking, full-resolution arbitrary access, or zero visible drift without evidence.

## Sources

Read [the self-contained source reference](references/SOURCES.md): E01–E12 for seek, codec, container and browser behavior; X01 for masters/channels; B05 and A01–A03 for color. Pipeline choices and acceptance rules above are original synthesis of those facts and the user's explicit scroll invariant.
