# Browser acceptance protocol and proposed budgets

No checks below were run against an application in this research task. These are future acceptance criteria, not passed results. Test a fixed asset revision, locale, composition and quality tier. Preserve raw evidence and failures.

## Observable tests

| Test | Procedure and measurable evidence | Failure condition |
| --- | --- | --- |
| Fixed-progress identity | For each chapter sample start/end, 25/50/75%, formation/hold/reabsorption boundaries and transition sides. Reach each point forwards, backwards and by direct jump. Save canonical state JSON, exact asset revision, presented timestamp/frame identity and full-stage captures. | Different authored state at the same input; mismatched frame/word/mask versions; systematic visual differences. |
| Immediate stop and settled freeze | Record the final native scroll event and last admitted input-triggered paint. Compare captures immediately afterwards and at 0.25, 1.5 and 5 seconds. Repeat while a seek, font, texture or adjacent scene is still pending. Keep native momentum distinct from stationary `scrollY`. | Visible camera, particle, word, media, grain, glow, fade or loading spinner continues at fixed inputs; late decoder result changes the stage. |
| Late/stale async completion | Delay media/texture responses; request A, B, C quickly and reverse to A. Resolve requests out of order. Record requested/ready/presented epochs. | An old result paints over the current scene or any late callback causes idle catch-up. |
| Reverse and long jump | Scrub every enabled asset slowly, flick rapidly, drag scrollbar, jump over several chapters and jump backwards. Repeat cold and warm. | Backlog, forced waiting, stale word/background pairing, wrong endpoints, unbounded fetch/decoder count; “instant exact” claim when target remains unavailable. |
| Neural mechanism | Capture same phrase before formation, formed and reabsorbing, at several depths/angles. Disable bloom and optional glyph fill. Inspect behind/in-front pairs and direct jumps into each phase. | Words merely slide as intact DOM labels, particles lack glyph formation, false occlusion, unreadable strokes, detached particles or traversal-dependent trails. |
| Locales | Enumerate every catalog key and exact source phrase for NO/EN/zh-Hans; compare DOM and glyph target strings; inspect each phrase and all controls/errors/fallbacks on portrait. Switch locale mid-scene and after a deep link. | Missing/mistranslated/unreviewed text treated as approved; tofu/missing glyphs; clipped Chinese punctuation; loss of scene/focus/route state; hidden fallback to another language. |
| Navigation and access | Keyboard-only start to footer and back; skip; all scene controls; modals; browser Back; screen-reader order; JavaScript off; WebGL2 unavailable; reduced motion before load and toggled while active. | Trap, obscured focus, duplicate/dead controls, missing semantic words/actions, empty long scroll ranges, autoplay or inaccessible failure. |
| Layout | 320 × 568, 390 × 844, 768 × 1024, 1440 × 900 and short landscape; 200% text, 400% zoom where applicable, text-spacing override, toolbar movement and rotation. | Essential crop, unreadable type, overlapping control rows, accidental horizontal page scroll, changed narrative position from resize feedback. |
| Lifecycle | Hide/resume, navigate away/back ten times, trigger context loss and restore/fallback, block one media/font/model request. Track active listeners/RAF, decoder count, app resource counts and heap trends. | Old callbacks modify new state, sustained idle rendering, monotonic retained resource growth, crash or unusable fallback. |
| Delivery/privacy | Actual Range GETs, MIME/cache/validator checks and unauthorized direct-asset requests to relevant staging aliases and hosts. | Full-byte transfer masquerades as verified partial delivery; stale hashes; private file in output; unauthenticated private media accessible. |

Use automated screenshots and state assertions for reproducible checks, then inspect real motion and language readability manually. For same-browser same-device static captures, begin with an exact canvas pixel comparison; isolate browser UI and cursor. If nondeterministic platform rasterization forces a tolerance, record the raw diff, pixel count, maximum channel error and a justified bound. Do not hide moving particles behind a generous perceptual threshold. Cross-browser/GPU bit-identical pixels are not promised; state identity, correct frame selection, geometry and composition are still testable. External screen recording can help verify actual presentation when a canvas readback is not appropriate. [W04, W30]

