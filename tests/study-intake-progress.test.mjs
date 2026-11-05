import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudyRelease, MIN_STUDY_ACCOUNTS} from '../worker/study-intake-progress.js';

const RULES = [
  {id: 'test-reasons', title: 'Synthetic reasons rule', version: 'fixture-v1'},
  {id: 'test-notice', title: 'Synthetic notice rule', version: 'fixture-v1'}
];
const token = n => n.toString(16).padStart(64, '0');
const uuid = n => '00000000-0000-4000-8000-' + n.toString(16).padStart(12, '0');
const record = (n, {owner = n, fingerprint = n, outcome = 'flag', extra = false} = {}) => ({jobId: uuid(n), ownerToken: token(owner), documentFingerprint: token(fingerprint), checks: [{ruleId: 'test-reasons', outcome}, ...(extra ? [{ruleId: 'test-notice', outcome}] : [])]});
const wave = (count, offset = 0, options = {}) => Array.from({length: count}, (_, i) => record(offset + i + 1, options));
const release = (records, options = {}) => buildStudyRelease(records, {rules: RULES, ...options});

test('below ten accounts returns nulls, never pretend zeros or person counts', () => {
  for (const count of [0, 1, 9]) {
    const r = release(wave(count));
    assert.equal(r.publicSummary.suppressed, true);
    assert.deepEqual(r.publicSummary.totals, {accounts: null, distinctExcerpts: null, checkedPoints: null, flaggedPoints: null});
    assert.ok(r.publicSummary.rules.every(rule => rule.suppressed && rule.flaggedPoints === null));
  }
  assert.equal(MIN_STUDY_ACCOUNTS, 10);
  assert.throws(() => release(wave(10), {minAccounts: 9}), /UNSAFE_STUDY_MINIMUM/);
});

test('ten distinct contributing accounts permit safe aggregate counts', () => {
  const r = release(wave(10));
  assert.equal(r.publicSummary.suppressed, false);
  assert.deepEqual(r.publicSummary.totals, {accounts: 10, distinctExcerpts: 10, checkedPoints: 10, flaggedPoints: 10});
  const reason = r.publicSummary.rules.find(rule => rule.id === 'test-reasons');
  assert.equal(reason.flaggedPoints, 10); assert.equal(reason.noFlagPoints, 0);
  assert.equal(r.publicSummary.legalConclusion, null);
  assert.equal(r.publicSummary.probabilityOfIllegality, null);
  assert.match(r.publicSummary.units.accounts, /not verified persons/);
  assert.match(r.publicSummary.units.distinctExcerpts, /not authenticated complete decisions/);
});

test('many excerpts by one account never satisfy account minimum', () => {
  const r = release(wave(100, 0, {owner: 1}));
  assert.equal(r.publicSummary.totals.accounts, null);
  assert.equal(r.publicSummary.totals.distinctExcerpts, null);
});

test('private identities, fingerprints and source fields cannot enter public summary', () => {
  const rows = wave(10), r = release(rows), json = JSON.stringify(r.publicSummary);
  for (const row of rows) {
    assert.ok(!json.includes(row.jobId)); assert.ok(!json.includes(row.ownerToken)); assert.ok(!json.includes(row.documentFingerprint));
  }
  for (const [key, value] of [['name', 'Private Person'], ['quote', 'Secret source quote'], ['institution', 'Bergen'], ['probability', 99]]) {
    const wrong = structuredClone(rows); wrong[0][key] = value;
    assert.throws(() => release(wrong), /INVALID_STUDY_RECORD_FIELDS/);
  }
});

test('unknown rules, extra model fields, malformed IDs and duplicated checks reject', () => {
  const wrongs = [
    row => { row.checks[0].ruleId = 'unknown'; },
    row => { row.checks[0].percentage = 90; },
    row => { row.checks[0].outcome = 'proven_illegal'; },
    row => { row.jobId = 'not-a-uuid'; },
    row => { row.ownerToken = 'person-name'; },
    row => { row.checks.push({...row.checks[0]}); }
  ];
  for (const change of wrongs) { const rows = wave(10); change(rows[0]); assert.throws(() => release(rows), /INVALID_|DUPLICATE_/); }
});

