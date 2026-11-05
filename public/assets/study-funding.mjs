/* Local synthetic ledger for a lawyer-controlled account. Never connects to a bank.
 * actorId is a demo boundary, not authentication or evidence of bank authority. */
const validId = value => typeof value === 'string' && /^demo-[a-z0-9-]{1,80}$/.test(value);
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const instant = value => {
  requireValue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), 'INVALID_TIME');
  const time = Date.parse(value);
  requireValue(Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19), 'INVALID_TIME');
  return time;
};
const positiveMoney = value => Number.isSafeInteger(value) && value > 0;
const safeTotal = values => {
  let total = 0;
  for (const value of values) { total += value; requireValue(Number.isSafeInteger(total), 'LEDGER_LIMIT_EXCEEDED'); }
  return total;
};
const MAX_ENTRIES = 10000;
const DAY = 86400000;
export function sixCalendarMonthsAfter(value) {
  const date = new Date(instant(value)), originalDay = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay)); return date.toISOString();
}

export class DemoLawyerAccountFund {
  #campaign;
  #lawyerId;
  #legalReviewerId;
  #analysisOperatorId;
  #analysis = null;
  #receipts = new Map();
  #disbursements = new Map();
  #events = new Map();
  #refunds = new Map();
  #review = null;
  #authorization = null;
  #reconciliation = null;
  #lastMatchedReport = null;
  #spleisObservation = null;
  #latestTime = -Infinity;
  constructor({ id = 'demo-lawyer-fund', lawyerId = 'demo-user-lawyer', legalReviewerId = lawyerId, analysisOperatorId = 'demo-analysis-operator', deadline, thresholdCases = 100, goalMinor = 5000000, reviewGraceDays = 7, settlementGraceDays = 7, termsVersion = 'demo-terms-v1', mode = 'demo' }) {
    requireValue(mode === 'demo', 'REAL_PAYMENTS_NOT_CONFIGURED');
    requireValue(validId(id) && validId(lawyerId) && validId(legalReviewerId) && validId(termsVersion), 'INVALID_CAMPAIGN');
    requireValue(validId(analysisOperatorId) && analysisOperatorId !== lawyerId && analysisOperatorId !== legalReviewerId, 'SEPARATE_ANALYSIS_OPERATOR_REQUIRED');
    requireValue(Number.isSafeInteger(thresholdCases) && thresholdCases >= 10, 'INVALID_CASE_THRESHOLD');
    requireValue(positiveMoney(goalMinor), 'INVALID_GOAL');
    requireValue(Number.isInteger(reviewGraceDays) && reviewGraceDays >= 0 && reviewGraceDays <= 30, 'INVALID_REVIEW_GRACE');
    requireValue(Number.isInteger(settlementGraceDays) && settlementGraceDays >= 1 && settlementGraceDays <= 30, 'INVALID_SETTLEMENT_GRACE');
    const closing = instant(deadline);
    this.#lawyerId = lawyerId;
    this.#legalReviewerId = legalReviewerId;
    this.#analysisOperatorId = analysisOperatorId;
    this.#campaign = {
      id, deadline: new Date(closing).toISOString(),
      reviewDeadline: new Date(closing + reviewGraceDays * DAY).toISOString(),
      executionDeadline: new Date(closing + (reviewGraceDays + settlementGraceDays) * DAY).toISOString(),
      thresholdCases, thresholdAnalyzedDecisions: thresholdCases, goalMinor, termsVersion, state: 'collecting-demo'
    };
  }
  #actor(actorId, synthetic) {
    requireValue(synthetic === true, 'SYNTHETIC_OPERATION_REQUIRED');
    requireValue(actorId === this.#lawyerId, 'DESIGNATED_LAWYER_REQUIRED');
  }
  #analysisActor(actorId, synthetic) {
    requireValue(synthetic === true, 'SYNTHETIC_OPERATION_REQUIRED');
    requireValue(actorId === this.#analysisOperatorId, 'ANALYSIS_OPERATOR_REQUIRED');
  }
  #reviewActor(actorId, synthetic) {
    requireValue(synthetic === true, 'SYNTHETIC_OPERATION_REQUIRED');
    requireValue(actorId === this.#legalReviewerId, 'DESIGNATED_LEGAL_REVIEWER_REQUIRED');
  }
  #event(eventId, payload) {
    requireValue(validId(eventId), 'INVALID_EVENT_ID');
    const fingerprint = JSON.stringify(payload);
    if (this.#events.has(eventId)) {
      requireValue(this.#events.get(eventId) === fingerprint, 'EVENT_REPLAY_MISMATCH');
      return null;
    }
    requireValue(this.#events.size < MAX_ENTRIES, 'LEDGER_ENTRY_LIMIT');
    return fingerprint;
  }
  #remember(eventId, fingerprint) { this.#events.set(eventId, fingerprint); }
  #totals() {
    const received = safeTotal([...this.#receipts.values()].map(p => p.amountMinor));
    const spent = safeTotal([...this.#disbursements.values()].map(p => p.amountMinor));
    const refunded = safeTotal([...this.#refunds.values()].map(p => p.confirmedMinor));
    const balance = received - spent - refunded;
    requireValue(Number.isSafeInteger(balance) && balance >= 0, 'NEGATIVE_OR_INVALID_BALANCE');
    return { received, spent, refunded, balance };
  }
  #changedLedger() {
    if (this.#reconciliation?.status === 'matched') this.#reconciliation.status = 'stale';
  }
  #notMismatched() { requireValue(this.#reconciliation?.status !== 'mismatch', 'RECONCILIATION_MISMATCH'); }
  #readiness() {
    const totals = this.#totals();
    const analysisThresholdMet = Boolean(this.#analysis && this.#analysis.analyzedDistinctDecisions >= this.#campaign.thresholdCases);
    const currentReconciliation = this.#reconciliation?.status === 'matched';
    const fundingGoalMet = currentReconciliation && totals.balance >= this.#campaign.goalMinor;
    const campaignEligible = ['collecting-demo', 'review-due-demo', 'authorized-demo'].includes(this.#campaign.state);
    const reasonCodes = [];
    if (!analysisThresholdMet) reasonCodes.push('ANALYSIS_THRESHOLD_NOT_MET');
    if (!currentReconciliation) reasonCodes.push('CURRENT_RECONCILIATION_REQUIRED');
    else if (!fundingGoalMet) reasonCodes.push('FUNDING_GOAL_NOT_MET');
    if (!campaignEligible) reasonCodes.push('CAMPAIGN_NOT_REVIEWABLE');
    return {
      analysisThresholdMet, currentReconciliation, fundingGoalMet, campaignEligible,
      readyToInviteLawyer: analysisThresholdMet && fundingGoalMet && campaignEligible,
      confirmedAvailableMinor: currentReconciliation ? totals.balance : null,
      reasonCodes, automaticLegalAction: false, legalConclusion: false
    };
  }
  #requireReadiness() {
    const readiness = this.#readiness();
    requireValue(readiness.analysisThresholdMet, 'ANALYSIS_THRESHOLD_NOT_MET');
    requireValue(readiness.currentReconciliation, 'CURRENT_RECONCILIATION_REQUIRED');
    requireValue(readiness.fundingGoalMet, 'FUNDING_GOAL_NOT_MET');
    requireValue(readiness.campaignEligible, 'CAMPAIGN_NOT_REVIEWABLE');
  }
  #reviewable(now) {
    this.advance(now);
    requireValue(['collecting-demo', 'review-due-demo', 'authorized-demo'].includes(this.#campaign.state), 'CAMPAIGN_NOT_REVIEWABLE');
  }
  #refundRequired() {
    this.#authorization = null;
    this.#campaign.state = this.#totals().balance > 0 ? 'refund-required-demo' : 'closed-empty-demo';
  }
  recordBankReceipt({ id, eventId, amountMinor, currency = 'NOK', actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(validId(id) && positiveMoney(amountMinor) && currency === 'NOK', 'INVALID_RECEIPT');
    const fingerprint = this.#event(eventId, ['receipt', id, amountMinor, currency]);
    if (fingerprint === null) return { duplicate: true, ...this.summary() };
    this.advance(now);
    requireValue(this.#campaign.state === 'collecting-demo', 'COLLECTION_CLOSED');
    requireValue(!this.#receipts.has(id), 'DUPLICATE_CONTRIBUTION');
    safeTotal([this.#totals().received, amountMinor]);
    this.#receipts.set(id, { id, amountMinor });
    this.#remember(eventId, fingerprint); this.#changedLedger();
    return { duplicate: false, ...this.summary() };
  }
  reconcileAccount({ statementId, balanceMinor, actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(Number.isSafeInteger(balanceMinor) && balanceMinor >= 0, 'INVALID_BALANCE');
    const fingerprint = this.#event(statementId, ['statement', balanceMinor]);
    if (fingerprint === null) return { duplicate: true, ...this.summary() };
    this.advance(now);
    const status = balanceMinor === this.#totals().balance ? 'matched' : 'mismatch';
    this.#reconciliation = { status };
    if (status === 'matched') {
      const totals = this.#totals();
      this.#lastMatchedReport = { asOf: new Date(instant(now)).toISOString(), receivedDemoMinor: totals.received, disbursedDemoMinor: totals.spent, refundedDemoMinor: totals.refunded, heldDemoMinor: totals.balance };
    }
    this.#remember(statementId, fingerprint);
    return { duplicate: false, ...this.summary() };
  }
  recordPreliminaryAnalysis({ reportId, actorId, analyzedDistinctDecisions, distinctParticipants, flaggedDistinctDecisions = 0, asOf, now, synthetic, ...extra }) {
    this.#analysisActor(actorId, synthetic);
    requireValue(Object.keys(extra).length === 0, 'AGGREGATE_ANALYSIS_FIELDS_ONLY');
    requireValue(validId(reportId) && Number.isSafeInteger(analyzedDistinctDecisions) && analyzedDistinctDecisions >= 0 && Number.isSafeInteger(distinctParticipants) && distinctParticipants >= 0 && distinctParticipants <= analyzedDistinctDecisions && (analyzedDistinctDecisions === 0 ? distinctParticipants === 0 : distinctParticipants > 0), 'INVALID_ANALYSIS_REPORT');
    requireValue(Number.isSafeInteger(flaggedDistinctDecisions) && flaggedDistinctDecisions >= 0 && flaggedDistinctDecisions <= analyzedDistinctDecisions, 'INVALID_ANALYSIS_FLAGS');
    const reportTime = instant(asOf), recordedTime = instant(now);
    requireValue(reportTime <= recordedTime, 'ANALYSIS_REPORT_IN_FUTURE');
    const reportDate = new Date(reportTime).toISOString();
    const fingerprint = this.#event(reportId, ['preliminary-analysis', analyzedDistinctDecisions, distinctParticipants, flaggedDistinctDecisions, reportDate]);
    if (fingerprint === null) return this.summary();
    requireValue(!this.#analysis || reportTime >= instant(this.#analysis.asOf), 'OLDER_ANALYSIS_REPORT');
    this.advance(now);
    this.#analysis = { reportId, asOf: reportDate, analyzedDistinctDecisions, distinctParticipants, flaggedDistinctDecisions, legalReview: false, source: 'preliminary-machine-analysis-demo' };
    // Analysis collection is independent of legal work and bank authority. A new
    // report never approves spending or changes a previously authorized budget.
    this.#remember(reportId, fingerprint);
    return this.summary();
  }
  recordSpleisObservation({ eventId, grossRaisedMinor, asOf, now, actorId, synthetic, ...extra }) {
    this.#actor(actorId, synthetic);
    requireValue(Object.keys(extra).length === 0, 'AGGREGATE_PROVIDER_FIELDS_ONLY');
    requireValue(Number.isSafeInteger(grossRaisedMinor) && grossRaisedMinor >= 0, 'INVALID_PROVIDER_TOTAL');
    const observed = instant(asOf), recorded = instant(now);
    requireValue(observed <= recorded, 'PROVIDER_REPORT_IN_FUTURE');
    const fingerprint = this.#event(eventId, ['spleis-observation', grossRaisedMinor, new Date(observed).toISOString()]);
    if (fingerprint === null) return this.summary();
    requireValue(!this.#spleisObservation || observed >= instant(this.#spleisObservation.asOf), 'OLDER_PROVIDER_REPORT');
    this.advance(now);
    this.#spleisObservation = { grossRaisedDemoMinor: grossRaisedMinor, asOf: new Date(observed).toISOString(), recordedAt: new Date(recorded).toISOString(), source: 'synthetic-spleis-public-total' };
    // Gross money reported by Spleis is not a receipt on the lawyer's bank account.
    // It cannot fund the case, change reconciliation or authorize disbursement.
    this.#remember(eventId, fingerprint);
    return this.summary();
  }
  recordLawyerReview({ reviewId, actorId, verifiedDistinctCases = 0, recommendation, now, synthetic }) {
    this.#reviewActor(actorId, synthetic);
    requireValue(validId(reviewId) && Number.isSafeInteger(verifiedDistinctCases) && verifiedDistinctCases >= 0, 'INVALID_LEGAL_REVIEW');
    requireValue(['seek-legal-assistance', 'insufficient-material'].includes(recommendation), 'INVALID_RECOMMENDATION');
    const fingerprint = this.#event(reviewId, ['review', verifiedDistinctCases, recommendation]);
    if (fingerprint === null) return this.summary();
    this.#reviewable(now);
    // The first legal assessment starts only after both collection goals are met.
    // Follow-up/withdrawal remains possible after legitimate spending reduces the
    // balance; otherwise an existing mandate could not be withdrawn responsibly.
    if (!this.#review) this.#requireReadiness();
    this.#review = { reviewId, verifiedDistinctCases, recommendation, analysisReportId: this.#analysis?.reportId ?? null };
    this.#authorization = null;
    if (recommendation === 'insufficient-material') this.#refundRequired();
    else this.#campaign.state = this.#totals().spent === 0 && instant(now) < instant(this.#campaign.deadline) ? 'collecting-demo' : 'review-due-demo';
    this.#remember(reviewId, fingerprint);
    return this.summary();
  }
  authorizeLegalWork({ authorizationId, reviewId, budgetMinor, termsVersion, mandateConfirmed, actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(validId(authorizationId) && positiveMoney(budgetMinor), 'INVALID_BUDGET');
    requireValue(mandateConfirmed === true && termsVersion === this.#campaign.termsVersion, 'MANDATE_AND_CURRENT_TERMS_REQUIRED');
    const fingerprint = this.#event(authorizationId, ['authorization', reviewId, budgetMinor, termsVersion]);
    if (fingerprint === null) return this.summary();
    this.#reviewable(now);
    requireValue(this.#review?.reviewId === reviewId && this.#review.recommendation === 'seek-legal-assistance', 'CURRENT_LAWYER_REVIEW_REQUIRED');
    this.#requireReadiness();
    requireValue(this.#review.analysisReportId === this.#analysis?.reportId, 'CURRENT_ANALYSIS_REVIEW_REQUIRED');
    const totals = this.#totals();
    requireValue(budgetMinor <= totals.balance, 'INSUFFICIENT_AVAILABLE_BUDGET');
    requireValue(totals.spent === 0, 'REVISED_SPENDING_REQUIRES_CLOSEOUT');
    this.#authorization = { authorizationId, reviewId, budgetMinor };
    this.#campaign.state = 'authorized-demo';
    this.#remember(authorizationId, fingerprint);
    return this.summary();
  }
  recordBankDisbursement({ id, eventId, authorizationId, amountMinor, recipientType, result = 'confirmed', actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(validId(id) && positiveMoney(amountMinor) && ['confirmed', 'failed'].includes(result), 'INVALID_DISBURSEMENT');
    requireValue(recipientType === 'approved-law-firm', 'LAWFIRM_ONLY');
    const fingerprint = this.#event(eventId, ['disbursement', id, authorizationId, amountMinor, recipientType, result]);
    if (fingerprint === null) return { duplicate: true, ...this.summary() };
    this.advance(now); this.#notMismatched();
    requireValue(this.#campaign.state === 'authorized-demo' && this.#authorization?.authorizationId === authorizationId, 'CURRENT_LAWYER_AUTHORIZATION_REQUIRED');
    requireValue(!this.#disbursements.has(id), 'DUPLICATE_DISBURSEMENT');
    const totals = this.#totals();
    requireValue(amountMinor <= totals.balance && amountMinor <= this.#authorization.budgetMinor - totals.spent, 'DISBURSEMENT_EXCEEDS_BUDGET');
    if (result === 'confirmed') {
      this.#disbursements.set(id, { id, amountMinor }); this.#changedLedger();
      if (this.#totals().balance === 0) this.#campaign.state = 'spent-demo';
    }
    this.#remember(eventId, fingerprint);
    return { duplicate: false, ...this.summary() };
  }
  advance(now) {
    const time = instant(now);
    // A caller cannot rewind a closed campaign using an earlier clock value.
    requireValue(time >= this.#latestTime, 'TIME_CANNOT_MOVE_BACKWARDS');
    this.#latestTime = time;
    if (time >= instant(this.#campaign.executionDeadline) && this.#campaign.state === 'authorized-demo') this.#refundRequired();
    if (time >= instant(this.#campaign.deadline) && this.#campaign.state === 'collecting-demo') this.#campaign.state = 'review-due-demo';
    if (time >= instant(this.#campaign.reviewDeadline) && this.#campaign.state === 'review-due-demo') this.#refundRequired();
    return this.#campaign.state;
  }
  cancelAndRefund({ reason, actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(['legal-review-withdrawn', 'mandate-not-established', 'account-agreement-unavailable', 'unused-balance-closeout', 'lawyer-declined'].includes(reason), 'INVALID_CANCELLATION_REASON');
    this.advance(now);
    requireValue(['collecting-demo', 'review-due-demo', 'authorized-demo'].includes(this.#campaign.state), 'CANCELLATION_NOT_AVAILABLE');
    this.#refundRequired(); return this.summary();
  }
  prepareRefundInstructions({ batchId, actorId, now, synthetic }) {
    this.#actor(actorId, synthetic); requireValue(validId(batchId), 'INVALID_REFUND_BATCH');
    this.advance(now);
    requireValue(['refund-required-demo', 'refund-instructions-demo', 'refunded-demo'].includes(this.#campaign.state), 'REFUNDS_NOT_DUE');
    if (!this.#refunds.size) {
      const { received, balance } = this.#totals();
      // Before spending this returns every contribution in full. After authorized
      // spending, this only demonstrates pro-rata unused-balance closeout.
      const receipts = [...this.#receipts.values()].sort((a, b) => a.id.localeCompare(b.id));
      let assigned = 0;
      const allocations = receipts.map(p => { const amountMinor = Number(BigInt(p.amountMinor) * BigInt(balance) / BigInt(received)); assigned += amountMinor; return { p, amountMinor }; });
      let remainder = balance - assigned;
      for (const allocation of allocations) if (remainder > 0) { allocation.amountMinor++; remainder--; }
      allocations.forEach(({ p, amountMinor }, i) => {
        if (amountMinor > 0) this.#refunds.set(`demo-refund-${String(i + 1).padStart(6, '0')}`, { refundId: `demo-refund-${String(i + 1).padStart(6, '0')}`, contributionId: p.id, amountMinor, confirmedMinor: 0, state: 'pending' });
      });
    }
    if ([...this.#refunds.values()].some(r => r.confirmedMinor < r.amountMinor)) this.#campaign.state = 'refund-instructions-demo';
    return [...this.#refunds.values()].filter(r => r.confirmedMinor < r.amountMinor).map(r => ({ ...r, remainingMinor: r.amountMinor - r.confirmedMinor, currency: 'NOK', synthetic: true, externalInstructionSent: false }));
  }
  recordBankRefund({ refundId, eventId, amountMinor, result, actorId, now, synthetic }) {
    this.#actor(actorId, synthetic);
    requireValue(validId(refundId) && positiveMoney(amountMinor) && ['confirmed', 'failed'].includes(result), 'INVALID_REFUND');
    const fingerprint = this.#event(eventId, ['refund', refundId, amountMinor, result]);
    if (fingerprint === null) return { duplicate: true, ...this.summary() };
    this.advance(now); this.#notMismatched();
    requireValue(this.#campaign.state === 'refund-instructions-demo', 'REFUND_INSTRUCTIONS_REQUIRED');
    const refund = this.#refunds.get(refundId); requireValue(refund, 'UNKNOWN_REFUND');
    requireValue(amountMinor <= refund.amountMinor - refund.confirmedMinor && amountMinor <= this.#totals().balance, 'REFUND_EXCEEDS_REMAINING');
    if (result === 'confirmed') {
      refund.confirmedMinor += amountMinor;
      refund.state = refund.confirmedMinor === refund.amountMinor ? 'confirmed' : 'partially-confirmed';
      this.#changedLedger();
    } else refund.state = 'retry-needed';
    this.#remember(eventId, fingerprint);
    if ([...this.#refunds.values()].every(r => r.confirmedMinor === r.amountMinor)) this.#campaign.state = 'refunded-demo';
    return { duplicate: false, ...this.summary() };
  }
  summary() {
    const totals = this.#totals();
    const refundState = ['refund-required-demo', 'refund-instructions-demo'].includes(this.#campaign.state);
    return {
      ...this.#campaign, synthetic: true, custodyModel: 'lawyer-controlled-account-proposal',
      accountClassification: 'pending-account-agreement', bankAccountEstablished: false, escrowEstablished: false,
      realPaymentsEnabled: false, externalTransferMade: false, bankOperationsAvailable: false,
      spleisObservation: this.#spleisObservation ? structuredClone(this.#spleisObservation) : null,
      providerTotalsIncludedInLedger: false,
      receivedDemoMinor: totals.received, heldDemoMinor: totals.balance, disbursedDemoMinor: totals.spent, refundedDemoMinor: totals.refunded,
      refundDueDemoMinor: refundState ? totals.balance : 0, authorizedBudgetMinor: this.#authorization?.budgetMinor ?? 0,
      distinctVerifiedCases: this.#review?.verifiedDistinctCases ?? 0, humanReviewRecorded: Boolean(this.#review),
      analyzedDistinctDecisions: this.#analysis?.analyzedDistinctDecisions ?? 0,
      distinctParticipants: this.#analysis?.distinctParticipants ?? 0,
      flaggedDistinctDecisions: this.#analysis?.flaggedDistinctDecisions ?? 0,
      preliminaryAnalysis: this.#analysis ? structuredClone(this.#analysis) : null,
      readiness: this.#readiness(),
      pendingRefunds: [...this.#refunds.values()].filter(r => r.confirmedMinor < r.amountMinor).length,
      reconciliationStatus: this.#reconciliation?.status ?? 'unreported',
      lastReportAt: this.#lastMatchedReport?.asOf ?? null, lastReconciledAt: this.#lastMatchedReport?.asOf ?? null,
      reconciledBalanceMinor: this.#lastMatchedReport?.heldDemoMinor ?? null,
      reconciledReport: this.#lastMatchedReport ? structuredClone(this.#lastMatchedReport) : null,
      note: 'Kun lokal simulering. Foreløpig maskinelt analysert materiale og innsamling kommer før saklig advokatvurdering. Nok analyserte unike vedtak og full finansiering i aktuell avstemt tilgjengelig saldo gir grunnlag for å invitere advokat til vurdering, ikke en juridisk konklusjon eller tillatelse til å bruke penger. Ingen konto er opprettet. Bare advokaten skal disponere en eventuell avtalt konto utenfor nettstedet; ID-kontrollen her er ikke sikker innlogging.'
    };
  }
}

/** No production payment path exists. The website never disposes bank funds. */
export class UnconfiguredPaymentAdapter {
  async createPayment() { throw new Error('LAWYER_ACCOUNT_NOT_ESTABLISHED'); }
  async refund() { throw new Error('BANK_OPERATIONS_NOT_AVAILABLE'); }
  async payout() { throw new Error('BANK_OPERATIONS_NOT_AVAILABLE'); }
}
