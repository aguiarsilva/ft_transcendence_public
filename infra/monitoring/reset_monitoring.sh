#!/bin/bash

set -e

echo "=== Resetting Monitoring Setup ==="
echo ""
echo "⚠️  This will delete all monitoring data and configurations!"
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Stop and remove everything
echo "Stopping services..."
docker compose down -v 2>/dev/null || true

# Remove all generated files
echo "Removing configuration files..."
rm -f docker-compose.yml prometheus.yml alerts.yml .env .grafana_credentials .gitignore

# Remove provisioning files
echo "Removing provisioning files..."
rm -rf grafana/

# Remove volumes explicitly
echo "Removing Docker volumes..."
docker volume rm monitoring_grafana_data 2>/dev/null || true
docker volume rm monitoring_prometheus_data 2>/dev/null || true

echo ""
echo "✅ Reset complete!"
echo ""
echo "Now run: ./init_monitoring.sh"
