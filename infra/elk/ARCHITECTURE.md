# ELK Security Architecture - Visual Guide

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ft_transcendence                            │
│                      ELK Stack Architecture                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              Backend Application (Fastify + Node.js)               │
│              Logs → /backend/logs/backend.log (JSON)               │
│                                                                     │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ File Read (Filebeat)
                  │
┌─────────────────v───────────────────────────────────────────────────┐
│                  Docker Network: elk-network                        │
│                  (Isolated Bridge, 172.27.0.0/16)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ FILEBEAT (172.27.0.4)                                   │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ • Reads: /backend/logs/backend.log                      │      │
│  │ • PII Redaction: Tokens, passwords, emails, cards      │      │
│  │ • Authentication: Parsed credentials                    │      │
│  │ • Output: TCP 5000 to Logstash (beats protocol)        │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         │ Beats Protocol                            │
│                         │ (TCP, unencrypted - can enable TLS)       │
│  ┌──────────────────────v───────────────────────────────────┐      │
│  │ LOGSTASH (172.27.0.3)                                   │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ • Input: Beats input on port 5000                       │      │
│  │ • Filter: Timestamp mapping, pino level parsing        │      │
│  │ • Masking: Additional PII/secrets masking               │      │
│  │ • Enrichment: Audit fields, fingerprinting              │      │
│  │ • Output: HTTPS to Elasticsearch:9200 (with auth)      │      │
│  │ • Backup: Local file retention                          │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         │ HTTPS + Auth                              │
│                         │ (SSL/TLS Certificate)                     │
│  ┌──────────────────────v───────────────────────────────────┐      │
│  │ ELASTICSEARCH (172.27.0.2:9200)                         │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ Security:                                                │      │
│  │   • X-Pack Security: ENABLED                            │      │
│  │   • Authentication: logstash_internal (user)            │      │
│  │   • RBAC: Role-based permissions                        │      │
│  │   • SSL/TLS: HTTPS only                                 │      │
│  │   • Audit: All access logged                            │      │
│  │                                                          │      │
│  │ Storage:                                                 │      │
│  │   • Index: app-logs-YYYY.MM.dd                          │      │
│  │   • ILM Policy: hot → warm → cold → delete (30d)       │      │
│  │   • Replicas: 0 (single node), Shards: 1               │      │
│  │   • Compression: Best compression enabled               │      │
│  │                                                          │      │
│  │ Backup:                                                  │      │
│  │   • Snapshot Repo: app-logs-backup                      │      │
│  │   • Location: /usr/share/elasticsearch/data/backup      │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         │ HTTPS + Auth                              │
│                         │ (SSL/TLS Certificate)                     │
│  ┌──────────────────────v───────────────────────────────────┐      │
│  │ KIBANA (172.27.0.5:5601)                               │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ • UI: HTTPS encrypted dashboard                        │      │
│  │ • Authentication: X-Pack login (kibana_system user)    │      │
│  │ • Features:                                             │      │
│  │   - Discover: Search & explore logs                    │      │
│  │   - Dashboards: Pre-built analytics dashboard          │      │
│  │   - Alerts: Custom alert rules (optional)              │      │
│  │   - Data Views: app-logs-* index pattern               │      │
│  └──────────────────────────────────────────────────────────┘      │
│                         ↑ Exposed to Host                           │
│                         Port 5601 (HTTPS)                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Host Machine                               │
│                                                                     │
│  Browser: https://localhost:5601                                   │
│  User: elastic / Password: changeme (from .env.elk)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────┘

LAYER 1: Data Collection
┌────────────────────────────────────────┐
│ Filebeat → PII Redaction               │
│ ✓ Tokens: Bearer ***REDACTED***        │
│ ✓ Passwords: password=***REDACTED***   │
│ ✓ Emails: user@***REDACTED***.com     │
│ ✓ Credit Cards: ****-****-****-****    │
└────────────────────────────────────────┘

LAYER 2: Data Processing
┌────────────────────────────────────────┐
│ Logstash → Data Masking                │
│ ✓ Additional PII filtering             │
│ ✓ Secrets masking                      │
│ ✓ Audit field enrichment               │
│ ✓ Event fingerprinting                 │
└────────────────────────────────────────┘

LAYER 3: Encryption in Transit
┌────────────────────────────────────────┐
│ Beats → Logstash → Elasticsearch       │
│ ✓ SSL/TLS certificates                 │
│ ✓ Authentication (username/password)   │
│ ✓ Encrypted handshake                  │
│ ✓ HTTPS for all REST APIs              │
└────────────────────────────────────────┘

