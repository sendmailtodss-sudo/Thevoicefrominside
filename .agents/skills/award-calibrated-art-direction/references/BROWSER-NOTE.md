# Browser observation scope

Checked 2026-11-12 UTC with installed Playwright and `/usr/bin/chromium`, headless, fresh isolated pages. No forms submitted, messages posted or purchases attempted. The FWA's public official records were read in full after rendering; the creative sites received bounded entry and wheel actions. This is reference observation, not a product test suite.

| Site | Actions and captures | What was actually seen | What remains unknown |
| --- | --- | --- | --- |
| FWA About | 1440×900 rendered read; `fwa-about.json`, `fwa-about.png` | Current human-jury rule, FWAi separation and archive description | None of these statements establish the quality of any live winner |
| FWA ORVAE / Orchestrated / Aviator | 1280×800 rendered official records; corresponding JSON/PNG pairs | Exact category/date and current percentage; Aviator legacy/new distinction | Full interaction quality |
| The Watch | 1440×900; entered URL, waited, wheel +1000; `watch-landing.png`, `watch-scroll.png` | Light loading field and circular progress motif. DOM later contained actual product content | Product interaction, real loading time, reversibility, mobile, frame rate |
| Where Worlds Take Shape | 1440×900; entered URL, waited, wheel +1000; `worlds-landing.png`, `worlds-scroll.png` | Loading character, input hints and introduction | Playable navigation, portfolio access, device behavior |
| ORVAE initial pass | 1280×800; waited 18 s, screenshot, wheel +1100 then −1100; `orvae-live-0.png`, `orvae-live-forward.png`, `orvae-live-back.png` | Marble-like entry field, wordmark, then entry invitation | Screenshots were entry/loading states, not evidence of forward/reverse chapters |
| ORVAE follow-up | 960×600; waited for visible “Enter Orvae World”, clicked, waited 5 s, screenshot; wheel +1200, waited 2 s, screenshot; `orvae-entered.png`, `orvae-entered-scroll.png`, `orvae-entered.json` | A tiled/pixel-like reveal of an architectural doorway on a circular platform with tree, cloud and mountainous background. Second capture showed more of the scene | `scrollY` remained 0; elapsed reveal and wheel happened together, so no causal claim that scroll changed the scene. No completed chapter navigation, hold narration, reverse/freeze, mobile or performance test |

No reference has been certified to satisfy this project's unusually strict absolute-scroll contract. Creator descriptions of game simulation, generative audio or timed environmental motion should be understood as different design contracts, not patterns to import unchanged.

Practical next verification, only if later needed: visit the chosen reference on an ordinary hardware browser, wait for entry to finish, capture the same chapter position before/after an idle interval, then reverse to an exact prior state. Record input/state coordinates and the elapsed time separately. Use physical mobile devices for mobile performance claims. Do not spend more research time trying to certify every reference when the useful principle is already supported by the source and its limitation is clear.
