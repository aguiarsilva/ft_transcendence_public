# ELK Stack for Backend Logging

This directory contains the ELK (Elasticsearch, Logstash, Filebeat) stack configuration for centralized backend application logging with enterprise-grade security.

## 🔐 Security-First Architecture

The ELK stack now complies with major security requirements:
- ✅ **Authentication & Authorization** (X-Pack Security with RBAC)
- ✅ **Encryption in Transit** (SSL/TLS for all components)
- ✅ **Data Protection** (PII/secrets redaction, encryption)
- ✅ **Audit Trail** (comprehensive logging of access & actions)
- ✅ **Data Retention** (automatic lifecycle management)
- ✅ **Backup & Recovery** (snapshot repository)
- ✅ **Network Isolation** (container network segmentation)

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenSSL (for certificate generation)

### 1. Generate Security Certificates

```bash
cd infra/elk
bash generate-certs.sh
```

This creates SSL/TLS certificates for all ELK components.

### 2. Configure Environment

```bash
# Copy default environment
cp .env.elk .env.elk.prod

# Edit with secure passwords (production)
nano .env.elk.prod
```

**Update these values in production:**
```bash
ELASTIC_PASSWORD=$(openssl rand -base64 32)
KIBANA_PASSWORD=$(openssl rand -base64 32)
LOGSTASH_PASSWORD=$(openssl rand -base64 32)
FILEBEAT_PASSWORD=$(openssl rand -base64 32)
```

### 3. Start ELK Stack

```bash
docker compose up -d
```

This automatically:
1. ✅ Starts Elasticsearch with SSL/TLS and authentication enabled
2. ✅ Creates restricted user accounts (security-setup service)
3. ✅ Registers ILM policy and index templates (setup service)
4. ✅ Starts Kibana, Logstash, and Filebeat with authentication

### 4. Access Kibana

```
URL: https://localhost:5601
Username: elastic
Password: (value from .env.elk)
```

---

## Security Features Breakdown

### Authentication & Authorization

**Default User Accounts:**

| User | Password | Purpose |
|------|----------|---------|
| `elastic` | `$ELASTIC_PASSWORD` | Master admin (all access) |
| `kibana_system` | `$KIBANA_PASSWORD` | Kibana system user |
| `logstash_internal` | `$LOGSTASH_PASSWORD` | Log ingestion service |
| `filebeat_internal` | `$FILEBEAT_PASSWORD` | Log collection service |
| `auditor` | Auto-generated | Read-only audit access |

**Role-Based Access Control (RBAC):**
- Kibana can read logs and manage dashboards
- Logstash can only write to `app-logs-*` indices
- Filebeat can only create indices in `app-logs-*`
- Auditor role has read-only access for compliance

### Encryption

**In Transit (SSL/TLS):**
- Elasticsearch: HTTPS (port 9200)
- Kibana: HTTPS (port 5601)
- Internal communication: TLS encrypted

**Generated Certificates:**
```
certs/
├── ca.crt / ca.key          (Certificate Authority)
├── elasticsearch.p12        (Elasticsearch keystore)
├── kibana.crt / kibana.key
├── logstash.crt / logstash.key
└── filebeat.crt / filebeat.key
```

### Data Protection

**PII & Secrets Redaction:**

Automatically masks sensitive patterns in logs:
- JWT tokens: `Bearer ***REDACTED***`
- Passwords/keys: `password=***REDACTED***`
- Email addresses: `user@***REDACTED***.com`
- Credit cards: `****-****-****-****`

**Where it happens:**
1. Filebeat preprocessor redaction (filebeat.yml)
2. Logstash filter masking (logstash.conf)

### Audit Logging

**What's Audited:**
- ✅ All authentication attempts (success & failure)
- ✅ Authorization failures (access denied)
- ✅ Admin operations (user creation, role changes)
- ✅ Data access patterns

**View in Kibana:**
```
Discover → Filter: log.level_text: "error" AND audit.processed_at: [last 24h]
```

### Data Retention & Archiving (ILM)

**Index Lifecycle Management Policy:**

| Phase | Duration | Actions |
|-------|----------|---------|
| Hot | 0 days | Ingest, rollover daily/at 50GB |
| Warm | 7 days | Compress, merge segments |
| Cold | 14 days | Move to cheaper storage |
| Delete | 30 days | Auto-delete old indices |

**Customize retention (in `ilm-policy.json`):**
```json
"delete": {
  "min_age": "90d",  // Change to 90 days instead of 30
  "actions": { "delete": {} }
}
```

Then re-register:
```bash
bash setup-ilm.sh
```

### Backup & Disaster Recovery

**Snapshot Repository:** `app-logs-backup`

**Create backup:**
```bash
curl -k -X PUT \
  -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-$(date +%Y%m%d) \
  -H 'Content-Type: application/json' \
  -d '{"indices": "app-logs-*"}'
```

**Restore backup:**
```bash
curl -k -X POST \
  -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-20241201/_restore
```

### Network Isolation

