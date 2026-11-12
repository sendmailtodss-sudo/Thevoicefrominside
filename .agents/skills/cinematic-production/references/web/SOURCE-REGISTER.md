# Fresh primary-source register

Research retrieved on 12 November 2026 using ordinary HTTPS through the existing environment. No billed crawlers, search-service credits or media generation were used. Prior skills and source lists were not accepted as external evidence. Facts were independently checked in the successfully fetched documents below.

The private archive’s machine-readable `sources/fetch-register.json` preserves original/final URLs, retrieval UTC, HTTP status, byte count and SHA-256 for raw snapshots. HTML reading copies are in `sources/*.txt`; their hashes differ from raw HTML by design. These snapshots are private research evidence and should not be copied into a public skill distribution. If only this reference is distributed, keep its URLs and source IDs; archive hashes remain available from the private handover.

Sources have different authority: normative W3C/WHATWG/IETF standards define requirements/semantics; editor drafts describe developing APIs; official Three.js source establishes the referenced version's implementation; MDN and browser-vendor guidance explains APIs and limitations; provider documentation describes advertised platform behavior. None alone proves the project's implementation or a physical device passed a test.

Three.js sources were fetched from official `mrdoob/three.js` r170 paths and freshly resolved through the official Git object API to commit `beab9e845f9e5ae11d648f55b24a0e910b56a85a` (W50/W50a). For immutable follow-up links, substitute that commit for `r170` in the listed raw GitHub URLs. No copied demo, uninstalled dependency or a newer-version snippet is treated as runtime evidence.

## Claim map

### W01

