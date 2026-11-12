# Scroll-controlled scene transitions

The journey blends neighbouring video scenes using their absolute scroll position. Both clip times and blend opacity are calculated by `transition()` in `public/assets/journey/timeline.mjs`. Moving backwards requests the same frames and weights; there is no timer, autoplay or animation loop.

The browser reuses at most two paused video elements. It draws a complete composition to a retained canvas only when both requested frames are decoded. An offscreen scratch canvas prevents a failed draw from erasing the last good frame. A scene change in the middle of a blend reuses the same decoders rather than unloading them. Each resource assignment has a generation guard so stale callbacks cannot replace a newer request.

The canvas uses cover framing and each scene’s focal point. Output is bounded to 2,073,600 pixels and a device-pixel ratio of 1.5. Original artworks remain contained in their existing frames and inspection dialog. The point before Big Bang, language controls, six-work gallery and reduced-motion alternative retain their existing behavior.

A failed video uses its own poster and reports that playback is unavailable. Loading or slow decoding retains the last complete frame while the user remains free to scroll or skip. This removes an abrupt opacity swap; it cannot guarantee zero decode latency, manufacture a missing camera movement, correct inaccurate garment artwork or verify a fictional location.

## Verification

Run the focused checks with:

```sh
node --test tests/journey-transitions.test.mjs tests/journey-timeline.test.mjs tests/journey-assets.test.mjs
```

The new tests cover weighted boundary continuity, reverse and skipped input, alpha coverage, static point/art stops, disabled blending, cover geometry and invalid media duration. Browser verification must also use real media on desktop and mobile layouts, stop/freeze, rapid scene changes, forward/reverse comparisons, unavailable media and reduced motion. Emulated mobile Chromium does not establish physical iPhone/Safari or VR-headset performance.

No paid media generation, provider connection, service activation or deployment is part of this code change.

## Neural words and bottom navigation

The eleven approved expressions keep their existing Norwegian, English and simplified Chinese wording. They now use luminous green system monospace type, with three different entry directions, depth, scale, focus and absorption into the neural stream. All values come from the same absolute network position. Two or three expressions share the active interval, fading in after brains become recognizable and disappearing before the late vortex turns into an empty nebula. Word positions follow the last completely decoded composite while a newer frame is loading.

The source-space gaps come from sparse inspected brain frames. Cover crops choose central alternatives when the outer brains are off-screen on phones; very short landscape screens use visible-strip alternatives. These are compositional anchors, not precise object tracking. They do not add new brains or change the source footage.

Duplicate section entries, contribution/gallery links and the separately injected opt-in filmmaker launch share a bottom dock. The primary site header retains its navigation and language selector. The six original artwork frames reserve the measured dock height so the last row remains above the controls. Rotation retains the active scroll position when the journey is in view. Reduced-motion users keep static scenes and explicit navigation.

The focused suite currently has 18 passing checks, including visibility timing, direction/depth, cover-aware readable anchors and reverse equality. Automated Chromium checks with actual local MP4 files passed desktop and phone layouts, Norwegian/English/simplified-Chinese neural text, bottom link placement, frozen stop, reverse equality, skipped scenes, portrait-to-landscape rotation, gallery dialog focus, a deliberately unavailable video and recovery, and reduced motion. The browser checks are local preview evidence; they do not establish production delivery, physical iPhone/Safari behavior or headset performance.

Additional desktop/phone browser checks compare exact media seek times and image hashes after tiny scroll steps in both directions, rather than accepting a nearby previously decoded frame. The opt-in film link keeps the same bound node during language/text refresh so closing its dialog restores focus. Destroy/reinitialization removes generated nodes, listeners and media sources, then recreates a single dock and two paused journey decoders.