LAYER 4: Access Control
┌────────────────────────────────────────┐
│ X-Pack Security + RBAC                 │
│ ✓ Authentication: username/password    │
│ ✓ Authorization: Role-based access     │
│ ✓ API Keys: For service accounts       │
│ ✓ Audit Trail: All access logged       │
└────────────────────────────────────────┘

LAYER 5: Data Retention
┌────────────────────────────────────────┐
│ ILM Lifecycle Management               │
│ ✓ Hot (0d): Ingest & rollover          │
│ ✓ Warm (7d): Compress & merge          │
│ ✓ Cold (14d): Archive                  │
│ ✓ Delete (30d): Auto-purge (GDPR)     │
└────────────────────────────────────────┘

LAYER 6: Backup & Recovery
┌────────────────────────────────────────┐
│ Snapshot Repository                    │
│ ✓ Automated backups                    │
│ ✓ Disaster recovery enabled            │
│ ✓ Point-in-time restoration            │
│ ✓ Compliance archival                  │
└────────────────────────────────────────┘

LAYER 7: Network Isolation
┌────────────────────────────────────────┐
│ Docker Network Segmentation            │
│ ✓ Isolated bridge network              │
│ ✓ No internet access required          │
│ ✓ Port 5601 only exposed               │
│ ✓ Internal TLS for component comm      │
└────────────────────────────────────────┘
```

---

## 📊 Data Flow with Security

```
┌───────────────────────────────────────────────────────────────────────┐
│                      LOG DATA FLOW WITH SECURITY                      │
└───────────────────────────────────────────────────────────────────────┘

STEP 1: LOG GENERATION
───────────────────────
Backend (Pino Logger)
    ↓
    • Outputs JSON lines to: /backend/logs/backend.log
    • Format: {"time":1234567890,"level":30,"msg":"Login successful","user":"john@example.com"}
    • Rate: Continuous (as events occur)


STEP 2: LOG COLLECTION
──────────────────────
Filebeat reads file continuously
    ↓
    • Filebeat.yml processors run:
      1. Parse NDJSON (newline-delimited JSON)
      2. REDACT: john@example.com → john@***REDACTED***.com
      3. Add enrichment fields (service.name: backend)
      4. Drop unnecessary fields (pid, hostname)
    ↓
    Redacted log sent to Logstash:5000
    • Protocol: Beats (TCP)
    • Authentication: Not required for beats (can enable)


STEP 3: LOG PROCESSING
──────────────────────
Logstash receives and processes
    ↓
    • Logstash.conf filters:
      1. Parse timestamp (UNIX_MS → ISO 8601)
      2. Map pino level (30 → "info")
      3. REDACT additional patterns:
         - tokens: eyJ... → ***REDACTED***
         - passwords: secret → ***REDACTED***
      4. Add audit fields (processed_at, classification)
      5. Fingerprint for deduplication
    ↓
    Output to Elasticsearch:9200
    • Protocol: HTTPS (SSL/TLS encrypted)
    • Authentication: logstash_internal / password


STEP 4: STORAGE & INDEXING
──────────────────────────
Elasticsearch receives and indexes
    ↓
    • Security checks:
      1. Verify SSL certificate ✓
      2. Authenticate user (logstash_internal) ✓
      3. Check authorization (logstash_internal can write app-logs-*) ✓
      4. Log access in audit trail ✓
    ↓
    • Store in index:
      - Index name: app-logs-2024.12.02
      - Shard: 1, Replica: 0
      - Applied mappings: index-template.json
      - ILM policy: app-logs-policy
    ↓
    • ILM Lifecycle:
      - HOT PHASE: This index (new logs)
      - After 1 day: Rollover to app-logs-2024.12.03
      - After 7 days: Move to WARM phase (compress)
      - After 14 days: Move to COLD phase (archive)
      - After 30 days: Move to DELETE phase (auto-purge)


STEP 5: QUERYING & VISUALIZATION
─────────────────────────────────
User accesses Kibana dashboard
    ↓
    • Security checks:
      1. SSL certificate verified ✓
      2. User login required (X-Pack) ✓
      3. Verify user role (kibana_system) ✓
      4. Log access in audit trail ✓
    ↓
    • Kibana queries Elasticsearch:
      - Search: Match logs in app-logs-* pattern
      - Filter: service.name: "backend"
      - Aggregate: Group by log.level_text
      - Visualize: Charts, tables, dashboards
    ↓
    • Dashboard displays:
      - Recent logs (sanitized, redacted)
      - Error distribution
      - Log volume over time
      - Custom metrics


