#!/bin/sh
set -eu

ELASTIC_HOST=${ELASTICSEARCH_HOST:-https://elasticsearch:9200}
ELASTIC_PASSWORD=${ELASTIC_PASSWORD:-changeme}
KIBANA_PASSWORD=${KIBANA_PASSWORD:-changeme}
LOGSTASH_PASSWORD=${LOGSTASH_PASSWORD:-changeme}
FILEBEAT_PASSWORD=${FILEBEAT_PASSWORD:-changeme}
AUDITOR_PASSWORD=${AUDITOR_PASSWORD:-changeme}

echo "🔐 Setting up ELK Stack Security..."

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch at $ELASTIC_HOST..."
while true; do
  if curl -s -k -u elastic:$ELASTIC_PASSWORD "$ELASTIC_HOST" | grep -q 'You Know, for Search'; then
    echo "✅ Elasticsearch is ready"
    break
  else
    echo "⏳ Elasticsearch not ready yet, retrying in 5s..."
    sleep 5
  fi
done

# ---------------------------
# Reserved users: set passwords only
# ---------------------------
echo "📝 Setting password for kibana_system..."
curl -s -k -u elastic:$ELASTIC_PASSWORD -X POST "$ELASTIC_HOST/_security/user/kibana_system/_password" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$KIBANA_PASSWORD\"}"

echo "📝 Setting password for elastic..."
curl -s -k -u elastic:$ELASTIC_PASSWORD -X POST "$ELASTIC_HOST/_security/user/elastic/_password" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$ELASTIC_PASSWORD\"}"

# ---------------------------
# Internal service users
# ---------------------------
create_user() {
  USERNAME=$1
  PASSWORD=$2
  ROLE=$3

  # Create role if not exists
  if ! curl -s -k -u elastic:$ELASTIC_PASSWORD "$ELASTIC_HOST/_security/role/$ROLE" | grep -q '"found":true'; then
    echo "📝 Creating role $ROLE..."
    curl -s -k -u elastic:$ELASTIC_PASSWORD -X PUT "$ELASTIC_HOST/_security/role/$ROLE" \
      -H "Content-Type: application/json" \
      -d "{\"cluster\": [\"manage_index_templates\",\"monitor\"], \"indices\": [{\"names\":[\"*\"], \"privileges\":[\"write\",\"create_index\",\"read\"]}]}"
  else
    echo "✅ Role $ROLE already exists"
  fi

  # Create user if not exists
  if ! curl -s -k -u elastic:$ELASTIC_PASSWORD "$ELASTIC_HOST/_security/user/$USERNAME" | grep -q '"found":true'; then
    echo "📝 Creating user $USERNAME..."
    curl -s -k -u elastic:$ELASTIC_PASSWORD -X POST "$ELASTIC_HOST/_security/user/$USERNAME" \
      -H "Content-Type: application/json" \
      -d "{\"password\":\"$PASSWORD\", \"roles\":[\"$ROLE\"], \"full_name\":\"$USERNAME\"}"
  else
    echo "✅ User $USERNAME already exists, updating password..."
    curl -s -k -u elastic:$ELASTIC_PASSWORD -X POST "$ELASTIC_HOST/_security/user/$USERNAME/_password" \
      -H "Content-Type: application/json" \
      -d "{\"password\":\"$PASSWORD\"}"
  fi
}

# Create Logstash, Filebeat, and Auditor users
create_user "logstash_internal" "$LOGSTASH_PASSWORD" "logstash_internal"
create_user "filebeat_internal" "$FILEBEAT_PASSWORD" "filebeat_internal"
create_user "auditor" "$AUDITOR_PASSWORD" "logs_auditor"

echo "🎉 ELK Stack security setup complete!"
