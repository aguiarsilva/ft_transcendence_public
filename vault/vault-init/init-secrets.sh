#!/bin/sh
set -e

# Start Vault in dev mode in background
vault server -dev \
  -dev-root-token-id=${VAULT_TOKEN} \
  -dev-listen-address=0.0.0.0:8200 &

VAULT_PID=$!

export VAULT_ADDR=${VAULT_ADDR}
export VAULT_TOKEN=${VAULT_TOKEN}

# Wait until Vault responds
until vault status >/dev/null 2>&1; do
  echo "⏳ Waiting for Vault to be ready..."
  sleep 1
done

echo "✅ Vault is ready, populating secrets..."

vault kv put secret/jwt JWT_SECRET="47207beb81b771c7a65868653e604f729fe66bd0f7488ee56389205a630ffee9"
vault kv put secret/oauth CLIENT_ID="922027778026-ppn6j39no943nt8nle0mp3gkrcnuaimn.apps.googleusercontent.com" CLIENT_SECRET="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"
vault kv put secret/encryption ENCRYPTION_KEY="FJb9BWRIY76dndZcbAZPyv8qAvn77FjEfYCSorXGpvc="

echo "🎉 Vault secrets initialized!"

# Keep Vault running in foreground
wait $VAULT_PID
