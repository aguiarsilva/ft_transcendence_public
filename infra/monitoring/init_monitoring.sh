#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== FT_Transcendence Monitoring Credentials Setup ==="
echo ""

# Generate secure random password and secret key
echo "Generating secure credentials..."
GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)
SECRET_KEY=$(openssl rand -base64 32)

# Create .env file with the secure credentials
echo "Creating .env file with secure credentials..."
cat > .env << EOF
# Grafana Admin Credentials (Auto-generated)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

# Grafana Secret Key
GRAFANA_SECRET_KEY=${SECRET_KEY}
EOF

chmod 600 .env

# Update root .env file with Grafana credentials
if [ -f "$ROOT_DIR/.env" ]; then
  # Remove old GRAFANA lines and add new ones
  grep -v "GRAFANA_ADMIN_USER\|GRAFANA_ADMIN_PASSWORD\|GRAFANA_SECRET_KEY" "$ROOT_DIR/.env" > "$ROOT_DIR/.env.tmp"
  cat >> "$ROOT_DIR/.env.tmp" << EOF

# Grafana Admin Credentials (Auto-generated)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
GRAFANA_SECRET_KEY=${SECRET_KEY}
EOF
  mv "$ROOT_DIR/.env.tmp" "$ROOT_DIR/.env"
fi

# Save credentials for reference
cat > .grafana_credentials << EOF
===================================
GRAFANA ADMIN CREDENTIALS
===================================
URL: http://localhost:4000
Username: admin
Password: ${GRAFANA_PASSWORD}

Prometheus: http://localhost:9090

⚠️  Keep these credentials secure!
=================================
EOF

chmod 600 .grafana_credentials

echo ""
echo "✅ Credentials generated!"
echo ""
echo "📝 Credentials saved to: $SCRIPT_DIR/.env"
echo "💾 Reference saved to: $SCRIPT_DIR/.grafana_credentials"
echo ""
echo "🔐 Grafana Credentials:"
echo "   URL: http://localhost:4000"
echo "   Username: admin"
echo "   Password: ${GRAFANA_PASSWORD}"
echo ""
echo "Done! 🎉"
