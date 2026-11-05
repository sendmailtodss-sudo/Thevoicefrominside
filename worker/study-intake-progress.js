/**
 * Pure aggregation of consented, machine-completed and schema-validated coded
 * study results. No I/O. Individual legal/human review is not a prerequisite.
 *
 * This module does not approve submissions, authenticate accounts, verify that
 * different accounts represent different people, or establish anonymisation.
 * Callers must keep `guard` private and persist every actual release's guard.
 * Withdrawal/guard expiry must lock further publication in the caller; dropping
 * historical guards and starting again is not a safe way to revise a release.
 */
export const STUDY_PROGRESS_METHOD = 'approved-excerpt-aggregation-v1';
export const MIN_STUDY_ACCOUNTS = 10;
const OUTCOMES = ['flag', 'no_flag', 'insufficient'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX = /^[a-f0-9]{64}$/;
const RULE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const assert = (ok, code) => { if (!ok) throw new Error(code); };
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : plain(value) ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const clone = value => structuredClone(value);
const text = (value, min, max) => typeof value === 'string' && value.trim() === value && value.length >= min && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
const unique = values => [...new Set(values)];
const sort = values => [...values].sort();

function validateRules(input) {
  assert(Array.isArray(input) && input.length >= 1 && input.length <= 50, 'INVALID_STUDY_RULES');
  const rules = input.map(rule => {
    assert(exact(rule, ['id', 'title', 'version']) && typeof rule.id === 'string' && RULE_ID.test(rule.id) && text(rule.title, 3, 300) && text(rule.version, 1, 100), 'INVALID_STUDY_RULE');
    return clone(rule);
  });
  assert(unique(rules.map(rule => rule.id)).length === rules.length, 'DUPLICATE_STUDY_RULE');
  return rules.sort((a, b) => a.id.localeCompare(b.id));
}

function validateRecords(input, rules) {
  assert(Array.isArray(input) && input.length <= 1000, 'STUDY_RECORD_LIMIT');
  const knownRules = new Set(rules.map(rule => rule.id));
  const byJob = new Map();
  const byFingerprint = new Map();
  for (const value of input) {
    assert(exact(value, ['jobId', 'ownerToken', 'documentFingerprint', 'checks']), 'INVALID_STUDY_RECORD_FIELDS');
    assert(typeof value.jobId === 'string' && UUID.test(value.jobId) && typeof value.ownerToken === 'string' && HEX.test(value.ownerToken) && typeof value.documentFingerprint === 'string' && HEX.test(value.documentFingerprint), 'INVALID_STUDY_RECORD_ID');
    assert(Array.isArray(value.checks) && value.checks.length >= 1 && value.checks.length <= rules.length, 'INVALID_STUDY_CHECKS');
    const checks = value.checks.map(check => {
      assert(exact(check, ['ruleId', 'outcome']) && knownRules.has(check.ruleId) && OUTCOMES.includes(check.outcome), 'INVALID_STUDY_CHECK');
      return clone(check);
    }).sort((a, b) => a.ruleId.localeCompare(b.ruleId));
    assert(unique(checks.map(check => check.ruleId)).length === checks.length, 'DUPLICATE_STUDY_CHECK');
    const record = {jobId: value.jobId.toLowerCase(), ownerToken: value.ownerToken, documentFingerprint: value.documentFingerprint, checks};
    const sameJob = byJob.get(record.jobId);
    assert(!sameJob || canonical(sameJob) === canonical(record), 'STUDY_JOB_CONFLICT');
    byJob.set(record.jobId, record);
    const sameDocument = byFingerprint.get(record.documentFingerprint);
    if (sameDocument) {
      assert(canonical(sameDocument.checks) === canonical(checks), 'STUDY_DOCUMENT_CONFLICT');
      // Count an identical coded excerpt once, not once for every uploading
      // account. A deterministic representative conservatively undercounts
      // accounts rather than letting duplicate copies amplify participation.
      const representative = [sameDocument, record].sort((a, b) => a.ownerToken.localeCompare(b.ownerToken) || a.jobId.localeCompare(b.jobId))[0];
      byFingerprint.set(record.documentFingerprint, representative);
    } else byFingerprint.set(record.documentFingerprint, record);
  }
  return [...byFingerprint.values()].sort((a, b) => a.documentFingerprint.localeCompare(b.documentFingerprint));
}

function aggregate(input, rules, minAccounts) {
  const records = validateRecords(input, rules);
  const accounts = new Set(records.map(record => record.ownerToken));
  const points = records.flatMap(record => record.checks.map(check => ({ownerToken: record.ownerToken, documentFingerprint: record.documentFingerprint, ...check})));
  const metrics = new Map();
  const visible = new Set();
  const makeMetric = (key, rows, unit) => {
    const members = new Map();
    for (const row of rows) {
      if (!members.has(row.ownerToken)) members.set(row.ownerToken, new Set());
      members.get(row.ownerToken).add(unit === 'accounts' ? 'present' : unit === 'excerpts' ? row.documentFingerprint : row.documentFingerprint + ':' + row.ruleId);
    }
    const contributors = [...members].sort(([a], [b]) => a.localeCompare(b)).map(([ownerToken, items]) => ({ownerToken, items: sort(items)}));
    const value = unit === 'accounts' ? contributors.length : unique(contributors.flatMap(member => member.items)).length;
    metrics.set(key, {key, value, contributors});
    return value;
  };
  const accountCount = rows => new Set(rows.map(row => row.ownerToken)).size;
  const supportSafe = count => count === 0 || count >= minAccounts;
  const marginSafe = rows => supportSafe(accountCount(rows)) && supportSafe(accounts.size - accountCount(rows));
  const enough = accounts.size >= minAccounts;

  // All visible categorical margins are withheld if their intersection exposes
  // a small account group, even where each simple marginal count looks large.
  const signatures = new Map(), accountLabels = new Map();
  for (const point of points) {
    if (!accountLabels.has(point.ownerToken)) accountLabels.set(point.ownerToken, new Set());
    accountLabels.get(point.ownerToken).add(point.ruleId + ':' + point.outcome);
  }
  for (const account of accounts) {
    const labels = sort(accountLabels.get(account));
    const signature = JSON.stringify(labels);
    signatures.set(signature, (signatures.get(signature) || 0) + 1);
  }
  const patternsSafe = enough && [...signatures.values()].every(count => count >= minAccounts);
  const flagged = points.filter(point => point.outcome === 'flag');
  const totals = {
    accounts: makeMetric('totals.accounts', records, 'accounts'),
    distinctExcerpts: makeMetric('totals.distinctExcerpts', records, 'excerpts'),
    checkedPoints: makeMetric('totals.checkedPoints', points, 'points'),
    flaggedPoints: makeMetric('totals.flaggedPoints', flagged, 'points')
  };
  for (const key of ['accounts', 'distinctExcerpts']) {
    if (enough) visible.add('totals.' + key);
    else totals[key] = null;
  }
  for (const key of ['checkedPoints', 'flaggedPoints']) {
    if (patternsSafe && marginSafe(key === 'flaggedPoints' ? flagged : points)) visible.add('totals.' + key);
    else totals[key] = null;
  }
  const ruleRows = rules.map(rule => {
    const rows = points.filter(point => point.ruleId === rule.id);
    const byOutcome = Object.fromEntries(OUTCOMES.map(outcome => [outcome, rows.filter(point => point.outcome === outcome)]));
    const canShow = patternsSafe && marginSafe(rows) && OUTCOMES.every(outcome => marginSafe(byOutcome[outcome]));
    const prefix = 'rule.' + rule.id + '.';
    const values = {
      accounts: makeMetric(prefix + 'accounts', rows, 'accounts'),
      checkedPoints: makeMetric(prefix + 'checkedPoints', rows, 'points'),
      flaggedPoints: makeMetric(prefix + 'flaggedPoints', byOutcome.flag, 'points'),
      noFlagPoints: makeMetric(prefix + 'noFlagPoints', byOutcome.no_flag, 'points'),
      insufficientPoints: makeMetric(prefix + 'insufficientPoints', byOutcome.insufficient, 'points')
    };
    for (const key of Object.keys(values)) {
      if (canShow) visible.add(prefix + key);
      else values[key] = null;
    }
    return {...rule, suppressed: !canShow, ...values};
  });
  const publicSummary = {
    kind: 'approved-study-progress', schemaVersion: 1, methodVersion: STUDY_PROGRESS_METHOD,
    minAccounts, suppressed: !enough, totals, rules: ruleRows,
    units: {accounts: 'distinct contributing accounts, not verified persons', distinctExcerpts: 'distinct submitted excerpt fingerprints, not authenticated complete decisions', checkedPoints: 'completed source-bound machine checks', flaggedPoints: 'machine checks marked for possible follow-up, not proven violations'},
    legalConclusion: null, probabilityOfIllegality: null,
    privacy: 'Small account groups, complementary groups and categorical intersections are suppressed. Historical changes are checked against retained private release guards. This is not proof of irreversible anonymisation.'
  };
  const guard = {
    kind: 'private-study-release-guard', schemaVersion: 1, methodVersion: STUDY_PROGRESS_METHOD,
    minAccounts, rules: clone(rules), records: clone(records),
    visibleMetrics: sort(visible),
    // Persist each pseudonymous coded contribution only once in records. The
    // per-metric contributor matrices are reconstructed and checked from that
    // immutable source at each release, rather than repeating long tokens many
    // times inside one database value. Encryption/authentication belongs to the
    // caller; this structural check is not a cryptographic authenticity proof.
    metrics: [...metrics.values()].map(({key, value}) => ({key, value})).sort((a, b) => a.key.localeCompare(b.key))
  };
  return {publicSummary, guard, internalMetrics: [...metrics.values()]};
}

function checkedPrevious(value, rules, minAccounts) {
  // Accept a persisted guard directly or the complete result returned by this
  // function. PublicSummary is never trusted as the private historical guard.
  const guard = plain(value) && Object.hasOwn(value, 'guard') ? value.guard : value;
  assert(exact(guard, ['kind', 'schemaVersion', 'methodVersion', 'minAccounts', 'rules', 'records', 'visibleMetrics', 'metrics']), 'INVALID_STUDY_RELEASE_GUARD');
  assert(guard.kind === 'private-study-release-guard' && guard.schemaVersion === 1 && guard.methodVersion === STUDY_PROGRESS_METHOD, 'INVALID_STUDY_RELEASE_GUARD');
  assert(guard.minAccounts === minAccounts, 'STUDY_MINIMUM_CHANGED');
  assert(canonical(guard.rules) === canonical(rules), 'STUDY_CATALOGUE_CHANGED');
  const recomputed = aggregate(guard.records, rules, minAccounts);
  assert(canonical(guard) === canonical(recomputed.guard), 'STUDY_RELEASE_GUARD_MISMATCH');
  return recomputed;
}

function changedContributors(before, after) {
  const oldMembers = new Map((before?.contributors || []).map(member => [member.ownerToken, canonical(member.items)]));
  const newMembers = new Map((after?.contributors || []).map(member => [member.ownerToken, canonical(member.items)]));
  return unique([...oldMembers.keys(), ...newMembers.keys()]).filter(owner => oldMembers.get(owner) !== newMembers.get(owner)).length;
}

/**
 * records must already be consented and machine-completed, with structured
 * source/schema validation enforced by the caller. No individual legal review
 * is required. The caller separately authorizes the aggregate's privacy release.
 * This pure function deliberately has no endpoint, model call or publication
 * permission check. Persist only guard server-side; return only publicSummary.
 */
export function buildStudyRelease(records, {rules, minAccounts = MIN_STUDY_ACCOUNTS, previousReleases = []} = {}) {
  assert(Number.isInteger(minAccounts) && minAccounts >= MIN_STUDY_ACCOUNTS && minAccounts <= 1000, 'UNSAFE_STUDY_MINIMUM');
  assert(Array.isArray(previousReleases) && previousReleases.length <= 100, 'STUDY_RELEASE_HISTORY_LIMIT');
  const catalogue = validateRules(rules);
  const current = aggregate(records, catalogue, minAccounts);
  const currentFingerprints = new Set(current.guard.records.map(record => record.documentFingerprint));
  const currentVisible = new Set(current.guard.visibleMetrics);
  const currentMetrics = new Map(current.internalMetrics.map(metric => [metric.key, metric]));
  for (const previousValue of previousReleases) {
    const previous = checkedPrevious(previousValue, catalogue, minAccounts);
    assert(previous.guard.records.every(record => currentFingerprints.has(record.documentFingerprint)), 'STUDY_REMOVAL_REQUIRES_REVIEW');
    assert(previous.guard.visibleMetrics.every(key => currentVisible.has(key)), 'STUDY_VISIBILITY_REMOVAL_REQUIRES_REVIEW');
    const oldMetrics = new Map(previous.internalMetrics.map(metric => [metric.key, metric]));
    for (const key of currentVisible) {
      const before = oldMetrics.get(key), after = currentMetrics.get(key);
      const contributorsChanged = changedContributors(before, after);
      assert(contributorsChanged === 0 || contributorsChanged >= minAccounts, 'STUDY_SMALL_ACCOUNT_CHANGE_BLOCKED');
      const delta = Math.abs(after.value - (before?.value || 0));
      assert(delta === 0 || delta >= minAccounts, 'STUDY_SMALL_COUNT_CHANGE_BLOCKED');
    }
  }
  return clone({publicSummary: current.publicSummary, guard: current.guard});
}
