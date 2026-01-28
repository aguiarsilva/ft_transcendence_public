const vaultAddr = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
const vaultToken = process.env.VAULT_TOKEN;

export async function getSecretFromVault(path: string, key: string): Promise<string | null> {
  if (!vaultToken) return null;

  try {
    const res = await fetch(`${vaultAddr}/v1/${path}`, {
      headers: { "X-Vault-Token": vaultToken },
    });

    if (!res.ok) {
      console.warn(`Vault request failed for ${path}:${key} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data?.data?.data?.[key] ?? null;
  } catch (err) {
    console.warn("Vault error:", err);
    return null;
  }
}
