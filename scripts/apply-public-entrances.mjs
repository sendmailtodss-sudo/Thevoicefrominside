/** Add the approved public entrances without replacing the page or its journey. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const stylesheet = '<link rel="stylesheet" href="/home-entrances.css">';
export const content = {
  no: {
    eyebrow: 'To retninger · Felles skapere', title: 'To innganger. Flere stemmer.',
    intro: 'Kunst og fellesskap. Fortellinger og forandring. Velg hvor du vil begynne.',
    creativeLabel: 'Kunst og fellesskap', creativeTitle: 'Kunstfellesskapet og forum',
    creativeText: 'Et sted for kreativitet, nye muligheter og støtte på veien videre. Vi ønsker å samle mennesker, erfaringer og organisasjoner som vil bidra.',
    status: 'Forumet og fadderordningen er foreløpig ideer under utvikling.',
    creativeButton: 'Utforsk fellesskapet', creativeHref: '/kunstfellesskap/',
    collaboration: 'Samarbeid og støtte', collaborationHref: '/collaborate/',
    editorialLabel: 'Fortellinger og aktivisme', editorialTitle: 'Stemmen fra innsiden',
    editorialText: 'Fortellinger innenfra, kritiske spørsmål og arbeid for rettssikkerhet. Her løfter vi frem perspektiver vi mener må bli hørt.',
    editorialButton: 'Les dagboken', editorialHref: '/dagbok/',
    book: 'Boken', bookHref: '/boken/', legal: 'Juridisk motvekt', legalHref: '/juridisk-motvekt/',
    distinction: 'Disse to retningene har de samme skaperne, men ulike formål. Noen organisasjoner er avhengige av samarbeid med systemet for å hjelpe mennesker. Derfor gjør vi det tydelig at støtte til eller samarbeid med kunstfellesskapet og forumet ikke innebærer støtte til aktivismen eller alle synspunktene i den andre retningen.',
    about: 'Om oss · Hvorfor egne støtterom?',
    rooms: 'Vi ønsker egne rom fordi innsatte og tidligere innsatte kan ha behov for å dele erfaringer om soning og veien videre, mens pårørende trenger plass til egne spørsmål, belastninger og støtte. Ingen skal måtte dele sin historie i det andre rommet.',
    reach: 'Målet er å gjøre muligheter og støtte lettere tilgjengelig, også utenfor de største byene.',
    organisation: 'Denne inndelingen beskriver innholdet på nettstedet; en eventuell formell organisasjonsstruktur er ikke fastlagt her.',
  },
  en: {
    eyebrow: 'Two directions · Shared creators', title: 'Two entrances. More voices.',
    intro: 'Art and community. Stories and change. Choose where you would like to begin.',
    creativeLabel: 'Art and community', creativeTitle: 'Art community and forum',
    creativeText: 'A place for creativity, new opportunities and support on the way forward. We hope to bring together people, experience and organisations who want to contribute.',
    status: 'The forum and mentorship idea are still in development.',
    creativeButton: 'Explore the community', creativeHref: '/en/creative-community/',
    collaboration: 'Collaboration and support', collaborationHref: '/en/collaborate/',
    editorialLabel: 'Stories and activism', editorialTitle: 'The Voice from Inside',
    editorialText: 'Stories from inside, critical questions and work for legal rights. Here we share perspectives we believe need to be heard.',
    editorialButton: 'Read the diary', editorialHref: '/en/dagbok/',
    book: 'The book', bookHref: '/en/boken/', legal: 'Legal counterweight', legalHref: '/en/juridisk-motvekt/',
    distinction: 'These two directions share creators but have different purposes. Some organisations depend on working with the system to help people. We therefore want to make clear that supporting or working with the art community and forum does not imply support for activism or every view in the other direction.',
    about: 'About us · Why separate support rooms?',
    rooms: 'We envision separate rooms because people in or formerly in prison may want to share experiences of prison and moving forward, while relatives need space for their own questions, burdens and support. Nobody should have to share their story in the other room.',
    reach: 'The aim is to make opportunities and support easier to reach, including outside the largest cities.',
    organisation: "This division describes the website's content; a formal organisational structure has not been established here.",
  },
};

export function entranceSection(language) {
  const c = content[language];
  if (!c) throw new Error('Expected no or en language');
  return `<!-- public-entrances-start -->
<section class="home-entrances" aria-labelledby="home-entrances-title">
  <header class="home-entrances-intro"><p class="home-entrances-eyebrow">${c.eyebrow}</p><h2 id="home-entrances-title">${c.title}</h2><p>${c.intro}</p></header>
  <div class="home-entrances-grid">
    <section class="home-entrance home-entrance-creative" aria-labelledby="home-creative-title"><p class="home-entrance-label">01 / ${c.creativeLabel}</p><h3 id="home-creative-title">${c.creativeTitle}</h3><p>${c.creativeText}</p><p class="home-entrance-status">${c.status}</p><a class="home-entrance-button" href="${c.creativeHref}">${c.creativeButton} <span aria-hidden="true">↗</span></a><p class="home-entrance-links"><a href="${c.collaborationHref}">${c.collaboration}</a></p></section>
    <section class="home-entrance home-entrance-editorial" aria-labelledby="home-editorial-title"><p class="home-entrance-label">02 / ${c.editorialLabel}</p><h3 id="home-editorial-title">${c.editorialTitle}</h3><p>${c.editorialText}</p><a class="home-entrance-button" href="${c.editorialHref}">${c.editorialButton} <span aria-hidden="true">↗</span></a><p class="home-entrance-links"><a href="${c.bookHref}">${c.book}</a><span aria-hidden="true"> · </span><a href="${c.legalHref}">${c.legal}</a></p></section>
  </div>
  <p class="home-entrances-distinction">${c.distinction}</p>
  <details class="home-entrances-about"><summary>${c.about}</summary><div><p>${c.rooms}</p><p>${c.reach}</p><p>${c.organisation}</p></div></details>
</section>
<!-- public-entrances-end -->
`;
}

export function applyPublicEntrances(source, language) {
  const section = entranceSection(language);
  if (source.includes('<!-- public-entrances-start -->')) {
    if (!source.includes(section) || source.split(stylesheet).length !== 2) throw new Error('An existing entrance needs review before replacement');
    return source;
  }
  const anchor = '<!-- minds-landing-start -->';
  if (source.split(anchor).length !== 2 || source.split('</head>').length < 2) throw new Error('Expected one journey anchor and a complete head');
  if (source.includes(stylesheet)) throw new Error('Unexpected existing entrance stylesheet');
  return source.replace('</head>', stylesheet + '</head>').replace(anchor, section + anchor);
}

function main(args) {
  const readArg = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
  const inputArgument = readArg('--input-root');
  const outputArgument = readArg('--output-root');
  if (!inputArgument || !outputArgument) throw new Error('Usage: node scripts/apply-public-entrances.mjs --input-root PUBLIC_DIR --output-root SEPARATE_EMPTY_DIR');
  const input = fs.realpathSync(inputArgument);
  const output = path.resolve(outputArgument);
  fs.mkdirSync(output, { recursive: true });
  const resolvedOutput = fs.realpathSync(output);
  if (resolvedOutput === input || resolvedOutput.startsWith(input + path.sep) || input.startsWith(resolvedOutput + path.sep)) throw new Error('Output must be separate from input');
  if (fs.readdirSync(output).length) throw new Error('Output must be empty');
  const plan = [['index.html', 'no'], ['en/index.html', 'en']].map(([relative, language]) => {
    const file = path.join(input, relative);
    if (!fs.realpathSync(file).startsWith(input + path.sep)) throw new Error('Input symlink escapes its root');
    return { relative, html: applyPublicEntrances(fs.readFileSync(file, 'utf8'), language) };
  });
  for (const item of plan) {
    const destination = path.join(output, item.relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, item.html, { flag: 'wx' });
  }
  const asset = fileURLToPath(new URL('../public/home-entrances.css', import.meta.url));
  fs.copyFileSync(asset, path.join(output, 'home-entrances.css'), fs.constants.COPYFILE_EXCL);
  console.log(JSON.stringify({ pages: plan.map(item => item.relative), asset: 'home-entrances.css', sourceUnchanged: true }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2));
