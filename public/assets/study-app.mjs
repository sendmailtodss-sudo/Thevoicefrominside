import { t, uiLabel, translateWorkNote, translateProgressReport, translateCohortReport, locale } from './study-i18n.mjs';
import { CATEGORIES, STATE_LABELS, REVIEW_STATES, MAX_TEXT, reviewLocally, makePrivateWorkNote, aggregateSyntheticCohorts, syntheticCases, productionReadiness } from './study-core.mjs';
import { DemoLawyerAccountFund, sixCalendarMonthsAfter } from './study-funding.mjs';
import { ProgressReleaseRegister, syntheticProgressRecords, PROGRESS_STATUS_LABELS } from './study-progress.mjs';

const byId = id => document.getElementById(id);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
let localReview = null, readRevision = 0, currentAggregate = null;
const source = byId('study-source'), reviewBox = byId('study-review');
function localStatus(message, error = false) { const node = byId('study-status'); node.textContent = message; node.classList.toggle('error', error); }
function download(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
  const link = element('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function invalidateReview() {
  localReview = null;
  reviewBox.replaceChildren(); reviewBox.hidden = true; byId('study-export-wrap').hidden = true;
}
function clearLocal() {
  readRevision++; source.value = ''; byId('study-file').value = ''; byId('study-complete').checked = false;
  invalidateReview();
}
byId('study-local-form').addEventListener('submit', event => event.preventDefault());
source.addEventListener('input', () => { readRevision++; invalidateReview(); });
byId('study-authority').addEventListener('change', invalidateReview);
byId('study-complete').addEventListener('change', invalidateReview);
byId('study-example').addEventListener('click', () => {
  clearLocal();
  source.value = 'SYNTETISK EKSEMPEL — ingen virkelig person eller sak.\nDato: 2026-10-01.\nSøknaden om en aktivitet avslås. Vi viser til sikkerhet og interne regler. Vi har lagt vekt på rapporten av 25.09.2026. Parten opplyser at rapporten inneholder en feil.\nDet kan klages på avgjørelsen. Dokumentene som omtales, følger ikke med i denne testteksten.\nTesten fastslår ikke om avgjørelsen er et enkeltvedtak eller om en lovregel er brutt.';
  localStatus(t('Et oppdiktet eksempel er satt inn. Trykk «Gå gjennom teksten lokalt».'));
});
byId('study-file').addEventListener('change', async event => {
  const version = ++readRevision, file = event.target.files?.[0]; invalidateReview(); if (!file) return;
  if (!/\.txt$/i.test(file.name) || file.size > 1024 * 1024) { event.target.value = ''; localStatus(t('Velg en .txt-fil på høyst 1 MB. PDF/OCR er ikke aktivert.'), true); return; }
  try {
    const text = await file.text(); if (version !== readRevision) return;
    if (text.length > MAX_TEXT) { localStatus(t('Teksten er for lang. Bruk maksimalt 160 000 tegn i én lokal gjennomgang.'), true); return; }
    source.value = text; localStatus(t('Tekstfilen er lest i denne fanen. Den er ikke lastet opp.'));
  } catch { if (version === readRevision) localStatus(t('Filen kunne ikke leses.'), true); }
});
byId('study-clear').addEventListener('click', () => { clearLocal(); localStatus(t('Skjema, utdrag og arbeidsnotat er tømt. Dette er ikke en garanti for sikker sletting fra enheten.')); });
window.addEventListener('pagehide', clearLocal);
byId('study-analyze').addEventListener('click', () => {
  try {
    localReview = reviewLocally(source.value, { authority: byId('study-authority').value, completeMaterial: byId('study-complete').checked });
    reviewBox.replaceChildren(); reviewBox.hidden = false; byId('study-export-wrap').hidden = false;
    const intro = element('div', undefined, 'review-intro');
    intro.append(element('h3', t('Arbeidsnotat for din gjennomgang')), element('p', t('Treffene nedenfor er tekstutdrag, ikke konstaterte feil. Les hele dokumentet og relevante vedlegg. Ingen del av dette notatet går inn i teststatistikken.')), element('p', t('Mulige paragrafhenvisninger i teksten (må kontrolleres manuelt): ') + (localReview.sections.join(', ') || t('Ingen treff.'))), element('p', t('Datoer gjenkjent: ') + (localReview.dates.join(', ') || t('Ingen treff.'))));
    reviewBox.append(intro);
    for (const category of localReview.categories) {
      const card = element('section', undefined, 'review-card');
      card.append(element('h3', uiLabel(category.title)), element('p', uiLabel(category.question)));
      if (category.matches.length) for (const quote of category.matches) card.append(element('blockquote', quote));
      else card.append(element('p', t('Ingen ordlyd gjenkjent med de faste søkereglene. Det betyr ikke at plikten er brutt.'), 'small'));
      const stateLabel = element('label', t('Din foreløpige registrering')); stateLabel.htmlFor = 'review-state-' + category.id;
      const select = element('select'); select.id = stateLabel.htmlFor;
      for (const state of REVIEW_STATES.filter(s => s !== 'lawyer_confirmed_procedural_issue')) { const option = element('option', uiLabel(STATE_LABELS[state])); option.value = state; select.append(option); }
      select.value = 'not_assessable'; select.addEventListener('change', () => { category.reviewState = select.value; }); stateLabel.append(select);
      const grid = element('div', undefined, 'review-edit');
      for (const [field, title] of [['reviewerReason', t('Hva bør undersøkes, og hvorfor?')], ['counterevidence', t('Hva taler imot mistanken, eller mangler?')]]) {
        const label = element('label', title), area = element('textarea'); area.id = `review-${field}-${category.id}`; area.rows = 3; area.maxLength = 3000; label.htmlFor = area.id;
        area.addEventListener('input', () => { category[field] = area.value; }); label.append(area); grid.append(label);
      }
      card.append(stateLabel, grid); reviewBox.append(card);
    }
    localStatus(t('Lokal gjennomgang er klar. Ingen juridisk sannsynlighet er beregnet.'));
  } catch (error) { localStatus(error.message === 'TEXT_TOO_LONG' ? t('Teksten overskrider 160 000 tegn.') : t('Lim inn tekst eller velg en tekstfil først.'), true); }
});
byId('study-export').addEventListener('click', () => { if (localReview) download('rettsspeil-privat-arbeidsnotat.json', translateWorkNote(makePrivateWorkNote(localReview))); });

const PROGRESS_DATES = ['2026-10-01T12:00:00.000Z', '2026-10-15T12:00:00.000Z', '2026-11-01T12:00:00.000Z'];
const progressNumber = value => Number.isSafeInteger(value) ? new Intl.NumberFormat(locale).format(value) : t('Skjult');
const progressDate = value => new Date(value).toLocaleDateString(locale, { timeZone: 'Europe/Oslo', day: 'numeric', month: 'long', year: 'numeric' });
let progressRegister, progressStage = 0, currentProgress = null;
function progressDelta(value) {
  if (!Number.isSafeInteger(value)) return t('Endringen vises ikke');
  return value === 0 ? t('Uendret siden forrige rapport') : (value > 0 ? '+' : '') + progressNumber(value) + t(' siden forrige rapport');
}
function renderProgress(snapshot) {
  const meta = byId('progress-report-meta'); meta.replaceChildren();
  meta.append(element('span', t('SYNTETISK TESTRAPPORT'), 'pill'), element('p', t(`Rapportutgave ${progressStage} av ${PROGRESS_DATES.length} · ${progressDate(snapshot.publishedAt)}`, `Report release ${progressStage} of ${PROGRESS_DATES.length} · ${progressDate(snapshot.publishedAt)}`), 'progress-report-date'));
  meta.append(element('p', snapshot.previousPublishedAt ? t(`Endring målt fra rapporten ${progressDate(snapshot.previousPublishedAt)} til ${progressDate(snapshot.publishedAt)}.`, `Change measured from the report of ${progressDate(snapshot.previousPublishedAt)} to ${progressDate(snapshot.publishedAt)}.`) : t('Første testutgave. Ingen tidligere rapport å sammenligne med.'), 'progress-report-period'));
  const totals = byId('progress-totals'); totals.replaceChildren();
  const specs = [
    ['participants', t('Personer med vedtak'), t('Unike deltakere med akseptert vedtak')],
    ['decisions', t('Vedtak i grunnlaget'), t('Duplikater er holdt utenfor')],
    ['machineAnalyzedDecisions', t('Maskinanalyserte vedtak'), t('Foreløpig analyse av alle planlagte punkter; ingen advokat kreves først')],
    ['machineFlaggedPoints', t('Maskinelle kontrollflagg'), t('Mulig kontrollbehov, ikke konstaterte lovbrudd')],
    ['humanReviewedDecisions', t('Menneskekontrollerte vedtak'), t('Et separat kontrollsteg, ikke inngangsvilkår for maskinell fremdrift')],
    ['lawyerReviewedDecisions', t('Advokatvurderte vedtak'), t('Senere rettslig gjennomgang vises for seg')],
    ['provisionsReviewed', t('Lovbestemmelser vurdert'), t('Ulike bestemmelser i eksempelgrunnlaget')],
    ['assessmentPoints', t('Kontrollpunkter vurdert'), t('En bestemmelse i ett vedtak er ett punkt')]
  ];
  for (const [key, title, detail] of specs) {
    const card = element('article', undefined, 'progress-metric'); card.dataset.metric = key;
    card.append(element('h3', title), element('strong', progressNumber(snapshot.totals[key]), 'progress-value'));
    if (snapshot.sincePrevious && Object.hasOwn(snapshot.sincePrevious, key)) card.append(element('span', progressDelta(snapshot.sincePrevious[key]), 'progress-change'));
    card.append(element('p', detail)); totals.append(card);
  }
  const statuses = byId('progress-review-status'); statuses.replaceChildren();
  for (const row of snapshot.byStatus) {
    const card = element('article', undefined, 'progress-status-card'); card.dataset.status = row.id;
    card.append(element('h4', uiLabel(row.label)));
    if (row.suppressed) card.append(element('p', t('Tallene er skjult for å beskytte små grupper.'), 'progress-suppressed'));
    else card.append(element('strong', progressNumber(row.assessmentCount), 'progress-status-value'), element('p', t(`kontrollpunkter fordelt på ${progressNumber(row.decisionCount)} vedtak og ${progressNumber(row.participantCount)} personer.`, `checkpoints across ${progressNumber(row.decisionCount)} decisions and ${progressNumber(row.participantCount)} people.`)));
    statuses.append(card);
  }
  const wrapper = byId('progress-provisions'); wrapper.replaceChildren();
  const table = element('table', undefined, 'progress-table');
  table.append(element('caption', t('Vurderingsstatus per lovbestemmelse · syntetiske kontrollpunkter')));
  const head = element('thead'), heading = element('tr');
  for (const title of [t('Bestemmelse'), t('Vurderte kontrollpunkter'), ...Object.values(PROGRESS_STATUS_LABELS)]) { const th = element('th', uiLabel(title)); th.scope = 'col'; heading.append(th); }
  head.append(heading); table.append(head);
  const body = element('tbody');
  for (const row of snapshot.provisions) {
    const tr = element('tr'), title = element('th', uiLabel(row.label)); title.scope = 'row'; tr.append(title);
    if (row.suppressed) {
      const cell = element('td', t('Fordelingen er skjult for å beskytte små grupper.'), 'progress-suppressed'); cell.colSpan = 1 + Object.keys(PROGRESS_STATUS_LABELS).length; tr.append(cell);
    } else {
      tr.append(element('td', progressNumber(row.assessmentCount)));
      for (const id of Object.keys(PROGRESS_STATUS_LABELS)) {
        const status = row.byStatus?.find(value => value.id === id);
        tr.append(element('td', status && !status.suppressed ? progressNumber(status.assessmentCount) : t('Skjult'), status?.suppressed ? 'progress-suppressed' : undefined));
      }
    }
    body.append(tr);
  }
  table.append(body); wrapper.append(table);
  const milestones = byId('progress-milestones'); milestones.replaceChildren();
  for (const row of snapshot.milestones) {
    const visible = !row.suppressed && Number.isSafeInteger(row.value);
    const card = element('article', undefined, 'progress-milestone' + (visible && row.complete ? ' complete' : ''));
    card.append(element('span', visible ? (row.complete ? t('Nådd i testen') : t('Neste arbeidsmål')) : t('Status skjult'), 'pill'), element('h4', uiLabel(row.label)));
    card.append(element('p', visible ? t(`${progressNumber(row.value)} av ${progressNumber(row.target)} i testgrunnlaget.`, `${progressNumber(row.value)} of ${progressNumber(row.target)} in the test dataset.`) : t('For lite publiserbart grunnlag til å vise status.')));
    milestones.append(card);
  }
  byId('progress-next').disabled = progressStage >= PROGRESS_DATES.length;
  byId('progress-export').disabled = !currentProgress;
}
function showProgressStage(stage) {
  const snapshot = progressRegister.publish({ releaseId: `demo-progress-period-${stage}`, publishedAt: PROGRESS_DATES[stage - 1], records: syntheticProgressRecords(stage) });
  currentProgress = snapshot; progressStage = stage; renderProgress(snapshot);
}
function resetProgress() {
  progressRegister = new ProgressReleaseRegister(); progressStage = 0; currentProgress = null;
  try { showProgressStage(1); byId('progress-message').textContent = t('Første testperiode vises. Ingen virkelige personer eller vedtak er registrert.'); }
  catch { byId('progress-message').textContent = t('Testrapporten kunne ikke vises. Ingen opplysninger er sendt.'); byId('progress-export').disabled = true; }
}
byId('progress-next').addEventListener('click', () => {
  if (progressStage >= PROGRESS_DATES.length) return;
  try { showProgressStage(progressStage + 1); byId('progress-message').textContent = t('Neste kontrollerte testutgave er vist. Endringene gjelder oppdiktet materiale; ingen ny innsendelse er gjort.'); }
  catch { byId('progress-message').textContent = t('Denne endringen kan ikke offentliggjøres i testen. Den forrige rapporten beholdes.'); }
});
byId('progress-reset').addEventListener('click', resetProgress);
byId('progress-export').addEventListener('click', () => { if (currentProgress) download('rettsspeil-fremdrift-testrapport.json', translateProgressReport(currentProgress)); });
resetProgress();

const colors = { needs_review: '#a77a2c', no_issue_observed: '#2c7673', not_assessable: '#bac5c5', lawyer_confirmed_procedural_issue: '#72495a' };
function drawCohorts(records) {
  currentAggregate = aggregateSyntheticCohorts(records);
  const container = byId('study-cohorts'); container.replaceChildren();
  container.append(element('p', t('DEMO: Tallene er oppdiktet for å teste metoden. De beskriver ikke faktiske forhold ved de navngitte institusjonene.'), 'notice'));
  for (const group of currentAggregate.cohorts) {
    const box = element('article', undefined, 'cohort');
    box.append(element('span', t('SYNTETISK TEST'), 'pill'), element('h3', uiLabel(group.institution)), element('p', t(`${group.role} · år ${group.year}`, `${uiLabel(group.role)} · year ${group.year}`), 'cohort-meta'));
    if (group.suppressed) box.append(element('p', t('Tall skjult: for få ulike testsaker. Det eksakte antallet vises ikke.')));
    else {
      box.append(element('p', t(`${group.distinctCases} forskjellige testsaker. Kontrollerte fordelinger — ingen beregnet sannsynlighet for lovbrudd.`, `${group.distinctCases} distinct test cases. Checked distributions — no calculated probability of a breach of law.`), 'small'));
      for (const row of group.categories) {
        const entry = element('section', undefined, 'category-row'); entry.append(element('h4', uiLabel(row.title)));
        if (row.suppressed) entry.append(element('p', t('Fordelingen skjules fordi små celler ellers kan avsløres.'), 'small'));
        else {
          const bars = element('div', undefined, 'bars'); bars.setAttribute('aria-hidden', 'true'); const legend = element('div', undefined, 'legend');
          for (const state of REVIEW_STATES) {
            const count = row.counts[state], bar = element('span', undefined, 'bar ' + state); bar.style.width = `${count / row.denominator * 100}%`; bars.append(bar);
            const label = element('span', `${uiLabel(STATE_LABELS[state])}: ${count}`); label.style.setProperty('--swatch', colors[state]); legend.append(label);
          }
          entry.append(bars, legend);
        }
        box.append(entry);
      }
    }
    container.append(box);
  }
}
byId('study-demo-normal').addEventListener('click', () => drawCohorts([...syntheticCases(60), ...syntheticCases(60, 'Bjørgvin fengsel')]));
byId('study-demo-small').addEventListener('click', () => drawCohorts(syntheticCases(7)));
byId('study-aggregate-export').addEventListener('click', () => { if (currentAggregate) download('rettsspeil-syntetisk-teststatistikk.json', translateCohortReport(currentAggregate)); });
drawCohorts([...syntheticCases(60), ...syntheticCases(60, 'Bjørgvin fengsel')]);

let fund, fundNow, fundDeadline, receiptCounter = 0, statementCounter = 0, demoFundReport = null;
const ANALYSIS_OPERATOR_ID = 'demo-analysis-operator', LEGAL_REVIEWER_ID = 'demo-case-lawyer', LAWYER_ID = 'demo-user-lawyer', TERMS_VERSION = 'demo-terms-v1', TEST_GOAL_MINOR = 500000;
const amount = minor => new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 2 }).format(minor / 100);
const reportTime = value => new Date(value).toLocaleString(locale, { timeZone: 'Europe/Oslo', dateStyle: 'medium', timeStyle: 'short' }) + ' (Oslo)';
// This read-only service receives no text, files, contributor details or local drafts.
let liveFundReport = null, liveFundPaused = false, liveFundFailure = false, fundReportSequence = 0;
function readinessCard(title, value, target, detail, format = progressNumber) {
  const card = element('article', undefined, 'readiness-card');
  card.append(element('h4', title));
  if (Number.isSafeInteger(value) && Number.isSafeInteger(target) && target > 0) {
    const meter = element('progress'); meter.max = target; meter.value = Math.min(value, target); meter.setAttribute('aria-label', title + ': ' + format(value) + t(' av ') + format(target));
    card.append(element('strong', format(value) + t(' av ') + format(target), 'readiness-value'), meter);
  } else card.append(element('strong', detail, 'readiness-unknown'));
  if (Number.isSafeInteger(value)) card.append(element('p', detail));
  return card;
}
function renderLiveFund() {
  const report = liveFundReport, box = byId('study-fund-real-report'); box.replaceChildren();
  const readiness = byId('study-readiness-live'); readiness.replaceChildren();
  readiness.append(readinessCard(t('Foreløpig analysegrunnlag'), null, null, t('Ingen bekreftet analyserapport ennå')));
  if (!report) {
    box.append(element('p', t('Ingen bekreftet kontorapport ennå'), 'fund-empty'));
    if (liveFundFailure) box.append(element('p', t('Rapporttjenesten kunne ikke nås eller svaret kunne ikke kontrolleres. Ingen saldo er beregnet.'), 'small'));
    readiness.append(readinessCard(t('Tilgjengelig finansiering'), null, null, t('Ingen bekreftet kontorapport ennå')));
  } else {
    box.append(element('span', t('SERVERENS BEKREFTEDE KONTORAPPORT'), 'pill'), element('p', t('Rapportversjon ') + report.version + t(' · beløp avstemt per ') + reportTime(report.asOf), 'fund-report-date'), element('p', t('Registrert av kontorapportøren: ') + reportTime(report.reportedAt), 'small'));
    const grid = element('div', undefined, 'metric-grid fund-metrics');
    for (const [title, value] of [[t('Samlet innbetalt'), report.totalReceivedMinor], [t('Tilgjengelig beløp'), report.availableMinor], [t('Samlet brukt'), report.totalDisbursedMinor], [t('Samlet tilbakebetalt'), report.totalRefundedMinor]]) {
      const card = element('div', undefined, 'metric'); card.append(element('span', title), element('strong', amount(value))); grid.append(card);
    }
    box.append(grid, element('p', t('Finansieringsmål: ') + amount(report.goalMinor) + t('. Rapporten er bekreftet av den utpekte kontorapportøren. Dette er ikke en direkte banktilkobling.'), 'small'));
    if (liveFundPaused) box.append(element('p', t('Rapporttjenesten er satt på pause. Siste daterte rapport beholdes; dette er ikke bekreftelse på at innsamling eller bruk av midler er åpen.'), 'notice'));
    if (liveFundFailure) box.append(element('p', t('Siste henting mislyktes. Tallene er fra den tidligere daterte rapporten over og er ikke en ny bekreftelse.'), 'notice'));
    readiness.append(readinessCard(t('Tilgjengelig finansiering'), report.availableMinor, report.goalMinor, liveFundPaused || liveFundFailure ? t('Siste daterte rapport. Ny status må avklares.') : t('Bekreftet disponibelt beløp mot avtalens mål. Dette er bare finansieringssporet.'), amount));
  }
  const note = element('p', t('Invitasjonsgrunnlag er ikke bekreftet. En virkelig analyserapport mangler, og en senere advokat må gjøre sin egen vurdering.'), 'readiness-conclusion');
  readiness.append(note);
}
async function refreshLiveFund() {
  const sequence = ++fundReportSequence, button = byId('fund-real-refresh'); button.disabled = true;
  try {
    const response = await fetch('/api/legal-fund/report', { method: 'GET', credentials: 'omit', cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('REPORT_UNAVAILABLE');
    const data = await response.json(); if (sequence !== fundReportSequence) return;
    if (!data || typeof data.enabled !== 'boolean' || typeof data.paused !== 'boolean' || !['not_available', 'available', 'paused'].includes(data.status)) throw new Error('INVALID_REPORT');
    if ((data.status === 'not_available') !== (data.report === null) || (!data.enabled && data.report !== null) || (data.status === 'paused' && !data.paused)) throw new Error('INVALID_REPORT');
    if (data.report === null) { liveFundReport = null; liveFundPaused = data.paused; }
    else {
      const report = data.report;
      const numbers = ['totalReceivedMinor','totalDisbursedMinor','totalRefundedMinor','availableMinor','goalMinor','version'];
      if (!numbers.every(key => Number.isSafeInteger(report[key]) && report[key] >= 0) || report.goalMinor <= 0 || report.version <= 0 || report.source !== 'lawyer-confirmed-account-report' || !Number.isFinite(Date.parse(report.asOf)) || !Number.isFinite(Date.parse(report.reportedAt)) || report.availableMinor !== report.totalReceivedMinor - report.totalDisbursedMinor - report.totalRefundedMinor) throw new Error('INVALID_REPORT');
      liveFundReport = Object.fromEntries([...numbers, 'asOf', 'reportedAt', 'source'].map(key => [key, report[key]])); liveFundPaused = data.paused;
    }
    liveFundFailure = false;
  } catch { if (sequence !== fundReportSequence) return; liveFundFailure = true; }
  finally { if (sequence === fundReportSequence) { button.disabled = false; renderLiveFund(); } }
}
byId('fund-real-refresh').addEventListener('click', refreshLiveFund);
renderLiveFund(); refreshLiveFund();
function renderDemoReadiness(summary) {
  const box = byId('study-fund-readiness'); box.replaceChildren();
  box.append(element('span', t('SYNTETISK TOSPORSBAROMETER · INGEN VIRKELIGE ANALYSER ELLER PENGER'), 'pill'));
  const grid = element('div', undefined, 'readiness-grid'), ready = summary.readiness;
  grid.append(readinessCard(t('Foreløpig analysert testmateriale'), summary.analyzedDistinctDecisions, summary.thresholdCases, t('Unike testvedtak. ') + summary.distinctParticipants + t(' oppdiktede deltakere; ingen advokatvurdering kreves for denne telleren.')));
  grid.append(readinessCard(t('Avstemte, tilgjengelige testmidler'), ready.confirmedAvailableMinor, summary.goalMinor, ready.currentReconciliation ? t('Tilgjengelig etter bruk og refusjon. Brutto innbetaling alene er ikke nok.') : t('Venter på oppdatert testavstemming'), amount));
  box.append(grid);
  const phase = !ready.campaignEligible ? t('Testforløpet er avsluttet for nye invitasjoner. Se kontostatus og eventuell refusjonsoppfølging nedenfor.') : summary.humanReviewRecorded ? t('Fase 3 i testen: en separat advokatvurdering er registrert. Oppdrag, budsjett og eventuell bruk følger egne vilkår.') : ready.readyToInviteLawyer ? t('Fase 2 i testen: nok foreløpig analysert materiale og bekreftede disponible testmidler. En advokat kan inviteres til å vurdere grunnlaget.') : t('Fase 1 i testen: bygg analysegrunnlaget og finansieringen parallelt. Begge vilkårene må være oppfylt før invitasjon til advokatvurdering.');
  box.append(element('p', phase, 'readiness-conclusion'), element('p', t('Oppfylte arbeidsmål er ikke bevis på lovbrudd, pålegg om å ta en sak eller fullmakt til å flytte penger.'), 'small'));
  byId('fund-review').disabled = !ready.readyToInviteLawyer;
}
const states = { 'collecting-demo': t('Åpen for testregistreringer'), 'review-due-demo': t('Innsamlingsperioden er slutt – invitasjonsvilkårene må kontrolleres'), 'authorized-demo': t('Testadvokaten har vedtatt et budsjett'), 'paid-demo': t('Testutbetaling registrert'), 'disbursed-demo': t('Testutbetaling registrert'), 'refund-required-demo': t('Ubrukte testmidler skal følges opp for refusjon'), 'refund-instructions-demo': t('Refusjonsliste klar – testrefusjoner gjenstår'), 'refunded-demo': t('Testrefusjoner bekreftet'), 'closed-empty-demo': t('Testperioden er avsluttet uten midler'), 'spent-demo': t('Testmidlene er brukt til det avtalte oppdraget') };
const reconciliationLabels = { unreported: t('Ingen kontoutskrift er avstemt'), stale: t('Nye hendelser må avstemmes'), matched: t('Testregnskap og testkontoutskrift samsvarer'), mismatch: t('Avvik må avklares før midler kan brukes') };
function makeDemoFundReport(summary) {
  // Explicit allowlist: neither contributor IDs nor private bank references belong in a public report.
  return {
    type: 'rettsspeil-advokatkonto-samlerapport', synthetic: true, realAccountEstablished: false,
    currency: 'NOK', reportAt: summary.lastReconciledAt,
    receivedMinor: summary.receivedDemoMinor, heldMinor: summary.heldDemoMinor,
    disbursedMinor: summary.disbursedDemoMinor, refundedMinor: summary.refundedDemoMinor,
    note: t('Oppdiktede testbeløp fra en simulert bankavstemming. Ingen penger er mottatt, utbetalt eller refundert.')
  };
}
function renderDemoFundReport(summary) {
  const root = byId('study-fund-report'); root.replaceChildren();
  byId('fund-report').disabled = !demoFundReport;
  if (!demoFundReport) {
    root.append(element('p', t('Ingen avstemt testrapport ennå. Registrer en testinnbetaling og prøv advokatens bankavstemming.'), 'notice'));
    return;
  }
  root.append(element('span', t('SYNTETISK RAPPORT · INGEN VIRKELIGE PENGER'), 'pill'), element('p', t('Sist avstemt: ') + reportTime(demoFundReport.reportAt), 'fund-report-date'));
  const grid = element('div', undefined, 'metric-grid fund-metrics');
  for (const [title, value, detail] of [
    [t('Bekreftede testinnbetalinger'), demoFundReport.receivedMinor, t('Samlet før utbetaling og refusjon')],
    [t('Ubrukte midler i testregnskapet'), demoFundReport.heldMinor, t('Ingen faktisk kontosaldo')],
    [t('Bekreftet testutbetaling'), demoFundReport.disbursedMinor, t('Til avtalt rettslig hjelp i eksemplet')],
    [t('Bekreftet testrefusjon'), demoFundReport.refundedMinor, t('En liste alene telles ikke')]
  ]) {
    const box = element('div', undefined, 'metric'); box.append(element('span', title), element('strong', amount(value)), element('span', detail)); grid.append(box);
  }
  root.append(grid);
  if (summary.reconciliationStatus !== 'matched') root.append(element('p', t('Rapporten viser siste avstemte utgave. ') + reconciliationLabels[summary.reconciliationStatus] + t('. Tallene oppdateres først etter en ny avstemming.'), 'notice'));
}
function renderFund() {
  const summary = fund.summary(), root = byId('study-fund-summary'); root.replaceChildren();
  root.append(element('p', states[summary.state] || summary.state, 'fund-state'));
  root.append(element('p', t(`Privat testregistrering: mottatt ${amount(summary.receivedDemoMinor)}, ubrukt ${amount(summary.heldDemoMinor)}, utbetalt ${amount(summary.disbursedDemoMinor)} og refundert ${amount(summary.refundedDemoMinor)}.`, `Private test ledger: received ${amount(summary.receivedDemoMinor)}, unused ${amount(summary.heldDemoMinor)}, disbursed ${amount(summary.disbursedDemoMinor)} and refunded ${amount(summary.refundedDemoMinor)}.`), 'small'));
  root.append(element('p', reconciliationLabels[summary.reconciliationStatus] + t('. Dette er en lokal demonstrasjon av advokatens kontroll, ikke bankbekreftelse eller innlogging.'), 'small'));
  root.append(element('p', t(`Testfrist for innsamling: ${reportTime(summary.deadline)}. Vurderingsfrist: ${reportTime(summary.reviewDeadline)}. Siste testfrist for registrert utbetaling: ${reportTime(summary.executionDeadline)}. Foreløpig analyserte testvedtak: ${summary.analyzedDistinctDecisions}/${summary.thresholdCases}. Senere advokatvurdering registrert: ${summary.humanReviewRecorded ? t('ja') : t('nei')}. Testbudsjett: ${amount(summary.authorizedBudgetMinor)}. Tilbakeføringsbehov i testen: ${amount(summary.refundDueDemoMinor)}.`, `Test collection deadline: ${reportTime(summary.deadline)}. Assessment deadline: ${reportTime(summary.reviewDeadline)}. Final test deadline for registered disbursement: ${reportTime(summary.executionDeadline)}. Preliminarily analysed test decisions: ${summary.analyzedDistinctDecisions}/${summary.thresholdCases}. Later legal assessment registered: ${summary.humanReviewRecorded ? t('ja') : t('nei')}. Test budget: ${amount(summary.authorizedBudgetMinor)}. Refunds due in the test: ${amount(summary.refundDueDemoMinor)}.`), 'small'));
  renderDemoReadiness(summary); renderDemoFundReport(summary);
}
function resetFund() {
  fundNow = new Date(); fundDeadline = new Date(sixCalendarMonthsAfter(fundNow.toISOString()));
  fund = new DemoLawyerAccountFund({ deadline: fundDeadline.toISOString(), lawyerId: LAWYER_ID, legalReviewerId: LEGAL_REVIEWER_ID, analysisOperatorId: ANALYSIS_OPERATOR_ID, thresholdCases: 100, goalMinor: TEST_GOAL_MINOR, reviewGraceDays: 7, termsVersion: TERMS_VERSION });
  receiptCounter = 0; statementCounter = 0; demoFundReport = null;
  renderFund(); byId('fund-status').textContent = t('Demonstrasjonen er klar. Ingen konto eller betalingstjeneste er aktiv.'); byId('fund-status').classList.remove('error');
}
const errorLabels = {
  CURRENT_LAWYER_AUTHORIZATION_REQUIRED: t('Før utbetaling må advokaten vedta oppdrag og budsjett etter den senere faglige vurderingen og oppdatert avstemming.'),
  CURRENT_LAWYER_REVIEW_REQUIRED: t('Før bruk av midler kreves den separate advokatvurderingen i fase 3. Foreløpig analyse og innsamling kan gjøres før dette.'),
  CURRENT_ANALYSIS_REVIEW_REQUIRED: t('Analysegrunnlaget er endret. Advokaten må vurdere den nye rapporten før et budsjett for bruk av midler vedtas.'),
  CURRENT_RECONCILIATION_REQUIRED: t('Avstem den siste testkontoutskriften først. Uavklarte eller nye kontohendelser sperrer bruk av midlene.'),
  RECONCILIATION_MISMATCH: t('Kontoutskriften avviker fra testregnskapet. Avklar avviket og gjør en ny avstemming først.'),
  COLLECTION_CLOSED: t('Testperioden er stengt for nye innbetalinger.'),
  CAMPAIGN_NOT_REVIEWABLE: t('Testkampanjen er avsluttet for nye vurderinger. Start på nytt for et annet scenario.'),
  FUNDING_GOAL_NOT_MET: t('Testmålet er ikke nådd med oppdatert, avstemt disponibelt beløp. Brutto innbetaling er ikke nok.'),
  ANALYSIS_THRESHOLD_NOT_MET: t('Det må foreligge nok foreløpig maskinanalyserte, unike testvedtak før advokatens rettslige vurdering inviteres.'),
  ANALYSIS_OPERATOR_REQUIRED: t('Analyserapporten må registreres av analyseoperatøren, som er en separat rolle fra kontoansvarlig advokat.'),
  INSUFFICIENT_AVAILABLE_BUDGET: t('Det er ikke nok ubrukte testmidler til dette budsjettet.'),
  CANCELLATION_NOT_AVAILABLE: t('Dette testforløpet kan ikke avbrytes i den nåværende tilstanden.'),
  CAMPAIGN_NOT_COLLECTING: t('Testperioden er ikke lenger åpen for innbetaling. Start demonstrasjonen på nytt for et annet scenario.'),
  CURRENT_HUMAN_REVIEW_REQUIRED: t('Før bruk av midler kreves den separate advokatvurderingen i fase 3. Foreløpig analyse og innsamling kan gjøres før dette.'),
  THRESHOLD_AND_LEGAL_REVIEW_REQUIRED: t('Foreløpig analysegrunnlag og finansiering må først være oppfylt; senere bruk krever advokatens selvstendige vurdering.'),
  NO_PAID_FUNDS: t('Registrer en bekreftet testinnbetaling først.'),
  LAWYER_AUTHORIZATION_REQUIRED: t('Før utbetaling må advokaten vedta oppdrag og budsjett etter den senere faglige vurderingen og oppdatert avstemming.'),
  CURRENT_AUTHORIZATION_REQUIRED: t('Før utbetaling må advokaten vedta oppdrag og budsjett etter den senere faglige vurderingen og oppdatert avstemming.'),
  RECONCILIATION_REQUIRED: t('Avstem den siste testkontoutskriften først. Uavklarte eller nye kontohendelser sperrer bruk av midlene.'),
  ACCOUNT_RECONCILIATION_REQUIRED: t('Avstem den siste testkontoutskriften først. Uavklarte eller nye kontohendelser sperrer bruk av midlene.'),
  REFUNDS_NOT_DUE: t('Det er ikke grunnlag for en refusjonsliste i denne testtilstanden.'),
  REFUND_NOT_DUE: t('Det er ikke grunnlag for en refusjonsliste i denne testtilstanden.')
};
function fundAction(action, success) {
  try { action(); renderFund(); byId('fund-status').textContent = success; byId('fund-status').classList.remove('error'); }
  catch (error) { renderFund(); byId('fund-status').textContent = errorLabels[error.message] || t('Dette steget er ikke tilgjengelig i den nåværende testen. Kontroller analysegrunnlaget, avstemmingen, fristene og vilkårene for den valgte fasen.'); byId('fund-status').classList.add('error'); }
}
function reconcileFund(mismatch = false) {
  const index = ++statementCounter;
  fund.reconcileAccount({ statementId: `demo-statement-${index}`, balanceMinor: fund.summary().heldDemoMinor + (mismatch ? 100 : 0), actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true });
  if (fund.summary().reconciliationStatus === 'matched') demoFundReport = makeDemoFundReport(fund.summary());
}
byId('fund-analysis').addEventListener('click', () => fundAction(() => fund.recordPreliminaryAnalysis({ reportId: 'demo-preliminary-analysis-100', actorId: ANALYSIS_OPERATOR_ID, analyzedDistinctDecisions: 100, distinctParticipants: 50, flaggedDistinctDecisions: 40, asOf: fundNow.toISOString(), now: fundNow.toISOString(), synthetic: true }), t('Foreløpig analyse av 100 oppdiktede vedtak er registrert i testen. Ingen dokumenter er analysert, og ingen advokatvurdering er gjort med denne knappen.')));
byId('fund-pay').addEventListener('click', () => fundAction(() => { const index = ++receiptCounter; fund.recordBankReceipt({ id: `demo-receipt-${index}`, eventId: `demo-receipt-event-${index}`, amountMinor: TEST_GOAL_MINOR, currency: 'NOK', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); }, t('5 000 testkroner er registrert som en advokatbekreftet innbetaling. Avstem kontoutskriften før samlerapporten oppdateres. Ingen penger er mottatt.')));
byId('fund-reconcile').addEventListener('click', () => fundAction(() => reconcileFund(), t('Testregnskapet er avstemt mot en oppdiktet kontoutskrift. En ny samlet testrapport er klar.')));
byId('fund-mismatch').addEventListener('click', () => fundAction(() => reconcileFund(true), t('Et avvik på én testkrone er registrert. Samlerapporten er ikke oppdatert; avviket må avklares.')));
byId('fund-review').addEventListener('click', () => fundAction(() => fund.recordLawyerReview({ reviewId: 'demo-lawyer-review', actorId: LEGAL_REVIEWER_ID, recommendation: 'seek-legal-assistance', synthetic: true, now: fundNow.toISOString() }), t('Advokatens faglige vurdering er simulert. Den er ikke en bestilling, bankoverføring eller rettslig konklusjon.')));
byId('fund-lawyer').addEventListener('click', () => fundAction(() => fund.authorizeLegalWork({ authorizationId: 'demo-lawyer-budget', reviewId: 'demo-lawyer-review', budgetMinor: TEST_GOAL_MINOR, termsVersion: TERMS_VERSION, mandateConfirmed: true, actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }), t('Et avgrenset testoppdrag og budsjett på 5 000 kr er vedtatt av testadvokaten. Ingen penger er flyttet.')));
byId('fund-payout').addEventListener('click', () => fundAction(() => fund.recordBankDisbursement({ id: 'demo-legal-work-disbursement', eventId: 'demo-disbursement-event', authorizationId: 'demo-lawyer-budget', amountMinor: TEST_GOAL_MINOR, recipientType: 'approved-law-firm', actorId: LAWYER_ID, synthetic: true, now: fundNow.toISOString() }), t('En testutbetaling til avtalt rettslig hjelp er registrert. Ingen penger er overført. Ny bankavstemming kreves før rapporten oppdateres.')));
byId('fund-expire').addEventListener('click', () => fundAction(() => { fundNow = new Date(Date.parse(fund.summary().executionDeadline) + 1000); fund.advance(fundNow.toISOString()); if (['refund-required-demo', 'refund-instructions-demo', 'refunded-demo'].includes(fund.summary().state)) fund.prepareRefundInstructions({ batchId: 'demo-expiry-refund-list', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); }, t('Testtiden er flyttet forbi innsamlings-, vurderings- og utbetalingsfristen. Eventuelle ubrukte midler må følges opp av advokaten; en refusjonsliste flytter ingen penger.')));
byId('fund-cancel').addEventListener('click', () => fundAction(() => { fund.cancelAndRefund({ reason: 'legal-review-withdrawn', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); if (['refund-required-demo', 'refund-instructions-demo'].includes(fund.summary().state)) fund.prepareRefundInstructions({ batchId: 'demo-cancel-refund-list', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); }, t('Testgrunnlaget er trukket tilbake. En eventuell refusjonsliste gjelder ubrukte midler; ingen bankoverføring er utført.')));
byId('fund-refund').addEventListener('click', () => fundAction(() => { const refunds = fund.prepareRefundInstructions({ batchId: 'demo-refund-list-retry', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); for (const item of refunds) fund.recordBankRefund({ refundId: item.refundId, eventId: `demo-confirm-${item.refundId.slice(5)}`, amountMinor: item.remainingMinor, result: 'confirmed', actorId: LAWYER_ID, now: fundNow.toISOString(), synthetic: true }); }, t('Testrefusjoner er registrert som bankbekreftet. Ingen virkelige penger er refundert. Avstem kontoutskriften for å oppdatere samlerapporten.')));
byId('fund-report').addEventListener('click', () => { if (demoFundReport) download('rettsspeil-advokatkonto-samlerapport-demo.json', demoFundReport); });
byId('fund-reset').addEventListener('click', resetFund); resetFund();

const gateLabels = { adult_only_pilot_eligibility: t('Første pilot begrenset til personer over 18 år, med kontrollert deltakervilkår og håndtering av tredjepersoners opplysninger'), voluntary_participation_without_penalty: t('Reell frivillighet uten press, fordeler i soningen eller negative følger ved å avslå eller trekke seg'), accountable_controller: t('Navngitt behandlingsansvarlig og tydelig kontaktpunkt'), lawful_basis_articles_6_9_10: t('Vurdert rettslig grunnlag, også for helse- og straffesaksopplysninger'), dpia_and_security_review: t('Personvernkonsekvensvurdering og uavhengig sikkerhetsgjennomgang'), processor_contracts_and_regions: t('Databehandleravtaler, behandlingsregioner og underleverandører'), legal_method_validation: t('Versjonerte rettskilder og validert analysemetode'), independent_human_review: t('Metodekontroll og rutine for faglig oppfølging; advokatvurdering av en mulig sak kommer etter innsamling og foreløpig analyse'), contact_custodian_and_key_management: t('Separat kontaktforvalter, tilgangsstyring og nøkkelforvaltning'), withdrawal_and_retention_process: t('Uttak, oppbevaringsfrister, innsyn og sletting'), abuse_and_duplicate_case_controls: t('Kontroll av duplikater, falske bidrag og skadelige opplastinger'), lawyer_account_mandate_and_bank_authority: t('Avtale om kontohold, bidragsvilkår og bankfullmakt der bare kontoansvarlig advokat disponerer midlene; et senere rettslig oppdrag avtales særskilt'), refund_and_reconciliation_operations: t('Testet avstemming, advokatstyrt refusjon, kostnadsfordeling og rapportering'), user_publication_approval: t('Prosjekteierens uttrykkelige publiseringsgodkjenning') };
for (const key of productionReadiness().missing) byId('study-gates').append(element('li', gateLabels[key]));