STEP 6: RETENTION & ARCHIVAL
────────────────────────────
ILM automatically manages lifecycle
    ↓
    Day 0-1 (HOT):  Ingest new logs, accept writes
    Day 1-7 (WARM):  Read-only, compress segments
    Day 7-14 (COLD): Archive to cold storage
    Day 14-30:       Read-only archive
    Day 30+:         AUTO-DELETE (GDPR compliance)


EXAMPLE: Complete Log Journey (30 minutes)
───────────────────────────────────────────
10:00 - Backend: POST /api/auth/login
        Log: {"msg":"User login","email":"admin@company.com","status":"success"}

10:00:01 - Filebeat reads & REDACTS
        Result: {"msg":"User login","email":"admin@***REDACTED***.com","status":"success"}

10:00:02 - Sent to Logstash:5000 (beats protocol)

10:00:03 - Logstash processes
        • Timestamps normalized
        • Level mapped (default 30 → "info")
        • Fingerprint added
        • Audit fields added

10:00:04 - Stored in Elasticsearch
        Index: app-logs-2024.12.02
        Doc ID: unique hash
        Fields indexed for searching

10:00:30 - Kibana queries & displays
        • User sees log in Discover tab
        • Email already redacted
        • Can search by: log.level, @timestamp, message
        • Cannot see raw email (PII protected)

10:30:00 - After 30 days: Auto-deleted per ILM policy
        • Complies with GDPR "right to be forgotten"
        • Storage automatically freed
        • No manual intervention needed
```

---

## 🔑 Security Credentials Flow

```
┌──────────────────────────────────────────────────────────┐
│           CREDENTIAL MANAGEMENT & FLOW                  │
└──────────────────────────────────────────────────────────┘

CONFIGURATION (.env.elk)
───────────────────────
ELASTIC_PASSWORD=changeme
KIBANA_PASSWORD=changeme
LOGSTASH_PASSWORD=changeme
FILEBEAT_PASSWORD=changeme
KIBANA_ENCRYPTION_KEY=<32-char-minimum>


INITIALIZATION (setup-security.sh)
──────────────────────────────────
At startup, creates users with roles:

┌─────────────────────────────────────┐
│ elastic (master)                    │
│ ├─ Role: superuser (all access)    │
│ └─ Password: $ELASTIC_PASSWORD      │
├─────────────────────────────────────┤
│ kibana_system                       │
│ ├─ Role: kibana_admin               │
│ ├─ Access: .kibana*, app-logs-*    │
│ └─ Password: $KIBANA_PASSWORD       │
├─────────────────────────────────────┤
│ logstash_internal                   │
│ ├─ Role: logstash_internal          │
│ ├─ Access: Write to app-logs-*      │
│ └─ Password: $LOGSTASH_PASSWORD     │
├─────────────────────────────────────┤
│ filebeat_internal                   │
│ ├─ Role: filebeat_internal          │
│ ├─ Access: Create app-logs-* index │
│ └─ Password: $FILEBEAT_PASSWORD     │
├─────────────────────────────────────┤
│ auditor                             │
│ ├─ Role: logs_auditor               │
│ ├─ Access: Read-only (audit)        │
│ └─ Password: Auto-generated         │
└─────────────────────────────────────┘


RUNTIME (Service Communication)
──────────────────────────────

Logstash → Elasticsearch:9200
    • Username: logstash_internal
    • Password: $LOGSTASH_PASSWORD
    • SSL: HTTPS + certificate verification
    • Header: Authorization: Basic base64(user:pass)
    ↓
    Elasticsearch validates:
    1. SSL certificate ✓
    2. Username/password ✓
    3. User role permissions ✓
    4. Operation allowed (write to app-logs-*) ✓
    5. Log access in audit trail ✓
    ↓
    Continue processing ✓


Kibana → Elasticsearch:9200
    • Username: kibana_system
    • Password: $KIBANA_PASSWORD
    • SSL: HTTPS + certificate verification
    • Queries: Search app-logs-* index
    ↓
    Elasticsearch validates:
    1. SSL certificate ✓
    2. Username/password ✓
    3. User role permissions ✓
    4. Can read app-logs-* ✓
    5. Log access in audit trail ✓
    ↓
    Return results ✓


User → Kibana:5601
    • URL: https://localhost:5601
    • Login: elastic / changeme (or custom)
    • Session: JWT token (X-Pack)
    ↓
    Kibana validates:
    1. SSL certificate ✓
    2. Username/password ✓
    3. User role (can access kibana) ✓
    4. Log access in audit trail ✓
    ↓
    Show dashboard ✓


CERTIFICATES (SSL/TLS)
─────────────────────
Generated by: generate-certs.sh

