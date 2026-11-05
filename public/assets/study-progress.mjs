/* Synthetic progress reports only. No collection endpoint, identity service or legal finding. */
export const PROGRESS_VERSION = 'rettsspeil-progress-demo-0.2.0';
export const MIN_PROGRESS_PEOPLE = 10;
export const PROGRESS_STATUS_LABELS = Object.freeze({
  machine_flagged: 'Maskinelt flagget · mulig kontrollbehov',
  machine_no_flag: 'Maskinelt vurdert · ingen flagg',
  missing_documents: 'Dokumentasjon mangler',
  priority_review: 'Prioritert juridisk gjennomgang',
  lawyer_reviewed_possible_issue: 'Advokatvurdert mulig avvik',
  no_issue_observed: 'Ingen avvik påvist i gjennomgangen'
});
export const PROGRESS_PROVISIONS = Object.freeze([
  Object.freeze({ id: 'demo-fvl-17', label: 'Forvaltningsloven § 17 · demokatalog', catalogueStatus: 'synthetic-example-not-current-law' }),
  Object.freeze({ id: 'demo-fvl-24', label: 'Forvaltningsloven § 24 · demokatalog', catalogueStatus: 'synthetic-example-not-current-law' }),
  Object.freeze({ id: 'demo-fvl-27', label: 'Forvaltningsloven § 27 · demokatalog', catalogueStatus: 'synthetic-example-not-current-law' })
]);
const statuses = Object.keys(PROGRESS_STATUS_LABELS);
const machineStatuses = ['machine_flagged', 'machine_no_flag'];
const humanStatuses = statuses.filter(status => !machineStatuses.includes(status));
const provisionIds = new Set(PROGRESS_PROVISIONS.map(p => p.id));
const idPattern = /^demo-[a-z0-9-]{1,80}$/;
const recordKeys = ['synthetic', 'accepted', 'participantId', 'decisionId', 'fingerprint', 'reviewStage', 'plannedProvisionIds', 'assessments'];
const assessmentKeys = ['provisionId', 'status', 'reviewerRole', 'reviewBasis', 'evidenceChecked', 'ruleVersionChecked', 'counterevidenceChecked'];
const machineKeys = ['kind', 'completed', 'modelVersion', 'ruleCatalogVersion', 'analyzedAt', 'sourceReferencesRecorded', 'counterevidenceConsidered', 'outcome'];
const requireValue = (condition, code) => { if (!condition) throw new Error(code); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every(k => keys.includes(k));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : plain(value) ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}' : JSON.stringify(value);
const isoTime = value => {
  requireValue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value), 'INVALID_PUBLICATION_TIME');
  const parsed = Date.parse(value);
  requireValue(Number.isFinite(parsed) && new Date(parsed).toISOString() === value, 'INVALID_PUBLICATION_TIME');
  return parsed;
};
const unique = values => [...new Set(values)];
const participantCount = rows => unique(rows.map(r => r.participantId)).length;
const clone = value => structuredClone(value);
const allPlanned = (record, predicate) => record.assessments.length === record.plannedProvisionIds.length && record.assessments.every(predicate);
const machineComplete = record => allPlanned(record, a => !!a.machineAnalysis);
const humanComplete = record => record.reviewStage === 'reviewed' && allPlanned(record, a => a.reviewerRole !== 'model');
const lawyerComplete = record => humanComplete(record) && record.assessments.every(a => a.reviewerRole === 'lawyer' && a.reviewBasis === 'lawyer-reviewed');
function validateMachineAnalysis(value) {
  requireValue(exactKeys(value, machineKeys), 'INVALID_MACHINE_PROVENANCE_FIELDS');
  requireValue(value.kind === 'structured-checkpoint-analysis' && value.completed === true, 'COMPLETED_STRUCTURED_MACHINE_ANALYSIS_REQUIRED');
  requireValue(typeof value.modelVersion === 'string' && idPattern.test(value.modelVersion) && typeof value.ruleCatalogVersion === 'string' && idPattern.test(value.ruleCatalogVersion), 'SYNTHETIC_MACHINE_VERSIONS_REQUIRED');
  try { isoTime(value.analyzedAt); } catch { throw new Error('INVALID_MACHINE_ANALYSIS_TIME'); }
  requireValue(value.sourceReferencesRecorded === true && value.counterevidenceConsidered === true, 'MACHINE_SOURCE_AND_COUNTEREVIDENCE_REQUIRED');
  requireValue(['flagged', 'no_flag'].includes(value.outcome), 'INVALID_MACHINE_OUTCOME');
}