[CSS Scroll-driven Animations Level 1](https://www.w3.org/TR/scroll-animations-1/) — W3C published Working Draft.

- Supports: Scroll-driven timelines use scroll position rather than clock time.
- Limit: Published snapshot is 2023; not a browser support table. Prefer W51 for current editor text.
- Retrieved: `2026-11-12T00:36:37.375270+00:00`; bytes `336103`; SHA-256 `1ded53b8cdc55f6ec84e0b383ae434f3fbd640eb7d73c6c9f4b1bdcecefac583`.

### W02

[CSSOM View: scrolling APIs](https://drafts.csswg.org/cssom-view/) — CSSWG editor draft.

- Supports: Defines native scroll offsets and scrolling APIs.
- Limit: Draft API shapes do not establish shipping support; no smooth-scroll adoption is recommended.
- Retrieved: `2026-11-12T00:36:37.376228+00:00`; bytes `1086057`; SHA-256 `9f61bb129419c0fd05f327ff46b8be7a324b96ddbb3142cb30bb67c24dd795f5`.

### W03

[HTML Living Standard: media elements](https://html.spec.whatwg.org/multipage/media.html) — WHATWG living standard.

- Supports: Seeking is a stateful asynchronous algorithm; paused video can retain a previous frame while seeking; fastSeek requests approximate-for-speed seeking.
- Limit: Does not promise immediate arbitrary frame decode or low reverse-seek latency.
- Retrieved: `2026-11-12T00:36:37.376852+00:00`; bytes `837077`; SHA-256 `1f1abd5bbc357b299ef3a02226ad759c6568747c959f2525ced5a9ba5b76e0d9`.

### W04

[requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback) — Browser API documentation.

- Supports: requestVideoFrameCallback metadata includes mediaTime/presentedFrames; callback can arrive a v-sync later.
- Limit: Metadata aids evidence; callback does not guarantee synchronous exact-frame presentation.
- Retrieved: `2026-11-12T00:36:37.378241+00:00`; bytes `170303`; SHA-256 `efb6dd3273ec16bc4bec6c12bdb6aeba40f76192c30898ad51c84ff1f46753ed`.

### W05

[HTMLMediaElement currentTime](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime) — Browser API documentation.

- Supports: Setting currentTime seeks; reported position is an approximation and media-supported position may differ.
- Limit: Use current fetched text; do not repeat an old timer-rounding claim absent from this snapshot.
- Retrieved: `2026-11-12T00:36:37.379589+00:00`; bytes `167291`; SHA-256 `dbe64504630c64f6d3321b36d2370cb909ad27d5ec8aeb05d5816e63a0c86937`.

### W06

[HTMLMediaElement fastSeek](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/fastSeek) — Browser API documentation.

- Supports: fastSeek trades precision for speed; currentTime is recommended when precision is needed.
- Limit: The alternative still does not promise immediate frame-accurate rendering.
- Retrieved: `2026-11-12T00:36:37.387527+00:00`; bytes `164020`; SHA-256 `9d3cfa0e0312c30819988263e2628f70ca940f02fe9580f16d605c3934d53e11`.

### W07

[MediaCapabilities decodingInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaCapabilities/decodingInfo) — Browser API documentation.

- Supports: decodingInfo reports supported, smooth and powerEfficient for a configuration; reporting may precede measured device statistics.
- Limit: Playback capability is not proof of random-seek latency or battery results for this scene.
- Retrieved: `2026-11-12T00:36:37.642032+00:00`; bytes `174785`; SHA-256 `52ff92307e5943b8d2418946f679660f434a2f6d2a2eddfd0b7a9c3d8b2d2a29`.

### W08

[Media formats and codecs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats) — Browser media documentation.

- Supports: Media container, codecs and configuration are distinct components.
- Limit: No universal codec/browser compatibility guarantee inferred.
- Retrieved: `2026-11-12T00:36:37.645480+00:00`; bytes `152607`; SHA-256 `3c1cb67178144b603b54906092ebcf15468c4a40acc6e953bb621ff268a0f50c`.

### W14

[Three.js r170 PerspectiveCamera](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/cameras/PerspectiveCamera.js) — Official pinned-version source.

- Supports: PerspectiveCamera stores FOV/aspect/near/far and updates projection matrices.
- Limit: No approved camera choreography or mobile framing supplied by the API.
- Retrieved: `2026-11-12T00:36:38.120254+00:00`; bytes `6470`; SHA-256 `b4c3985ae5152bddfbb6d714c778a39e00c9ad617fdf668acf6fd56944e8e773`.

### W15

[Three.js r170 ShaderMaterial](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/materials/ShaderMaterial.js) — Official pinned-version source.

- Supports: ShaderMaterial provides uniforms and vertex/fragment shader hooks.
- Limit: Does not establish a ready-made particle typography effect.
- Retrieved: `2026-11-12T00:36:38.136134+00:00`; bytes `3952`; SHA-256 `1d4b7e2106452ee1f7e506d796edc76e18b4a18749c74659d34bd5817b608dbb`.

### W16

[Three.js r170 Material](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/materials/Material.js) — Official pinned-version source.

- Supports: Materials explicitly control depthTest, depthWrite, colorWrite and blending.
- Limit: Transparent intersection behavior must still be measured/inspected.
- Retrieved: `2026-11-12T00:36:38.141148+00:00`; bytes `16400`; SHA-256 `4e859ed8ab759acb68fcf98beb32d757b1c3a08021559711fbec769907a011cc`.

### W17

[Three.js r170 DepthTexture](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/textures/DepthTexture.js) — Official pinned-version source.

- Supports: DepthTexture stores depth-format render data.
- Limit: Does not reconstruct depth from a normal photograph or video.
- Retrieved: `2026-11-12T00:36:38.164126+00:00`; bytes `1374`; SHA-256 `a81073fcacfcfac6e642eaf845640ffdc0cfe9d883a0592501ec998007074faa`.

### W18

[Three.js r170 InstancedBufferGeometry](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/core/InstancedBufferGeometry.js) — Official pinned-version source.

- Supports: InstancedBufferGeometry exists and exposes instanceCount.
- Limit: Particle count and device throughput are not guaranteed.
- Retrieved: `2026-11-12T00:36:38.287939+00:00`; bytes `562`; SHA-256 `5f7282071f739d43bd9379491c7f27c387c3cf1a7eb905c1301b4b44c3ae9aca`.

### W19

[WCAG 2.2 standard](https://www.w3.org/TR/WCAG22/) — W3C normative accessibility standard.

- Supports: Relevant keyboard, focus, reflow, contrast, language, flash and target-size success criteria; AA target minimum 24 CSS px with exceptions.
- Limit: Citing criteria is not an audit or conformance certificate; project 44px controls are a stricter proposal.
- Retrieved: `2026-11-12T00:36:38.295859+00:00`; bytes `512457`; SHA-256 `6e3c5fe397257cae509a2fb4752b73062cf8cbeb92c2cec618989b17e4cf7057`.

### W20

[Understanding Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — WAI informative Understanding document.

- Supports: Animation from Interactions 2.3.3 is Level AAA; nonessential interaction motion can be disabled.
- Limit: Explains the normative criterion; is not a distinct mandatory AA requirement.
- Retrieved: `2026-11-12T00:36:38.302765+00:00`; bytes `36817`; SHA-256 `14af35e29c3c990a8de49207a26b260c1812eb09b2c70b25f3750a9f114c12f2`.

### W21

[Understanding Pause Stop Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) — WAI informative Understanding document.

- Supports: Pause/Stop/Hide conditions distinguish automatic movement lasting over five seconds and auto-updating.
- Limit: Not a generic five-second limit for all user-controlled scrolling.
- Retrieved: `2026-11-12T00:36:38.305965+00:00`; bytes `61709`; SHA-256 `7780b8cdbca2f3434bdb15ebfb7fe890f68474689c4614fa04697fe65dafb7a2`.

### W22

[Chinese Layout Requirements](https://www.w3.org/TR/clreq/) — W3C Chinese layout working document.

- Supports: Chinese typographic conventions include character grid behavior, punctuation and line composition distinct from Latin text.
- Limit: Does not certify translations or prescribe one universally appropriate font.
- Retrieved: `2026-11-12T00:36:38.324615+00:00`; bytes `768965`; SHA-256 `94fca95d8d2dc1415411bd4666226bd86427a97202535dc17ad6db201f4887fb`.

### W23

[Language tags in HTML and XML](https://www.w3.org/International/articles/language-tags/) — W3C Internationalization guidance.

- Supports: BCP47 language/script distinction; zh-Hans identifies Chinese written with Simplified script.
- Limit: A script tag does not establish region or content completeness.
- Retrieved: `2026-11-12T00:36:38.378914+00:00`; bytes `41772`; SHA-256 `deedd7739d3a08eccaeb9ee8cd7567302d7722fd3179693ab58bf60b6cfcfb40`.

### W24

[CSS Font Loading Level 3](https://www.w3.org/TR/css-font-loading-3/) — W3C font loading specification.

- Supports: FontFace loading and FontFaceSet ready/load APIs coordinate font availability.
- Limit: Readiness alone does not prove glyph coverage, correct shaping or licensed use.
- Retrieved: `2026-11-12T00:36:38.953747+00:00`; bytes `288547`; SHA-256 `1a443ea0a7f67bab99daac264808df5268d652f0abbd63989c2a31b1d489a340`.

### W25

[HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) — IETF HTTP semantics standard.

- Supports: Range, Accept-Ranges, Content-Range and 206/416 semantics; servers can ignore Range in applicable cases.
- Limit: No inspected provider endpoint is certified to deliver Range correctly.
- Retrieved: `2026-11-12T00:36:38.971861+00:00`; bytes `1187554`; SHA-256 `d431760660ea44e130f6e919dab216df2d0b3a490567a98089267523368fe1e5`.

### W26

[Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) — Official provider documentation.

- Supports: Standard Protection excludes production domains; All Deployments protects all URLs; several access-control methods exist.
- Limit: Actual account/project settings, recipients and plan state were not inspected; no paid method authorized.
- Retrieved: `2026-11-12T00:36:39.013228+00:00`; bytes `13596`; SHA-256 `72854940b055fe7d2c01d9685804c6ff623e3bdee73bdcf4c79974223cdcb999`.

### W27

[Vercel ignore](https://vercel.com/docs/deployments/vercel-ignore) — Official provider documentation.

- Supports: .vercelignore excludes deployment uploads and supports allowlist-style patterns.
- Limit: Do not extrapolate one ignore file to every build/prebuilt/Git/external-asset path.
- Retrieved: `2026-11-12T00:36:39.014916+00:00`; bytes `3005`; SHA-256 `daa338897fb41c0ea72c5923f01c7dc10d486e40e09200d32761ea94c0ddfa99`.

### W28

[Vercel Cache-Control headers](https://vercel.com/docs/caching/cache-control-headers) — Official provider documentation.

- Supports: Documents Cache-Control, private/no-store and content-hashed immutable asset patterns.
- Limit: Live response headers and authentication remain untested.
- Retrieved: `2026-11-12T00:36:39.084150+00:00`; bytes `21230`; SHA-256 `139ff65472da5e4592ae4c69401b367321ea2bf03ef22f2d31f2e9b1b5165a8c`.

### W29

[Vercel static cache](https://vercel.com/docs/caching/cdn-cache) — Official provider documentation.

- Supports: Vercel CDN caches eligible content; immutable assets have distinct lifecycle and removal considerations.
- Limit: Cache availability and exact cache-hit behavior require endpoint evidence.
- Retrieved: `2026-11-12T00:36:39.093988+00:00`; bytes `31912`; SHA-256 `8471f561656a57e6264fe45c03194c72e80c0578429bf3c2269e0028a3d1fc49`.

### W30

[WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — Browser WebGL guidance.

- Supports: Avoid unnecessary sync/readbacks; budget VRAM conservatively; no portable maximum VRAM query; release objects.
- Limit: App accounting is not a reliable measurement of total browser/driver GPU memory.
- Retrieved: `2026-11-12T00:36:39.100581+00:00`; bytes `203794`; SHA-256 `ab8ed616f03d0165f66e62cc910c044529216d935d7f5930402499d2df826e05`.

### W31

[Core Web Vitals](https://web.dev/articles/vitals) — Browser-vendor performance guidance.

- Supports: Good CWV targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at 75th percentile split mobile/desktop.
- Limit: Lab runs do not establish field percentiles or scroll/GPU frame performance.
- Retrieved: `2026-11-12T00:36:39.382103+00:00`; bytes `145964`; SHA-256 `5a25ed1c2897a097e79aed14c0b2abcb187a08da404e319c3d810df5657e23e2`.

### W32

[HTML image decoding](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode) — Browser API documentation.

- Supports: Image.decode resolves after decoding; enables readiness-aware presentation.
- Limit: A decode promise does not remove network latency or unlimited-memory risk.
- Retrieved: `2026-11-12T00:36:39.413913+00:00`; bytes `164493`; SHA-256 `f689d4dfe43b55a84e33ae56d1d17df24c359332c5afd7eca9c82091589b616b`.

### W33

[Three.js r170 AnimationMixer](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/animation/AnimationMixer.js) — Official pinned-version source.

- Supports: AnimationMixer.setTime resets mixer/action times and seeks via update.
- Limit: Clip weights, timeScale, scheduled fades and callbacks need random-access verification.
- Retrieved: `2026-11-12T00:36:39.440936+00:00`; bytes `16463`; SHA-256 `8448a95b7fc00e9ddfb04a582e4d138b2c9d19b040aa5094815b934221bba4d6`.

### W34

[CSS touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) — Browser CSS documentation.

- Supports: touch-action influences native pan and pinch gestures.
- Limit: No recommendation to disable browser gestures globally.
- Retrieved: `2026-11-12T00:36:39.460615+00:00`; bytes `335519`; SHA-256 `9c16241b87c51aa4e3ef9226a23060f6be3b6a95b5c9333dc0aa9b26dcfe5a6b`.

### W35

[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — Browser API documentation.

- Supports: Visibility state/events and background RAF/timer throttling support lifecycle management.
- Limit: Throttling does not replace explicit cleanup or a deterministic resume model.
- Retrieved: `2026-11-12T00:36:39.672273+00:00`; bytes `158548`; SHA-256 `fde7e42f346dcc675872f8bd3d68120db05491cc14527bf2bdc6f5b0f6294c89`.

### W36

[MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — Browser CSS documentation.

- Supports: prefers-reduced-motion detects user preference to reduce motion.
- Limit: The project must design a complete alternative, not just detect the flag.
- Retrieved: `2026-11-12T00:36:39.783684+00:00`; bytes `330284`; SHA-256 `211c8ad1f708754a66b484f63ad22a1489035368ac1c415bc41ec93ca053a411`.

### W37

[Vercel project configuration headers](https://vercel.com/docs/project-configuration#headers) — Official provider documentation.

- Supports: Project configuration can define response headers.
- Limit: No configuration was changed or confirmed on the actual deployment.
- Retrieved: `2026-11-12T00:36:39.797780+00:00`; bytes `11862`; SHA-256 `6c3a86c7902a97b04796bafc0b21eaa79de09061486adc37bf386407b6e9b2a2`.

### W38

[Vercel Static Files](https://vercel.com/docs/build-output-api/primitives) — Official provider documentation.

- Supports: Build Output API static files are exposed at deployment URL paths.
- Limit: The present repository does not establish that this exact build output route is used by production.
- Retrieved: `2026-11-12T00:36:39.860643+00:00`; bytes `25161`; SHA-256 `dca5f00f10ee9620cb77d4e0a3fb3942bf5afd4c784aba2627b09b61cdc516b2`.

### W39

[Three.js r170 WebGLRenderer](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/renderers/WebGLRenderer.js) — Official pinned-version source.

- Supports: r170 WebGLRenderer rejects WebGL1, exposes renderer info and shader compilation APIs.
- Limit: The local bundle identifying as r170 was not verified byte-for-byte against the official source.
- Retrieved: `2026-11-12T00:36:40.025542+00:00`; bytes `76721`; SHA-256 `d672d7203ce3a2ed5888a0c17488bfa38fef0c32f36299653547f225cf02371e`.

### W40

[CSS dynamic viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) — Browser CSS documentation.

- Supports: Small, large and dynamic viewport units behave differently; vh maps to large viewport height.
- Limit: Best toolbar behavior for this stage needs physical-device testing.
- Retrieved: `2026-11-12T00:36:40.069399+00:00`; bytes `353580`; SHA-256 `3e776ca3dab84348e8e428f6812740245e6effd3e101c6f223b263dc9ea393fb`.

### W09a

[Three.js r170 rendering on demand](https://raw.githubusercontent.com/mrdoob/three.js/r170/manual/en/rendering-on-demand.html) — Official Three.js r170 manual.

- Supports: Render on relevant changes instead of a perpetual RAF loop; damping requires ongoing updates.
- Limit: Its optional damping example conflicts with the project contract and is deliberately not adopted.
- Retrieved: `2026-11-12T00:37:16.647519+00:00`; bytes `12015`; SHA-256 `c2e4ee6338171d4b2d42cb9880356daa492920d9c91d6bf2fd5bbf43be4d2aa7`.

### W10a

[Three.js r170 responsive design](https://raw.githubusercontent.com/mrdoob/three.js/r170/manual/en/responsive.html) — Official Three.js r170 manual.

- Supports: CSS canvas size and backing resolution differ; DPR can multiply work.
- Limit: No source DPR value is treated as a guaranteed project budget.
- Retrieved: `2026-11-12T00:37:16.648209+00:00`; bytes `15210`; SHA-256 `6298d21eecc17cd03ecb8af727f3946944f8f96e7d80df2f284512355e93ea05`.

### W11a

[Three.js r170 transparency](https://raw.githubusercontent.com/mrdoob/three.js/r170/manual/en/transparency.html) — Official Three.js r170 manual.

- Supports: Transparent object sorting is limited and does not solve all geometry-level ordering.
- Limit: A glow or renderOrder alone cannot establish correct spatial occlusion.
- Retrieved: `2026-11-12T00:37:16.651550+00:00`; bytes `18997`; SHA-256 `ed375d805a94e3415af423de0f6364d5b0b320c802ce3e4f1f75e577abf06077`.

### W12a

[Three.js r170 cleanup](https://raw.githubusercontent.com/mrdoob/three.js/r170/manual/en/cleanup.html) — Official Three.js r170 manual.

- Supports: Dispose geometry, material and texture resources; decoded textures can consume much more than file sizes.
- Limit: Exact memory usage requires an asset ledger and measurement.
- Retrieved: `2026-11-12T00:37:16.655500+00:00`; bytes `17338`; SHA-256 `b97e0f50830fde3276503b5175c3538d2183a8bbf03a6948762a87ca24afa1db`.

### W41

[Three.js r170 BufferGeometry](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/core/BufferGeometry.js) — Official pinned-version source.

- Supports: BufferGeometry supports vertex attributes, indices, draw ranges and disposal.
- Limit: No populated particle geometry or benchmark is created by reading it.
- Retrieved: `2026-11-12T00:37:16.860430+00:00`; bytes `21361`; SHA-256 `e4afb03a78c96831a7472b3f587b9e8275d38e31060c793493bd25b6311816cc`.

### W42

[Vercel git deployment](https://vercel.com/docs/git) — Official provider documentation.

- Supports: Connected Git repositories can deploy automatically on branch pushes/production merges.
- Limit: Current project linkage and auto-deploy settings were not inspected.
- Retrieved: `2026-11-12T00:37:16.876882+00:00`; bytes `18099`; SHA-256 `a2438f1a57c178d3985b44c5f32a9ec819bab54973d821a7280ce2a95708b100`.

### W43

[Vercel security headers](https://vercel.com/docs/cdn-security/security-headers) — Official provider documentation, contextual only.

- Supports: Security header reference retrieved for delivery context.
- Limit: No specific security-header prescription or conformance claim is based on this optional source.
- Retrieved: `2026-11-12T00:37:16.883213+00:00`; bytes `7815`; SHA-256 `9b37e495b353125c2ee9f58e8624999bbe3e3277d4549374f53f7a71284f8109`.

### W44

[WebCodecs video processing](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs) — Browser-vendor API guidance.

- Supports: WebCodecs operations are asynchronous; frames need explicit close; worker/offscreen routes are possible.
- Limit: Its real-time playback example conflicts with the scroll clock; no WebCodecs pipeline installed.
- Retrieved: `2026-11-12T00:37:16.891277+00:00`; bytes `194199`; SHA-256 `128badd9ef43d4b7202970242ba3f254f399c1a5e7627de9b049bcce07f5b203`.

### W46

[Three.js r170 CSS3DRenderer](https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/jsm/renderers/CSS3DRenderer.js) — Official pinned-version source.

- Supports: CSS3DRenderer creates DOM elements and CSS transforms.
- Limit: It does not implicitly put DOM glyphs into the WebGL depth buffer; separate composition needed.
- Retrieved: `2026-11-12T00:37:17.021531+00:00`; bytes `8092`; SHA-256 `5fbc4f012917c03eebd0c145ab334b3524faa39eb8feca30dc5a2d003968e761`.

### W13b

[Three.js r170 Color Management manual](https://raw.githubusercontent.com/mrdoob/three.js/r170/docs/manual/en/introduction/Color-management.html) — Official Three.js r170 manual.

- Supports: Linear-sRGB working color, texture color-space assignment and output conversion ownership; custom shaders need output conversion handling.
- Limit: A project-specific color pipeline remains to be built and inspected.
- Retrieved: `2026-11-12T00:37:58.399484+00:00`; bytes `13215`; SHA-256 `385a2b304973098b0f2de9e62b17b271a7a7341c0712040c8ac124ec0c95ab0c`.

### W45a

[Noto Sans CJK OFL license](https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/LICENSE) — Font publisher license.

- Supports: Noto Sans CJK source license is SIL OFL 1.1 with redistribution/modification conditions.
- Limit: Candidate only; no font installed/selected, no guarantee every desired glyph is covered.
- Retrieved: `2026-11-12T00:37:58.407292+00:00`; bytes `4301`; SHA-256 `6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2`.

### W47

[ImageBitmap close](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close) — Browser API documentation.

- Supports: ImageBitmap.close releases its graphical resources.
- Limit: No guarantee of immediate system memory reclamation or a global VRAM measurement.
- Retrieved: `2026-11-12T00:37:58.416165+00:00`; bytes `149047`; SHA-256 `e61c9923bf85a8ec31c80bf11568a23a26dbc205b0b50262ecd0c9df174d825f`.

### W48

[HTTP Range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) — Browser HTTP guidance.

- Supports: Explains real byte-range requests and 206/416 handling.
- Limit: Used with normative W25; no endpoint was probed.
- Retrieved: `2026-11-12T00:37:58.418114+00:00`; bytes `215653`; SHA-256 `47a1a207e69868bebb75ec60d25a76b8032d4c93b9620acbe3ffaee5f840695e`.

### W49

[Canvas text rendering](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text) — Browser Canvas guidance.

- Supports: Canvas draws text using configured font and can measure text through TextMetrics.
- Limit: Correct font loading, shaping, mask sampling and language review remain project work.
- Retrieved: `2026-11-12T00:37:58.606360+00:00`; bytes `157011`; SHA-256 `78ecf64cae49c804dca62776cb5138e7d150686e410aad0cb84b87b4839f5398`.

### W50

[Three.js r170 immutable tag resolution](https://api.github.com/repos/mrdoob/three.js/git/ref/tags/r170) — Official repository Git object API.

- Supports: Resolved r170 to annotated tag object 232de0cb2d49a3f28d84a8ca9cc4bbf806771736.
- Limit: Tag names alone are mutable; W50a resolves its immutable commit target.
- Retrieved: `2026-11-12T00:37:58.694361+00:00`; bytes `321`; SHA-256 `9ae874d2aa9c31eeec0973bf245c75993273d6323d4497837d9117a29a30dc77`.

### W51

[CSS Scroll-driven Animations editor draft](https://drafts.csswg.org/scroll-animations-1/) — CSSWG current editor draft.

- Supports: Scroll-progress animation concept uses scroll position rather than clock time.
- Limit: Working draft, not cross-browser compatibility evidence or permission for independent unsynchronized layers.
- Retrieved: `2026-11-12T00:37:58.936244+00:00`; bytes `450031`; SHA-256 `fb9bed59b624d8993397941246355ab35f6d84d6a9ccdd8ddc879da813aa6816`.

### W52

[Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) — Official provider documentation.

- Supports: Vercel Authentication and deployment-protection scopes/access-request behavior.
- Limit: Actual reviewer access and authentication path must be tested before sharing private previews.
- Retrieved: `2026-11-12T00:37:58.966981+00:00`; bytes `13585`; SHA-256 `90d142d66ca2c430955e3f36ee2f88685a7f69704db5bef28f358eb8bd7f2a50`.

### W50a

[Three.js r170 annotated tag target](https://api.github.com/repos/mrdoob/three.js/git/tags/232de0cb2d49a3f28d84a8ca9cc4bbf806771736) — Official repository Git object API.

- Supports: Annotated r170 tag points to commit beab9e845f9e5ae11d648f55b24a0e910b56a85a.
- Limit: Does not verify the local vendored bundle or authorize an upgrade.
- Retrieved: `2026-11-12T00:38:41.324786+00:00`; bytes `633`; SHA-256 `c37a972c1bcf9f36d4ab64b29a58cfa30f427deca73d84741438a33f60fd3c7b`.

## Failed paths retained

These URLs were attempted and returned 404. They are not cited as inspected evidence; recovered official paths have separate IDs.

| ID | Failed URL | Recovery |
| --- | --- | --- |
| W09 | https://threejs.org/manual/en/rendering-on-demand.html | W09a |
| W10 | https://threejs.org/manual/en/responsive.html | W10a |
| W11 | https://threejs.org/manual/en/transparency.html | W11a |
| W12 | https://threejs.org/manual/en/cleanup.html | W12a |
| W13 | https://threejs.org/manual/en/color-management.html | W13b |
| W13a | https://raw.githubusercontent.com/mrdoob/three.js/r170/manual/en/color-management.html | W13b |
| W45 | https://raw.githubusercontent.com/notofonts/noto-cjk/main/LICENSE | W45a |

## Evidence versus project synthesis

The pure state function, atomic presentation policy, renderer selection, proposed resource envelopes, camera/depth ownership table, glyph-particle mechanism and test matrices are original project recommendations synthesized from these sources and the user brief. They are not quotations, universal standards, certified performance results, proof of translations, or proof of cinematic quality. The current work has performed document retrieval, source inspection and private draft writing only.

Claims not established: immediate frame-accurate arbitrary cold seeking; guaranteed mobile frame rate; exact total VRAM consumption; fully translated production routes; matching scene depth from a plain MP4; current Vercel protection or deployment wiring; an installed r185/WebGPU runtime; completed browser or physical-device tests; award outcomes.
