Stemmen fra innsiden — The Voice from Inside

Stemmen fra innsiden grows out of my book, my diary and my experiences with the Norwegian prison and justice systems. It brings personal stories together with documents, art and music to expose what happens when institutions lose sight of the human beings they are supposed to serve.

I want to turn those experiences into collective action. The struggle reaches beyond prison walls. It concerns people in custody, former prisoners, families, children, communities and employees caught inside systems that can harm the people on both sides of the wall.

This project invites developers, artists, musicians, writers, translators, lawyers, researchers and activists to help challenge that system. Your contribution can be a piece of code, a song, a drawing, a translation, a careful review of a document or an idea that makes the project more useful.

The project has three connected foundations:
- Dagbok fra innsiden — Diary from Inside: Personal writing, stories and excerpts from the book, presented alongside relevant documentation. The author’s own words, anger, humour, vulnerability and metaphors must survive editing and translation. Readers should be able to follow the story and understand the material behind it.
- Kunstsamfunnet — The Art Community: A space for art, music, expression and collaboration, open to everyone. You do not need a connection to prison to participate. The development goals include accessible galleries, optional 3D viewing, individual artwork links, artist profiles, submissions and opportunities to support creators. Artists should have a say in pricing and presentation, with clear arrangements for ownership, costs and payment.
- Rettspeilet — The Justice Mirror: A place to examine how power is exercised through decisions, procedures and institutional practice. The goal is to connect accounts of lived experience with documents and careful review, making it easier to see what the evidence establishes and which questions remain unanswered.
Around these foundations, we are developing a wider set of tools and opportunities for participation:

Documentation and practical support. Tools for organising documents, extracting text through OCR, preparing access requests and complaint drafts, and understanding the course of a case. This work needs contributions from developers, people with lived experience and qualified legal professionals.

Music and creative collaboration. Music submissions, listening and discovery, opportunities for producers and musicians to work together, and a voting system where each account can support several different songs once per song.

Art, clothing and support for creators. Ways to present original works, explore artwork on clothing and develop transparent arrangements for sales and artist compensation. These features need practical work on design, production, payment handling and clear agreements.

Languages and accessibility. Norwegian, English, simplified Chinese and Cantonese versions, with attention to the meaning and voice of the original writing. Mobile usability, keyboard access, readable layouts and alternatives to demanding visual features should make participation possible for more people.

Discussion and participation. Space for disagreement, anger and substantive criticism, supported by moderation, human review and tools that protect participants’ private information.

Research and public accountability. Work with public statistics, documented sources and clearly explained methods. Connections with journalists, researchers, organisations and professional contacts can help bring neglected experiences into public discussion.

Book, film and storytelling. Related work includes book translations, video storytelling, subtitles and animation. These are distinct creative projects that can connect with the website while preserving the integrity of the original stories.

The project includes existing writing and website development alongside unfinished features and proposals. Contributors should be able to see what works, what needs testing and what still needs to be built. A feature description is a development goal, not a claim that a service is already operating.

We welcome help with frontend and backend development, security, accessibility, design, testing, translation, documentation and maintenance. Small contributions matter. So do people willing to question an assumption, find an error or improve something another person has started.

The reusable [video-analysis skill](.agents/skills/youtube-video-analysis/SKILL.md) includes executable tools for authorized local videos and normally accessible public video sources. It extracts timestamped frames and silent adjacent clips, records source hashes, and keeps visual observations separate from metadata, captions and inference. Python, ffmpeg and ffprobe are required; the optional public-source extractor is pinned in the skill requirements. Run its `doctor` command first. Network, login and geographic restrictions remain explicit limitations; installing the skill does not grant access to restricted videos.

I am looking for collaborators who want to put their abilities to work in the struggle for dignity, accountability and change. Help build a place where people can tell their stories, show their evidence, create together and challenge the state structures that continue to create victims on both sides of the wall.

## Website and contributor source — 11 November 2026

