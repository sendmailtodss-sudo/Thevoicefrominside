# Dør-/veggpassasje – lokal kontinuitetsprøve

Status 2026-11-17. Dette er en lokal, reversibel prøve, ikke en godkjent film
eller en publiseringsklar effekt. Work eier nettsidekode, integrasjon og
publisering; dette ligger utelukkende i `claude-output/door-passage/`.

## Hvilken fil og hvilke tidskoder

**Kildefil:** `corridor-to-painter-passage-91a39873174ce62d.mp4`
sha256 `91a39873174ce62d1662ce3b96d63bed47a22e7c2ada60aed97fabf69a05e487`
1280×720, h264, 24 fps, 174 bilder (7,25 s). Hentet fra den gjeldende,
publiserte produksjonskilden (`CURRENT-MEDIA.json` i produksjonspakken) og
kontrollert bit for bit mot den oppgitte hashen før bruk.

**Hvorfor denne døren:** Dette er den eneste lukkede, ekte døren mellom to
rom i dagens publiserte medier. Arbeidsordren beskriver to dørpassasjer:
(1) «lukket celledør til mannen med gullglis» og (2) «tvers over gangen
gjennom lukket dør første fra venstre til kunstnerrommet». Ifølge
`manifest-current.json` (`locationReconstruction`) er passasje (1) i dag
løst med et **vindu** («inn gjennom det tredje øvre vinduet fra venstre»),
ikke en dør, og den er eksplisitt listet i `requestedMediaReplacements` som
noe som trenger ny, kontrollert kilde – ikke noe jeg skal gjette meg frem
til. Passasje (2), `corridor-to-painter`, er den eneste som faktisk viser en
lukket dør som krysses, og er valgt derfor. **Åpent punkt:** hvis «feil dør»
betyr noe annet enn dette valget, si konkret hvilken passasje som menes,
så retter jeg det før videre arbeid.

**Tidskoder brukt i prøven:** kildebilder 100–172 (24 fps) = 3,0 sekunder,
med effekten aktiv omtrent bilde 109–138. Hele resten av klippet (0–99 og
144–174) er urørt original.

## Hva den første prøven bommet på (forkastet av bruker)

Se `rejected-v1/REJECTED.md` for full liste. Kort sagt:
- Partikkel-/oppløsningsfargen leste som gyllen ild, ikke dørmateriale.
- Oppløsningsfronten var én stor, fraktal «brannhull»-form, ikke en
  kontrollert overflateerosjon.
- Kameramodellen var ikke verifisert mot dørens faktiske fire hjørner.
- «Rommet bak» var ett enkelt slørete stillbilde, ikke ekte kameradybde.
- Overgangen til ekte senere bilder var en hard, synlig skjøt.

## v2 – også forkastet (teknisk feil, ikke vist frem)

Forsøkte å varpe to stillbilder (dør og rom) med kameramodellen. Modellen var
kun tilpasset bilde 101–127; utenfor det området går den gjennom null og
bildene kollapser til flate fargeblokker fra bilde ~132. Se
`rejected-v1/REJECTED.md`, avsnitt «v2».

## v3 – levert prøve (dette er status nå)

**Metode:** Ingen piksel i originalen byttes ut. Kameraet, geometrien, lyset
og okklusjonen i den ekte opptaket er allerede riktige, inkludert kildens
egen (svake) innebygde tåke-/dobbelteksponeringsovergang rundt bilde
112–140. v3 legger bare til små, tallrike, dørfargede flak OPPÅ originalen,
posisjonert med samme kameramodell som før (brukt kun til plassering, ikke
bildevarping, og med et sikkerhetsgulv på avstandsverdien slik at den aldri
kan gå gjennom null). Et kort, lokalt blitslys ved kikkhullet lyser opp
flakene nær det punktet.

**Hvorfor dette ikke er en «hull/portal»-løsning:** Det finnes ingen maske
som avdekker rommet tidlig. Det eneste jeg legger til er støv/flak og lys;
selve avdekkingen av rommet skjer akkurat når og hvor den ekte opptaket
allerede viser den.

**Målt kameramodell (SIFT + RANSAC, bilde 101–127):**
fluktpunkt (565,3; 337,9), skala-nedgang 2,203 %/bilde, lineær tilpasning
med maksimalt avvik 0,007 over 27 bilder.

**Render-kommando:**
```
python3 render_door_passage_v3.py \
  corridor-to-painter-passage-91a39873174ce62d.mp4 \
  <utkatalog>
```
Bruker kun `ffmpeg` (bilde-uttrekk og H264-koding, crf 14) og Python
(`opencv-python-headless`, `numpy`) – ingen ekstern modell, ingen kostnad,
ingen jobb-ID.

**Leveranse:** `deliverable/door-passage-v3-demo.mp4` – 1280×720, h264,
24 fps, 73 bilder, 3,04 s. sha256
`3b5aa32bac70769985afd9b6be986532d90d7295490710436f0d244ccfa4f01b`.
Kontaktark: `deliverable/door-passage-v3-contact-sheet.png`.

