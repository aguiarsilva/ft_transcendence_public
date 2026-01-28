#!/bin/bash
# ============================================================================
# ELK Stack ILM & Index Template Setup with Authentication
# ============================================================================

set -e

ELASTICSEARCH_HOST="${ELASTICSEARCH_HOST:-https://elasticsearch:9200}"
ELASTIC_USERNAME="${ELASTIC_USERNAME:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD:-changeme}"
ELASTICSEARCH_CA_CERTS="${ELASTICSEARCH_CA_CERTS:-/tmp/certs/ca.crt}"

MAX_RETRIES=30
RETRY_DELAY=2

echo "📋 Setting up ELK Stack ILM Policy and Index Template..."

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch at $ELASTICSEARCH_HOST..."
attempt=0
while ! curl -s -k -u "$ELASTIC_USERNAME:$ELASTIC_PASSWORD" "$ELASTICSEARCH_HOST" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -gt $MAX_RETRIES ]; then
    echo "❌ Elasticsearch not ready after $((MAX_RETRIES * RETRY_DELAY))s"
    exit 1
  fi
  echo "   Attempt $attempt/$MAX_RETRIES..."
  sleep $RETRY_DELAY
done
echo "✅ Elasticsearch is ready"

# Get the directory where this script is located
SCRIPT_DIR="/tmp"

# Helper function for curl with SSL and auth
elastic_curl() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -s -k -X "$method" \
      -u "$ELASTIC_USERNAME:$ELASTIC_PASSWORD" \
      -H "Content-Type: application/json" \
      "$ELASTICSEARCH_HOST$endpoint"
  else
    curl -s -k -X "$method" \
      -u "$ELASTIC_USERNAME:$ELASTIC_PASSWORD" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$ELASTICSEARCH_HOST$endpoint"
  fi
}

# Register ILM policy
echo "📋 Registering ILM policy 'app-logs-policy'..."
elastic_curl "PUT" "/_ilm/policy/app-logs-policy" "$(cat "$SCRIPT_DIR/ilm-policy.json")"
echo ""
echo "✅ ILM policy registered"

# Register index template
echo "📋 Registering index template for 'app-logs-*'..."
elastic_curl "PUT" "/_index_template/app-logs-template" "$(cat "$SCRIPT_DIR/index-template.json")"
echo ""
echo "✅ Index template registered"

# Create initial index with ILM policy attached
echo "📋 Creating initial index 'app-logs-000001'..."
elastic_curl "PUT" "/app-logs-000001" '{
  "settings": {
    "index.lifecycle.name": "app-logs-policy",
    "index.lifecycle.rollover_alias": "app-logs"
  }
}' 2>/dev/null || echo "   (Index may already exist)"
echo ""

# Verify ILM policy is attached to the index
echo "📋 Verifying ILM configuration..."
elastic_curl "GET" "/app-logs-000001/_settings" | grep -q "app-logs-policy" && echo "✅ ILM policy successfully attached" || echo "⚠️  Could not verify ILM attachment"
echo ""

echo "🎉 ELK stack ILM and index template setup complete!"