The public website is [thevoicefrominside.dev](https://thevoicefrominside.dev), hosted on Vercel. Its reading pages, gallery and browser experience run independently of ChatGPT. The former ChatGPT Sites deployment is a historical rollback reference; use the project domain for current links.

This repository is the sanitized contributor distribution. It includes application code, example editorial content and approved public media. The full production source and its approved writing are managed separately; private manuscripts, case files, operational records, service credentials and private uploads are excluded here. A checkout of this repository is therefore not a complete production backup.

The current site includes Norwegian and English reading routes, the curated [gallery](https://thevoicefrominside.dev/galleri-3d/), original-artwork clothing studies and [collaboration](https://thevoicefrominside.dev/collaborate/) entrances. Accounts, identity verification, payments and public submissions remain closed until their independent services and agreements are in place. Prototype screens and backend tests do not establish that a service is open.

You can develop with Node 24 and any editor, without a ChatGPT subscription. Codex and other AI assistants can work with the same files and Git branches when their own account access permits; they are optional development tools. Hosting, domain ownership and any optional AI service have their own account and pricing terms.

The frontend consists of ordinary HTML, CSS, JavaScript and media files. See the [development guide](docs/development.md) for local work and the [independent hosting guide](docs/independent-hosting.md) for the portable frontend output, production-content boundary and release process. A local commit, GitHub push and Vercel publication are separate actions; this document does not certify that a local change has been pushed or deployed.

Everyone is welcome to help with code, design, translation, accessibility, testing, legal expertise, art, writing and music. Use public or synthetic examples. Preserve approved writing, redactions and artwork; display permission and commercial reproduction rights remain separate.

## Run the contributor preview

Requires Node.js 24. No application dependencies or paid services are needed for the local preview.

```sh
npm ci
npm test
npm run check
npm run build
npm run dev
```

Open <http://localhost:8080>. For GitHub Codespaces, use **Code → Codespaces → Create codespace on main**, then run `npm run dev` and open forwarded port 8080. Creating a Codespace is your choice and may consume your GitHub allowance; the repository does not create one automatically.

The reading layouts, navigation, gallery, clothing preview and local tools can be developed with example content. Original artwork and editorial passages remain separately managed. The local server deliberately returns a closed response for `/api/*`; it does not activate accounts, submissions, payments, email or production data access. Worker code and SQL schemas are included for review and isolated testing.

See [development setup](docs/development.md), [contributing](CONTRIBUTING.md), [feature status](docs/feature-status.md) and [source provenance](docs/source-provenance.json). A GitHub commit does not deploy the public website.

No new licence is granted by this export. Code, writing, artwork and commercial reproduction rights must be considered separately; do not assume an open-source or artwork licence that has not been agreed.
## Bli med og bygg / Help build the project

**NO:** Vi søker utviklere, hackere, kunstnere, musikere, oversettere, jurister og testere som vil bruke kunnskapen sin for verdighet, rettssikkerhet og solidaritet med mennesker på begge sider av murene. Stemmen fra innsiden kobler personlige fortellinger, dokumentasjon og kunst med verktøy som kan gjøre makt lettere å etterprøve. Hjelp oss å gjøre arbeidet tilgjengelig, presist og nyttig.

Alle er velkomne. Egne erfaringer fra fengsel kan gi verdifulle perspektiver, men ingen slik tilknytning er nødvendig, og ingen må dele sin historie eller identitet for å bidra. En liten feilrapport, en god oversettelsesmerknad eller én gjennomarbeidet kodeendring er en reell innsats.

Start med [bidragsveiledningen](CONTRIBUTING.md) og [utviklingsoppsettet](docs/development.md). Se [små startoppgaver](https://github.com/sendmailtodss-sudo/Thevoicefrominside/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22) eller [oppgaver der vi trenger hjelp](https://github.com/sendmailtodss-sudo/Thevoicefrominside/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22help%20wanted%22). Skriv i saken hva du vil undersøke, så kan arbeidet samordnes. Bruk gjerne norsk eller engelsk.

Vi trenger særlig hjelp med mobil og tilgjengelighet, ekte leddelt figurbevegelse med avklarte bruksrettigheter, kildekontroll i inmAIte, språklig troskap mellom norsk og engelsk, grafikkytelse og en forståelig kunstner- og modellvelger. Avanserte oppgaver er merket som hjelp ønskes; startoppgavene har mindre omfang.

Dette lageret er en utviklingsutgave med eksempler der originaltekst eller medier ikke er frigitt. Bruk syntetiske saker i utvikling og feilrapporter. Ikke legg private saksdokumenter, manus, kontaktopplysninger eller innloggingsnøkler i GitHub. Prototyper og tester betyr ikke at innsending, kontoer, betaling eller juridiske tjenester er åpnet. Rettigheter til kode, tekst, kunst og kommersiell reproduksjon må leses hver for seg i prosjektets gjeldende vilkår.

**EN:** We are looking for developers, hackers, artists, musicians, translators, legal reviewers and testers who want to put their skills to work for dignity, accountability and solidarity with people on both sides of prison walls. The Voice from Inside connects personal writing, documentation and art with tools that can help people examine how power is used. Help make that work accessible, accurate and useful.

Everyone is welcome. Experience of prison can offer valuable insight, but no connection is required and nobody needs to disclose their history or identity to contribute. A clear bug report, a careful translation note or one focused code change can help.

Read [Contributing](CONTRIBUTING.md) and the [development guide](docs/development.md), then choose a [good first issue](https://github.com/sendmailtodss-sudo/Thevoicefrominside/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22) or a [help wanted task](https://github.com/sendmailtodss-sudo/Thevoicefrominside/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22help%20wanted%22). Comment with the part you want to investigate so contributors can coordinate. Norwegian and English contributions are welcome.

Current needs include mobile accessibility, articulated character animation using properly licensed assets, source validation in inmAIte, faithful Norwegian/English language review, graphics performance, and clearer artist and model selection. Advanced work is marked help wanted; starter tasks have a smaller scope.

This repository is a developer distribution with examples wherever original writing or media has not been released. Use synthetic cases in development and bug reports. Keep private case files, manuscripts, contact details and credentials out of GitHub. Prototype screens and passing tests do not mean submissions, accounts, payments or legal services are open. Read the current terms for code, writing, artwork and commercial reproductions separately.


## Export history — 5 November 2026

The application code, generic interface, navigation and gallery in this contributor export were updated from website source commit `d9de7e2954f4a790fc6f12257f1e6c8d46389096`. The 27 approved gallery images and depth resources are included. Editorial reading pages still use example material; private manuscripts and case documents are excluded. This repository is not a complete content mirror or a deployment receipt. See [source provenance](docs/source-provenance.json).
