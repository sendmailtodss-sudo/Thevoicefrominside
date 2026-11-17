# Åpningsfilm til skyene – sammenstilt prøve

Status 2026-11-17. Isolert medieprøve under `claude-output/` per den autoritative
ordrens Claude-rolle (seksjon 7 / N07). Ikke integrert i journey-manifestet. Codex
eier integrasjon og release. Ingen public-fil, manifest eller publisher er endret.

## Hva dette er

En sammenhengende åpningsprøve (univers → enkelt sinn → skapende handlinger →
samklang → skyer), klippet fra eksisterende, hash-verifiserte kildeklipp med **rette
kutt** — ingen fade, iris, blits eller støvoverlegg for å skjule skjøter. Skjøtene er
rapportert ærlig, ikke skjult.

**Samlende fargegrading (`grade_opening.py`):** De sju klippene hadde ulik farge
(varm galakse, blå hjerner, gull synapser, grønn virvel). For at det skal lese som
**én film i utvikling** og ikke mange klipp, trekkes alle mot én felles kosmisk blå
palett i CIE-Lab, mens **lysutviklingen (mørkt → lyst) beholdes** så filmen fortsatt
utvikler seg. Lyse, naturlige flater (skyer, Jord-høylys) beskyttes mot fargeendringen
så de holder seg realistiske. Dette oppfinner ikke innhold; det re-graderer kun
eksisterende frames.

- **Leveranse 16:9:** `deliverable/opening-to-clouds-preview-16x9.mp4`
  1280×720, h264, 24 fps, 788 frames, 32,83 s.
  sha256 `4ab048a8c20a3b7dd9bd3c32787236c110fe3da9b9ca05d2aafc00a7a28e51d0`
- **Mobil 9:16 senterutsnitt:** `deliverable/opening-to-clouds-preview-9x16-centrecrop.mp4`
- **Stillalternativ (reduced-motion):** `deliverable/stills/` – én meningsbærende frame per beat.
- **Redigerbar tidslinje:** `edl.json` · **Render-oppskrift:** `build_opening.py`
- **Skjøtbevis:** `evidence/joins.png` (siste/første frame rundt hvert kutt),
  `evidence/mobile_crop_check.png`, `evidence/preview_overview.png`.

Bygg: `python3 build_opening.py <kildemappe> <utmappe>`. Krever ffmpeg + opencv/numpy.
Scriptet verifiserer hver kildes sha256 før bruk og rører ingen originaler.

## Kildegrunnlag og samsvar med V4

Alle sju klippene er lastet ned fra live produksjon og hash-verifisert mot pakkens
`CURRENT-MEDIA.json`. V4-arkivet (`Nettside_checkpoint_2026-11-17_v4.zip`, sha256
`1fa9173c…7ce26`) ble hentet, verifisert og lest; dens `film-join-controls/JOINS.json`
bruker nøyaktig **samme kildehasher** i samme manifestrekkefølge. Jeg dupliserer ikke
Works 21 diagnostiske skjøtklipp; dette er den sammenhengende, trimmede prøven de ikke
dekker. V4 bekrefter `new_order_implemented: false` og at åpningsrekkefølgen under er
gjeldende manifest. DNA er ute (manifest `dna.enabled=false`); originalen er bevart.

Inngangens første skjerm (svart stjernerom, medaljong, språkflagg) er et **separat**
punkt og inngår ikke her – denne prøven er den kosmiske filmåpningen, ikke inngangsskjermen.

## Segmentliste (kilde, hash, inn/ut, kamera, gjenbruk)

| # | Beat | Scene | Kilde-sha256 | Inn–ut (kilde-fps) | Lengde | Kamera |
|---|---|---|---|---|---|---|
| 1 | univers | big-bang | `4a9ab3a8…1a90ae` | 0–120 (24) | 5,00s | punkt → stjernestriper → spiralgalakse |
| 2 | univers | galaxy-descent | `9e118114…e671e641e` | 20–120 (24) | 4,17s | videre inn i spiralen, virvel mot dyp; trimmet før hjernefeltet |
| 3 | enkelt sinn | brains | `7aeff6b9…08ff7039b` | 30–195 (30) | 5,50s | drift gjennom hjernefelt, inn mot ett sinn |
| 4 | skapende handlinger | impulses | `dbd602bf…363827b68c` | 60–210 (30) | 5,00s | gyldne synapselinjer tennes mellom hjernene |
| 5 | samklang | vortex | `4569e5c4…41a772d7f636d` | 110–295 (30) | 6,17s | nettverket binder seg til én blå spiralvirvel |
| 6 | samklang | supernova | `aa82b367…deb961aec3` | 88–192 (24) | 4,33s | grønn virvel → Jord i rom ved soloppgang |
| 7 | skyer | earth-gate (frontdel) | `9119c30e…ea260767264` | 0–64 (24) | 2,67s | Jord → ned gjennom atmosfæren til fullt skydekke; **stopper ved frame 63, siste rene sky før fengselet toner fram (~frame 68)** |