Use at least current Safari on a physical iPhone, Chrome on a physical midrange Android device, desktop Chromium, desktop Firefox and macOS Safari where the audience requires it. Record model, OS/browser versions, viewport, DPR, refresh rate, power mode, network profile, cache state, thermal state and quality tier. Emulation is useful for layout and throttling but does not emulate iOS video decode, thermal limits or the phone GPU. If devices are unavailable, mark these gates untested.

## Proposed project budgets — subject to measurement

These are starting project envelopes, not Three.js/browser limits, universal best practice, or measured performance of this website. Revise from actual device evidence while preserving the mechanism and accessible path.

| Resource or metric | Proposed mobile envelope | Proposed desktop envelope | Measurement rule |
| --- | --- | --- | --- |
| First usable shell | ≤300 KiB compressed HTML/CSS/control JS; poster/font addition ≤1.5 MiB total before optional scene payload | Same semantic shell; first visual payload ≤2.5 MiB | Cold transferred bytes by resource class; controls and skip must function before heavy assets. |
| First required cinematic segment | ≤4 MiB additional compressed assets | ≤8 MiB additional | This does not set the whole journey's download size; load segment-by-segment and show actual totals. |
| Active frame pacing | Target 60 fps; acceptable declared reduced tier 30 fps with p95 presented-frame interval ≤33.3 ms | p95 interval ≤16.7 ms on named 60 Hz device | Record ≥30 seconds active forward/reverse plus 3-minute thermal run; report median/p95/p99 and missed frames. Averages alone conceal stalls. |
| Input-to-correct-visible-state, warm active scrolling | p95 ≤100 ms | p95 ≤50 ms | Correlate input epoch and actual correct composite. This never permits post-stop catch-up. Record unavailable/missed targets separately. |
| Canvas draw-buffer cap | ≤1.0 megapixel initially; DPR cap ≤1.5, further limited by pixel cap | ≤2.1 megapixels initially; DPR cap ≤2 | Use actual CSS dimensions × backing ratio; CSS pixel count is not GPU work. Portrait can need a distinct composition at a lower backing resolution. |
| Active draw calls / visible triangles | ≤75 / ≤200k starting ceiling | ≤150 / ≤750k starting ceiling | `renderer.info` for all passes; these counts are diagnostic, not a speed guarantee. Transparency/fill can dominate. |
| App-accounted resident image/texture/render-target data | ≤96 MiB | ≤192 MiB | Ledger dimensions × formats × mip levels × live buffers; count depth and post targets. Excludes unknown browser/driver allocation; do not call this measured total VRAM. |
| Decoders / frame requests | ≤2 video elements decoding only where a transition requires them; bounded latest-target queue | Same default | Confirm active decoder work and network requests; a paused element may still decode during seeks. |
| Idle authored rendering | 0 repeated RAF renders and 0 autonomous presentation changes after last admitted paint | Same | Measure a 5-second fixed-state interval; asynchronous background caching may complete but cannot animate the stage. |

Do not set a particle-count budget in isolation: glyph density, quad size, overdraw, transparency and postprocessing matter. Start with the lowest population that preserves exact strokes and flow. Measure the complete frame, then reduce background decoration, resolution and effects before sacrificing required words or depth relationships. Freeze quality tier for comparisons; change it only through a declared policy that cannot silently change an idle composition. [W10a, W11a, W30]

Track Core Web Vitals independently: web.dev's current “good” thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 at the 75th percentile, split mobile/desktop. These are published guidance, unlike the custom envelopes above. Lab runs do not establish field percentiles. INP and LCP do not prove smooth scroll scrubbing or GPU responsiveness; retain the custom presentation measurements. [W31]

Output evidence should state **passed**, **failed**, **not run** or **blocked**, with browser/device and artifact references. Keep technical acceptance separate from artistic acceptance: meaning, cinematic coherence, exact artwork, typography, mobile framing and visual originality require human review even after tests pass.

Sources: [register](SOURCE-REGISTER.md). State/renderer decision: [matrix](ARCHITECTURE-DECISION-MATRIX.md).
