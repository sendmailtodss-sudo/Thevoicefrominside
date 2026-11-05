// Only the retired legal-hub landing page loads this file.
const target = document.body.dataset.legalHubTarget;
window.location.replace(target + window.location.search + window.location.hash);
