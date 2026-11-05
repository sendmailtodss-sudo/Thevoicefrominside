// Runs only in the legacy landing document, never in an open workspace.
const target = document.body.dataset.inmaiteTarget;
const hash = window.location.hash || document.body.dataset.inmaiteDefaultHash || '';
window.location.replace(target + window.location.search + hash);
