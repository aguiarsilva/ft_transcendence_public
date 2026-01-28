# ft_transcendence

A real-time multiplayer Pong tournament platform built as a SPA with Docker, secure architecture, and extensible modules.

## 🏗 Tech Stack
- Frontend: TypeScript (SPA)
- Backend: PHP / Fastify (Node.js, if module used)
- Database: SQLite (if module used)
- Realtime: WebSockets
- Deployment: Docker (single-command)
- Security: HTTPS, XSS/SQLi prevention, hashed passwords

## 🚀 How to Run
```bash
# Single command to start app + Vault + ELK stack (builds images and starts services):
docker compose up --build

Monitoring/ELK services included:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:4000 (provisioned dashboard: FT_Transcendence → Backend Monitoring)
- Kibana: http://localhost:5601 (default credentials: elastic/changeme)

Note: The `infra/monitoring` folder contains the Prometheus/Grafana configs used by the compose. On first run Grafana admin credentials are taken from environment variables `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD` if set; otherwise default admin/admin is used.

**Important**: Before first run, generate ELK certificates:
```bash
cd infra/elk
bash generate-certs.sh
cd ../..
```

Then start everything:
```bash
make up
```

## 🚀 All Available Commands Summary
Command	Description
make or make all	Install deps and start servers
make dev	Start both servers
make fclean	Clean everything, reinstall, and restart
make restart	Restart servers
make clean	Remove node_modules and build artifacts
make install	Install all dependencies
make build	Build both projects
