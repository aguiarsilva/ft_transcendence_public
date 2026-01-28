#!/bin/sh
set -e

KIBANA_URL="https://kibana:5601"
AUTH="elastic:${ELASTIC_PASSWORD}"
CA_CERT="/tmp/certs/ca.crt"
DASHBOARD_FILE="/saved_objects/ft_transcendence_dashboard.ndjson"

echo "⏳ Waiting for Kibana to be available..."

until curl -k -s "$KIBANA_URL/api/status" \
  -u "$AUTH" \
  --cacert "$CA_CERT" | grep -q '"level":"available"'; do
  sleep 5
done

echo "📊 Importing Kibana saved objects..."

curl -k -u "$AUTH" \
  -H "kbn-xsrf: true" \
  -F file=@"$DASHBOARD_FILE" \
  "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  --cacert "$CA_CERT"

echo "✅ Kibana setup completed successfully"