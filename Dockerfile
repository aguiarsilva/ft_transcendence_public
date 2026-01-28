FROM node:18-alpine AS builder
WORKDIR /app

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Generate self-signed certificates for local dev/build
RUN mkdir -p certs && \
    openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout certs/server.key -out certs/server.crt \
    -days 365 -subj "/C=US/ST=Test/L=Test/O=Test/CN=localhost"

# Build frontend
COPY frontend/package*.json frontend/
COPY frontend/ frontend/
RUN cd frontend && npm install && npm run build

# Build backend
COPY backend/package*.json backend/
COPY backend/ backend/
RUN cd backend && npm install && npm run build

FROM node:18-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# Copy SSL certificates from builder
COPY --from=builder /app/certs ../certs

# Copy backend build and built frontend into backend/public
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/frontend/dist ./public

# If there are existing public assets (avatars), include them
COPY backend/public ./public

RUN npm ci --production

EXPOSE 3001
CMD ["node", "dist/index.js"]