## Overlevering til Codex (skyoverlevering)

Prøven slutter på det fulle skydekket i `earth-gate` (kilde-frame 63), **før** noe av
Bergen fengsel-området blir synlig (fengselet toner fram fra ~frame 68). Det eksisterende godkjente nedstigningsklippet `earth-gate` fortsetter
uendret derfra inn i fengselet, og er eid av resten av filmen. Overgangshåndtaket er at
siste segment (supernova) ender på Jord-i-rom som matcher `earth-gate` sin første frame
(luma-differanse 7). Jeg endrer ikke fengsel, betjenter, C7 eller noe etter skyen.

## Ærlig skjøtvurdering (ikke skjult med overganger)

Målt som luma-differanse (dY) på kuttgrensen + visuell motiv-/akse-/skala-vurdering.
Ingen skjøt er «godkjent bevegelse» – det krever Works/din visuelle aksept.

| Skjøt | dY | Vurdering |
|---|---|---|
| J1 big-bang → galaxy-descent | 14 | Motiv-kontinuerlig (galakse→galakse), men ulik galakse/fargegrading (varm→kjølig) og rotasjon. Akseptabelt scenebytte, ikke sømløs kamerabevegelse. |
| **J2 galaxy-descent → brains** | 40 | **Svakest.** Nebula-dis (dim) → nær-svart stjernerom der hjernene toner inn. Kort mørkedupp og ingen felles motiv. Flagges som underkjent skjøt; et mulig forbedringshåndtak er å la hjernene begynne å tone inn tidligere i overlappet. |
| J3 brains → impulses | 7 | Ren: hjernefelt → hjernefelt, matchet skala og grading. |
| J4 impulses → vortex | 20 | Motiv-match (synapsenettverk→nettverk), lite fargehopp (gull→blå). Akseptabelt. |
| J5 vortex → supernova | 31 | **virvel→virvel**: blå spiralvirvel → virvel. Etter graderingen er den grønne virvelen trukket mot teal/blå, så fargeskiftet er dempet; ingen motivreversering. |
| J6 supernova → earth-gate | 7 | Ren skyoverlevering: Jord-i-rom → Jord-i-rom. Liten skala-endring (Jord trekker seg litt unna), samme motiv. |

Graderingen demper fargehoppene i J1, J4 og J5 betydelig (alle i samme blå familie nå).
J2 er fortsatt den svakeste (mørkedupp), men nå farge-konsistent.

## Mobilutsnitt (9:16) og stillalternativ

`evidence/mobile_crop_check.png` viser 9:16 senterutsnitt per beat. Hovedmotivet holdes i
alle beats, med **ett flagg:** på supernova-beaten er Jorda stor og sentral, så 9:16 klipper
venstre/høyre kant av kloden. Mulig håndtak ved integrasjon: en liten `focusY`/utzooming på
den scenen for mobil. Stillalternativene i `deliverable/stills/` er meningsbærende frames,
egnet for reduced-motion.

## Hva som gjenstår / ikke hevdet

- Dette er **ikke** godkjent film. Sammenhengende bevegelse over hver skjøt og mobil-/
  reduced-motion-visning må godkjennes visuelt av deg/Work.
- J2 er en reell svak skjøt, ikke skjult.
- Komprimerings-/keyframe-måling på mørke gradienter/skyer er ikke gjort her; previewen er
  crf 16, GOP 12. Codex eier endelig encode-/seeking-oppsett under nettsidens scrollklokke.
- Modell brukt denne leveransen: Claude Opus 4.8 (konfigurert i økten). Hasher/metadata via
  skript (`sha256sum`, `ffprobe`, Python `hashlib`), ikke modell. Null ekstern kostnad.
