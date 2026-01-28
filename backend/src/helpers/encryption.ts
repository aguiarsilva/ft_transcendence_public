import crypto from "crypto";
import config from "../config.js";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 16;

const rawKey = config.encryptionKey;
const KEY = Buffer.from(rawKey, "base64");

if (KEY.length !== 32) {
  throw new Error(
    `❌ ENCRYPTION_KEY must be base64-encoded 32 bytes, but got ${KEY.length}`
  );
}

// Encrypt
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    encrypted.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

// Decrypt
export function decrypt(data: string): string {
  const [ivB64, encryptedB64, authTagB64] = data.split(":");
  if (!ivB64 || !encryptedB64 || !authTagB64) {
    throw new Error("❌ Invalid encrypted data format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
