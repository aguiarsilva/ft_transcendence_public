#!/bin/bash
# ============================================================================
# ELK Stack SSL/TLS Certificate Generation
# Generates self-signed certificates for development/testing
# For production, use certificates from a trusted Certificate Authority
# ============================================================================

set -e

CERT_DIR="./certs"
DAYS_VALID=365
KEY_SIZE=2048

# Load keystore password from .env.elk
if [ -f ".env.elk" ]; then
  export $(grep KEYSTORE_PASSWORD .env.elk | xargs)
fi

# Use loaded password or default
KEYSTORE_PASS="${KEYSTORE_PASSWORD:-changeme}"

echo "🔐 Generating ELK Stack SSL/TLS Certificates..."
echo "   Validity period: $DAYS_VALID days"
echo "   Output directory: $CERT_DIR"
echo "   Using keystore password from .env.elk"
echo ""

# Create certs directory
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# ============================================================================
# 1. GENERATE CA (Certificate Authority)
# ============================================================================
echo "1️⃣  Generating CA (Certificate Authority)..."
openssl genrsa -out ca.key $KEY_SIZE 2>/dev/null
openssl req -new -x509 \
  -days $DAYS_VALID \
  -key ca.key \
  -out ca.crt \
  -subj "/CN=ELK-CA/O=ft_transcendence/C=US" \
  2>/dev/null
echo "   ✅ CA certificate created"

# ============================================================================
# 2. GENERATE ELASTICSEARCH CERTIFICATE
# ============================================================================
echo "2️⃣  Generating Elasticsearch certificate..."
openssl genrsa -out elasticsearch.key $KEY_SIZE 2>/dev/null

# Create config for SAN (Subject Alternative Names)
cat > elasticsearch.cnf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = elasticsearch
O = ft_transcendence
C = US

[v3_req]
subjectAltName = DNS:elasticsearch,DNS:localhost,IP:127.0.0.1,IP:172.27.0.2
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
EOF

openssl req -new \
  -key elasticsearch.key \
  -out elasticsearch.csr \
  -config elasticsearch.cnf \
  2>/dev/null

openssl x509 -req \
  -days $DAYS_VALID \
  -in elasticsearch.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out elasticsearch.crt \
  -extensions v3_req \
  -extfile elasticsearch.cnf \
  2>/dev/null

# Create PKCS#12 keystore (Elasticsearch format)
openssl pkcs12 -export \
  -in elasticsearch.crt \
  -inkey elasticsearch.key \
  -out elasticsearch.p12 \
  -name elasticsearch \
  -passout pass:$KEYSTORE_PASS \
  2>/dev/null

# Create truststore with CA certificate
keytool -importcert \
  -file ca.crt \
  -keystore elasticsearch.truststore.p12 \
  -storetype PKCS12 \
  -storepass $KEYSTORE_PASS \
  -alias ca \
  -noprompt \
  2>/dev/null

rm elasticsearch.cnf elasticsearch.csr
echo "   ✅ Elasticsearch certificate created (elasticsearch.p12, elasticsearch.truststore.p12)"

# ============================================================================
# 3. GENERATE KIBANA CERTIFICATE
# ============================================================================
echo "3️⃣  Generating Kibana certificate..."
openssl genrsa -out kibana.key $KEY_SIZE 2>/dev/null

openssl req -new \
  -key kibana.key \
  -out kibana.csr \
  -subj "/CN=kibana/O=ft_transcendence/C=US" \
  2>/dev/null

openssl x509 -req \
  -days $DAYS_VALID \
  -in kibana.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out kibana.crt \
  2>/dev/null

rm kibana.csr
echo "   ✅ Kibana certificate created"

# ============================================================================
# 4. GENERATE LOGSTASH CERTIFICATE
# ============================================================================
echo "4️⃣  Generating Logstash certificate..."
openssl genrsa -out logstash.key $KEY_SIZE 2>/dev/null

openssl req -new \
  -key logstash.key \
  -out logstash.csr \
  -subj "/CN=logstash/O=ft_transcendence/C=US" \
  2>/dev/null

openssl x509 -req \
  -days $DAYS_VALID \
  -in logstash.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out logstash.crt \
  2>/dev/null

rm logstash.csr
echo "   ✅ Logstash certificate created"

# ============================================================================
# 5. GENERATE FILEBEAT CERTIFICATE
# ============================================================================
echo "5️⃣  Generating Filebeat certificate..."
openssl genrsa -out filebeat.key $KEY_SIZE 2>/dev/null

openssl req -new \
  -key filebeat.key \
  -out filebeat.csr \
  -subj "/CN=filebeat/O=ft_transcendence/C=US" \
  2>/dev/null

openssl x509 -req \
  -days $DAYS_VALID \
  -in filebeat.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out filebeat.crt \
  2>/dev/null
truststore.p12 elasticsearch.
rm filebeat.csr
echo "   ✅ Filebeat certificate created"

# ============================================================================
# 6. SET PROPER PERMISSIONS
# ============================================================================
echo "6️⃣  Setting certificate permissions..."
chmod 644 ca.crt
chmod 600 ca.key
chmod 644 elasticsearch.p12 elasticsearch.crt
chmod 600 elasticsearch.key
chmod 644 kibana.crt
chmod 600 kibana.key
chmod 644 logstash.crt
chmod 600 logstash.key
chmod 644 filebeat.crt
chmod 600 filebeat.key
echo "   ✅ Permissions set"

cd - > /dev/null

echo ""
echo "✅ SSL/TLS Certificate generation complete!"
echo ""
echo "📋 Generated files:"
ls -lh "$CERT_DIR"/ | tail -n +2 | awk '{print "   " $9, "(" $5 ")"}'
echo ""
echo "⚠️  IMPORTANT:"
echo "   - These are SELF-SIGNED certificates for development only"
echo "   - For PRODUCTION, use certificates from a trusted CA"
echo "   - Store ca.key securely; never commit to version control"
echo "   - Update elasticsearch.p12 password in production"
echo ""
echo "🔐 Next steps:"
echo "   1. Update .env.elk with secure passwords"
echo "   2. Update logstash.conf with certificate paths if using mutual TLS"
echo "   3. Update filebeat.yml with certificate verification if needed"
echo "   4. Run: docker compose up -d"
echo ""
