/* Rettsspeil: local, deterministic review and synthetic-only research demonstrator. */
export const VERSION = 'rettsspeil-local-0.1.0';
export const MAX_TEXT = 160000;
export const MIN_COHORT = 10;
export const AUTHORITY_TYPES = Object.freeze(['kriminalomsorg', 'nav', 'barnevern', 'statsforvalteren', 'tilsynsradet', 'sivilombudet']);
export const REVIEW_STATES = Object.freeze(['needs_review', 'no_issue_observed', 'not_assessable', 'lawyer_confirmed_procedural_issue']);
export const STATE_LABELS = Object.freeze({ needs_review: 'Trenger nærmere gjennomgang', no_issue_observed: 'Ingen merknad i gjennomgangen', not_assessable: 'Kan ikke vurderes med materialet', lawyer_confirmed_procedural_issue: 'Saksbehandlingsfeil vurdert av jurist' });
export const CATEGORIES = Object.freeze([
  { id: 'legal_basis', title: 'Hjemmel og regelversjon', pattern: /§|hjemmel|rettslig grunnlag|lov om|forskrift/i, question: 'Hvilken regel og regelversjon gjelder for denne avgjørelsen? Kontroller den siterte ordlyden mot primærkilden på vedtaksdatoen.' },
  { id: 'reasons', title: 'Begrunnelse og individuelt skjønn', pattern: /begrunn|vurder|hensyn|legger.*vekt|etter.*vurdering/i, question: 'Er faktum, regelen og resultatet knyttet sammen? Undersøk både momenter som støtter avgjørelsen og det som taler imot.' },
  { id: 'participation', title: 'Varsel og anledning til å svare', pattern: /uttale|forhåndsvarsel|kontradiksjon|merknad|hørt/i, question: 'Når og hvordan fikk parten anledning til å uttale seg? Kontroller eventuelle lovlige unntak før en mangel konkluderes.' },
  { id: 'investigation', title: 'Opplysning av saken', pattern: /dokument|vedlegg|rapport|opplysning|utred|vitne/i, question: 'Hvilke opplysninger bygger avgjørelsen på? Finnes motstridende opplysninger, og hvilke dokumenter mangler?' },
  { id: 'proportionality', title: 'Inngrep, alternativer og forholdsmessighet', pattern: /forholdsmess|alternativ|mindre inngrip|nødvendig|sikkerhet|risiko/i, question: 'Krever den aktuelle regelen en forholdsmessighetsvurdering? Er konkrete alternativer, hensyn og inngrepets varighet vurdert?' },
  { id: 'notification', title: 'Underretning og dokumentert mottak', pattern: /mottatt|forkynt|overlevert|underrett|sendt|dato/i, question: 'Skill dato for vedtak, utsending, underretning og faktisk mottak. Finn samtidige holdepunkter; verktøyet beregner ikke klagefristen.' },
  { id: 'appeal', title: 'Klagevei og frist', pattern: /klage|frist|overprøv|ombud/i, question: 'Hvilken klageordning og frist gjelder for dette organet og denne avgjørelsen? Kontroller særregler og om dokumentet faktisk er et enkeltvedtak.' },
  { id: 'impartiality', title: 'Habilitet og rollefordeling', pattern: /habil|inhabil|saksbehandler|signert|signatur|på vegne av/i, question: 'Er det konkrete omstendigheter som bør undersøkes om habilitet eller myndighet? Felles arbeidssted eller samme signatur beviser ikke inhabilitet.' }
]);

const categoryIds = new Set(CATEGORIES.map(c => c.id));
const recordKeys = new Set(['caseId', 'synthetic', 'institution', 'role', 'year', 'reviewStates', 'provenance', 'hasCounterevidence', 'materialComplete']);
const institutions = new Set(['Bergen fengsel', 'Bjørgvin fengsel', 'Region vest', 'KDI', 'NAV', 'Barnevern', 'Statsforvalteren', 'Tilsynsrådet', 'Sivilombudet']);
const roles = new Set(['juridisk funksjon', 'saksbehandling', 'ledelse']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function requireCondition(condition, code) { if (!condition) throw new Error(code); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}

/** Only the caller's current tab retains source text; no I/O or model API is called. */
export function reviewLocally(source, { authority = 'kriminalomsorg', completeMaterial = false, now = new Date() } = {}) {
  requireCondition(typeof source === 'string' && source.trim().length > 0, 'TEXT_REQUIRED');
  requireCondition(source.length <= MAX_TEXT, 'TEXT_TOO_LONG');
  requireCondition(AUTHORITY_TYPES.includes(authority), 'UNKNOWN_AUTHORITY');
  const text = source.replace(/\r\n?/g, '\n').trim();
  const passages = text.split(/\n+|(?<=[.!?])\s+(?=[A-ZÆØÅ])/u).map(s => s.trim()).filter(Boolean);
  // Preserve hyphenated regulation sections and explicit lists; do not silently turn § 3-11 into § 3.
  const sections = [...new Set(text.match(/§{1,2}\s*\d+[a-zæøå]?(?:\s*[-–]\s*\d+[a-zæøå]?)?(?:\s*(?:,|og)\s*\d+[a-zæøå]?(?:\s*[-–]\s*\d+[a-zæøå]?)?)*(?:\s*(?:første|andre|annet|tredje|fjerde|femte)\s+ledd)?/giu) || [])].slice(0, 40);
  const dates = [...new Set(text.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/gu) || [])].slice(0, 40);
  return {
    version: VERSION, createdAt: new Date(now).toISOString(), method: 'fixed-local-search-rules', authority,
    completeMaterial: Boolean(completeMaterial), legalConclusion: null, probabilityOfIllegality: null,
    sections, dates,
    categories: CATEGORIES.map(c => ({ id: c.id, title: c.title, question: c.question,
      matches: passages.filter(p => c.pattern.test(p)).slice(0, 3).map(p => p.slice(0, 1200)),
      reviewState: 'not_assessable', reviewerReason: '', counterevidence: '' }))
  };
}

