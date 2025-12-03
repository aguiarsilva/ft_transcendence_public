# ELK Stack for Backend Logging

This directory contains the ELK (Elasticsearch, Logstash, Filebeat) stack configuration for centralized backend application logging.

## Quick Start

### 1. Start ELK Stack

```bash
cd infra/elk
docker compose up -d
```

This starts:
- **Elasticsearch** (port 9200) — log storage
- **Kibana** (port 5601) — visualization & exploration
- **Logstash** (port 5000) — log processing & forwarding
- **Filebeat** — log collection from backend

### 2. Backend (produces logs)

The backend will:
- Log to stdout with pino-pretty (human-readable format in terminal)
- Write JSON logs to `backend/logs/backend.log` (for ELK ingestion)

### 3. Access Kibana

Open your browser: **http://localhost:5601**

## Importing the Dashboard

A pre-built dashboard is provided to visualize backend logs:

### Import Steps (One-time setup)

1. In Kibana, go to **Stack Management** → **Saved Objects**
2. Click **Import** (top-right)
3. Select the file: `infra/elk/kibana-dashboard.ndjson`
4. Click **Import**
5. Confirm any index pattern creation if prompted

### Using the Dashboard

1. Go to **Dashboards** in the left sidebar
2. Select **Backend Logs Dashboard**
3. You'll see:
   - **Recent logs table** — all backend logs with timestamps, levels, messages
   - **Logs by Level** — pie chart showing distribution of info/warn/error logs
   - **Error Count** — metric card showing total errors
   - **Logs Over Time** — line chart of log volume over time
   - **Top Log Messages** — table of most frequent messages

## Manual Data View Setup (if needed)

If you're setting up without importing the dashboard:

1. **Create a Data View:**
   - Go to **Stack Management** → **Data Views**
   - Click **Create Data View**
   - Name: `app-logs-*`
   - Timestamp: `@timestamp`
   - Save

2. **Explore Logs:**
   - Go to **Discover**
   - Select the `app-logs-*` data view
   - Set time range (top-right) to include your logs
   - Search: `service.name : "backend"`

## Available Log Fields

After logs are ingested, you can filter/search using these fields:

- `service.name` — always "backend"
- `@timestamp` — log timestamp
- `message` — the main log message
- `log.level` — severity level (info, warn, error, etc.)
- `level` — numeric pino level (10=trace, 20=debug, 30=info, 40=warn, 50=error)
- `hostname` — machine hostname
- `pid` — process ID
- `time` — original pino timestamp (milliseconds)

## Example Searches (in Kibana Discover)

```
# All backend logs
service.name : "backend"

# Only errors
service.name : "backend" AND log.level : "error"

# Logs from last hour
service.name : "backend" AND @timestamp >= now-1h

# Specific message
message : "Server running"

# Logs containing "error" in message
service.name : "backend" AND message : error
```

## Troubleshooting

### No logs appearing in Kibana?

1. Verify backend is running and log file exists:
   ```bash
   tail -f backend/logs/backend.log
   ```

2. Check Filebeat is reading:
   ```bash
   docker compose logs filebeat --tail=50 | grep -i harvester
   ```
   Should show `"running":1` and `"open_files":1`

3. Check Elasticsearch has indices:
   ```bash
   curl -s 'http://localhost:9200/_cat/indices?v' | grep app-logs
   ```

4. Refresh Kibana data view:
   - Go to **Stack Management** → **Data Views** → `app-logs-*`
   - Click the refresh icon
   - Go back to **Discover**

### Logs aren't updating?

- Verify backend is still running (check terminal)
- Check file permissions: `ls -la backend/logs/backend.log`
- Restart backend: `npm run start` (from backend dir)

## Data Retention & ILM Policy

The ELK stack includes **Index Lifecycle Management (ILM)** to automatically manage log retention:

- **Hot phase**: Indices roll over daily or at 50GB
- **Delete phase**: Indices older than 30 days are deleted

### How It Works

1. When you start the stack, a `setup` service automatically registers:
   - ILM policy: `app-logs-policy`
   - Index template: `app-logs-template`

2. New indices created for `app-logs-*` pattern automatically use this policy.

3. Logstash outputs to indices named `app-logs-YYYY.MM.dd`, which match the template and inherit the policy.

### Verify ILM is Active

```bash
# Check ILM policy is registered
curl -s 'http://localhost:9200/_ilm/policy/app-logs-policy' | jq .

# Check an index has ILM settings
curl -s 'http://localhost:9200/app-logs-2025.11.28/_settings' | jq '.["app-logs-2025.11.28"].settings.index.lifecycle'
```

### Customize Retention

To change the retention period (default: 30 days):

1. Edit `infra/elk/ilm-policy.json`:
   ```json
   "delete": {
     "min_age": "7d",  // ← change from "30d" to your desired period
     "actions": { "delete": {} }
   }
   ```

2. Re-register the policy:
   ```bash
   cd infra/elk
   bash setup-ilm.sh
   ```

3. The new policy applies to future indices; existing indices keep their lifecycle unchanged.

## Configuration Files

- `docker-compose.yml` — ELK services definition (includes auto-setup service)
- `filebeat/filebeat.yml` — Filebeat input/output config
- `filebeat/entrypoint.sh` — Script to copy config with correct permissions
- `logstash/pipeline/logstash.conf` — Logstash filter/output pipeline
- `ilm-policy.json` — Index Lifecycle Management policy (hot/delete)
- `index-template.json` — Index template with ILM and field mappings
- `setup-ilm.sh` — Script to register ILM policy and template
- `kibana-dashboard.ndjson` — Pre-built dashboard (import this)

## Stopping ELK Stack

```bash
cd infra/elk
docker compose down
```

To also remove data (indices and volumes):
```bash
docker compose down -v
```

## Notes

- Elasticsearch data persists in the `esdata` Docker volume
- Logs are indexed by date: `app-logs-YYYY.MM.dd`
- Filebeat automatically harvests new lines added to `backend/logs/backend.log`
- ILM policy automatically deletes indices older than 30 days
- To update Filebeat or Logstash config, restart the container: `docker compose restart filebeat logstash`
