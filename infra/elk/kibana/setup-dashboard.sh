#!/bin/bash
set -e

KIBANA_HOST=${KIBANA_HOST:-https://localhost:5601}
ELASTIC_USER=${ELASTIC_USER:-elastic}
ELASTIC_PASSWORD=${ELASTIC_PASSWORD:-changeme}

echo "🎨 Setting up Kibana Dashboard..."

# Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready..."
until curl -sk -u "$ELASTIC_USER:$ELASTIC_PASSWORD" "$KIBANA_HOST/api/status" | grep -q '"level":"available"'; do
  echo "⏳ Kibana not ready yet, retrying in 5s..."
  sleep 5
done
echo "✅ Kibana is ready"

# Create data view (index pattern)
echo "📊 Creating data view for app-logs..."
curl -sk -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
  -X POST "$KIBANA_HOST/api/data_views/data_view" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "data_view": {
      "title": "app-logs-*",
      "name": "Application Logs",
      "timeFieldName": "@timestamp"
    }
  }' || echo "Data view might already exist"

# Get data view ID
DATA_VIEW_ID=$(curl -sk -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
  "$KIBANA_HOST/api/data_views" \
  -H "kbn-xsrf: true" | grep -o '"id":"[^"]*app-logs[^"]*"' | head -1 | cut -d'"' -f4)

echo "📈 Data view ID: $DATA_VIEW_ID"

# Create dashboard with visualizations
echo "🎨 Creating dashboard..."
curl -sk -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
  -X POST "$KIBANA_HOST/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  --form file=@/tmp/dashboard.ndjson

echo ""
echo "✅ Dashboard setup complete!"
echo "🌐 Access Kibana at: $KIBANA_HOST"
echo "👤 Username: $ELASTIC_USER"
echo "🔑 Password: $ELASTIC_PASSWORD"
echo ""
echo "📊 Dashboard: Application Logs Overview"