/** Export is explicitly a PRIVATE local work note, not an anonymised contribution. */
export function makePrivateWorkNote(review) {
  requireCondition(review?.version === VERSION, 'INVALID_REVIEW');
  return { kind: 'private-work-note', containsPotentialPersonalData: true, sent: false,
    caution: 'Kan inneholde person- og saksopplysninger. Ikke publiser. Ingen juridisk konklusjon eller sannsynlighetsberegning er utført.',
    review: structuredClone(review) };
}

/** A strict schema stops raw excerpts, signature names and identifiers entering aggregates. */
export function validateSyntheticRecord(input) {
  requireCondition(input && typeof input === 'object' && !Array.isArray(input), 'INVALID_RECORD');
  requireCondition(Object.keys(input).every(k => recordKeys.has(k)), 'UNEXPECTED_OR_SENSITIVE_FIELD');
  requireCondition(input.synthetic === true, 'REAL_INTAKE_DISABLED');
  requireCondition(/^demo-[a-z0-9-]{1,48}$/.test(input.caseId || ''), 'SYNTHETIC_CASE_ID_REQUIRED');
  requireCondition(institutions.has(input.institution), 'UNKNOWN_INSTITUTION');
  requireCondition(roles.has(input.role), 'UNKNOWN_ROLE');
  requireCondition(Number.isInteger(input.year) && input.year >= 2020 && input.year <= 2100, 'INVALID_YEAR');
  requireCondition(['synthetic-fixture', 'synthetic-manual-review'].includes(input.provenance), 'SYNTHETIC_PROVENANCE_REQUIRED');
  requireCondition(typeof input.materialComplete === 'boolean' && typeof input.hasCounterevidence === 'boolean', 'COMPLETENESS_REQUIRED');
  requireCondition(input.reviewStates && typeof input.reviewStates === 'object' && !Array.isArray(input.reviewStates), 'REVIEW_STATES_REQUIRED');
  requireCondition(Object.keys(input.reviewStates).length === CATEGORIES.length && Object.keys(input.reviewStates).every(k => categoryIds.has(k)), 'INCOMPLETE_REVIEW_CATEGORIES');
  for (const id of categoryIds) requireCondition(REVIEW_STATES.includes(input.reviewStates[id]), 'INVALID_REVIEW_STATE');
  return structuredClone(input);
}

