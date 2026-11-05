/* Password-protected local work copies. No network, storage or password recovery. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./workshop-core.js'), require('node:crypto').webcrypto);
  } else if (root) root.WorkshopBackup = factory(root.WorkshopCore, root.crypto);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, webcrypto) {
  'use strict';
  const FORMAT = 'stemmen-workshop-encrypted';
  const VERSION = 1;
  const ITERATIONS = 600000;
  const MAX_FILE_BYTES = 3 * 1024 * 1024;
  const MAX_PLAINTEXT_BYTES = 2 * 1024 * 1024;
  const MAX_CIPHERTEXT_BYTES = MAX_PLAINTEXT_BYTES + 16;
  const MIN_PASSPHRASE_LENGTH = 12, MAX_PASSPHRASE_LENGTH = 1024;
  const ALGORITHM = 'AES-GCM-256', KDF = 'PBKDF2-SHA256';
  const HEADER_KEYS = ['format', 'version', 'algorithm', 'kdf', 'iterations', 'salt', 'iv', 'ciphertext'];
  const encoder = new TextEncoder();
  // All authenticated header values are fixed and strictly checked before key derivation.
  const AAD = encoder.encode('StemmenWorkshopBackup|v1|PBKDF2-SHA256|600000|AES-GCM-256');
  function fail(code) { const error = new Error(code); error.code = code; throw error; }
  function cryptoReady() {
    if (!webcrypto || !webcrypto.subtle || typeof webcrypto.getRandomValues !== 'function') fail('CRYPTO_UNAVAILABLE');
    if (!Core || typeof Core.parse !== 'function' || typeof Core.serialize !== 'function') fail('CORE_UNAVAILABLE');
  }
  function boundedText(text, max) {
    if (typeof text !== 'string') fail('INVALID_ENVELOPE');
    if (text.length > max || encoder.encode(text).byteLength > max) fail('FILE_TOO_LARGE');
  }
  function passphraseBytes(passphrase) {
    if (typeof passphrase !== 'string' || passphrase.length > MAX_PASSPHRASE_LENGTH * 2) fail('INVALID_PASSPHRASE');
    const length = Array.from(passphrase).length;
    if (length < MIN_PASSPHRASE_LENGTH || length > MAX_PASSPHRASE_LENGTH) fail('INVALID_PASSPHRASE');
    // TextEncoder replaces lone surrogates. Reject them so distinct input is not silently normalized.
    for (let i = 0; i < passphrase.length; i++) {
      const value = passphrase.charCodeAt(i);
      if (value >= 0xD800 && value <= 0xDBFF) {
        const next = passphrase.charCodeAt(++i);
        if (!(next >= 0xDC00 && next <= 0xDFFF)) fail('INVALID_PASSPHRASE');
      } else if (value >= 0xDC00 && value <= 0xDFFF) fail('INVALID_PASSPHRASE');
    }
    return encoder.encode(passphrase);
  }
  function base64(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(binary);
  }
  function fromBase64(text, minimum, maximum) {
    if (typeof text !== 'string' || !text.length || text.length > 4 * Math.ceil(maximum / 3) || text.length % 4 !== 0) fail('INVALID_ENVELOPE');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) fail('INVALID_ENVELOPE');
    let bytes;
    try {
      if (typeof Buffer !== 'undefined') bytes = new Uint8Array(Buffer.from(text, 'base64'));
      else { const binary = atob(text); bytes = Uint8Array.from(binary, character => character.charCodeAt(0)); }
    } catch (_) { fail('INVALID_ENVELOPE'); }
    if (bytes.length < minimum || bytes.length > maximum || base64(bytes) !== text) fail('INVALID_ENVELOPE');
    return bytes;
  }
  function readEnvelope(text) {
    boundedText(text, MAX_FILE_BYTES);
    let envelope; try { envelope = JSON.parse(text); } catch (_) { fail('INVALID_ENVELOPE'); }
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) fail('INVALID_ENVELOPE');
    const names = Object.keys(envelope);
    if (names.length !== HEADER_KEYS.length || names.some(name => !HEADER_KEYS.includes(name))) fail('INVALID_ENVELOPE');
    if (envelope.format !== FORMAT || envelope.version !== VERSION || envelope.algorithm !== ALGORITHM || envelope.kdf !== KDF || envelope.iterations !== ITERATIONS) fail('UNSUPPORTED_FORMAT');
    // Both encoded and decoded lengths are bounded before PBKDF2 can run.
    const salt = fromBase64(envelope.salt, 16, 16);
    const iv = fromBase64(envelope.iv, 12, 12);
    const ciphertext = fromBase64(envelope.ciphertext, 16, MAX_CIPHERTEXT_BYTES);
    // Accepted values above are only fixed ASCII identifiers, integers and base64.
    // Thus property tokens cannot occur inside an accepted value; count them to
    // reject duplicate JSON keys, including escaped spellings of the same key.
    const propertyTokens = text.match(/"(?:\\.|[^"\\])*"\s*:/g) || [];
    if (propertyTokens.length !== HEADER_KEYS.length) fail('INVALID_ENVELOPE');
    return { salt, iv, ciphertext };
  }
  async function keyFor(password, salt, usage) {
    const material = await webcrypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveKey']);
    return webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material,
      { name: 'AES-GCM', length: 256 }, false, [usage]);
  }
  async function encrypt(serializedStateText, passphrase) {
    cryptoReady();
    const password = passphraseBytes(passphrase);
    let plaintext;
    try {
      if (typeof serializedStateText !== 'string') fail('INVALID_PLAINTEXT');
      if (serializedStateText.length > MAX_PLAINTEXT_BYTES || encoder.encode(serializedStateText).byteLength > MAX_PLAINTEXT_BYTES) fail('FILE_TOO_LARGE');
      let validated;
      try { validated = Core.serialize(Core.parse(serializedStateText)); } catch (_) { fail('INVALID_PLAINTEXT'); }
      plaintext = encoder.encode(validated);
      if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) fail('FILE_TOO_LARGE');
      const salt = webcrypto.getRandomValues(new Uint8Array(16)), iv = webcrypto.getRandomValues(new Uint8Array(12));
      const key = await keyFor(password, salt, 'encrypt');
      const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD, tagLength: 128 }, key, plaintext));
      return JSON.stringify({ format: FORMAT, version: VERSION, algorithm: ALGORITHM, kdf: KDF, iterations: ITERATIONS,
        salt: base64(salt), iv: base64(iv), ciphertext: base64(ciphertext) }, null, 2);
    } finally {
      password.fill(0);
      if (plaintext) plaintext.fill(0);
    }
  }
  async function decrypt(envelopeText, passphrase) {
    cryptoReady();
    const envelope = readEnvelope(envelopeText);
    const password = passphraseBytes(passphrase);
    let plaintext;
    try {
      const key = await keyFor(password, envelope.salt, 'decrypt');
      plaintext = new Uint8Array(await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: envelope.iv, additionalData: AAD, tagLength: 128 }, key, envelope.ciphertext));
      if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) fail('DECRYPT_FAILED');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
      // Imported local status is draft data only, not verified identity or authorization.
      return Core.serialize(Core.parse(text));
    } catch (_) {
      // Wrong passwords, modified authenticated bytes and invalid decrypted data share one error.
      fail('DECRYPT_FAILED');
    } finally {
      password.fill(0);
      if (plaintext) plaintext.fill(0);
    }
  }
  function isEncryptedEnvelope(text) {
    // Detection is only a bounded routing hint. decrypt() performs complete validation.
    try {
      boundedText(text, MAX_FILE_BYTES);
      const data = JSON.parse(text);
      return !!data && typeof data === 'object' && !Array.isArray(data) && data.format === FORMAT;
    } catch (_) { return false; }
  }
  return Object.freeze({ FORMAT, VERSION, ITERATIONS, MAX_FILE_BYTES, MAX_PLAINTEXT_BYTES, MIN_PASSPHRASE_LENGTH, MAX_PASSPHRASE_LENGTH,
    encrypt, decrypt, isEncryptedEnvelope });
});