test('exact fingerprint copies collapse across accounts and do not amplify participation', () => {
  const rows = wave(10), duplicate = record(11, {fingerprint: 1});
  const r = release([...rows, duplicate]);
  assert.equal(r.publicSummary.totals.accounts, 10); assert.equal(r.publicSummary.totals.distinctExcerpts, 10);
  assert.equal(r.guard.records.length, 10);
  assert.deepEqual(release([...rows, duplicate]).publicSummary, release([duplicate, ...rows].reverse()).publicSummary);
  const inflated = Array.from({length: 100}, (_, n) => record(n + 1, {fingerprint: 1}));
  assert.equal(release(inflated).publicSummary.totals.accounts, null);
});

test('conflicting coding for one fingerprint and conflicting use of job ID reject', () => {
  const rows = wave(10);
  assert.throws(() => release([...rows, record(11, {fingerprint: 1, outcome: 'no_flag'})]), /STUDY_DOCUMENT_CONFLICT/);
  assert.throws(() => release([...rows, {...record(12), jobId: uuid(1)}]), /STUDY_JOB_CONFLICT/);
  assert.deepEqual(release([...rows, structuredClone(rows[0])]).publicSummary, release(rows).publicSummary);
});

test('a small categorical group suppresses the entire outcome distribution', () => {
  const rows = [...wave(10), ...wave(1, 10, {outcome: 'no_flag'})], r = release(rows).publicSummary;
  assert.equal(r.totals.accounts, 11); assert.equal(r.totals.distinctExcerpts, 11);
  assert.equal(r.totals.flaggedPoints, null); assert.equal(r.totals.checkedPoints, null);
  assert.ok(r.rules.every(rule => rule.suppressed && rule.noFlagPoints === null && rule.flaggedPoints === null));
});

test('small intersections are suppressed even where simple rule margins are at least ten', () => {
  // Both rule/outcome margins have at least ten accounts, but there are single
  // account combinations that a cross-tabulation could expose.
  const rows = wave(20, 0, {extra: true});
  rows.slice(10).forEach(row => { row.checks[0].outcome = 'no_flag'; row.checks[1].outcome = 'no_flag'; });
  rows[9].checks[1].outcome = 'no_flag'; rows[10].checks[1].outcome = 'flag';
  const r = release(rows).publicSummary;
  assert.equal(r.totals.accounts, 20); assert.equal(r.totals.flaggedPoints, null);
  assert.ok(r.rules.every(rule => rule.suppressed));
});

test('safe ten-account outcome groups expose checked/flagged/insufficient counts honestly', () => {
  const rows = [...wave(10), ...wave(10, 10, {outcome: 'no_flag'}), ...wave(10, 20, {outcome: 'insufficient'})];
  const r = release(rows).publicSummary, rule = r.rules.find(rule => rule.id === 'test-reasons');
  assert.equal(r.totals.accounts, 30); assert.equal(r.totals.flaggedPoints, 10);
  assert.deepEqual([rule.checkedPoints, rule.flaggedPoints, rule.noFlagPoints, rule.insufficientPoints], [30, 10, 10, 10]);
});

test('unchanged releases and ten-account additions preserve historic publication guard', () => {
  const first = release(wave(10));
  assert.deepEqual(release(wave(10), {previousReleases: [first]}).publicSummary, first.publicSummary);
  const next = release(wave(20), {previousReleases: [first.guard]});
  assert.equal(next.publicSummary.totals.accounts, 20);
});

test('one new account or ten new excerpts from one account cannot create a public increment', () => {
  const first = release(wave(10));
  assert.throws(() => release(wave(11), {previousReleases: [first]}), /STUDY_SMALL_ACCOUNT_CHANGE_BLOCKED/);
  const more = [...wave(10), ...wave(10, 10, {owner: 1})];
  assert.throws(() => release(more, {previousReleases: [first]}), /STUDY_SMALL_ACCOUNT_CHANGE_BLOCKED/);
});

