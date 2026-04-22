# 🎮 Transcendence Pong 3D

A full-stack, real-time multiplayer Pong game with **3D graphics, tournament system, and enterprise-grade monitoring**. Built as a Single Page Application demonstrating modern web development practices, containerization, and production-ready architecture.

## 🎥 Demo

https://github.com/user-attachments/assets/1643b3be-552c-4acb-90f0-718dee9423fc

---

## 🌟 Key Features

### 🎯 Game Modes
- **AI vs Player** — Play against intelligent computer opponent
- **1v1 Local** — Two players on the same keyboard
- **Tournament System** — Create and join competitive tournaments with bracket progression
- **3D Graphics** — Immersive 3D game environment using Three.js

### 🔐 Authentication & Security
- **Multiple Auth Methods**: Email/password with JWT tokens + Google OAuth 2.0
- **Two-Factor Authentication (2FA)**: TOTP-based security layer
- **Security Hardening**: XSS prevention, SQL injection protection, password hashing (bcrypt)
- **HTTPS/TLS**: Secure communication with certificate management

### 👥 Social Features
- **Friend System**: Add friends, track online/offline presence
- **Real-time Presence**: WebSocket-based status updates
- **User Profiles**: Customizable avatars, statistics, and match history
- **Global Leaderboard**: Competitive ranking system based on performance

### 📊 Production-Ready Infrastructure
- **Monitoring Stack**: Prometheus + Grafana with custom dashboards
- **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana, Filebeat)
- **Secrets Management**: HashiCorp Vault integration
- **Containerization**: Full Docker Compose orchestration
- **API Documentation**: Swagger/OpenAPI interactive docs

---

## 🏗️ Technical Architecture

### **Frontend**
- **TypeScript** — Type-safe SPA with custom routing
- **Three.js** — 3D graphics rendering engine
- **Vite** — Modern build tool with HMR
- **Tailwind CSS** — Utility-first styling

### **Backend**
- **Node.js + Fastify** — High-performance async web framework
- **TypeScript** — End-to-end type safety
- **SQLite** — Embedded relational database
- **TypeORM** — ORM with migrations support
- **WebSockets** — Real-time bidirectional communication

### **DevOps & Monitoring**
- **Docker Compose** — Multi-container orchestration
- **Prometheus** — Metrics collection and alerting
- **Grafana** — Data visualization dashboards
- **ELK Stack** — Centralized log aggregation and analysis
- **Vault** — Dynamic secrets and credential rotation

### **Security Measures**
- JWT authentication with secure token handling
- Google OAuth 2.0 integration
- TOTP-based 2FA (Time-based One-Time Passwords)
- Input sanitization and validation
- Password hashing with bcrypt
- HTTPS enforcement with TLS certificates
- CORS configuration
- XSS and SQL injection prevention

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Make (optional, for convenience commands)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aguiarsilva/ft_transcendence_solo.git
   cd ft_transcendence_solo
   ```

2. **Generate ELK certificates** (first-time setup)
   ```bash
   cd infra/elk
   bash generate-certs.sh
   cd ../..
   ```

3. **Start the application**
   ```bash
   make up
   # or
   docker compose up --build
   ```

4. **Access the application**
   - **Game**: https://localhost:8443
   - **API Docs**: https://localhost:3001/documentation
   - **Grafana**: http://localhost:4000
   - **Kibana**: http://localhost:5601
   - **Prometheus**: http://localhost:9090

---

## 📦 Available Commands

| Command | Description |
|---------|-------------|
| `make up` | Build and start all services |
| `make dev` | Start frontend and backend in development mode |
| `make restart` | Restart all services |
| `make clean` | Remove build artifacts and dependencies |
| `make fclean` | Complete cleanup and reinstall |
| `make install` | Install all dependencies |
| `make build` | Build production bundles |

---

## 📁 Project Structure

```
ft_transcendence_solo/
├── frontend/              # TypeScript SPA
│   ├── src/
│   │   ├── views/        # UI components
│   │   ├── api/          # API client
│   │   ├── state/        # State management
│   │   └── game/         # 3D game engine
│   └── public/           # Static assets
├── backend/              # Fastify REST API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   ├── models/       # TypeORM entities
│   │   └── plugins/      # Fastify plugins
├── infra/
│   ├── monitoring/       # Prometheus & Grafana
│   ├── elk/             # Logging stack
│   └── vault/           # Secrets management
└── docker-compose.yml   # Orchestration config
```

---

## 🎯 Technical Highlights

### Performance Optimization
- Async/await patterns throughout the stack
- WebSocket connection pooling
- Efficient 3D rendering with requestAnimationFrame
- Database query optimization with indexes
- Docker layer caching for faster builds

### Scalability Considerations
- Stateless JWT authentication
- Horizontal scaling-ready backend architecture
- Containerized microservices design
- Centralized configuration management

### Code Quality
- TypeScript for type safety
- Input validation with AJV schemas
- Error handling with custom error classes
- Automated security testing
- RESTful API design principles

---

## 📊 Monitoring & Observability

### Grafana Dashboards
- Request rate and latency metrics
- Error rate tracking
- Active user sessions
- WebSocket connection health

### ELK Stack
- Structured JSON logging
- Real-time log streaming
- Pre-built Kibana dashboards
- Log level filtering and search

---

## 🔒 Security Features

- **Authentication**: Multi-factor with JWT + OAuth + 2FA
- **Authorization**: Role-based access control
- **Data Protection**: Password hashing, encrypted secrets
- **Network Security**: HTTPS, CORS policies
- **Input Validation**: XSS and SQL injection prevention
- **Security Testing**: Automated vulnerability scanning

---

## 📝 API Documentation

Interactive API documentation available at: `https://localhost:3001/documentation`

Key endpoints:
- `POST /api/v1/auth/login` — User authentication
- `POST /api/v1/auth/google` — Google OAuth login
- `GET /api/v1/users/profile` — User profile data
- `GET /api/v1/leaderboard` — Global rankings
- `POST /api/v1/tournaments` — Create tournament
- `WebSocket /ws` — Real-time game connections

---

## 🧪 Testing

```bash
# Run security tests
node security-test.js

# Run backend tests (if implemented)
cd backend && npm test

# Run frontend tests (if implemented)
cd frontend && npm test
```

---

## 🤝 Contributing

This is a solo portfolio project for demonstration purposes. Feel free to fork and experiment!

---

## 📄 License

This project is part of the 42 School curriculum.

---

## 👤 Author

**aguiarsilva**  
[GitHub Profile](https://github.com/aguiarsilva)

---

## 🙏 Acknowledgments

- **42 School** — For the comprehensive web development curriculum
- **Three.js Community** — For excellent 3D graphics documentation
- **Fastify Team** — For the performant web framework

---

**⭐ If you found this project interesting, please consider giving it a star!**
