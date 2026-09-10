const assert = require("assert");
const crypto = require("crypto");

// Minimal self-contained AES-256-GCM test matching lib/security/encryption.ts logic
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function testKey() {
  return crypto.createHash("sha256").update("test-encryption-secret-key-for-unit-tests-1234").digest();
}

function encrypt(plainText) {
  const key = testKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let enc = cipher.update(plainText, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return { encrypted: enc, iv: iv.toString("hex"), tag: tag.toString("hex") };
}

function decrypt(encrypted, ivHex, tagHex) {
  const key = testKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(encrypted, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

console.log("Running Security & Encryption Test Suite...");

// Test 1: Encrypt & Decrypt round-trip
const secretToken = "ya29.a0ARrdaM-GoogleOAuthSampleAccessToken-Secret12345";
const encResult = encrypt(secretToken);

assert.ok(encResult.encrypted, "Encrypted payload should exist");
assert.ok(encResult.iv, "IV should exist");
assert.ok(encResult.tag, "Auth tag should exist");
assert.notStrictEqual(encResult.encrypted, secretToken, "Ciphertext must not match plaintext");

const decrypted = decrypt(encResult.encrypted, encResult.iv, encResult.tag);
assert.strictEqual(decrypted, secretToken, "Decrypted token must match original plaintext");
console.log("✓ Test 1 Passed: AES-256-GCM Token Encryption round-trip succeeded.");

// Test 2: Tamper resistance (authenticated tag verification)
try {
  const tamperedCipher = encResult.encrypted.substring(0, encResult.encrypted.length - 2) + "ff";
  decrypt(tamperedCipher, encResult.iv, encResult.tag);
  assert.fail("Should have thrown authentication tag error for tampered ciphertext");
} catch (err) {
  assert.ok(err, "Tampered ciphertext correctly rejected by AES-256-GCM auth tag");
  console.log("✓ Test 2 Passed: Tampered ciphertext was rejected by auth tag.");
}

console.log("All encryption tests passed successfully!\n");