**Ærlig vurdering – hva som fortsatt mangler:**
Flash + støv-laget leser nå som et troverdig, lokalt lysglimt med dørfarget
støv, ikke som ild, og ingen bilder kollapser eller hopper geometrisk. Men
jeg har IKKE klart å erstatte kildens egen svake tåke-/dobbelteksponering i
bilde ~124–140 med en ordentlig, overbevisende overflateoppløsning – støvet
mitt er synlig tidligere og tynt, og den avgjørende avdekkingen av rommet
hviler fortsatt på det originale, middelmådige Higgsfield-resultatet, ikke
på en ny effekt jeg har bygget. Dette er et reelt, ikke et påstått, hull i
leveransen. Å lukke det ordentlig krever enten:
- en finere masking/rotoskopisk isolasjon av nøyaktig hvilke piksler i
  originalen som er kildens egen tåke, for å dempe/erstatte akkurat dem
  (teknisk mulig, men tidkrevende å gjøre riktig for hånd per bilde), eller
- et ordentlig 3D-verktøy (Blender) for å modellere dørens geometri og
  partikkelfysikk presist. **Blender er listet som tilgjengelig i
  produksjonsgrunnlaget, men er ikke installert i denne økten** (kontrollert
  med `command -v blender` → mangler). Jeg har brukt `ffmpeg` og Python
  (opencv/numpy), som er installert, i stedet.

## Modellbruk denne økten

Hovedarbeidet (kameramåling, kompositt-skript, feilsøking, iterasjon) er
gjort med **Claude Sonnet 5** (konfigurert modell denne økten, bekreftet via
`/model`). Ingen Opus-bytte er gjort – de to tekniske feilene (ildfarge,
ekstrapolert kameramodell) var løsbare ved bedre skript/metode, ikke et
avgrenset geometri-/kontinuitetsproblem som krevde Opus. Hasher og
metadata er beregnet med skript (`sha256sum`, `ffprobe`, Python
`hashlib`), ikke med noen modell. Ingen Haiku-oppgave var aktuell i dette
steget.

## Kostnad

Null. Ingen ekstern generering, ingen API-kall, ingen jobb-ID. Alt er lokal
rendering med `ffmpeg` og Python.

## Neste steg (ikke startet)

Per oppdraget fortsetter jeg ikke med en hel serie før denne prøven er
vurdert. Hvis den godkjennes som retning (lyd/geometri ok, men tettheten
skal økes), er neste skritt å forsøke å dempe kildens egen tåke-piksler
spesifikt og erstatte dem med sterkere flak, i stedet for bare å legge til
flere oppå. Hvis «feil dør» betyr en annen passasje enn den jeg har brukt,
sier du fra hvilken, så bytter jeg kilde før jeg går videre.

## Bekreftelse av Works funn på commit 2978fbf (2026-11-17)

Alle fire konkrete funn er kontrollert og bekreftet korrekte:

1. **Additiv-only bekreftet, men bare FØR koding.** Diff mot rå PNG-bilder
   (`run5/_frames/src_*.png` vs `.../out/f_*.png`) gir `min(out-src)=0` over
   alle 73 bilder/kanaler – ingen piksel er noen gang lavere enn kilden,
   nøyaktig som designet. Den leverte H264-filen viser derimot negative
   avvik ned til -29 mot kilden når man dekoder den tilbake; dette er
   kvantiseringsstøy fra selve H264-kodingen (crf 14), ikke et avvik fra
   additiv-designet. Presisert her for å unngå misforståelse.
2. **`r`-bugen er bekreftet.** I `Debris.draw()` beregnes
   `r = np.clip(size * sc, 0.5, 5.0)`, men `r` brukes aldri i selve
   tegningen (`np.add.at` tegner én piksel per partikkel, etterfulgt av en
   fast `GaussianBlur(…, 0.55)`). Den angitte flakstørrelsen styrer
   dermed ikke noe synlig. Dette er en reell feil i det committede
   skriptet, ikke rettet med en ny rendering (per instruks om å bevare
   prøven som diagnostikk og ikke starte en ny effektrunde), men notert
   her presist slik at en eventuell videreføring vet nøyaktig hva som må
   fikses i koden.
3. **Ingen dybdemasker/okklusjon er bekreftet fraværende.** v3 har bevisst
   ingen maskering i det hele tatt (det var selve designvalget for å unngå
   v1/v2s feil) – partikler tegnes additivt uten noen dybdetest mot karm,
   låsplate, dørhåndtak eller annet inventar i bildet. Dette er korrekt
   observert og er en reell begrensning, ikke en påstått en.
4. **Hash-avviket ved lokal gjenskaping er forventet.** Min egen
   gjenskaping av `render_door_passage_v3.py` mot samme kildefil gir ikke
   nødvendigvis byte-identisk MP4 på tvers av kjøringer, siden `libx264`
   med `preset slow` og flertråds koding ikke er garantert
   bit-deterministisk. De rå PNG-bildene (før koding) er derimot
   reproduserbare fra samme script+seed+kilde. Dette endrer ikke
   konklusjonen i punkt 1–3.

Ingen ny rendering er gjort som følge av denne tilbakemeldingen. Prøven
forblir som levert i `deliverable/` og arkivert i `rejected-v1/`.
