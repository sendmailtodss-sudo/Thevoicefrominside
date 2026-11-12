# Primary sources and evidence boundaries

Retrieved 2026-11-12 from public official sites or official raw GitHub repositories. Facts below are paraphrased; the skill workflows are original synthesis. Versioned Blender links refer to **4.5 LTS documentation**; they do not select or install Blender. OpenCV uses its 4.x documentation. Other rolling documents are retrieval snapshots, not release pins. Full source-byte hashes are recorded in the research manifest; source snapshots are evidence records, not executable dependencies.

Yale is an originating university teaching source for its own film analysis lessons. Adobe is an official editing-tool vendor tutorial, not a scientific optics source. Technical claims about calibration, rendering, encoding and browser behavior rely on the relevant official technical sources. No source proves project-specific production quality, compatibility, performance or available render passes.

## E01 — FFmpeg, Main Documentation

[ffmpeg Documentation](https://ffmpeg.org/ffmpeg.html)

Input seeking commonly finds a preceding seek point; accurate transcoding seeks decode and discard intervening content. Supports recognizing prediction/decode dependency work.

Retrieved: 2026-11-12. Source snapshot SHA-256: `da545596656090fff27d3aa2deb3e7a9465cacdb74ccedf01a2202f8cadd2fe3`.

## E02 — FFmpeg, Codecs Documentation

[FFmpeg Codecs Documentation](https://ffmpeg.org/ffmpeg-codecs.html)

Documents generic GOP/B-frame controls and encoder-specific options including libx264. Options require selected-codec/output inspection; a universal encoding command is not established.

Retrieved: 2026-11-12. Source snapshot SHA-256: `19716983c5b85fb88483fdf20fcb59b231f3523e5919eccda60aa7b00f5d305e`.

## E03 — FFmpeg, Formats Documentation

[FFmpeg Formats Documentation](https://ffmpeg.org/ffmpeg-formats.html)

MOV/MP4 metadata/fragmentation, faststart and seeking options. Faststart moves metadata; it is not a guarantee of independently decodable frames or low random-access latency.

Retrieved: 2026-11-12. Source snapshot SHA-256: `94a0c690581e1f26296ddb2d0c3421bbd328b52c6af7fd81d9770c419f8dd3ec`.

## E04 — W3C, WebCodecs Specification

[WebCodecs](https://www.w3.org/TR/webcodecs/)

Defines independent key chunks; no mandatory codec configuration; VideoDecoder queue/resource behavior; configure/flush key-chunk requirements; reset clears configuration; presentation-ordered output; explicit VideoFrame release. Normative API authority, not a browser performance benchmark.

Retrieved: 2026-11-12. Source snapshot SHA-256: `0fa152953edb0117871a6c546d17e58786af4ec90a7a97c304f9453d0611e9b9`.

## E05 — WHATWG, HTML Media Standard

[HTML Standard](https://html.spec.whatwg.org/multipage/media.html)

Media timelines, seeking and paused video rendering are distinct from application-controlled composition. Normative behavior does not promise zero-latency arbitrary seeking or atomic synchronization of independent rendering layers.

Retrieved: 2026-11-12. Source snapshot SHA-256: `1f1abd5bbc357b299ef3a02226ad759c6568747c959f2525ced5a9ba5b76e0d9`.

## E06 — MDN, requestVideoFrameCallback

[HTMLVideoElement: requestVideoFrameCallback() method - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)

Provides mediaTime/presentedFrames/presentation timing metadata; callbacks can be a display refresh late and have no strict synchronization guarantee. Official maintainer documentation with specification links.

Retrieved: 2026-11-12. Source snapshot SHA-256: `efb6dd3273ec16bc4bec6c12bdb6aeba40f76192c30898ad51c84ff1f46753ed`.

## E07 — FFmpeg, License and Legal Considerations

[FFmpeg License and Legal Considerations](https://ffmpeg.org/legal.html)

FFmpeg is generally LGPL 2.1-or-later with GPL consequences for selected components; libx264 is explicitly called out. Applies to an actual chosen build/use, not automatically to distribution of encoded media.

Retrieved: 2026-11-12. Source snapshot SHA-256: `0c0f84b347baa5edb55ad594cb9b8dc3a6ae47b652131ff4533a16b3773e89df`.

## E08 — W3C, WebCodecs Samples

[WebCodecs API Samples](https://w3c.github.io/webcodecs/samples/)

Official examples link video decoding to demuxing/drawing workflows. Optional future reading; no sample was installed or executed.

Retrieved: 2026-11-12. Source snapshot SHA-256: `83e787a7a85d3ffffcc7c0e62d7c8d9af0c1f68371fdf6f4194c245944bb6aa9`.

## E09 — MDN, fastSeek

[HTMLMediaElement: fastSeek() method - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/fastSeek)

Explicitly describes a precision tradeoff; points to currentTime for seeking without that tradeoff. Does not establish frame presentation latency.

Retrieved: 2026-11-12. Source snapshot SHA-256: `9d3cfa0e0312c30819988263e2628f70ca940f02fe9580f16d605c3934d53e11`.

## E10 — MDN, currentTime

[HTMLMediaElement: currentTime property - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)

Setting the value requests seeking; the reviewed page distinguishes media position from update frequency and presented-media accuracy. It says timer rounding is not applied; do not repeat outdated rounding claims as a current universal fact.

Retrieved: 2026-11-12. Source snapshot SHA-256: `dbe64504630c64f6d3321b36d2370cb909ad27d5ec8aeb05d5816e63a0c86937`.

## E11 — MDN, playbackRate

[HTMLMediaElement: playbackRate property - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)

Negative playback rates have limited browser support. Even supported negative playback is clock-driven and does not itself satisfy absolute scroll sampling.

Retrieved: 2026-11-12. Source snapshot SHA-256: `2492c5b961b5f183c73ff53dd4ae2b798b56315f15485f5e58ca302e012800bf`.

## E12 — FFmpeg, ffprobe

[ffprobe Documentation](https://ffmpeg.org/ffprobe.html)

Documents inspecting stream/frame/packet metadata. Supports a future verification procedure; ffprobe was not executed on any project media during research.

Retrieved: 2026-11-12. Source snapshot SHA-256: `8c1723ff8319440618100863aaf016e75d6cd306809fd85890097f32b41fefd3`.

## B05 — Blender 4.5 LTS, Color Management

[Color Management - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/color_management.html)

Scene-linear processing, display/view transforms, input image spaces, non-color data and OpenColorIO roles/configuration. Establishes that data maps must not be treated as ordinary color images.

Retrieved: 2026-11-12. Source snapshot SHA-256: `377abccb3602d70a70bf28a5207e86a4819eda1cd772c446127bb0c39ac59ea1`.

## B09 — Blender 4.5 LTS, Baking Physics Simulations

[Baking Physics Simulations - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/physics/baking.html)

Baking stores simulation results for repeatable playback/rendering. Cache step greater than one may produce interpolation different from the original simulation. Supports baking plus sampling verification.

Retrieved: 2026-11-12. Source snapshot SHA-256: `989da60519a28680ee2652f33108b4f50d668cdb3b60d1bda7d18c59e5b9ff5a`.

## B15 — Blender 4.5 LTS, Cycles Motion Blur

[Motion Blur - Blender 4.5 LTS Manual](https://docs.blender.org/manual/en/4.5/render/cycles/render_settings/motion_blur.html)

Documents shutter sampling and object/camera motion-blur behavior. Useful for an authored shutter policy; does not resolve whether a paused blurred frame is creatively desired.

Retrieved: 2026-11-12. Source snapshot SHA-256: `663101d3c02283be30488abff704204349bcbcfbf96f10506504b7cdd3071b10`.

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
