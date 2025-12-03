# ELK Stack Deployment Guide

Quick reference for deploying the secure ELK stack in ft_transcendence.

## 🚀 Deployment Steps

### Step 1: Generate Certificates (First Time Only)

```bash
cd infra/elk
bash generate-certs.sh
```

Expected output:
```
✅ SSL/TLS Certificate generation complete!
✅ Generated files:
   ca.crt (ca.key)          (Certificate Authority)
   elasticsearch.p12 (Elasticsearch keystore)
   kibana.crt (kibana.key)
   logstash.crt (logstash.key)
   filebeat.crt (filebeat.key)
```

### Step 2: Configure Passwords

```bash
# For development (use defaults)
docker compose up -d

# For production (use secure passwords)
# Edit .env.elk with strong passwords:
ELASTIC_PASSWORD=$(openssl rand -base64 32)
KIBANA_PASSWORD=$(openssl rand -base64 32)
LOGSTASH_PASSWORD=$(openssl rand -base64 32)
FILEBEAT_PASSWORD=$(openssl rand -base64 32)
KIBANA_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Update .env.elk before starting
nano .env.elk
```

### Step 3: Start ELK Stack

```bash
docker compose up -d
```

**Automated Setup:**
1. Security service creates users and roles (wait 10-15 seconds)
2. ILM service registers policies and templates
3. Services start automatically

### Step 4: Verify Installation

```bash
# Check all services are running
docker compose ps

# Verify Elasticsearch health
curl -k -u elastic:changeme https://localhost:9200/_cluster/health

# Verify Kibana is accessible
curl -k -u elastic:changeme https://localhost:5601/api/status
```

### Step 5: Access Kibana Dashboard

```
URL: https://localhost:5601
Username: elastic
Password: changeme (or your custom password)
```

## 📊 Post-Deployment Configuration

### Import Dashboard

In Kibana UI:
1. Stack Management → Saved Objects
2. Click Import
3. Select: `infra/elk/kibana-dashboard.ndjson`
4. Click Import

### Create Data View (if needed)

In Kibana UI:
1. Stack Management → Data Views
2. Create Data View
3. Name: `app-logs-*`
4. Timestamp: `@timestamp`
5. Create

### Verify Logs are Flowing

```bash
# 1. Check backend log file exists
ls -la backend/logs/backend.log

# 2. Check Filebeat is reading
docker compose logs filebeat | grep "harvester"

# 3. Query Elasticsearch
curl -k -u elastic:changeme \
  'https://localhost:9200/app-logs-*/_search?size=5' | jq

# 4. Go to Kibana Discover tab
# Select data view: app-logs-*
# Should see recent logs
```

## 🔑 Managing Credentials

### View Current Passwords

```bash
cat .env.elk
```

### Change Elasticsearch Master Password

```bash
# 1. Access Elasticsearch
curl -k -u elastic:OLD_PASSWORD \
  -X POST \
  https://localhost:9200/_security/user/elastic/_password \
  -H 'Content-Type: application/json' \
  -d '{"password":"NEW_PASSWORD"}'

# 2. Update .env.elk
ELASTIC_PASSWORD=NEW_PASSWORD
```

### Change User Passwords

```bash
# Kibana system user
curl -k -u elastic:changeme \
  -X POST \
  https://localhost:9200/_security/user/kibana_system/_password \
  -H 'Content-Type: application/json' \
  -d '{"password":"NEW_PASSWORD"}'

# Update docker-compose.yml environment variable
```

## 🔍 Monitoring

### Check Service Status

```bash
# All services
docker compose ps

# Specific service logs
docker compose logs elasticsearch
docker compose logs kibana
docker compose logs logstash
docker compose logs filebeat
```

### Monitor Disk Usage

```bash
# Volume usage
docker volume ls
docker system df

# Elasticsearch data size
curl -k -u elastic:changeme \
  https://localhost:9200/_cat/indices?v
```

### Check ILM Policy Status

```bash
# View active ILM policies
curl -k -u elastic:changeme \
  https://localhost:9200/_ilm/status

# Check specific index ILM phase
curl -k -u elastic:changeme \
  https://localhost:9200/app-logs-000001/_ilm/explain
```

## 🔧 Troubleshooting

### Services not starting

```bash
# Check logs
docker compose logs

# Verify certs exist
ls -la certs/

# Check Docker resources
docker stats
```

### Cannot connect to Elasticsearch

```bash
# Test connection
curl -k https://localhost:9200

# With auth
curl -k -u elastic:changeme https://localhost:9200

# Check firewall
sudo ufw status
```

### Logs not appearing in Kibana

```bash
# 1. Check backend is logging
docker compose logs backend | tail -10

# 2. Check file exists and has content
tail -f backend/logs/backend.log

# 3. Check Filebeat is running
docker compose logs filebeat | tail -10

# 4. Check Logstash is receiving
docker compose logs logstash | tail -10

# 5. Refresh Kibana data view
# In Kibana UI: Stack Management → Data Views → click refresh
```

## 🛑 Stopping & Cleanup

### Stop Services

```bash
# Stop without removing volumes
docker compose stop

# Stop and remove containers (keeps volumes)
docker compose down

# Stop and remove everything (including data)
docker compose down -v
```

### Backup Before Cleanup

```bash
# Create snapshot
curl -k -X PUT \
  -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-final \
  -H 'Content-Type: application/json' \
  -d '{"indices":"app-logs-*"}'

# Verify backup
curl -k -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-final
```

## 🔐 Security Checklist

- [ ] Generated SSL/TLS certificates (`generate-certs.sh`)
- [ ] Changed default passwords in `.env.elk`
- [ ] Set strong `KIBANA_ENCRYPTION_KEY` (min 32 chars)
- [ ] Verified all services running (`docker compose ps`)
- [ ] Tested Kibana access
- [ ] Imported dashboard
- [ ] Verified logs flowing (Kibana Discover)
- [ ] Set up backups
- [ ] Configured firewall rules
- [ ] Documented passwords (secure location)
- [ ] Tested restore from backup

## 📋 Common Commands

```bash
# View all ELK services
docker compose ps

# Follow Elasticsearch logs
docker compose logs -f elasticsearch

# Check Elasticsearch health
curl -k -u elastic:changeme https://localhost:9200/_cluster/health

# List all indices
curl -k -u elastic:changeme https://localhost:9200/_cat/indices?v

# Count documents
curl -k -u elastic:changeme https://localhost:9200/app-logs-*/_count

# Search recent logs
curl -k -u elastic:changeme \
  'https://localhost:9200/app-logs-*/_search?sort=@timestamp:desc&size=10'

# Delete old index
curl -k -X DELETE \
  -u elastic:changeme \
  https://localhost:9200/app-logs-2024.11.01

# View users
curl -k -u elastic:changeme https://localhost:9200/_security/user

# View roles
curl -k -u elastic:changeme https://localhost:9200/_security/role
```

## 📞 Next Steps

1. Read [`SECURITY.md`](./SECURITY.md) for detailed security information
2. Review [`docker-compose.yml`](./docker-compose.yml) for configuration details
3. Check [`README_UPDATED.md`](./README_UPDATED.md) for complete documentation
4. Set up monitoring alerts in Kibana
5. Schedule regular backup testing

---

**For production deployment, follow the security checklist in [`SECURITY.md`](./SECURITY.md)**
