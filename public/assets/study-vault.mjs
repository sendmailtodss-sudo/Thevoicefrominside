/* A separate synthetic-only contact boundary; no production collection endpoint exists. */
const idPattern = /^demo-[a-z0-9-]{1,60}$/;
export class SyntheticContactVault {
  #contacts = new Map();
  #links = new Map();
  constructor({ mode = 'demo' } = {}) { if (mode !== 'demo') throw new Error('PRODUCTION_VAULT_NOT_CONFIGURED'); }
  enroll({ contactId, caseId, email, consentVersion, recontactConsent, synthetic }) {
    if (synthetic !== true || !idPattern.test(contactId || '') || !idPattern.test(caseId || '')) throw new Error('SYNTHETIC_CONTACT_REQUIRED');
    if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.invalid$/i.test(email || '')) throw new Error('REAL_CONTACT_NOT_ACCEPTED');
    if (consentVersion !== 'demo-v1' || recontactConsent !== true) throw new Error('EXPLICIT_RECONTACT_CONSENT_REQUIRED');
    if (this.#contacts.has(contactId) || this.#links.has(caseId)) throw new Error('CONTACT_OR_CASE_ALREADY_LINKED');
    this.#contacts.set(contactId, { email, consentVersion }); this.#links.set(caseId, contactId);
    return { contactId, caseId, synthetic: true, classification: 'pseudonymised-not-anonymous' };
  }
  requestRecontact({ caseId, lawyerReviewed, purpose }) {
    if (lawyerReviewed !== true || purpose !== 'request-original-and-fresh-consent') throw new Error('HUMAN_REVIEW_AND_NEW_CONSENT_REQUIRED');
    const contactId = this.#links.get(caseId), item = this.#contacts.get(contactId);
    if (!item) throw new Error('NO_RECONTACT_CONSENT');
    return { synthetic: true, sent: false, contactId, email: item.email, purpose };
  }
  withdraw(contactId) {
    this.#contacts.delete(contactId);
    for (const [caseId, linked] of this.#links) if (linked === contactId) this.#links.delete(caseId);
    return { futureRecontactBlocked: true, secureErasureGuaranteed: false, publishedAggregateWithdrawalNeedsReview: true };
  }
  publicSummary() { return { mode: 'demo', contactDetailsExposed: false, realContactIntake: false, anonymityClaim: false }; }
}
