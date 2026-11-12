# Journey presentation measurement and source re-check, 12 November 2026

Status: research note. No application code, media, service or deployment changed.
Measured revision: `09793ebf9c1068fd9f0a576d49f80fc0ab35ae5b` (`feature/dreamina-media`).
This note records what was actually measured in the contributor preview and which
external claims were re-checked against primary sources. It grants no production,
spending or publication authority and is not a visual acceptance.

## Baseline checks (Node 24.22.3)

| Command | Result |
| --- | --- |
| `npm test` | exit 0, 244 passed, 0 failed |
| `npm run check` | exit 0, 165 JavaScript files parse |
| `npm run build` | exit 0, 529 files |
| `python3 -m unittest discover -s tests` in `.agents/skills/youtube-video-analysis` | 12 passed, 3 errors: `yt_dlp` not installed (remote-URL tests only; local `inspect` works) |

## Freeze and reversal, actual composited pixels

Environment: Playwright with headless Chromium 153 on Linux, software video decode,
local `npm run dev`. **Emulated** viewports 1366×768 and 390×844 (touch, DPR 1),
Norwegian. No physical phone or Safari/WebKit was tested.

Method, at 15 absolute journey positions per viewport (30 states): jump to a position
slightly above, then to the target; capture after 0.3 s, 1.9 s and 3.4 s; approach the
same target from below; capture after 1.9 s. Full-page screenshots were compared per
pixel (a pixel counts as changed above 8/255 on any channel). Video `currentTime`,
`paused`, `seeking` and running Web Animations were recorded.

| Check | Result |
| --- | --- |
| Hold 1.9 s → 3.4 s after stop | 0 changed pixels in 30/30 states |
| Video elements while stopped | all paused, none seeking, 0 running animations |
| Same position reached downward vs upward | identical in 28/30; desktop 0.22 differed in 0.02 % of pixels (max Δ131), desktop 0.45 max Δ20 |
| `currentTime` downward vs upward | identical in 30/30 |
| 0.3 s after stop vs 1.9 s after stop | **changed in 4/30 states** (39–76 % of pixels): desktop 0.06, 0.38, 0.68; mobile 0.06 |

Interpretation: the picture is stable once it has settled, and the mapping is
position-determined. The contract is not yet met in the strict sense, because in four
states a decoded frame was presented more than 0.3 s after input ended. That is a late
update after the visitor stopped, even though `currentTime` was already correct.
A `currentTime` or `paused` assertion alone would not have detected it.

A likely contributor is keyframe spacing (measured with `ffprobe`):

| File | Frames | Keyframes |
| --- | ---: | ---: |
| `big-bang.mp4` | 193 | 2 |
| `prison-arrival.mp4` | 289 | 2 |
| `galaxy.mp4` | 451 | 31 |
| `brains.mp4` | 301 | 21 |
| `painter.mp4` | 234 | 16 |
| `stencil.mp4` | 518 | 35 |

Two of the late states fall in the two clips with only two keyframes. The third
(0.68, at a clip boundary) was not explained by this measurement. All clips are
1280×720 and are upscaled on larger screens.

## Other observations in the preview

- The neural words are HTML text with a glow, laid over the video. They do not share a
  camera, depth or occlusion with the brains, and at 390×844 two phrases overlapped.
- The journey chrome shows a `Pause` control and a second scroll hint under the scene
  title inside a main journey that has no autonomous playback.
- The eleven Norwegian expressions in `journey.js` match the approved list; English and
  Simplified Chinese strings are present. Translation meaning was not reviewed here.
- The approved start invitation is shown above the point at the origin.

## Primary sources re-checked on 12 November 2026

| Claim | Source | Evidence |
| --- | --- | --- |
| FWA awards need 80 % jury yes after at least 10 judgements within 21 days, no daily quota; FWAi has no vote | <https://thefwa.com/about> | rendered page read |
| CSSDA: WOTD needs a judges' average above 8.00 (varies); Special Kudos above 6; public UI/UX/Innovation awards need more than 20 votes and a judges' average above 6 | <https://www.cssdesignawards.com/about/> | page read |
| Webby website criteria for 2026/2027 are Content, Structure and Navigation, Visual Design, Functionality, Interactivity, Innovation, Overall Experience | <https://www.webbyawards.com/judging-criteria/> | page read |
| Awwwards 40/30/20/10 weighting | <https://www.awwwards.com/about-evaluation/> | **not opened here** (connection refused from this environment); relies on the earlier research pass |
| `requestVideoFrameCallback` is Baseline 2024 and may fire one v-sync late | MDN | page read |
| WebCodecs `VideoDecoder` is not Baseline | MDN | page read |
| WCAG 2.2.2 Pause, Stop, Hide is Level A; 2.3.3 Animation from Interactions is Level AAA and names scroll-triggered parallax | W3C Understanding documents | pages read |
| Core Web Vitals good thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile | <https://web.dev/articles/vitals> | page read |
| Higgsfield MCP and CLI always deduct credits; unlimited and free generations apply only on the website | Higgsfield help center, dated 1 Aug 2026 | pages read |
| Higgsfield REST API is a separate key-based, pay-as-you-go product; request files are deleted seven days after completion | <https://docs.higgsfield.ai/docs/llms.txt> and linked pages | pages read |
| three.js `master` is at 0.187.0; the repository's recorded local route is r170 | three.js `package.json` | file read |

## Not run

Physical devices, Safari/WebKit, Firefox, screen readers, keyboard-only traversal,
reduced-motion rendering, English and Chinese visual passes, resize/orientation,
memory and load timing, cold-cache behaviour, and continuous-motion review.
