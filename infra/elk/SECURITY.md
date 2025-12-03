# ELK Stack Security Hardening & Compliance Guide

This document details the security measures implemented in the ft_transcendence ELK stack to comply with enterprise log management requirements.

## 🔐 Security Features Implemented

### 1. **Authentication & Authorization (X-Pack Security)**

#### Status: ✅ ENABLED

**What's Protected:**
- All Elasticsearch API access requires username/password authentication
- Role-Based Access Control (RBAC) restricts users to specific indices and operations
- API keys and tokens enabled for service-to-service communication

**User Roles Created:**

| Role | Purpose | Access |
|------|---------|--------|
| `kibana_admin` | Kibana system user | `.kibana*` indices + `app-logs-*` read access |
| `logstash_internal` | Log ingestion service | Write to `app-logs-*`, manage ILM |
| `filebeat_internal` | Log collection service | Create indices in `app-logs-*` |
| `logs_auditor` | Compliance/audit read-only | Read all logs + audit trail |
| `elastic` | Master admin (default) | Full cluster access |

**Default Credentials:**
```bash
# Master user
Username: elastic
Password: $ELASTIC_PASSWORD (set in .env.elk)

# Other service accounts
kibana_system: $KIBANA_PASSWORD
logstash_internal: $LOGSTASH_PASSWORD
filebeat_internal: $FILEBEAT_PASSWORD
```

⚠️ **PRODUCTION REQUIREMENT:** Change all passwords to strong, randomly-generated values:
```bash
# Generate secure passwords
ELASTIC_PASSWORD=$(openssl rand -base64 32)
KIBANA_PASSWORD=$(openssl rand -base64 32)
LOGSTASH_PASSWORD=$(openssl rand -base64 32)
FILEBEAT_PASSWORD=$(openssl rand -base64 32)

# Update .env.elk with these values
```

---

### 2. **Encryption in Transit (SSL/TLS)**

#### Status: ✅ ENABLED

**What's Protected:**
- All communication between ELK components encrypted with SSL/TLS
- HTTP requests to Elasticsearch/Kibana use HTTPS (port 443)
- Internal component communication (Elasticsearch ↔ Logstash ↔ Filebeat) encrypted

**Certificate Setup:**

```bash
# Generate self-signed certificates for development
cd infra/elk
bash generate-certs.sh

# Certificates created:
# certs/
#   ├── ca.crt               (CA certificate - public)
#   ├── ca.key               (CA private key - SECRET)
#   ├── elasticsearch.p12    (Elasticsearch PKCS#12 keystore)
#   ├── kibana.crt/key       (Kibana certificate)
#   ├── logstash.crt/key     (Logstash certificate)
#   └── filebeat.crt/key     (Filebeat certificate)
```

