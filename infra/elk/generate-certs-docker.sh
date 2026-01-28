#!/bin/bash
# Generate Elasticsearch certificates using Docker (no local Java/keytool needed)
set -e

CERT_DIR="./certs"
DAYS_VALID=365

# Load keystore password from .env.elk
if [ -f ".env.elk" ]; then
  export $(grep KEYSTORE_PASSWORD .env.elk | xargs)
fi

KEYSTORE_PASS="${KEYSTORE_PASSWORD:-changeme}"

echo "🔐 Generating ELK Stack SSL/TLS Certificates using Docker..."
echo "   Validity period: $DAYS_VALID days"
echo "   Output directory: $CERT_DIR"
echo "   Using keystore password: ${KEYSTORE_PASS:0:4}***"
echo ""

# Create certs directory
mkdir -p "$CERT_DIR"

# Generate certificates using Elasticsearch container for OpenSSL
docker run --rm \
  -v "$(pwd)/$CERT_DIR:/certs" \
  -e KEYSTORE_PASS="$KEYSTORE_PASS" \
  docker.elastic.co/elasticsearch/elasticsearch:8.14.0 \
  bash -c "
    cd /certs
    
    # Generate CA
    echo '1️⃣  Generating CA...'
    openssl genrsa -out ca.key 2048 2>/dev/null
    openssl req -new -x509 -days $DAYS_VALID -key ca.key -out ca.crt \
      -subj '/CN=ELK-CA/O=ft_transcendence/C=US' 2>/dev/null
    
    # Generate Elasticsearch certificate
    echo '2️⃣  Generating Elasticsearch certificate...'
    openssl genrsa -out elasticsearch.key 2048 2>/dev/null
    
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
subjectAltName = DNS:elasticsearch,DNS:localhost,IP:127.0.0.1
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
EOF
    
    openssl req -new -key elasticsearch.key -out elasticsearch.csr \
      -config elasticsearch.cnf 2>/dev/null
    openssl x509 -req -days $DAYS_VALID -in elasticsearch.csr \
      -CA ca.crt -CAkey ca.key -CAcreateserial -out elasticsearch.crt \
      -extensions v3_req -extfile elasticsearch.cnf 2>/dev/null
    
    # Create PKCS#12 keystore
    openssl pkcs12 -export -in elasticsearch.crt -inkey elasticsearch.key \
      -out elasticsearch.p12 -name elasticsearch \
      -passout pass:\$KEYSTORE_PASS 2>/dev/null
    
    # Create truststore with CA
    keytool -importcert -file ca.crt \
      -keystore elasticsearch.truststore.p12 -storetype PKCS12 \
      -storepass \$KEYSTORE_PASS -alias ca -noprompt 2>/dev/null
    
    # Generate Kibana certificate
    echo '3️⃣  Generating Kibana certificate...'
    openssl genrsa -out kibana.key 2048 2>/dev/null
    openssl req -new -key kibana.key -out kibana.csr \
      -subj '/CN=kibana/O=ft_transcendence/C=US' 2>/dev/null
    openssl x509 -req -days $DAYS_VALID -in kibana.csr \
      -CA ca.crt -CAkey ca.key -CAcreateserial -out kibana.crt 2>/dev/null
    openssl pkcs12 -export -in kibana.crt -inkey kibana.key \
      -out kibana.p12 -name kibana \
      -passout pass:\$KEYSTORE_PASS 2>/dev/null
    
    # Create Elasticsearch keystore (alias for elasticsearch.p12)
    echo '   Creating elasticsearch.keystore.p12...'
    cp elasticsearch.p12 elasticsearch.keystore.p12
    
    # Generate Logstash certificate
    echo '4️⃣  Generating Logstash certificate...'
    openssl genrsa -out logstash.key 2048 2>/dev/null
    
    cat > logstash.cnf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = logstash
O = ft_transcendence
C = US

[v3_req]
subjectAltName = DNS:logstash,DNS:localhost,IP:127.0.0.1
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
EOF
    
    openssl req -new -key logstash.key -out logstash.csr \
      -config logstash.cnf 2>/dev/null
    openssl x509 -req -days $DAYS_VALID -in logstash.csr \
      -CA ca.crt -CAkey ca.key -CAcreateserial -out logstash.crt \
      -extensions v3_req -extfile logstash.cnf 2>/dev/null
    openssl pkcs12 -export -in logstash.crt -inkey logstash.key \
      -out logstash.p12 -name logstash \
      -passout pass:\$KEYSTORE_PASS 2>/dev/null
    
    # Cleanup temp files
    rm -f *.cnf *.csr *.srl
    
    # Set permissions
    chmod 644 *.crt *.p12 *.key
    
    echo '✅ All certificates generated successfully!'
  "
# Create Elasticsearch truststore using Java container
echo "5️⃣  Creating elasticsearch.truststore.p12..."
docker run --rm \
  -v "$(pwd)/$CERT_DIR:/certs" \
  -e KEYSTORE_PASS="$KEYSTORE_PASS" \
  eclipse-temurin:17-jre \
  keytool -importcert -file /certs/ca.crt \
    -keystore /certs/elasticsearch.truststore.p12 -storetype PKCS12 \
    -storepass "$KEYSTORE_PASS" -alias ca -noprompt

echo "   ✅ Truststore created"


echo ""
echo "✅ Certificate generation complete!"
echo "   Files created in: $CERT_DIR/"
ls -lh "$CERT_DIR/"
