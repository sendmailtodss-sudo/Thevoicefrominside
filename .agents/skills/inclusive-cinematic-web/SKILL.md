---
name: inclusive-cinematic-web
description: Guide for complete NO/EN/zh-Hans cinematic experiences with usable native scrolling, portrait composition, keyboard controls, reduced motion and semantic alternatives.
---

# Inclusive cinematic web

## Complete experience before visual enhancement

A person must be able to understand the same approved narrative and take the same essential actions through ordinary semantic HTML. Provide headings, ordered content, exact phrase equivalents, real links, meaningful image descriptions and a reachable footer. Treat the canvas/video as decorative when its complete meaning exists nearby; otherwise provide an equivalent description. Do not create duplicate screen-reader announcements for the same text. Decorative particle containers must not hide the only occurrence of essential words. [W19]

Keep a persistent, visible way to go directly to content and a visible language control before a visitor enters demanding motion. A skip link must move to a real destination and leave keyboard focus in a useful place. Do not trap users in a fullscreen stage or make them traverse every scene before reaching the site. Preserve browser Back, deep links, Page Up/Down, Space, Home/End, Tab and Shift+Tab. Provide accessible scene navigation without stealing arrow keys from native controls, fields, menus or assistive technology. Any modal inspection returns focus to its invoker.

WCAG 2.2 supplies relevant criteria, not an automatic conformance certificate: Keyboard 2.1.1, No Keyboard Trap 2.1.2, Bypass Blocks 2.4.1, Focus Visible 2.4.7, Focus Not Obscured 2.4.11, Reflow 1.4.10, Text Spacing 1.4.12, Non-text Content 1.1.1, contrast 1.4.3/1.4.11, and Language of Page/Parts 3.1.1/3.1.2. Check scope and exceptions; a canvas does not exempt its ordinary navigation or reading alternative. [W19]

## Reduced motion is a composed access mode

Read `prefers-reduced-motion` before starting camera movement and respond to changes. Offer a persistent manual static-view control. In static mode, remove large camera travel, parallax, particle morphing and prolonged sticky scroll distances; render composed chapter stills and ordered text in normal flow. Keep all words, scene navigation and actions. Do not force the user through blank scroll ranges corresponding to disabled visuals. [W20, W36]

Animation from Interactions, WCAG 2.3.3, is Level AAA. The project can deliberately satisfy this stronger requirement alongside an AA target. Pause/Stop/Hide 2.2.2 has specific conditions for automatic movement and auto-updating; do not misstate it as a blanket five-second rule for every user-controlled scroll effect. Regardless of that classification, the project explicitly requires no autonomous main-journey motion. Also inspect rapid scroll transitions for dangerous flashes; scrubbing does not make flash sensitivity disappear. [W19–W21]

## Touch and portrait composition

Keep browser panning and pinch zoom available. Avoid `touch-action:none` on the page/stage and broad `preventDefault` handlers. Decorative canvas layers should not intercept links or controls. Author portrait camera positions, focal points and phrase layout so that both brains and the meaningful relationship between them remain visible. Do not solve cropping by shrinking essential type until it cannot be read. [W14, W34]

Reserve safe areas for persistent navigation and bottom controls. Test actual browser toolbar expansion/retraction, software keyboard, rotation and short landscape screens. `svh`, `lvh` and `dvh` have different behavior; `dvh` can change while the browser UI moves, so do not continually remap narrative progress without preserving chapter position. Make the fixed/sticky control area measurable and prevent it covering focused content. [W40]

Proposed project touch targets are at least 44 × 44 CSS px, with separation and visible focus. This is a project design target; WCAG 2.5.8's AA minimum is 24 × 24 CSS px with specified exceptions. Verify at 320 CSS px width, 200% text resizing, 400% browser zoom where applicable and text-spacing overrides. Test the semantic alternative without two-dimensional scrolling for ordinary text and controls. [W19]

## Full NO, EN and Simplified Chinese

Use stable message IDs and explicit locale entries for every scene title, description, particle phrase, primary navigation item, button, tooltip, alt text, status, loading/failure message, modal, fallback, sound control and destination label. A translated language selector does not make an experience translated. Maintain a parity inventory and fail completeness checks on missing entries instead of quietly substituting Norwegian strings. Preserve approved writing; do not invent missing translations or certify them without review.

Retain user-facing `NO` if that is the approved label; use `nb` for actual Bokmål content, `en` for English and `zh-Hans` for Simplified Chinese metadata. Internal keys such as `no`/`zh` may map to canonical language tags. Set document and relevant part languages correctly. `zh-Hans` identifies a script; it does not itself establish locale, country, translation quality or a preferred Chinese font. [W19, W23]

Audit phrases from source catalog through formed glyph geometry and accessible text. Norwegian æ/ø/å and English/Norwegian accents, typographic punctuation and all Chinese characters must render with the chosen font revision. Chinese uses different line-breaking and punctuation conventions from Latin text. Do not split it on spaces or inherit wide uppercase Latin tracking. Provide locale-specific line breaks, sizing and spacing without distorting glyphs. Verify Chinese punctuation cannot appear at forbidden line positions and review the actual formed word/still on a phone. [W22, W24]

Language changes preserve stable scene ID/local fraction, relevant query/hash state, user controls and focus, then replace all locale-owned state atomically. Treat routes separately: if a destination is available only in another language, label that fact explicitly in the current language; do not imply that its full page is translated. The current scope requires complete NO/EN/zh-Hans within the cinematic experience, including its fallback and typography. Wider site translation claims require their own inventory.

## Future verification

Run automated catalog parity/glyph checks plus manual language review, keyboard-only traversal, screen-reader traversal, reduced-motion before load and while active, portrait rotation and zoom. Device emulation establishes layout only; actual iOS/Android browsers are needed for touch, decoder, thermal and GPU conclusions. Keep the static alternative complete on asset failure, disabled JavaScript and WebGL2 failure.

Sources: [register](../cinematic-production/references/web/SOURCE-REGISTER.md). Measurements: [browser protocol](../cinematic-production/references/web/BROWSER-TESTS-AND-BUDGETS.md). Delivery controls: [reference](../cinematic-production/references/web/MEDIA-DELIVERY-AND-PRIVATE-STAGING.md).
