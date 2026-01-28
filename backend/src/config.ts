import { getSecretFromVault } from "./helpers/vault.js";

async function loadConfig() {
  // === JWT Secret ===
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    const v = await getSecretFromVault("secret/data/jwt", "JWT_SECRET");
    jwtSecret = v ?? undefined;
  }
  if (!jwtSecret) throw new Error("❌ Missing JWT_SECRET (not in .env or Vault)");
  if (jwtSecret.length < 32) throw new Error("❌ JWT_SECRET must be at least 32 characters long");

  // === Encryption Key ===
  let encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    const v = await getSecretFromVault("secret/data/encryption", "ENCRYPTION_KEY");
    encryptionKey = v ?? undefined;
  }
  if (!encryptionKey) throw new Error("❌ Missing ENCRYPTION_KEY (not in .env or Vault)");

  // === Google OAuth ===
  let googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    const v = await getSecretFromVault("secret/data/oauth", "CLIENT_ID");
    googleClientId = v ?? undefined;
  }
  if (!googleClientId) throw new Error("❌ Missing GOOGLE_CLIENT_ID (not in .env or Vault)");

  let googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!googleClientSecret) {
    const v = await getSecretFromVault("secret/data/oauth", "CLIENT_SECRET");
    googleClientSecret = v ?? undefined;
  }
  if (!googleClientSecret) throw new Error("❌ Missing GOOGLE_CLIENT_SECRET (not in .env or Vault)");

  const corsOrigins = process.env.CORS_ORIGINS;
  if (!corsOrigins) {
    throw new Error("❌ Missing CORS_ORIGINS");
  }

  return {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "3001"),
    apiPrefix: "/api/v1",
    cors: {
      origins: corsOrigins.split(',').map(s => s.trim()),
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
    encryptionKey,
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
    db: {
      type: "sqlite",
      // DB_NAME should be a file path (not a directory). Example for Docker: /data/data.sqlite
      database: process.env.DB_NAME || "./data.sqlite",
      synchronize: true,
      logging: false,
    },
  };
}

export default await loadConfig();
