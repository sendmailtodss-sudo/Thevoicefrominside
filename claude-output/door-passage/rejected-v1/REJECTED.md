# Forkastet prøve – ikke bruk

Denne mappen inneholder den første prøven på dør-/veggpassasjen i
`corridor-to-painter-passage-91a39873174ce62d.mp4`. Brukeren vurderte
resultatet som elendig kvalitet og forkastet det 2026-11-17.

## Konkret hva som var galt
- Partikkel- og oppløsningsfargen leste som gyllen ild/flamme, ikke som
  overflatemateriale (dørmaling/metall) som smuldrer opp under et blitslys.
- Oppløsningsfronten var en uregelmessig, fraktal «brannhull»-form i stedet
  for en kontrollert, perspektivriktig erosjon festet til selve dørflaten.
- Kameramodellen (skala rundt ett fluktpunkt, hentet fra støyete
  SIFT-sporing på en lavteksturert dør) var ikke verifisert mot dørens
  faktiske fire hjørner, så masken og «romkortet» lå ikke nøyaktig på dørens
  kanter i flere bilder (synlig i bilder 118–128).
- «Romkortet» bak døren var ett enkelt senere bilde med slørete kant i
  stedet for faktiske senere bilder tidsvarpet tilbake, og ga et flatt,
  statisk inntrykk uten dørens egen kameradybde.
- Overgangen fra effekt til ekte senere bilder (frame 144) var en hard
  håndover, synlig som en skjøt – nær den «portal/hull som skjuler skjøten»
  arbeidsordren eksplisitt forbyr.
- Hele det 114–150-bilde-lange utsnittet ble rendret og vurdert bare via et
  kontaktark etter kjøring, uten en kritisk ny gjennomgang før det ble vist
  fram.

Se `../render_door_passage_v2.py` og `../README-door-passage.md` for det
nye forsøket.

## v2 (også forkastet, 2026-11-17)

`render_door_passage_v2_BROKEN.py` / `door-passage-v2-BROKEN.mp4`: forsøkte å
bytte ut både dørteksturen og «rommet bak» med to varpede stillbilder, drevet
av samme kameramodell som var tilpasset KUN bilde 101–127. Modellens Zd(t)
krysser null rundt bilde 145, og alt forbi bilde ~130 ekstrapolerte ut av
gyldig område: bildene 132–144 kollapser til flate, feil fargeblokker (se
`run3-v2-broken-sheet.png`). Ikke brukt videre.
