import { CATEGORIES, STATE_LABELS } from './study-core.mjs';
import { PROGRESS_STATUS_LABELS, PROGRESS_PROVISIONS } from './study-progress.mjs';

// Translate only explicit interface text and allowlisted generated metadata.
// Never pass source quotations, user notes or case content through this dictionary.
export const english = globalThis.document?.documentElement.lang === 'en';
export const locale = english ? 'en-GB' : 'nb-NO';
const messages = Object.freeze({
  "Et oppdiktet eksempel er satt inn. Trykk «Gå gjennom teksten lokalt».": "A fictional Norwegian example has been inserted. Select “Review the text locally”.",
  "Velg en .txt-fil på høyst 1 MB. PDF/OCR er ikke aktivert.": "Choose a .txt file of no more than 1 MB. PDF/OCR is not enabled here.",
  "Teksten er for lang. Bruk maksimalt 160 000 tegn i én lokal gjennomgang.": "The text is too long. Use no more than 160,000 characters in one local review.",
  "Tekstfilen er lest i denne fanen. Den er ikke lastet opp.": "The text file was read in this tab. It has not been uploaded.",
  "Filen kunne ikke leses.": "The file could not be read.",
  "Skjema, utdrag og arbeidsnotat er tømt. Dette er ikke en garanti for sikker sletting fra enheten.": "The form, excerpts and working note have been cleared. Secure erasure from the device is not guaranteed.",
  "Arbeidsnotat for din gjennomgang": "Working note for your review",
  "Treffene nedenfor er tekstutdrag, ikke konstaterte feil. Les hele dokumentet og relevante vedlegg. Ingen del av dette notatet går inn i teststatistikken.": "The matches below are excerpts, not established errors. Read the whole document and relevant attachments. No part of this note enters the test statistics.",
  "Mulige paragrafhenvisninger i teksten (må kontrolleres manuelt): ": "Possible statutory references in the text (check manually): ",
  "Ingen treff.": "No matches.",
  "Datoer gjenkjent: ": "Dates recognised: ",
  "Ingen ordlyd gjenkjent med de faste søkereglene. Det betyr ikke at plikten er brutt.": "The fixed search rules recognised no wording. This does not establish a breach of duty.",
  "Din foreløpige registrering": "Your preliminary entry",
  "Hva bør undersøkes, og hvorfor?": "What should be examined, and why?",
  "Hva taler imot mistanken, eller mangler?": "What contradicts the suspicion, or is missing?",
  "Lokal gjennomgang er klar. Ingen juridisk sannsynlighet er beregnet.": "Local review is ready. No legal probability has been calculated.",
  "Teksten overskrider 160 000 tegn.": "The text exceeds 160,000 characters.",
  "Lim inn tekst eller velg en tekstfil først.": "Paste text or choose a text file first.",
  "Endringen vises ikke": "Change withheld",
  "Uendret siden forrige rapport": "Unchanged since previous report",
  " siden forrige rapport": " since previous report",
  "SYNTETISK TESTRAPPORT": "SYNTHETIC TEST REPORT",
  "Første testutgave. Ingen tidligere rapport å sammenligne med.": "First test release. No earlier report to compare with.",
  "Personer med vedtak": "People with decisions",
  "Unike deltakere med akseptert vedtak": "Distinct participants with an accepted decision",
  "Vedtak i grunnlaget": "Decisions in the dataset",
  "Duplikater er holdt utenfor": "Duplicates excluded",
  "Maskinanalyserte vedtak": "Machine-analysed decisions",
  "Foreløpig analyse av alle planlagte punkter; ingen advokat kreves først": "Preliminary analysis of all planned points; no prior lawyer assessment required",
  "Maskinelle kontrollflagg": "Machine review flags",
  "Mulig kontrollbehov, ikke konstaterte lovbrudd": "Possible need for checking, not established breaches",
  "Menneskekontrollerte vedtak": "Human-checked decisions",
  "Et separat kontrollsteg, ikke inngangsvilkår for maskinell fremdrift": "A separate check, not a prerequisite for machine-analysis progress",
  "Advokatvurderte vedtak": "Lawyer-assessed decisions",
  "Senere rettslig gjennomgang vises for seg": "Later legal review is shown separately",
  "Lovbestemmelser vurdert": "Legal provisions assessed",
  "Ulike bestemmelser i eksempelgrunnlaget": "Distinct provisions in the example dataset",
  "Kontrollpunkter vurdert": "Checkpoints assessed",
  "En bestemmelse i ett vedtak er ett punkt": "One provision in one decision counts as one point",
  "Tallene er skjult for å beskytte små grupper.": "Counts withheld to protect small groups.",
  "Vurderingsstatus per lovbestemmelse · syntetiske kontrollpunkter": "Assessment status per legal provision · synthetic checkpoints",
  "Vurderte kontrollpunkter": "Checkpoints assessed",
  "Fordelingen er skjult for å beskytte små grupper.": "Breakdown withheld to protect small groups.",
  "Nådd i testen": "Reached in the test",
  "Neste arbeidsmål": "Next working goal",
  "Status skjult": "Status withheld",
  "For lite publiserbart grunnlag til å vise status.": "Insufficient publishable data to display status.",
  "Første testperiode vises. Ingen virkelige personer eller vedtak er registrert.": "The first test period is shown. No real people or decisions have been registered.",
  "Testrapporten kunne ikke vises. Ingen opplysninger er sendt.": "The test report could not be displayed. No information has been sent.",
  "Neste kontrollerte testutgave er vist. Endringene gjelder oppdiktet materiale; ingen ny innsendelse er gjort.": "The next controlled test release is shown. Changes concern fictional material; no new submission has been made.",
  "Denne endringen kan ikke offentliggjøres i testen. Den forrige rapporten beholdes.": "This change cannot be published in the test. The previous report is retained.",
  "DEMO: Tallene er oppdiktet for å teste metoden. De beskriver ikke faktiske forhold ved de navngitte institusjonene.": "DEMO: These figures are fictional and test the method. They do not describe actual conditions at the named institutions.",
  "SYNTETISK TEST": "SYNTHETIC TEST",
  "Tall skjult: for få ulike testsaker. Det eksakte antallet vises ikke.": "Counts withheld: too few distinct test cases. The exact number is not shown.",
  "Fordelingen skjules fordi små celler ellers kan avsløres.": "The breakdown is withheld because small cells could otherwise be inferred.",
  "Foreløpig analysegrunnlag": "Preliminary analysis base",
  "Ingen bekreftet analyserapport ennå": "No confirmed analysis report yet",
  "Ingen bekreftet kontorapport ennå": "No confirmed account report yet",
  "Rapporttjenesten kunne ikke nås eller svaret kunne ikke kontrolleres. Ingen saldo er beregnet.": "The reporting service could not be reached or its response could not be validated. No balance has been calculated.",
  "Tilgjengelig finansiering": "Available funding",
  "SERVERENS BEKREFTEDE KONTORAPPORT": "SERVER'S CONFIRMED ACCOUNT REPORT",
  " · beløp avstemt per ": " · amounts reconciled as of ",
  "Registrert av kontorapportøren: ": "Registered by the account reporter: ",
  "Samlet innbetalt": "Total received",
  "Tilgjengelig beløp": "Available amount",
  "Samlet brukt": "Total disbursed",
  "Samlet tilbakebetalt": "Total refunded",
  "Finansieringsmål: ": "Funding goal: ",
  ". Rapporten er bekreftet av den utpekte kontorapportøren. Dette er ikke en direkte banktilkobling.": ". The designated account reporter confirmed this report. This is not a direct bank connection.",
  "Rapporttjenesten er satt på pause. Siste daterte rapport beholdes; dette er ikke bekreftelse på at innsamling eller bruk av midler er åpen.": "The reporting service is paused. The last dated report is retained; this does not confirm that fundraising or spending is open.",
  "Siste henting mislyktes. Tallene er fra den tidligere daterte rapporten over og er ikke en ny bekreftelse.": "The latest fetch failed. Figures come from the earlier dated report above and are not a new confirmation.",
  "Siste daterte rapport. Ny status må avklares.": "Last dated report. Current status requires clarification.",
  "Bekreftet disponibelt beløp mot avtalens mål. Dette er bare finansieringssporet.": "Confirmed available amount against the agreed goal. This is the funding track only.",
  "Invitasjonsgrunnlag er ikke bekreftet. En virkelig analyserapport mangler, og en senere advokat må gjøre sin egen vurdering.": "Readiness to invite a lawyer is not confirmed. A real analysis report is missing, and a lawyer must later make an independent assessment.",
  "SYNTETISK TOSPORSBAROMETER · INGEN VIRKELIGE ANALYSER ELLER PENGER": "SYNTHETIC TWO-TRACK INDICATOR · NO REAL ANALYSES OR MONEY",
  "Foreløpig analysert testmateriale": "Preliminarily analysed test material",
  "Unike testvedtak. ": "Distinct test decisions. ",
  " oppdiktede deltakere; ingen advokatvurdering kreves for denne telleren.": " fictional participants; this counter requires no prior legal assessment.",
  "Avstemte, tilgjengelige testmidler": "Reconciled available test funds",
  "Tilgjengelig etter bruk og refusjon. Brutto innbetaling alene er ikke nok.": "Available after disbursements and refunds. Gross receipts alone are insufficient.",
  "Venter på oppdatert testavstemming": "Awaiting updated test reconciliation",
  "Testforløpet er avsluttet for nye invitasjoner. Se kontostatus og eventuell refusjonsoppfølging nedenfor.": "The test workflow is closed to new invitations. See account status and any refund follow-up below.",
  "Fase 3 i testen: en separat advokatvurdering er registrert. Oppdrag, budsjett og eventuell bruk følger egne vilkår.": "Test phase 3: a separate legal assessment is registered. Engagement, budget and any spending have their own conditions.",
  "Fase 2 i testen: nok foreløpig analysert materiale og bekreftede disponible testmidler. En advokat kan inviteres til å vurdere grunnlaget.": "Test phase 2: enough preliminarily analysed material and confirmed available test funds. A lawyer can be invited to assess the basis.",
  "Fase 1 i testen: bygg analysegrunnlaget og finansieringen parallelt. Begge vilkårene må være oppfylt før invitasjon til advokatvurdering.": "Test phase 1: build the analysis base and funding in parallel. Both conditions must be met before inviting a legal assessment.",
  "Oppfylte arbeidsmål er ikke bevis på lovbrudd, pålegg om å ta en sak eller fullmakt til å flytte penger.": "Reaching working goals is not proof of a breach, an instruction to accept a case or authority to move money.",
  "Åpen for testregistreringer": "Open for test entries",
  "Innsamlingsperioden er slutt – invitasjonsvilkårene må kontrolleres": "Collection period ended – invitation conditions must be checked",
  "Testadvokaten har vedtatt et budsjett": "The test lawyer has approved a budget",
  "Testutbetaling registrert": "Test disbursement registered",
  "Ubrukte testmidler skal følges opp for refusjon": "Unused test funds require refund follow-up",
  "Refusjonsliste klar – testrefusjoner gjenstår": "Refund list ready – test refunds remain outstanding",
  "Testrefusjoner bekreftet": "Test refunds confirmed",
  "Testperioden er avsluttet uten midler": "Test period ended without funds",
  "Testmidlene er brukt til det avtalte oppdraget": "Test funds spent on the agreed engagement",
  "Ingen kontoutskrift er avstemt": "No bank statement reconciled",
  "Nye hendelser må avstemmes": "New events require reconciliation",
  "Testregnskap og testkontoutskrift samsvarer": "Test ledger and test bank statement match",
  "Avvik må avklares før midler kan brukes": "Discrepancies must be resolved before funds can be used",
  "Oppdiktede testbeløp fra en simulert bankavstemming. Ingen penger er mottatt, utbetalt eller refundert.": "Fictional test amounts from simulated bank reconciliation. No money has been received, disbursed or refunded.",
  "Ingen avstemt testrapport ennå. Registrer en testinnbetaling og prøv advokatens bankavstemming.": "No reconciled test report yet. Register a test receipt and try the lawyer's bank reconciliation.",
  "SYNTETISK RAPPORT · INGEN VIRKELIGE PENGER": "SYNTHETIC REPORT · NO REAL MONEY",
  "Sist avstemt: ": "Last reconciled: ",
  "Bekreftede testinnbetalinger": "Confirmed test receipts",
  "Samlet før utbetaling og refusjon": "Total before disbursements and refunds",
  "Ubrukte midler i testregnskapet": "Unused funds in the test ledger",
  "Ingen faktisk kontosaldo": "Not an actual account balance",
  "Bekreftet testutbetaling": "Confirmed test disbursement",
  "Til avtalt rettslig hjelp i eksemplet": "For agreed legal assistance in the example",
  "Bekreftet testrefusjon": "Confirmed test refund",
  "En liste alene telles ikke": "A list alone does not count",
  "Rapporten viser siste avstemte utgave. ": "The report shows the last reconciled version. ",
  ". Tallene oppdateres først etter en ny avstemming.": ". Figures update only after a new reconciliation.",
  ". Dette er en lokal demonstrasjon av advokatens kontroll, ikke bankbekreftelse eller innlogging.": ". This is a local demonstration of the lawyer's checks, not bank confirmation or a login.",
  "Demonstrasjonen er klar. Ingen konto eller betalingstjeneste er aktiv.": "The demonstration is ready. No account or payment service is active.",
  "Før utbetaling må advokaten vedta oppdrag og budsjett etter den senere faglige vurderingen og oppdatert avstemming.": "Before disbursement, the lawyer must approve the engagement and budget following the later professional assessment and current reconciliation.",
  "Før bruk av midler kreves den separate advokatvurderingen i fase 3. Foreløpig analyse og innsamling kan gjøres før dette.": "Spending requires the separate legal assessment in phase 3. Preliminary analysis and fundraising can take place before it.",
  "Analysegrunnlaget er endret. Advokaten må vurdere den nye rapporten før et budsjett for bruk av midler vedtas.": "The analysis base has changed. The lawyer must assess the new report before approving a spending budget.",
  "Avstem den siste testkontoutskriften først. Uavklarte eller nye kontohendelser sperrer bruk av midlene.": "Reconcile the latest test bank statement first. Unresolved or new account events block spending.",
  "Kontoutskriften avviker fra testregnskapet. Avklar avviket og gjør en ny avstemming først.": "The bank statement differs from the test ledger. Resolve the discrepancy and reconcile again first.",
  "Testperioden er stengt for nye innbetalinger.": "The test period is closed to new receipts.",
  "Testkampanjen er avsluttet for nye vurderinger. Start på nytt for et annet scenario.": "The test campaign is closed to new assessments. Restart for a different scenario.",
  "Testmålet er ikke nådd med oppdatert, avstemt disponibelt beløp. Brutto innbetaling er ikke nok.": "The test goal has not been met with current, reconciled available funds. Gross receipts are insufficient.",
  "Det må foreligge nok foreløpig maskinanalyserte, unike testvedtak før advokatens rettslige vurdering inviteres.": "There must be enough distinct preliminarily machine-analysed test decisions before inviting the lawyer's legal assessment.",
  "Analyserapporten må registreres av analyseoperatøren, som er en separat rolle fra kontoansvarlig advokat.": "The analysis report must be registered by the analysis operator, a separate role from the account lawyer.",
  "Det er ikke nok ubrukte testmidler til dette budsjettet.": "There are insufficient unused test funds for this budget.",
  "Dette testforløpet kan ikke avbrytes i den nåværende tilstanden.": "This test workflow cannot be cancelled in its current state.",
  "Testperioden er ikke lenger åpen for innbetaling. Start demonstrasjonen på nytt for et annet scenario.": "The test period is no longer open to receipts. Restart the demonstration for a different scenario.",
  "Foreløpig analysegrunnlag og finansiering må først være oppfylt; senere bruk krever advokatens selvstendige vurdering.": "The preliminary analysis and funding conditions must be met first; later spending requires the lawyer's independent assessment.",
  "Registrer en bekreftet testinnbetaling først.": "Register a confirmed test receipt first.",
  "Det er ikke grunnlag for en refusjonsliste i denne testtilstanden.": "There is no basis for a refund list in this test state.",
  "Dette steget er ikke tilgjengelig i den nåværende testen. Kontroller analysegrunnlaget, avstemmingen, fristene og vilkårene for den valgte fasen.": "This step is unavailable in the current test. Check the analysis base, reconciliation, deadlines and conditions for the selected phase.",
  "Foreløpig analyse av 100 oppdiktede vedtak er registrert i testen. Ingen dokumenter er analysert, og ingen advokatvurdering er gjort med denne knappen.": "Preliminary analysis of 100 fictional decisions is registered in the test. This button has analysed no documents and performed no legal assessment.",
  "5 000 testkroner er registrert som en advokatbekreftet innbetaling. Avstem kontoutskriften før samlerapporten oppdateres. Ingen penger er mottatt.": "NOK 5,000 in test money is registered as a lawyer-confirmed receipt. Reconcile the statement before the aggregate report updates. No money has been received.",
  "Testregnskapet er avstemt mot en oppdiktet kontoutskrift. En ny samlet testrapport er klar.": "The test ledger is reconciled against a fictional bank statement. A new aggregate test report is ready.",
  "Et avvik på én testkrone er registrert. Samlerapporten er ikke oppdatert; avviket må avklares.": "A discrepancy of one test krone is registered. The aggregate report has not updated; the discrepancy must be resolved.",
  "Advokatens faglige vurdering er simulert. Den er ikke en bestilling, bankoverføring eller rettslig konklusjon.": "The lawyer's professional assessment is simulated. It is not an instruction, bank transfer or legal conclusion.",
  "Et avgrenset testoppdrag og budsjett på 5 000 kr er vedtatt av testadvokaten. Ingen penger er flyttet.": "The test lawyer has approved a defined test engagement and budget of NOK 5,000. No money has moved.",
  "En testutbetaling til avtalt rettslig hjelp er registrert. Ingen penger er overført. Ny bankavstemming kreves før rapporten oppdateres.": "A test disbursement for agreed legal assistance is registered. No money has been transferred. New bank reconciliation is required before the report updates.",
  "Testtiden er flyttet forbi innsamlings-, vurderings- og utbetalingsfristen. Eventuelle ubrukte midler må følges opp av advokaten; en refusjonsliste flytter ingen penger.": "Test time has moved beyond the collection, assessment and disbursement deadlines. The lawyer must follow up any unused funds; a refund list moves no money.",
  "Testgrunnlaget er trukket tilbake. En eventuell refusjonsliste gjelder ubrukte midler; ingen bankoverføring er utført.": "The basis for proceeding in the test has been withdrawn. Any refund list concerns unused funds; no bank transfer has been made.",
  "Testrefusjoner er registrert som bankbekreftet. Ingen virkelige penger er refundert. Avstem kontoutskriften for å oppdatere samlerapporten.": "Test refunds are registered as bank-confirmed. No real money has been refunded. Reconcile the statement to update the aggregate report.",
  "Første pilot begrenset til personer over 18 år, med kontrollert deltakervilkår og håndtering av tredjepersoners opplysninger": "First pilot limited to adults aged 18 or over, with checked eligibility and handling of third-party information",
  "Reell frivillighet uten press, fordeler i soningen eller negative følger ved å avslå eller trekke seg": "Genuinely voluntary participation without pressure, advantages during imprisonment or adverse consequences for declining or withdrawing",
  "Navngitt behandlingsansvarlig og tydelig kontaktpunkt": "Named data controller and a clear contact point",
  "Vurdert rettslig grunnlag, også for helse- og straffesaksopplysninger": "Assessed legal basis, including for health and criminal-offence data",
  "Personvernkonsekvensvurdering og uavhengig sikkerhetsgjennomgang": "Data protection impact assessment and independent security review",
  "Databehandleravtaler, behandlingsregioner og underleverandører": "Processor agreements, processing regions and subprocessors",
  "Versjonerte rettskilder og validert analysemetode": "Versioned legal sources and a validated analysis method",
  "Metodekontroll og rutine for faglig oppfølging; advokatvurdering av en mulig sak kommer etter innsamling og foreløpig analyse": "Method checks and professional follow-up; assessment of a possible case comes after collection and preliminary analysis",
  "Separat kontaktforvalter, tilgangsstyring og nøkkelforvaltning": "Separate contact custodian, access control and key management",
  "Uttak, oppbevaringsfrister, innsyn og sletting": "Withdrawal, retention periods, access and erasure",
  "Kontroll av duplikater, falske bidrag og skadelige opplastinger": "Controls for duplicates, false submissions and harmful uploads",
  "Avtale om kontohold, bidragsvilkår og bankfullmakt der bare kontoansvarlig advokat disponerer midlene; et senere rettslig oppdrag avtales særskilt": "Account-administration agreement, contribution terms and bank authority held only by the account lawyer; any later legal engagement agreed separately",
  "Testet avstemming, advokatstyrt refusjon, kostnadsfordeling og rapportering": "Tested reconciliation, lawyer-managed refunds, allocation of costs and reporting",
  "Prosjekteierens uttrykkelige publiseringsgodkjenning": "Project owner's explicit publication approval",
  "Skjult": "Withheld",
  "Bestemmelse": "Provision",
  "Rapportversjon ": "Report version ",
  " av ": " of ",
  "ja": "yes",
  "nei": "no"
});
export const t = (norwegian, englishText = messages[norwegian]) => english ? (englishText ?? norwegian) : norwegian;
const categoryEnglish = [
  ['Legal basis and version of the rule', 'Which rule and version apply to this decision? Check the quoted wording against the primary source in force on the decision date.'],
  ['Reasons and individual assessment', 'Are the facts, rule and outcome connected? Examine both factors supporting the decision and counterevidence.'],
  ['Notice and opportunity to respond', 'When and how could the party comment? Check any lawful exceptions before concluding that there is an omission.'],
  ['Investigation of the case', 'What information supports the decision? Is there conflicting information, and which documents are missing?'],
  ['Interference, alternatives and proportionality', 'Does the applicable rule require a proportionality assessment? Have specific alternatives, relevant considerations and the duration of the interference been assessed?'],
  ['Notification and documented receipt', 'Distinguish the decision date, dispatch, notification and actual receipt. Find contemporaneous evidence; the tool does not calculate the appeal deadline.'],
  ['Appeal route and deadline', 'Which appeal procedure and deadline apply to this authority and decision? Check special rules and whether the document is legally an individual administrative decision.'],
  ['Impartiality and allocation of roles', 'Are there specific circumstances requiring examination of impartiality or authority? A shared workplace or the same signature does not establish disqualification.']
];
const labels = new Map([
  ...CATEGORIES.flatMap((row, index) => [[row.title, categoryEnglish[index][0]], [row.question, categoryEnglish[index][1]]]),
  ...Object.values(STATE_LABELS).map((value,index)=>[value,['Needs closer review','No issue observed in the review','Cannot be assessed from the material','Procedural issue assessed by a legal professional'][index]]),
  ...Object.values(PROGRESS_STATUS_LABELS).map((value,index)=>[value,['Machine-flagged · possible need for checking','Machine-assessed · no flag','Documentation missing','Priority legal review','Possible issue assessed by a lawyer','No issue established in the review'][index]]),
  ...PROGRESS_PROVISIONS.map((row,index)=>[row.label,`Public Administration Act § ${[17,24,27][index]} · demo catalogue`]),
  ['100 personer med aksepterte vedtak','100 people with accepted decisions'],
  ['200 unike vedtak mottatt','200 distinct decisions received'],
  ['100 vedtak maskinelt analysert etter kontrollplanen','100 decisions machine-analysed under the review plan'],
  ['100 vedtak menneskekontrollert etter kontrollplanen','100 decisions human-checked under the review plan'],
  ['Bergen fengsel','Bergen Prison'], ['Bjørgvin fengsel','Bjørgvin Prison'], ['Region vest','Western Region'],
  ['juridisk funksjon','legal function'], ['saksbehandling','case administration'], ['ledelse','management'],
  ['For lite grunnlag til publisering.','Insufficient data for publication.']
]);
// Only call this for the module-owned category/status/institution labels above.
export const uiLabel = value => english ? (labels.get(value) ?? t(value)) : value;
export function translateWorkNote(note) {
  if (!english) return note;
  const result = structuredClone(note);
  result.interfaceLanguage = 'en'; result.sourceTextTranslated = false;
  result.caution = 'May contain personal and case information. Do not publish. No legal conclusion or probability calculation has been made.';
  for (const category of result.review.categories) { category.title = uiLabel(category.title); category.question = uiLabel(category.question); }
  // matches, reviewerReason, counterevidence, dates and statutory quotations stay exact.
  return result;
}
export function translateProgressReport(report) {
  if (!english) return report;
  const result = structuredClone(report); result.interfaceLanguage = 'en';
  for (const row of [...result.byStatus, ...result.provisions, ...result.milestones]) { row.label = uiLabel(row.label); for (const status of row.byStatus || []) status.label = uiLabel(status.label); }
  result.note = 'Fictional test data only; no AI model has run. A machine flag means a possible need for checking, not a breach or probability of a breach. Human and legal review are later, separate steps; neither is required for the preliminary machine phase. A lawyer-assessed possible issue is not a judgment. The demo catalogue establishes no current version of a legal rule. No people or decisions have actually been collected.';
  result.privacyNote = 'At least ten distinct people and checks of cross-patterns and historical changes. This is a conservative demonstration, not proof of anonymity. Public updates require central approval in production.';
  result.unitsNote = 'One person may have several decisions and one decision several checkpoints. Checkpoint statuses show the latest assessment stage. Machine-flagged points retain their machine result after later review and may overlap human and legal assessments. Counts of people and decisions across statuses may overlap.';
  result.reviewDefinition = 'Machine-analysed requires completed structured analysis with a version and date for every planned checkpoint. Raw word matches do not count. Human-checked and lawyer-assessed require separate completed review plans. Counts establish neither breaches nor the correctness of assessments.';
  return result;
}
export function translateCohortReport(report) {
  if (!english) return report;
  const result = structuredClone(report); result.interfaceLanguage = 'en';
  result.description = 'Fixed annual cohorts, no ranking of people. Shows review status, not probability of a breach. Self-selection prevents generalisation to all decisions.';
  for (const cohort of result.cohorts) {
    cohort.institution = uiLabel(cohort.institution); cohort.role = uiLabel(cohort.role);
    if (cohort.reason) cohort.reason = uiLabel(cohort.reason);
    for (const category of cohort.categories || []) category.title = uiLabel(category.title);
  }
  return result;
}