export function validateProgressRecord(input) {
  requireValue(exactKeys(input, recordKeys), 'UNEXPECTED_OR_MISSING_PROGRESS_FIELD');
  requireValue(input.synthetic === true, 'REAL_PROGRESS_INTAKE_DISABLED');
  requireValue(input.accepted === true, 'ACCEPTED_DECISION_REQUIRED');
  requireValue(typeof input.participantId === 'string' && typeof input.decisionId === 'string' && idPattern.test(input.participantId) && idPattern.test(input.decisionId), 'SYNTHETIC_PROGRESS_ID_REQUIRED');
  requireValue(typeof input.fingerprint === 'string' && /^demo-sha256-[a-f0-9]{64}$/.test(input.fingerprint), 'SYNTHETIC_FINGERPRINT_REQUIRED');
  requireValue(['received', 'in_review', 'machine_analyzed', 'reviewed'].includes(input.reviewStage), 'INVALID_REVIEW_STAGE');
  requireValue(Array.isArray(input.plannedProvisionIds) && input.plannedProvisionIds.length >= 1 && input.plannedProvisionIds.length <= provisionIds.size && input.plannedProvisionIds.every(id => provisionIds.has(id)) && unique(input.plannedProvisionIds).length === input.plannedProvisionIds.length, 'INVALID_REVIEW_PLAN');
  requireValue(Array.isArray(input.assessments) && input.assessments.length <= input.plannedProvisionIds.length, 'INVALID_ASSESSMENTS');
  const seen = new Set();
  for (const assessment of input.assessments) {
    requireValue(exactKeys(assessment, assessmentKeys) || exactKeys(assessment, [...assessmentKeys, 'machineAnalysis']), 'UNEXPECTED_OR_MISSING_ASSESSMENT_FIELD');
    if ('machineAnalysis' in assessment) validateMachineAnalysis(assessment.machineAnalysis);
    requireValue(input.plannedProvisionIds.includes(assessment.provisionId) && !seen.has(assessment.provisionId), 'DUPLICATE_OR_UNPLANNED_ASSESSMENT');
    seen.add(assessment.provisionId);
    requireValue(statuses.includes(assessment.status), 'INVALID_PROGRESS_STATUS');
    for (const flag of ['evidenceChecked', 'ruleVersionChecked', 'counterevidenceChecked']) requireValue(typeof assessment[flag] === 'boolean', 'REVIEW_CONTROLS_REQUIRED');
    if (machineStatuses.includes(assessment.status)) {
      requireValue(assessment.reviewerRole === 'model' && assessment.reviewBasis === 'machine-preliminary', 'MACHINE_ROLE_AND_BASIS_REQUIRED');
      requireValue(!!assessment.machineAnalysis, 'MACHINE_PROVENANCE_REQUIRED');
      requireValue(assessment.status === (assessment.machineAnalysis.outcome === 'flagged' ? 'machine_flagged' : 'machine_no_flag'), 'MACHINE_STATUS_OUTCOME_MISMATCH');
      requireValue(!assessment.evidenceChecked && !assessment.ruleVersionChecked && !assessment.counterevidenceChecked, 'MACHINE_IS_NOT_HUMAN_REVIEW');
      continue;
    }
    requireValue(['reviewer', 'lawyer'].includes(assessment.reviewerRole) && ['source-reviewed', 'lawyer-reviewed'].includes(assessment.reviewBasis), 'HUMAN_SOURCE_REVIEW_REQUIRED');
    if (assessment.reviewBasis === 'lawyer-reviewed') requireValue(assessment.reviewerRole === 'lawyer', 'LAWYER_ROLE_REQUIRED');
    if (assessment.status === 'lawyer_reviewed_possible_issue') requireValue(assessment.reviewerRole === 'lawyer' && assessment.reviewBasis === 'lawyer-reviewed' && assessment.evidenceChecked && assessment.ruleVersionChecked && assessment.counterevidenceChecked, 'LAWYER_SOURCE_REVIEW_REQUIRED');
    if (assessment.status === 'priority_review') requireValue(assessment.reviewBasis !== 'keyword-candidate' && assessment.evidenceChecked, 'SOURCE_REVIEW_REQUIRED_FOR_PRIORITY');
    if (assessment.status === 'no_issue_observed') requireValue(assessment.reviewBasis !== 'keyword-candidate' && assessment.evidenceChecked && assessment.ruleVersionChecked && assessment.counterevidenceChecked, 'SOURCE_REVIEW_REQUIRED_FOR_NO_ISSUE');
  }
  requireValue(input.reviewStage !== 'received' || input.assessments.length === 0, 'RECEIVED_DECISION_HAS_ASSESSMENTS');
  requireValue(input.reviewStage !== 'reviewed' || input.assessments.length === input.plannedProvisionIds.length, 'REVIEW_PLAN_NOT_COMPLETE');
  requireValue(input.reviewStage !== 'machine_analyzed' || machineComplete(input), 'MACHINE_PLAN_NOT_COMPLETE');
  requireValue(input.reviewStage !== 'reviewed' || humanComplete(input), 'HUMAN_REVIEW_PLAN_REQUIRED');
  const result = clone(input);
  result.plannedProvisionIds.sort();
  result.assessments.sort((a, b) => a.provisionId.localeCompare(b.provisionId));
  return result;
}

