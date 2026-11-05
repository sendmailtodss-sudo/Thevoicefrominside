/** An explicit, local export of one selected quotation. Never publishes or sends data. */
export function witnessDraftFromQuote(document, check, selected, now = new Date()) {
  if (!document || typeof document.id !== 'string' || !Array.isArray(document.pages) || !check || !Array.isArray(check.verifiedDocumentQuotes)) throw new Error('SOURCE_REQUIRED');
  if (!selected || typeof selected.quote !== 'string' || selected.quote.length < 10 || selected.quote.length > 2000 || !Number.isSafeInteger(selected.page)) throw new Error('SELECT_ONE_QUOTE');
  if (!check.verifiedDocumentQuotes.some(q => q.page === selected.page && q.quote === selected.quote)) throw new Error('QUOTE_NOT_CHECKED');
  if (!document.pages.some(p => p.number === selected.page && typeof p.text === 'string' && p.text.includes(selected.quote))) throw new Error('QUOTE_NOT_IN_SOURCE');
  const currentYear = now.getUTCFullYear(), year = Number(String(document.decisionDate).slice(0, 4));
  if (!Number.isInteger(year) || year < 1980 || year > currentYear) throw new Error('CHECK_SOURCE_DATE');
  const sourceReference = `${document.id} · p. ${selected.page}`;
  if (sourceReference.length > 500) throw new Error('SOURCE_REFERENCE_TOO_LONG');
  return {
    kind: 'other', institution: 'other', yearFrom: year, yearTo: year, role: 'other',
    claim: '', sourceReference, quote: selected.quote, confirms: '', doesNotConfirm: '',
    aiFlag: check.outcome === 'flag', consentPrivate: false, requestPublic: false
  };
}
