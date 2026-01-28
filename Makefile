NAME = pong

all: install dev

install:
	@echo "Installing backend dependencies..."
	@cd backend && npm install
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

install-backend:
	@cd backend && npm install

install-frontend:
	@cd frontend && npm install

dev:
	@echo "Starting backend and frontend concurrently..."
	@trap 'kill 0' EXIT; \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev) & \
	wait

dev-backend:
	@cd backend && npm run dev

dev-frontend:
	@cd frontend && npm run dev

build:
	@echo "Building backend and frontend..."
	@cd backend && npm run build
	@cd frontend && npm run build

build-backend:
	@cd backend && npm run build

build-frontend:
	@cd frontend && npm run build

preview:
	@cd frontend && npm run preview

test:
	@cd backend && npm run test || true

clean:
	@echo "Cleaning backend..."
	@cd backend && rm -rf node_modules dist package-lock.json
	@echo "Cleaning frontend..."
	@cd frontend && rm -rf node_modules dist package-lock.json

clean-backend:
	@cd backend && rm -rf node_modules dist package-lock.json

clean-frontend:
	@cd frontend && rm -rf node_modules dist package-lock.json

# Docker / Container targets
init-monitoring:
	@echo "Initializing monitoring credentials..."
	@bash infra/monitoring/init_monitoring.sh

up: init-monitoring
	@echo "Starting all services with docker compose..."
	@docker compose up --build -d 2>&1 | grep -v "dependency failed to start" || true
	@docker compose ps

up-detached: init-monitoring
	@echo "Starting all services in detached mode..."
	@docker compose up --build -d

down:
	@echo "Stopping all services..."
	@docker compose down

logs:
	@docker compose logs -f

ps:
	@docker compose ps

.PHONY: all install install-backend install-frontend dev dev-backend dev-frontend build build-backend build-frontend preview test clean clean-backend clean-frontend init-monitoring up up-detached down logs ps