export class SyntheticProgressStore {
  #records = new Map();
  #fingerprints = new Map();
  add(input) {
    const record = validateProgressRecord(input);
    const existingId = this.#records.get(record.decisionId);
    if (existingId) {
      requireValue(canonical(existingId) === canonical(record), 'DECISION_CONFLICT_REQUIRES_REVIEW');
      return { added: false, decisionCount: this.#records.size };
    }
    const fingerprintOwner = this.#fingerprints.get(record.fingerprint);
    if (fingerprintOwner) {
      requireValue(fingerprintOwner.participantId === record.participantId, 'DOCUMENT_OWNER_CONFLICT_REQUIRES_REVIEW');
      const stripId = row => { const { decisionId, ...rest } = row; return rest; };
      requireValue(canonical(stripId(fingerprintOwner)) === canonical(stripId(record)), 'DOCUMENT_CONFLICT_REQUIRES_REVIEW');
      return { added: false, decisionCount: this.#records.size };
    }
    requireValue(this.#records.size < 10000, 'PROGRESS_RECORD_LIMIT');
    this.#records.set(record.decisionId, record); this.#fingerprints.set(record.fingerprint, record);
    return { added: true, decisionCount: this.#records.size };
  }
  records() { return [...this.#records.values()].map(clone); }
  get size() { return this.#records.size; }
  clear() { this.#records.clear(); this.#fingerprints.clear(); }
}

function metricsFor(records) {
  const metrics = new Map();
  const metricValues = new Map();
  const setMetric = (key, rows, mode) => {
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.participantId)) map.set(row.participantId, []);
      map.get(row.participantId).push(mode === 'people' ? 'present' : mode === 'decisions' ? row.decisionId : mode === 'provisions' ? row.provisionId : row.decisionId + '|' + row.provisionId);
    }
    // Values, not only member sets, matter: one participant may add many decisions.
    const contributions = new Map([...map].map(([person, parts]) => [person, unique(parts).sort().join('|')]));
    metrics.set(key, contributions);
    metricValues.set(key, mode === 'people' ? contributions.size : mode === 'provisions' ? unique(rows.map(row => row.provisionId)).length : mode === 'decisions' ? unique(rows.map(row => row.decisionId)).length : rows.length);
  };
  const assessments = records.flatMap(r => r.assessments.map(a => ({ ...a, participantId: r.participantId, decisionId: r.decisionId })));
  setMetric('totals.participants', records, 'people');
  setMetric('totals.decisions', records, 'decisions');
  setMetric('totals.reviewedDecisions', records.filter(humanComplete), 'decisions');
  setMetric('totals.machineAnalyzedDecisions', records.filter(machineComplete), 'decisions');
  setMetric('totals.humanReviewedDecisions', records.filter(humanComplete), 'decisions');
  setMetric('totals.lawyerReviewedDecisions', records.filter(lawyerComplete), 'decisions');
  setMetric('totals.machineFlaggedPoints', assessments.filter(a => a.machineAnalysis?.outcome === 'flagged'), 'points');
  setMetric('totals.provisionsReviewed', assessments, 'provisions');
  setMetric('totals.assessmentPoints', assessments, 'points');
  const metricTriplet = (prefix, rows) => {
    setMetric(prefix + '.assessmentCount', rows, 'points');
    setMetric(prefix + '.decisionCount', rows, 'decisions');
    setMetric(prefix + '.participantCount', rows, 'people');
  };
  for (const status of statuses) metricTriplet('status.' + status, assessments.filter(a => a.status === status));
  for (const provision of PROGRESS_PROVISIONS) {
    const rows = assessments.filter(a => a.provisionId === provision.id);
    metricTriplet('provision.' + provision.id, rows);
    for (const status of statuses) metricTriplet(`provision.${provision.id}.status.${status}`, rows.filter(a => a.status === status));
  }
  return { metrics, metricValues, assessments };
}

function aggregateInternal(input, minPeople) {
  requireValue(Number.isInteger(minPeople) && minPeople >= MIN_PROGRESS_PEOPLE && minPeople <= 1000, 'UNSAFE_PROGRESS_MINIMUM');
  requireValue(Array.isArray(input), 'PROGRESS_RECORDS_REQUIRED');
  requireValue(input.length <= 20000, 'PROGRESS_INPUT_LIMIT');
  const store = new SyntheticProgressStore(); for (const record of input) store.add(record);
  const records = store.records();
  const people = new Set(records.map(r => r.participantId));
  const { metrics, metricValues, assessments } = metricsFor(records);
  const safeSupport = count => count === 0 || count >= minPeople;
  const enough = people.size >= minPeople;
  const signatureGroups = new Map();
  for (const person of people) {
    const personRecords = records.filter(r => r.participantId === person);
    const labels = unique(personRecords.flatMap(r => ['stage:' + r.reviewStage, 'machine-complete:' + machineComplete(r), 'human-complete:' + humanComplete(r), 'lawyer-complete:' + lawyerComplete(r), ...r.assessments.map(a => a.provisionId + ':' + a.status + ':' + a.reviewBasis + ':machine-' + (a.machineAnalysis?.outcome || 'none'))])).sort();
    const key = labels.join('|'); signatureGroups.set(key, (signatureGroups.get(key) || 0) + 1);
  }
  // A small intersection across otherwise large margins must not be recoverable by subtraction.
  const safePatterns = enough && [...signatureGroups.values()].every(count => count >= minPeople);
  const safeRow = rows => {
    const count = participantCount(rows);
    return safeSupport(count) && safeSupport(people.size - count);
  };
  const statusRows = statuses.map(id => ({ id, label: PROGRESS_STATUS_LABELS[id], rows: assessments.filter(a => a.status === id) }));
  const safeStatuses = safePatterns && statusRows.every(row => safeRow(row.rows));
  const provisionRows = PROGRESS_PROVISIONS.map(p => ({ ...p, rows: assessments.filter(a => a.provisionId === p.id) }));
  const safeProvisions = safePatterns && provisionRows.every(row => safeRow(row.rows) && statuses.every(id => safeRow(row.rows.filter(a => a.status === id))));
  const counts = rows => ({ assessmentCount: rows.length, decisionCount: unique(rows.map(r => r.decisionId)).length, participantCount: participantCount(rows) });
  const byStatus = statusRows.map(row => safeStatuses ? { id: row.id, label: row.label, suppressed: false, ...counts(row.rows) } : { id: row.id, label: row.label, suppressed: true });
  const provisions = provisionRows.map(row => safeProvisions && row.rows.length > 0 ? {
    id: row.id, label: row.label, catalogueStatus: row.catalogueStatus, suppressed: false, ...counts(row.rows),
    byStatus: statuses.map(id => ({ id, label: PROGRESS_STATUS_LABELS[id], suppressed: false, ...counts(row.rows.filter(a => a.status === id)) }))
  } : { id: row.id, label: row.label, catalogueStatus: row.catalogueStatus, suppressed: true });
  const completedCount = predicate => {
    const completed = records.filter(predicate), remaining = records.filter(r => !predicate(r));
    return safePatterns && safeSupport(participantCount(completed)) && safeSupport(participantCount(remaining)) ? completed.length : null;
  };
  const machineFlags = assessments.filter(a => a.machineAnalysis?.outcome === 'flagged');
  const totals = {
    participants: enough ? people.size : null,
    decisions: enough ? records.length : null,
    reviewedDecisions: completedCount(humanComplete),
    machineAnalyzedDecisions: completedCount(machineComplete),
    humanReviewedDecisions: completedCount(humanComplete),
    lawyerReviewedDecisions: completedCount(lawyerComplete),
    machineFlaggedPoints: safePatterns && safeRow(machineFlags) ? machineFlags.length : null,
    provisionsReviewed: safeProvisions ? unique(assessments.map(a => a.provisionId)).length : null,
    assessmentPoints: safePatterns && safeRow(assessments) ? assessments.length : null
  };
  const withheldTotals = Object.keys(totals).filter(key => totals[key] === null);
  const visible = new Set(Object.keys(totals).filter(key => totals[key] !== null).map(key => 'totals.' + key));
  for (const row of byStatus) if (!row.suppressed) for (const key of ['assessmentCount', 'decisionCount', 'participantCount']) visible.add(`status.${row.id}.${key}`);
  for (const row of provisions) if (!row.suppressed) {
    for (const key of ['assessmentCount', 'decisionCount', 'participantCount']) visible.add(`provision.${row.id}.${key}`);
    for (const item of row.byStatus) for (const key of ['assessmentCount', 'decisionCount', 'participantCount']) visible.add(`provision.${row.id}.status.${item.id}.${key}`);
  }
  const milestones = [
    ['participants-100', '100 personer med aksepterte vedtak', 100, totals.participants],
    ['decisions-200', '200 unike vedtak mottatt', 200, totals.decisions],
    ['machine-analyzed-100', '100 vedtak maskinelt analysert etter kontrollplanen', 100, totals.machineAnalyzedDecisions],
    ['reviewed-100', '100 vedtak menneskekontrollert etter kontrollplanen', 100, totals.humanReviewedDecisions]
  ].map(([id, label, target, value]) => ({ id, label, target, value, complete: value !== null && value >= target, suppressed: value === null }));
  const snapshot = {
    kind: 'synthetic-progress-release', synthetic: true, realIntakeEnabled: false, methodVersion: PROGRESS_VERSION, minPeople,
    totals, withheldTotals, byStatus, provisions, milestones,
    note: 'Kun oppdiktede testdata; ingen KI-modell er kjørt. Maskinelt flagget betyr mulig kontrollbehov, ikke et lovbrudd eller en sannsynlighet for lovbrudd. Menneske- og advokatkontroll er senere, separate trinn; ingen av dem kreves for den foreløpige maskinfasen. Et advokatvurdert mulig avvik er ikke en dom. Demokatalogen fastslår ingen gjeldende regelversjon. Ingen personer eller vedtak er faktisk samlet inn.',
    privacyNote: 'Minst ti forskjellige personer og kontroll av kryssmønstre og historiske endringer. Dette er en konservativ demonstrasjon, ikke bevis for anonymitet. Offentlig oppdatering må godkjennes sentralt i produksjon.',
    unitsNote: 'Samme person kan ha flere vedtak, og samme vedtak kan ha flere kontrollpunkter. Kontrollpunktstatusene viser siste vurderingsstadium. Maskinelt flaggede punkter bevarer maskinresultatet også etter senere gjennomgang og kan derfor overlappe menneske- og advokatvurderinger. Person- og vedtakstall på tvers av statusene kan overlappe.',
    reviewDefinition: 'Maskinelt analysert krever fullført strukturert analyse med versjon og dato for alle planlagte kontrollpunkter. Rå ordtreff teller ikke. Menneskekontrollert og advokatvurdert krever egne fullførte kontrollplaner. Tallene bekrefter verken lovbrudd eller at vurderingene er riktige.'
  };
  return { snapshot, records, people, metrics, metricValues, visible };
}

/** Preview aggregation is not a substitute for the persistent release register. */
export function aggregateProgress(records, { minPeople = MIN_PROGRESS_PEOPLE } = {}) {
  return clone(aggregateInternal(records, minPeople).snapshot);
}

function changedPeople(before, after) {
  const people = new Set([...before.keys(), ...after.keys()]);
  return [...people].filter(person => before.get(person) !== after.get(person)).length;
}

export class ProgressReleaseRegister {
  #releases = new Map();
  #latest = null;
  #minPeople;
  constructor({ minPeople = MIN_PROGRESS_PEOPLE } = {}) {
    requireValue(Number.isInteger(minPeople) && minPeople >= MIN_PROGRESS_PEOPLE && minPeople <= 1000, 'UNSAFE_PROGRESS_MINIMUM');
    this.#minPeople = minPeople;
  }
  publish({ releaseId, publishedAt, records }) {
    requireValue(typeof releaseId === 'string' && /^demo-progress-[a-z0-9-]{1,60}$/.test(releaseId), 'INVALID_PROGRESS_RELEASE_ID');
    const timestamp = isoTime(publishedAt);
    const current = aggregateInternal(records, this.#minPeople);
    requireValue(current.records.every(record => record.assessments.every(a => !a.machineAnalysis || isoTime(a.machineAnalysis.analyzedAt) <= timestamp)), 'ANALYSIS_AFTER_PUBLICATION_TIME');
    const fingerprint = canonical(current.records.slice().sort((a, b) => a.decisionId.localeCompare(b.decisionId)));
    const existing = this.#releases.get(releaseId);
    if (existing) {
      requireValue(existing.fingerprint === fingerprint && existing.publishedAt === publishedAt, 'PROGRESS_RELEASE_IMMUTABLE');
      return clone(existing.snapshot);
    }
    requireValue(this.#releases.size < 1000, 'PROGRESS_RELEASE_LIMIT');
    if (this.#latest) requireValue(timestamp > isoTime(this.#latest.publishedAt), 'PUBLICATION_TIME_MUST_ADVANCE');
    for (const previous of this.#releases.values()) {
      const currentDecisionIds = new Set(current.records.map(r => r.decisionId));
      requireValue(previous.records.every(r => currentDecisionIds.has(r.decisionId)), 'REMOVAL_REQUIRES_PUBLICATION_REVIEW');
      for (const key of previous.visible) requireValue(current.visible.has(key), 'VISIBILITY_REMOVAL_REQUIRES_REVIEW');
      for (const key of current.visible) {
        const changed = changedPeople(previous.metrics.get(key) || new Map(), current.metrics.get(key) || new Map());
        requireValue(changed === 0 || changed >= this.#minPeople, 'SMALL_PERSON_CHANGE_BLOCKED');
        // Ten changed people can still yield a net change of one. Suppress that
        // second route to small-cell disclosure, except catalogue cardinality.
        if (key !== 'totals.provisionsReviewed') {
          const delta = Math.abs((current.metricValues.get(key) || 0) - (previous.metricValues.get(key) || 0));
          requireValue(delta === 0 || delta >= this.#minPeople, 'SMALL_COUNT_CHANGE_BLOCKED');
        }
      }
    }
    let sincePrevious = null;
    if (this.#latest) {
      const previous = this.#latest;
      const newPeople = [...current.people].filter(id => !previous.people.has(id)).length;
      sincePrevious = {
        participants: current.snapshot.totals.participants === null || previous.snapshot.totals.participants === null ? null : newPeople,
        decisions: current.snapshot.totals.decisions === null || previous.snapshot.totals.decisions === null ? null : current.snapshot.totals.decisions - previous.snapshot.totals.decisions,
        reviewedDecisions: current.snapshot.totals.reviewedDecisions === null || previous.snapshot.totals.reviewedDecisions === null ? null : current.snapshot.totals.reviewedDecisions - previous.snapshot.totals.reviewedDecisions,
        assessmentPoints: current.snapshot.totals.assessmentPoints === null || previous.snapshot.totals.assessmentPoints === null ? null : current.snapshot.totals.assessmentPoints - previous.snapshot.totals.assessmentPoints,
        ...Object.fromEntries(['machineAnalyzedDecisions', 'humanReviewedDecisions', 'lawyerReviewedDecisions', 'machineFlaggedPoints'].map(key => [key, current.snapshot.totals[key] === null || previous.snapshot.totals[key] === null ? null : current.snapshot.totals[key] - previous.snapshot.totals[key]]))
      };
    }
    const snapshot = { ...current.snapshot, releaseId, publishedAt, previousPublishedAt: this.#latest?.publishedAt ?? null, sincePrevious };
    const entry = { ...current, snapshot, releaseId, publishedAt, fingerprint };
    this.#releases.set(releaseId, entry); this.#latest = entry;
    return clone(snapshot);
  }
  latest() { return this.#latest ? clone(this.#latest.snapshot) : null; }
}

/** Three fixed demonstration waves; no polling, analytics or real participants. */
export function syntheticHumanReviewedRecords(stage = 1) {
  requireValue([1, 2, 3].includes(stage), 'INVALID_DEMO_PROGRESS_STAGE');
  const people = stage * 40, records = [];
  for (let n = 0; n < people; n++) {
    const status = humanStatuses[n % humanStatuses.length];
    const participantId = 'demo-person-' + String(n + 1).padStart(4, '0');
    for (let doc = 0; doc < 2; doc++) {
      const serial = n * 2 + doc + 1;
      records.push({
        synthetic: true, accepted: true, participantId,
        decisionId: 'demo-decision-' + String(serial).padStart(5, '0'), fingerprint: 'demo-sha256-' + serial.toString(16).padStart(64, '0'),
        reviewStage: doc === 0 ? 'reviewed' : 'received', plannedProvisionIds: [...provisionIds],
        assessments: doc === 0 ? [...provisionIds].map(provisionId => ({ provisionId, status,
          reviewerRole: status === 'lawyer_reviewed_possible_issue' ? 'lawyer' : 'reviewer',
          reviewBasis: status === 'lawyer_reviewed_possible_issue' ? 'lawyer-reviewed' : 'source-reviewed',
          evidenceChecked: status !== 'missing_documents', ruleVersionChecked: status !== 'missing_documents', counterevidenceChecked: status !== 'missing_documents'
        })) : []
      });
    }
  }
  return records;
}

/** Pre-lawyer synthetic workflow: no AI provider is run and no human review is required. */
export function syntheticProgressRecords(stage = 1) {
  const records = syntheticHumanReviewedRecords(stage);
  for (let n = 0; n < records.length; n++) {
    const record = records[n];
    if (record.reviewStage === 'received') continue;
    const flagged = Math.floor(n / 2) % 2 === 0;
    record.reviewStage = 'machine_analyzed';
    record.assessments = record.assessments.map(a => ({
      provisionId: a.provisionId,
      status: flagged ? 'machine_flagged' : 'machine_no_flag',
      reviewerRole: 'model', reviewBasis: 'machine-preliminary',
      evidenceChecked: false, ruleVersionChecked: false, counterevidenceChecked: false,
      machineAnalysis: {
        kind: 'structured-checkpoint-analysis', completed: true,
        modelVersion: 'demo-model-not-executed-v1', ruleCatalogVersion: 'demo-catalog-v1',
        analyzedAt: '2026-09-01T12:00:00.000Z',
        sourceReferencesRecorded: true, counterevidenceConsidered: true,
        outcome: flagged ? 'flagged' : 'no_flag'
      }
    }));
  }
  return records;
}