**For Production:**
- Obtain certificates from a trusted Certificate Authority (Let's Encrypt, DigiCert, etc.)
- Replace self-signed certificates with CA-issued ones
- Ensure certificates include proper SANs (Subject Alternative Names)
- Implement certificate rotation every 365 days

**Configuration in docker-compose.yml:**
```yaml
xpack.security.transport.ssl.keystore.path=certs/elasticsearch.p12
xpack.security.http.ssl.keystore.path=certs/elasticsearch.p12
```

---

### 3. **Encryption at Rest**

#### Status: ⚠️ PARTIAL (File-system level)

**What's Protected:**
- Index data stored in `/esdata` volume
- Persistent data on disk

**To Enable Full Encryption at Rest (Production):**

Add to `docker-compose.yml` Elasticsearch environment:
```yaml
environment:
  - xpack.security.enabled=true
  - xpack.encryption_key.provider=vault  # If using Vault
```

Or use volume-level encryption:
```bash
# For Docker volumes on Linux with LUKS
sudo cryptsetup luksFormat /dev/sdX
sudo cryptsetup luksOpen /dev/sdX esdata
mkfs.ext4 /dev/mapper/esdata
```

---

### 4. **PII & Sensitive Data Redaction**

#### Status: ✅ ENABLED

**What's Protected:**
- JWT tokens masked in logs
- API keys and passwords redacted
- Email addresses partially masked (PII compliance)
- Credit card numbers masked (PCI compliance)

**Redaction Rules** (in `filebeat/filebeat.yml` and `logstash/pipeline/logstash.conf`):

| Pattern | Redacted As |
|---------|------------|
| `Bearer <token>` | `Bearer ***REDACTED***` |
| `password=<value>` | `password=***REDACTED***` |
| `api_key: <key>` | `api_key: ***REDACTED***` |
| `user@domain.com` | `user@***REDACTED***.com` |
| `4532-1488-0343-6467` | `****-****-****-****` |

**Example:**
```
Before: POST /api/auth/login with token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
After:  POST /api/auth/login with token: Bearer ***REDACTED***
```

---

### 5. **Audit Logging**

#### Status: ✅ ENABLED

**What's Audited:**
- All authentication attempts (success & failure)
- Authorization failures (access denied)
- Admin operations (user creation, role assignment)
- Data access patterns

**Audit Trail Fields** (in each log):
```json
{
  "audit": {
    "processed_at": "2024-12-02T10:30:00Z",
    "pipeline_version": "1.0",
    "data_classification": "internal"
  },
  "tags": ["alert-worthy"]  // Added for error logs
}
```

**View Audit Logs in Kibana:**
```
1. Go to Discover
2. Filter: log.level_text: "error" AND audit.processed_at: [last 24h]
3. Export for compliance reports
```

---

### 6. **Data Retention & Archiving Policies**

#### Status: ✅ ENABLED (ILM)

**Index Lifecycle Management (ILM) Policy: `app-logs-policy`**

| Phase | Duration | Actions |
|-------|----------|---------|
| **Hot** | 0 days | Ingest logs, rollover daily or at 50GB |
| **Warm** | 7 days | Compress, merge segments, shrink shards |
| **Cold** | 14 days | Move to cheaper storage (if configured) |
| **Delete** | 30 days | Automatically delete indices |

**Compliance Benefits:**
- ✅ Automatic retention enforcement (no manual deletion required)
- ✅ Reduced storage costs (warm/cold phases compress data)
- ✅ GDPR compliance (automatic deletion after retention period)
- ✅ Audit trail: ILM actions logged in Elasticsearch

**Verify ILM Status:**
```bash
# Check policy
curl -k -u elastic:changeme https://localhost:9200/_ilm/policy/app-logs-policy

# Check index status
curl -k -u elastic:changeme https://localhost:9200/app-logs-*/_stats
```

**Customize Retention (in `ilm-policy.json`):**
```json
"delete": {
  "min_age": "90d",  // Change from 30d to 90d for longer retention
  "actions": { "delete": {} }
}
```

---

### 7. **Backup & Disaster Recovery**

#### Status: ✅ ENABLED (Snapshot repository)

**Snapshot Repository Configured:** `app-logs-backup`

**Create Manual Backup:**
```bash
curl -k -X PUT \
  -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-$(date +%Y%m%d) \
  -H 'Content-Type: application/json' \
  -d '{ "indices": "app-logs-*" }'
```

**Restore from Backup:**
```bash
curl -k -X POST \
  -u elastic:changeme \
  https://localhost:9200/_snapshot/app-logs-backup/backup-20241201/_restore
```

---

### 8. **Network Isolation**

#### Status: ✅ ENABLED

**Docker Network Configuration:**
- ELK components in isolated `elk-network` bridge network
- Only Kibana (5601) and Elasticsearch (9200) exposed to host
- Logstash and Filebeat communicate only within the container network
- No direct internet access required (except for initial downloads)

**Network Diagram:**
```
┌─────────────────────────────────────────────┐
│         Docker Network: elk-network         │
│  172.27.0.0/16 (isolated subnet)            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────┐      │
│  │   Elasticsearch (172.27.0.2)     │      │
│  │   Ports: 9200 (HTTPS only)       │      │
│  └──────────────────────────────────┘      │
│              ↑ ↓                             │
│  ┌──────────────────────────────────┐      │
│  │   Logstash (172.27.0.3)          │      │
│  │   Ports: 5000 (internal only)    │      │
│  └──────────────────────────────────┘      │
│    ↑                     ↓                   │
│  Filebeat          Elasticsearch             │
│  (172.27.0.4)      (172.27.0.2)             │
│                                             │
│  ┌──────────────────────────────────┐      │
│  │   Kibana (172.27.0.5)            │      │
│  │   Port: 5601 (HTTPS, exposed)    │      │
│  └──────────────────────────────────┘      │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 9. **Resource Limits & Rate Limiting**

#### Status: ✅ ENABLED

**Container Resource Constraints:**
```yaml
# docker-compose.yml ulimits
ulimits:
  memlock:
    soft: -1
    hard: -1

# Elasticsearch JVM settings
environment:
  - ES_JAVA_OPTS=-Xms512m -Xmx512m  # Adjust based on system resources
```

**Connection Limits:**
```bash
# Logstash max clients
max_clients: 100

# Beats input heartbeat validation
tcp_keep_alive: true
```

---

## 🚀 Quick Start with Security

### Step 1: Generate Certificates
```bash
cd infra/elk
bash generate-certs.sh
```

### Step 2: Configure Environment
```bash
# Edit .env.elk
nano .env.elk

# Change default passwords to secure values:
ELASTIC_PASSWORD=$(openssl rand -base64 32)
KIBANA_PASSWORD=$(openssl rand -base64 32)
LOGSTASH_PASSWORD=$(openssl rand -base64 32)
FILEBEAT_PASSWORD=$(openssl rand -base64 32)
```

### Step 3: Start ELK Stack
```bash
docker compose up -d
```

This automatically:
1. Starts Elasticsearch with SSL/TLS enabled
2. Creates restricted user accounts (security-setup)
3. Registers ILM policy and index templates (setup)
4. Starts Kibana, Logstash, and Filebeat with authentication

### Step 4: Access Kibana
```bash
# Open browser: https://localhost:5601
# Username: elastic
# Password: (value from .env.elk)
```

---

## 📋 Compliance Checklist

- [x] **Authentication**: X-Pack Security enabled with RBAC
- [x] **Encryption**: SSL/TLS for all communications
- [x] **Data Protection**: PII & secrets redaction
- [x] **Audit Trail**: All access logged
- [x] **Retention**: ILM policy with 30-day auto-delete
- [x] **Backup**: Snapshot repository configured
- [x] **Isolation**: Network segmentation implemented
- [x] **Monitoring**: Health checks and resource limits
- [x] **Logging**: Dual logging (pino-pretty + JSON)

---

## 🔍 Monitoring & Troubleshooting

### Check Elasticsearch Health
```bash
curl -k -u elastic:changeme \
  https://localhost:9200/_cluster/health
```

### View Active Connections
```bash
curl -k -u elastic:changeme \
  https://localhost:9200/_nodes/stats/http
```

### Monitor ILM Actions
```bash
curl -k -u elastic:changeme \
  https://localhost:9200/_ilm/status
```

### View Audit Logs
```bash
# In Kibana Discover
log.level_text: "error" AND service.name: "elasticsearch"
```

### Debug Filebeat Connection
```bash
docker compose logs filebeat | grep -E "ERROR|WARN|connection"
```

---

## 🚨 Security Best Practices

### 1. **Change Default Passwords Immediately**
Before deploying to production, change all default passwords in `.env.elk`.

### 2. **Rotate Certificates Annually**
Implement certificate rotation workflow:
```bash
# Set reminder for renewal
crontab -e
# 0 0 1 1 * /path/to/generate-certs.sh
```

### 3. **Regular Backup Testing**
Verify backups work:
```bash
# Create test backup monthly
docker compose exec elasticsearch curl -X POST \
  -u elastic:changeme \
  http://localhost:9200/_snapshot/app-logs-backup/test-$(date +%Y%m%d)/_verify
```

### 4. **Monitor Disk Space**
ELK stack can consume significant disk space:
```bash
# Check volume usage
docker volume ls
docker system df

# Adjust data retention if needed (ilm-policy.json)
```

### 5. **Restrict Network Access**
In production, use firewall rules:
```bash
# Allow Kibana only from admin IPs
sudo ufw allow from 203.0.113.0/24 to any port 5601 proto tcp
```

### 6. **Enable MFA for Kibana Access** (Optional, Enterprise Feature)
Requires X-Pack subscription but adds another security layer.

---

## 📚 Additional Resources

- [Elasticsearch Security](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api.html)
- [Kibana Spaces & RBAC](https://www.elastic.co/guide/en/kibana/current/spaces.html)
- [ILM Best Practices](https://www.elastic.co/guide/en/elasticsearch/reference/current/ilm-concepts.html)
- [GDPR Compliance](https://www.elastic.co/blog/compliance-and-gdpr)

---

## 📞 Support & Questions

For security concerns or issues:
1. Check Docker logs: `docker compose logs [service]`
2. Review Elasticsearch audit logs in Kibana
3. Consult Elastic documentation
4. Contact your infrastructure team

---

**Last Updated:** December 2, 2024  
**Security Level:** Production-Ready (with CA-signed certificates recommended)
