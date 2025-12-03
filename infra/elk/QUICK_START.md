# ELK Stack - Quick Start Card

**Print this or bookmark it for quick reference!**

---

## 🚀 30-Second Setup

```bash
cd infra/elk
bash generate-certs.sh
docker compose up -d
```

**Wait 30 seconds, then:** https://localhost:5601  
**Username:** elastic  
**Password:** changeme

---

## 📋 Essential Commands

### Check Status
```bash
docker compose ps
docker compose logs elasticsearch
```

### Test Elasticsearch
```bash
curl -k -u elastic:changeme https://localhost:9200/_cluster/health
```

### View Indices
```bash
curl -k -u elastic:changeme https://localhost:9200/_cat/indices?v
```

### Search Logs
```bash
curl -k -u elastic:changeme \
  'https://localhost:9200/app-logs-*/_search?size=5&sort=@timestamp:desc'
```

### Check Users
```bash
curl -k -u elastic:changeme https://localhost:9200/_security/user
```

---

## 🔐 Change Password

```bash
# Update .env.elk
ELASTIC_PASSWORD=your-new-password

# Restart services
docker compose down
docker compose up -d
```

---

## 📊 Verify Logs Flowing

In Kibana:
1. Click **Discover** (left sidebar)
2. Select data view: **app-logs-***
3. Should see recent logs with 🟢 green timestamp

If no logs:
```bash
# Check backend log file
tail -f ../../backend/logs/backend.log

# Check Filebeat
docker compose logs filebeat | tail -20
```

---

## 🛑 Stop & Cleanup

```bash
# Stop (keep data)
docker compose stop

# Stop & remove (keep data)
docker compose down

# Stop & delete everything
docker compose down -v
```

---

## ⚠️ Important Files

| File | Purpose |
|------|---------|
| `.env.elk` | 🔐 Passwords - KEEP SECURE |
| `certs/` | 🔒 SSL certificates |
| `docker-compose.yml` | ⚙️ Configuration |
| `SECURITY.md` | 📚 Documentation |
| `DEPLOYMENT.md` | 📖 Detailed guide |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Check `docker compose ps` |
| Auth failed | Verify password in `.env.elk` |
| No logs | Check `docker compose logs filebeat` |
| Disk full | Adjust ILM policy (ilm-policy.json) |

---

## 📞 Quick Links

- **Kibana:** https://localhost:5601
- **Elasticsearch:** https://localhost:9200
- **Security Guide:** `SECURITY.md`
- **Architecture:** `ARCHITECTURE.md`
- **Full Setup:** `DEPLOYMENT.md`

---

## ✅ One-Minute Health Check

```bash
#!/bin/bash

echo "🔍 ELK Health Check..."

# Elasticsearch
echo -n "Elasticsearch: "
curl -s -k -u elastic:changeme https://localhost:9200/_cluster/health | grep -q '"status":"green"' && echo "✅ GREEN" || echo "❌ FAIL"

# Kibana
echo -n "Kibana: "
curl -s -k https://localhost:5601/api/status | grep -q '"state":"green"' && echo "✅ GREEN" || echo "❌ FAIL"

# Logstash
echo -n "Logstash: "
curl -s http://localhost:9600 | grep -q "tagline" && echo "✅ OK" || echo "❌ FAIL"

# Indices
echo -n "Indices: "
INDICES=$(curl -s -k -u elastic:changeme https://localhost:9200/_cat/indices?format=json | grep -c "app-logs")
echo "$INDICES indices ✅"

echo "Done!"
```

---

## 🎓 Learning Path

1. **First Time?**
   - Read: `README_UPDATED.md` (10 min)
   - Try: Quick Start above (5 min)

2. **Want Security Details?**
   - Read: `SECURITY.md` (20 min)
   - Review: `ARCHITECTURE.md` (10 min)

3. **Need to Deploy?**
   - Read: `DEPLOYMENT.md` (15 min)
   - Follow: Step-by-step instructions

4. **Need to Troubleshoot?**
   - Check: Troubleshooting sections in each guide
   - Run: Health check script above

---

## 💡 Pro Tips

- Use HTTPS (not HTTP) - certs auto-generated
- Passwords in `.env.elk` - change in production!
- Kibana at https://localhost:5601 - bookmark it
- Docker network isolated - very secure!
- ILM auto-deletes after 30 days - GDPR compliant

---

**For detailed documentation, see the other guide files in this directory.**

**Happy logging! 🎉**
