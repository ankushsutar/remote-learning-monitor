---
name: aegis-platform-orchestration
description: >-
  Procedures for orchestrating, configuring, running, and managing the Aegis platform across local development environments and multi-container Docker production deployments.
  Use this skill whenever running dev servers, configuring centralized .env settings, managing TimescaleDB/Redis in Docker, updating Nginx reverse proxy rules, or managing system ports.
---

# Platform Orchestration & Operations Skill

This skill defines standard operating procedures for hosting, configuring, and orchestrating the Aegis Student Telemetry Platform.

---

## 1. Quickstart: Local Development Hosting

To boot the entire local stack (Fastify Backend on `:4000` + Next.js Dashboard on `:3001` with automatic database seeding):

```bash
./start.sh
# or
bash scripts/dev.sh
```

### URLs:
- **Management Dashboard**: [http://localhost:3001](http://localhost:3001)
- **Ingestion API**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 2. Centralized Configuration (`.env`)

All services inherit configuration from the single root `.env` file:
- `PORT` (default: 4000)
- `DASHBOARD_PORT` (default: 3001)
- `DATABASE_URL` (default: `postgresql://postgres:password@localhost:5432/telemetry_db`)
- `REDIS_URL` (default: `redis://localhost:6379`)
- `JWT_SECRET` (token signing key)
- `CLASSROOM_BANDWIDTH_SPIKE_MB` (default: 15)
- `TAMPER_SYNC_TIMEOUT_HOURS` (default: 2)

---

## 3. Production Multi-Container Docker Stack

To launch the full production stack (TimescaleDB 16 + Redis 7 + Backend + Dashboard + Nginx SSL Proxy):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Checking Services:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 4. Troubleshooting Port Collisions

If port 4000 or 3001 is already occupied:
```bash
lsof -i :4000
lsof -i :3001

# Terminate process if necessary
kill -9 <PID>
```
