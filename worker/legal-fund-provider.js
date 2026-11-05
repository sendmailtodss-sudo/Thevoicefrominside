/* Read-only Spleis adapter. Configuration records external confirmations;
 * it cannot establish bank authority, create a fundraiser or move money. */
export const SPLEIS_CONFIRMATIONS = Object.freeze([
  'lawyerAccepted', 'recipientVerified', 'dispositionAgreement',
  'collectorFallbackResolved', 'refundTermsAgreed', 'platformAccepted'
]);
const SOURCE = 'manually-confirmed-spleis-public-total';
const DAY = 86400000;
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const date = (value, now) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value && Date.parse(value) <= now;
export function officialSpleisCampaignUrl(value) {
  // Require a canonical numeric campaign URL; no aliases, redirects, tracking,
  // credentials, nonstandard ports or URL-parser normalization of hostile input.
  return typeof value === 'string' && /^https:\/\/www\.spleis\.no\/(?:project\/)?[1-9]\d{0,11}$/.test(value) ? value : null;
}
const pending = () => Object.fromEntries(SPLEIS_CONFIRMATIONS.map(key => [key, { status: 'pending', confirmedAt: null }]));
function base(provider = 'spleis') {
  return { provider, status: provider === 'lawyer-account' ? 'lawyer_account' : 'awaiting_confirmation',
    campaignUrl: null, campaignStatus: 'not_started', canContribute: false,
    recipient: null, agreementVersion: null, confirmations: pending(), observation: null,
    accountLedgerSource: 'lawyer-confirmed-account-report',
    accountLedgerSeparate: true, availableToLawyerMinor: null,
    automaticPayout: false, automaticRefund: false, escrow: false,
    termsUrl: 'https://www.spleis.no/vilkar', pricesUrl: 'https://www.spleis.no/pris',
    termsReviewedAt: '2026-11-02', observationMode: 'manual-dated-confirmation' };
}

/** Only public aggregate fields leave this adapter. A missing total is null, not zero. */
export function getPublicFundingProvider(env = {}, now = Date.now()) {
  const result = base(env.LEGAL_FUND_PROVIDER === 'lawyer-account' ? 'lawyer-account' : 'spleis');
  if (result.provider === 'lawyer-account') return result;
  if (env.LEGAL_FUND_PROVIDER && env.LEGAL_FUND_PROVIDER !== 'spleis') return { ...result, status: 'configuration_invalid' };
  const raw = env.SPLEIS_PUBLIC_CONFIG;
  if (raw === undefined || raw === '') return result;
  try {
    if (typeof raw !== 'string' || raw.length > 8192) throw Error();
    const c = JSON.parse(raw);
    if (!exact(c, ['schemaVersion','campaignUrl','campaignStatus','recipientKind','recipientDisplayName','agreementVersion','confirmations','observation']) || c.schemaVersion !== 1) throw Error();
    if (c.campaignUrl !== null && !officialSpleisCampaignUrl(c.campaignUrl)) throw Error();
    if (!['not_started','open','paused','closed'].includes(c.campaignStatus)) throw Error();
    if (!['lawyer','law-firm'].includes(c.recipientKind)) throw Error();
    if (typeof c.recipientDisplayName !== 'string' || c.recipientDisplayName.length > 120 || /[\x00-\x1f\x7f<>]/.test(c.recipientDisplayName) || c.recipientDisplayName.trim() !== c.recipientDisplayName) throw Error();
    if (c.agreementVersion !== null && (typeof c.agreementVersion !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(c.agreementVersion))) throw Error();
    if (!exact(c.confirmations, SPLEIS_CONFIRMATIONS)) throw Error();
    for (const key of SPLEIS_CONFIRMATIONS) {
      const confirmation = c.confirmations[key];
      if (!exact(confirmation, ['status','confirmedAt']) || !['pending','confirmed','declined'].includes(confirmation.status)) throw Error();
      if (confirmation.status === 'confirmed' ? !date(confirmation.confirmedAt, now) : confirmation.confirmedAt !== null) throw Error();
    }
    let observation = null;
    if (c.observation !== null) {
      const o = c.observation;
      if (!exact(o, ['grossRaisedMinor','asOf','recordedAt','source','sourceUrl']) || o.source !== SOURCE
        || !Number.isSafeInteger(o.grossRaisedMinor) || o.grossRaisedMinor < 0
        || !date(o.asOf, now) || !date(o.recordedAt, now) || o.asOf > o.recordedAt
        || !c.campaignUrl || o.sourceUrl !== c.campaignUrl) throw Error();
      observation = { ...o, stale: now - Date.parse(o.asOf) > 30 * DAY, basis: 'gross-raised-not-lawyer-balance' };
    }
    result.confirmations = c.confirmations;
    result.agreementVersion = c.agreementVersion;
    result.campaignStatus = c.campaignStatus;
    const confirmed = SPLEIS_CONFIRMATIONS.every(key => c.confirmations[key].status === 'confirmed');
    const ready = confirmed && c.campaignUrl !== null && c.recipientDisplayName.length > 0 && c.agreementVersion !== null;
    if (ready) {
      result.recipient = { kind: c.recipientKind, displayName: c.recipientDisplayName };
      result.campaignUrl = c.campaignUrl;
      result.observation = observation;
      result.status = c.campaignStatus === 'open' ? 'ready' : c.campaignStatus === 'not_started' ? 'awaiting_launch' : c.campaignStatus;
      result.canContribute = c.campaignStatus === 'open';
    }
    return result;
  } catch { return { ...base(), status: 'configuration_invalid' }; }
}