test('ten changed contributors with a net count difference of one still cannot publish', () => {
  // Each account has both outcomes even after one of its four excerpts changes,
  // so no suppression rule masks the numeric-delta check being exercised.
  const base = Array.from({length: 20}, (_, i) => Array.from({length: 4}, (_, j) => record(i * 4 + j + 1, {owner: i + 1, outcome: j < 2 ? 'flag' : 'no_flag'}))).flat();
  const previous = release(base);
  const changed = structuredClone(base);
  for (let i = 0; i < 6; i++) changed[i * 4 + 2].checks[0].outcome = 'flag';
  for (let i = 6; i < 11; i++) changed[i * 4].checks[0].outcome = 'no_flag';
  assert.equal(release(changed).publicSummary.totals.flaggedPoints, previous.publicSummary.totals.flaggedPoints + 1);
  assert.throws(() => release(changed,{previousReleases:[previous]}), /STUDY_SMALL_COUNT_CHANGE_BLOCKED/);
});

test('removing old fingerprint or hiding previously visible cells is blocked', () => {
  const first = release(wave(20));
  assert.throws(() => release(wave(10), {previousReleases: [first]}), /STUDY_REMOVAL_REQUIRES_REVIEW/);
  const mixed = wave(20); mixed[0].checks[0].outcome = 'no_flag';
  assert.throws(() => release(mixed, {previousReleases: [first]}), /STUDY_VISIBILITY_REMOVAL_REQUIRES_REVIEW/);
});

test('comparison covers every historic release rather than just latest', () => {
  const first = release(wave(10)), second = release(wave(20), {previousReleases: [first]});
  const third = release(wave(30), {previousReleases: [first, second]});
  assert.equal(third.publicSummary.totals.accounts, 30);
  const tampered = structuredClone(first); tampered.guard.records[0].documentFingerprint = token(9999);
  assert.throws(() => release(wave(30), {previousReleases: [tampered, second]}), /STUDY_RELEASE_GUARD_MISMATCH/);
  const base = Array.from({length: 40}, (_, i) => Array.from({length: 4}, (_, j) => record(i * 4 + j + 1, {owner: i + 1, outcome: j < 2 ? 'flag' : 'no_flag'}))).flat();
  const a = release(base), next = structuredClone(base);
  for (let i = 0; i < 10; i++) next[i * 4].checks[0].outcome = 'no_flag';
  const b = release(next, {previousReleases: [a]});
  for (let i = 0; i < 9; i++) next[i * 4].checks[0].outcome = 'flag';
  next[10 * 4 + 2].checks[0].outcome = 'flag';
  assert.doesNotThrow(() => release(next, {previousReleases: [b]}));
  assert.throws(() => release(next, {previousReleases: [a, b]}), /STUDY_SMALL_ACCOUNT_CHANGE_BLOCKED/);
});

test('minimum, catalogue and private guard integrity cannot silently change', () => {
  const first = release(wave(20));
  assert.throws(() => release(wave(20), {minAccounts: 20, previousReleases: [first]}), /STUDY_MINIMUM_CHANGED/);
  assert.throws(() => release(wave(20), {rules: RULES.map(rule => ({...rule, version: 'v2'})), previousReleases: [first]}), /STUDY_CATALOGUE_CHANGED/);
  const guard = structuredClone(first.guard); guard.metrics[0].value++;
  assert.throws(() => release(wave(20), {previousReleases: [guard]}), /STUDY_RELEASE_GUARD_MISMATCH/);
  assert.throws(() => release(wave(20), {previousReleases: [first.publicSummary]}), /INVALID_STUDY_RELEASE_GUARD/);
});

test('input ordering and check ordering do not affect release; returned data are isolated', () => {
  const rows = wave(20, 0, {extra: true}), before = structuredClone(rows);
  const a = release(rows), b = release(rows.slice().reverse().map(row => ({...row, checks: row.checks.slice().reverse()})));
  assert.deepEqual(a, b); assert.deepEqual(rows, before);
  a.guard.records[0].checks[0].outcome = 'insufficient';
  assert.deepEqual(rows, before);
});

test('oversized record/history/catalogue inputs reject without weakening limits', () => {
  assert.throws(() => release(Array(1001).fill(record(1))), /STUDY_RECORD_LIMIT/);
  assert.throws(() => release([], {previousReleases: Array(101).fill({})}), /STUDY_RELEASE_HISTORY_LIMIT/);
  assert.throws(() => release([], {rules: []}), /INVALID_STUDY_RULES/);
});
