# Private local Rapstudio prototype

The first agreed workflow is **an imported/licensed beat, the user's own recording, a simple mix and an exported audio file**. This is a private, installable mobile web prototype for evaluation on iPhone and Android. It has no backend accounts, AI provider, uploads, payments or publishing integration.

Source: `public/verksted/rapstudio/`. Open `/verksted/rapstudio/` using the local developer server. `?lang=no`, `?lang=en` and `?lang=zh-Hans` select Norwegian, English and Simplified Chinese; the app also has a language menu. All app-owned labels, instructions and errors use the same complete dictionaries. File-picker and browser permission dialogs use the browser/operating system's language.

**Keep the entire directory out of public production releases until the private pilot has been reviewed.** A normal repository build copies `public/`; it does not itself provide an access boundary. Only use loopback development or an explicitly protected preview. Do not add a public menu entry as part of this prototype. Its static source contains no credentials or personal content.

## Using the prototype

1. Import a beat you own or have permission to use. Confirm the rights checkbox. The optional 90 BPM demo is original deterministic synthesis in this code, with no imported samples or AI generation.
2. Write your own lyrics or notes. Use headphones, keep the app in the foreground, and start microphone recording with the button. The beat starts from the beginning. A completed take replaces the single voice track; download a backup first to keep an older take. An existing voice file is the fallback when microphone access or recording codecs are unavailable.
3. Set beat and voice levels and adjust the voice's offset if the device introduces latency. Positive offset starts the voice later; negative offset crops its beginning. Play, pause, resume and stop the actual mix.
4. Download the mixed WAV, and separately download a project backup if you need to keep editable tracks. The WAV is a 44.1 kHz, 16-bit PCM mix. The mix's overall gain is reduced if needed to keep its peak below full scale; this is not a mastering service.

The current limits are two tracks, up to 180 seconds and 32 MiB per imported track, title up to 120 UTF-16 code units and notes up to 12,000. Recording stops at approximately 179 seconds to allow encoder finalization. A mix extending beyond 180 seconds is rejected rather than silently cut. Compressed-file support depends on the browser's real decoder. Only mono/stereo sources are supported. The short demo does not loop automatically.

Recording start alignment is not hardware-calibrated. Manual offset helps, but physical latency and headphone/Bluetooth behavior still need device testing. There is no promise of background, locked-screen or telephone-call recording. The app attempts to stop and preserve a take when hidden or interrupted; operating-system suspension can still prevent completion. Do not rely on the prototype for irreplaceable recordings.

## Storage and recovery

- Audio blobs and metadata are stored only in this origin's IndexedDB, with one `readwrite` transaction per complete project. The saved indicator is set only after the transaction completes. Changes are debounced and writes are serialized within the window.
- A storage/quota failure keeps the latest recording in the current session for backup, and shows that saving failed. Closing the session may lose unsaved changes.
- If a stored audio codec cannot be decoded, its raw blobs and notes remain available for backup. A failed initial database read blocks automatic overwriting; a deliberate restore or reset is required before saving can resume.
- A `.rapstudio` backup is a bounded binary container containing metadata plus both original audio blobs. There is no base64 expansion. It checks the format version, exact fields/lengths, total size and each track's SHA-256. Integrity hashes are not signatures, encryption or proof of ownership.
- Restore validates all metadata and hashes and decodes both tracks before atomically replacing the stored project. Replacing an existing project requires confirmation. Failed/cancelled restore keeps the previous stored project. There is no multi-project library; use separate downloaded backups.
- Reset deletes the current IndexedDB project after confirmation. It does not delete previously downloaded WAV or backup files, or uninstall the app shell.

The app does not encrypt local data. Anyone with access to the device/browser profile may be able to access it. Private browsing, browser cleanup, device replacement and operating-system storage eviction can remove data. The domain/origin and browser profile define the storage boundary; a backup is needed when moving to another device, browser or origin. Use one editing window at a time; there is no cross-tab conflict resolution or collaboration.

## Installation and offline boundary

The manifest has standalone display and scope/start URL `/verksted/rapstudio/`. On iPhone, use Safari's Share → Add to Home Screen. Android can offer an install prompt or a browser-menu installation option. No app-store submission, code signing or native application has been created.

The service worker caches exactly nine static URL entries from this directory, including the two index URL forms. It never handles APIs, auth pages, other website routes, uploads, non-GET requests or arbitrary queries. Language-only index queries reuse the cached shell. Redirects and non-script script responses are rejected; an index response must contain the app marker. No voice, notes or project backup is put in the shell cache.

The first visit needs network access. The app reports offline readiness only after worker activation. Once ready, the local project, file import, mixing, backup and WAV export can work without a network. A protected preview's authorization and installation behavior must also be checked on the intended phone; local loopback proof is not proof that a remote preview is accessible to the user.

The cache name contains a hash of the eight unique shell files. After editing a shell file, update that hash in `sw.js`; the dedicated test rejects an unchanged cache version. New versions use a distinct cache and remove only older `rapstudio-shell-` caches after successful activation. Do not broaden the service-worker scope.

## Verification and remaining work

`node --test tests/rap-studio*.test.mjs` covers resampling, signed offset placement, mono/stereo mixing, peak protection/float overflow, PCM WAV bytes, real blob backup roundtrip, maximum Chinese/escaped notes, corruption/length rejection, complete language dictionaries and the offline cache boundary/version.

Browser acceptance uses synthetic text and audio only. Required checks include an actual `MediaRecorder` take with Chromium's synthetic microphone, real permission denial, file fallback, playback/pause/resume, WAV downloads, byte-preserving backup/restore, quota failure, decoder/database fault recovery and offline reload/export. Mobile viewport emulation does **not** establish physical iPhone/Safari or Android recording quality, device latency, long-take memory usage, operating-system interruptions, installation or storage durability. Those remain pilot checks before a wider release.

The broader original vision remains a roadmap: AI-assisted beat and lyric creation, arrangement, quality feedback, artist/producer tools, and later controlled distribution and monetization. The prototype does not pretend that beat import fulfills generative beat production. Any AI provider, music-reference analysis, sample/stem rights, voice use, publication OAuth, payments or business terms require their own concrete implementation and verified access. Similarity checks cannot guarantee copyright clearance.