**Docker Network Topology:**
```
elk-network (isolated bridge)
├── Elasticsearch (172.27.0.2)  - Internal HTTPS only
├── Logstash (172.27.0.3)       - Internal only
├── Filebeat (172.27.0.4)       - Internal only
└── Kibana (172.27.0.5)         - Exposed on 5601 only
```

Only Kibana and Elasticsearch ports exposed to host (with HTTPS).

---

## Dashboard & Monitoring

### Import Pre-Built Dashboard

```bash
# In Kibana UI:
# 1. Go to Stack Management → Saved Objects
# 2. Click Import
# 3. Select: infra/elk/kibana-dashboard.ndjson
# 4. Import
```

### Monitor ELK Health

```bash
# Check Elasticsearch health
curl -k -u elastic:changeme https://localhost:9200/_cluster/health

# View ILM policy status
curl -k -u elastic:changeme https://localhost:9200/_ilm/status

# Check active connections
curl -k -u elastic:changeme https://localhost:9200/_nodes/stats/http

# View indices
curl -k -u elastic:changeme https://localhost:9200/_cat/indices?v
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | ELK services with security settings |
| `.env.elk` | Environment variables (passwords, retention) |
| `filebeat/filebeat.yml` | Input collection + PII redaction |
| `logstash/pipeline/logstash.conf` | Log processing + data masking |
| `ilm-policy.json` | Retention policy (hot/warm/cold/delete) |
| `index-template.json` | Index schema with security fields |
| `setup-security.sh` | User & role creation script |
| `setup-ilm.sh` | ILM policy registration script |
| `generate-certs.sh` | SSL/TLS certificate generation |
| `SECURITY.md` | Comprehensive security guide |
| `kibana-dashboard.ndjson` | Pre-built dashboard |

---

## Troubleshooting

### Elasticsearch won't start

```bash
# Check logs
docker compose logs elasticsearch

# Verify certificates exist
ls -la certs/

# Check permissions
docker compose logs elasticsearch | grep "permission"
```

### Authentication Failed

```bash
# Verify credentials
cat .env.elk

# Check user exists
curl -k -u elastic:changeme https://localhost:9200/_security/user

# View audit logs
docker compose logs elasticsearch | grep "auth"
```

### No logs appearing in Kibana

```bash
# 1. Check backend is running
docker compose logs backend | tail -20

# 2. Verify log file exists
ls -la backend/logs/backend.log

# 3. Check Filebeat is reading
docker compose logs filebeat | grep "harvester"

# 4. Verify Logstash received data
docker compose logs logstash | grep "received"

# 5. Refresh Kibana data view
# In Kibana: Stack Management → Data Views → app-logs-* → Refresh
```

### Disk space issues

```bash
# Check volume usage
docker volume ls
docker system df

# Adjust retention if needed (ilm-policy.json)
# Change "delete" min_age from 30d to shorter period
```

---

## Production Checklist

- [ ] Replace self-signed certificates with CA-signed ones
- [ ] Change all default passwords in `.env.elk`
- [ ] Set strong `KIBANA_ENCRYPTION_KEY` (min 32 chars)
- [ ] Configure firewall to restrict access (port 5601, 9200)
- [ ] Enable MFA for Kibana access (X-Pack Enterprise)
- [ ] Set up automated backups
- [ ] Configure log rotation for `backend/logs/backend.log`
- [ ] Test disaster recovery (backup & restore)
- [ ] Monitor disk usage (adjust retention if needed)
- [ ] Implement certificate rotation policy

---

## Advanced Configuration

### Enable Mutual TLS (Filebeat ↔ Logstash)

Edit `filebeat/filebeat.yml`:
```yaml
output.logstash:
  ssl.enabled: true
  ssl.certificate_authorities: ["/usr/share/filebeat/certs/ca.crt"]
  ssl.certificate: "/usr/share/filebeat/certs/filebeat.crt"
  ssl.key: "/usr/share/filebeat/certs/filebeat.key"
```

### Change Data Retention

Edit `ilm-policy.json`:
```json
"delete": {
  "min_age": "7d",  // Delete after 7 days
  "actions": { "delete": {} }
}
```

Re-register:
```bash
bash setup-ilm.sh
```

### Add Custom Index Fields

Edit `index-template.json` under `mappings.properties`:
```json
"custom_field": {
  "type": "keyword"
}
```

### Monitor Additional Metrics

Edit `logstash/pipeline/logstash.conf` to add custom fields:
```
mutate {
  add_field => {
    "custom.metric" => "%{field_name}"
  }
}
```

---

## Security Documentation

**For detailed security information, see:** [`SECURITY.md`](./SECURITY.md)

Topics covered:
- Authentication & Authorization details
- SSL/TLS certificate management
- PII redaction patterns
- Audit logging setup
- Compliance checklist
- Backup & recovery procedures

---

## Stopping ELK Stack

```bash
# Stop services
docker compose down

# Remove data (reset everything)
docker compose down -v
```

---

## Support & Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [ILM Best Practices](https://www.elastic.co/guide/en/elasticsearch/reference/current/ilm-concepts.html)
- [X-Pack Security](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api.html)

---

**Last Updated:** December 2, 2024  
**Stack Version:** 8.14.0  
**Security Level:** Production-Ready ✅