ca.crt / ca.key                  (Certificate Authority)
├── elasticsearch.p12            (Keystore - private + cert)
├── elasticsearch.crt / .key      (Public + private)
├── kibana.crt / kibana.key       (Public + private)
├── logstash.crt / logstash.key   (Public + private)
└── filebeat.crt / filebeat.key   (Public + private)

All components verify each other's certificates:
- Elasticsearch: Verifies Logstash certificate
- Logstash: Verifies Elasticsearch certificate (optional)
- Kibana: Verifies Elasticsearch certificate
- All use CA certificate for trust chain


PRODUCTION CHANGES CHECKLIST
────────────────────────────
[ ] Generate new certificates with CA
[ ] Generate strong random passwords:
    ELASTIC_PASSWORD=$(openssl rand -base64 32)
    KIBANA_PASSWORD=$(openssl rand -base64 32)
    LOGSTASH_PASSWORD=$(openssl rand -base64 32)
    FILEBEAT_PASSWORD=$(openssl rand -base64 32)
[ ] Update .env.elk with new values
[ ] Rotate credentials annually
[ ] Store .env.elk in secure location
[ ] Never commit passwords to Git
[ ] Use Vault/Secrets manager for production
```

---

## 📈 ILM Lifecycle Visualization

```
TIME PROGRESSION AND INDEX LIFECYCLE
────────────────────────────────────

Day 0-1: HOT PHASE (Current Index)
───────────────────────────────────
Index: app-logs-2024.12.02
State: ACTIVELY INGESTING
Size:  Growing (0 → 50GB or 1 day limit)

    Filebeat
        ↓
    Logstash
        ↓
    app-logs-2024.12.02 [HOT]
        ↓
    Rolling: At 50GB OR 1 day → Create new index


Day 1-7: WARM PHASE
───────────────────
Index: app-logs-2024.12.01
State: CLOSED FOR WRITES (Read-only)

    Actions:
    ├─ Forcemerge segments (1 segment per shard)
    ├─ Shrink shards (1 → 1, optimization)
    ├─ Compress:
    │  Before: 100 MB
    │  After:  40 MB (60% smaller)
    └─ Priority: 50 (lower than hot)


Day 7-14: COLD PHASE
────────────────────
Index: app-logs-2024.11.25
State: ARCHIVED

    Actions:
    ├─ Searchable snapshot (optional)
    ├─ Move to cold tier storage
    ├─ Reduce replicas to 0
    ├─ Stop refresh
    └─ Priority: 0 (lowest)


Day 14-30: COLD STORAGE
───────────────────────
Index: app-logs-2024.11.18 (and older)
State: STATIC ARCHIVE

    Characteristics:
    ├─ Minimal storage cost
    ├─ Slower search (acceptable)
    ├─ Long-term retention
    └─ Compliance & audit trail


Day 30+: DELETE PHASE
─────────────────────
Index: app-logs-2024.11.02 (30 days old)
State: DELETED

    Action: AUTO-DELETE
    ├─ Purge all documents
    ├─ Free storage
    ├─ GDPR "right to be forgotten" ✓
    └─ No manual intervention


EXAMPLE: December 2024 Timeline
────────────────────────────────

Today: 2024-12-02

Active Indices:
├─ app-logs-2024.12.02 [HOT]        ← Current
├─ app-logs-2024.12.01 [WARM]       ← 1 day old
├─ app-logs-2024.11.25 [WARM]       ← 7 days old
├─ app-logs-2024.11.18 [COLD]       ← 14 days old
├─ app-logs-2024.11.11 [COLD]       ← 21 days old
├─ app-logs-2024.11.04 [COLD]       ← 28 days old
└─ app-logs-2024.10.28 [DELETED]    ← 35 days old (purged)

Oldest retained: app-logs-2024.11.02 (30 days)
Next deletion: app-logs-2024.11.02 → 2024-12-02


STORAGE OPTIMIZATION
────────────────────

Scenario: 1GB logs per day

Without ILM:
├─ 30 days × 1GB = 30GB stored
└─ Cost: 30GB (full size)

With ILM:
├─ Hot (1 day):      1.0 GB  (uncompressed)
├─ Warm (6 days):    6.0 GB → 2.4 GB (compressed)
├─ Cold (14 days):  14.0 GB → 5.6 GB (archived)
├─ Delete (8 days):  Purged
└─ Total: 1.0 + 2.4 + 5.6 = 9.0 GB (70% savings!)
```

---

## 🎯 Summary

This visual guide shows:
1. **Architecture** - How all components connect
2. **Security Layers** - 7 layers of protection
3. **Data Flow** - Complete journey from log to deletion
4. **Credentials** - How authentication works
5. **Lifecycle** - How indices progress through phases

All implemented in your ELK stack! 🎉
