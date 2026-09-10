import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "eventpilot-default-secret-key-32chars-min!!";
  // Always derive a strict 32-byte (256-bit) key using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedData {
  encrypted: string; // hex
  iv: string;        // hex
  tag: string;       // hex
}

/**
 * Encrypts sensitive tokens (OAuth access & refresh tokens) using AES-256-GCM.
 */
export function encryptToken(plainText: string): EncryptedData {
  if (!plainText) {
    throw new Error("Cannot encrypt empty token");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypts AES-256-GCM encrypted token. Throws if authentication tag verification fails.
 */
export function decryptToken(encrypted: string, ivHex: string, tagHex: string): string {
  if (!encrypted || !ivHex || !tagHex) {
    throw new Error("Missing required encryption components for decryption");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