export class SyntheticStudyStore {
  #cases = new Map();
  add(input) {
    const record = validateSyntheticRecord(input), existing = this.#cases.get(record.caseId);
    if (existing) {
      requireCondition(canonical(existing) === canonical(record), 'CASE_CONFLICT_REQUIRES_MANUAL_REVIEW');
      return { added: false, distinctCases: this.#cases.size };
    }
    this.#cases.set(record.caseId, record);
    return { added: true, distinctCases: this.#cases.size };
  }
  get size() { return this.#cases.size; }
  records() { return [...this.#cases.values()].map(v => structuredClone(v)); }
  clear() { this.#cases.clear(); }
}

function cohortKey(record) { return `${record.institution}|${record.role}|${record.year}`; }
export function aggregateSyntheticCohorts(records, { minCell = MIN_COHORT } = {}) {
  requireCondition(Number.isInteger(minCell) && minCell >= MIN_COHORT, 'UNSAFE_MINIMUM');
  const store = new SyntheticStudyStore();
  for (const row of records) store.add(row);
  const groups = new Map();
  for (const row of store.records()) {
    const key = cohortKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const cohorts = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, cases]) => {
    const [institution, role, year] = key.split('|');
    if (cases.length < minCell) return { cohort: key, institution, role, year: Number(year), suppressed: true, reason: 'For lite grunnlag til publisering.' };
    const rows = CATEGORIES.map(category => {
      const counts = Object.fromEntries(REVIEW_STATES.map(state => [state, cases.filter(c => c.reviewStates[category.id] === state).length]));
      const smallCell = Object.values(counts).some(count => count > 0 && count < minCell);
      return smallCell ? { category: category.id, title: category.title, suppressed: true }
        : { category: category.id, title: category.title, suppressed: false, denominator: cases.length, counts };
    });
    // No completeness/counterevidence sub-counts are released: they could expose a rare record.
    return { cohort: key, institution, role, year: Number(year), suppressed: false, distinctCases: cases.length, categories: rows };
  });
  return { kind: 'synthetic-aggregate', synthetic: true, ruleVersion: VERSION, minCell, cohorts,
    description: 'Faste årskohorter, ingen personrangering. Viser kontrollstatus, ikke sannsynlighet for lovbrudd. Selvseleksjon hindrer generalisering til alle vedtak.' };
}

function visibleCells(snapshot) {
  const cells = new Map();
  for (const group of snapshot.cohorts) {
    if (group.suppressed) continue;
    cells.set(group.cohort + '|total', group.distinctCases);
    for (const row of group.categories) if (!row.suppressed) {
      for (const state of REVIEW_STATES) cells.set(`${group.cohort}|${row.category}|${state}`, row.counts[state]);
    }
  }
  return cells;
}

/** Immutable fixed releases, with conservative protection from repeated small-difference queries. */
export class SyntheticReleaseRegister {
  #releases = new Map();
  #latest = null;
  release(releaseId, records, { minCell = MIN_COHORT } = {}) {
    requireCondition(/^demo-release-[a-z0-9-]{1,60}$/.test(releaseId || ''), 'INVALID_RELEASE_ID');
    const snapshot = aggregateSyntheticCohorts(records, { minCell });
    const existing = this.#releases.get(releaseId);
    if (existing) {
      requireCondition(canonical(existing) === canonical(snapshot), 'RELEASE_IMMUTABLE');
      return structuredClone(existing);
    }
    if (this.#latest) {
      requireCondition(this.#latest.minCell === snapshot.minCell, 'RELEASE_POLICY_IMMUTABLE');
      const before = visibleCells(this.#latest), after = visibleCells(snapshot);
      for (const [key, count] of after) if (before.has(key)) {
        const delta = Math.abs(count - before.get(key));
        requireCondition(delta === 0 || delta >= minCell, 'SMALL_CHANGE_RELEASE_BLOCKED');
      }
      // Removing visibility can still disclose withdrawal. Retain a frozen release until a reviewed publication plan exists.
      for (const key of before.keys()) requireCondition(after.has(key), 'WITHDRAWAL_REQUIRES_PUBLICATION_REVIEW');
    }
    this.#releases.set(releaseId, snapshot); this.#latest = snapshot;
    return structuredClone(snapshot);
  }
}

export function syntheticCases(count = 60, institution = 'Bergen fengsel') {
  requireCondition(Number.isInteger(count) && count >= 0 && count <= 5000, 'INVALID_FIXTURE_SIZE');
  requireCondition(institutions.has(institution), 'UNKNOWN_INSTITUTION');
  const prefix = institution === 'Bergen fengsel' ? 'bergen' : institution === 'Bjørgvin fengsel' ? 'bjorgvin' : 'other';
  return Array.from({ length: count }, (_, i) => ({ caseId: `demo-${prefix}-${String(i + 1).padStart(4, '0')}`, synthetic: true,
    institution, role: 'juridisk funksjon', year: 2026, provenance: 'synthetic-fixture', materialComplete: i % 3 !== 0,
    hasCounterevidence: i % 2 === 0,
    reviewStates: Object.fromEntries(CATEGORIES.map((c, j) => [c.id, REVIEW_STATES[(i + j) % 3]])) }));
}

export const PRODUCTION_GATES = Object.freeze([
  'accountable_controller', 'lawful_basis_articles_6_9_10', 'adult_only_pilot_eligibility', 'voluntary_participation_without_penalty', 'dpia_and_security_review', 'processor_contracts_and_regions',
  'legal_method_validation', 'independent_human_review', 'contact_custodian_and_key_management', 'withdrawal_and_retention_process',
  'abuse_and_duplicate_case_controls', 'lawyer_account_mandate_and_bank_authority', 'refund_and_reconciliation_operations', 'user_publication_approval'
]);
export function productionReadiness(evidence = {}) {
  // This release has no real intake adapter. Checked boxes cannot activate it.
  return { intakeEnabled: false, paymentsEnabled: false, missing: PRODUCTION_GATES.filter(k => evidence[k] !== true), adapter: 'not-implemented-for-production' };
}
