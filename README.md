# AI Task Processing Platform

A production-ready MERN stack AI Task Processing Platform with Python worker, Docker, Kubernetes (k3s), Argo CD (GitOps), and CI/CD.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend   │────▶│   MongoDB   │
│   (React)   │     │  (Node.js)  │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Redis     │◀────│   Worker    │
                    │   (Queue)   │     │  (Python)   │
                    └─────────────┘     └─────────────┘
```

## Features

- **User Authentication**: JWT-based registration and login
- **Task Management**: Create, list, and view AI tasks
- **Async Processing**: Tasks processed asynchronously via Redis queue
- **4 Operations**: uppercase, lowercase, reverse string, word count
- **Real-time Status**: Track task status (pending → running → success/failed)
- **Docker Support**: Multi-stage builds, non-root users
- **Kubernetes Ready**: Deployments, Services, Ingress, HPA
- **GitOps**: Argo CD integration with auto-sync

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Worker | Python 3.12 + RQ |
| Database | MongoDB 7 |
| Queue | Redis 7 |
| Container | Docker |
| Orchestration | Kubernetes (k3s) |
| GitOps | Argo CD |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- MongoDB 7
- Redis 7

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-task-platform.git
cd ai-task-platform

# Start all services
docker-compose up

# Or run locally without Docker:
# Backend
cd backend && npm install && npm run dev

# Worker (in another terminal)
cd worker && pip install -r requirements.txt && python main.py

# Frontend
cd frontend && npm install && npm run dev
```

### Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks` | List user tasks |
| GET | `/api/tasks/:id` | Get task details |

## Supported Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `uppercase` | Convert text to uppercase | "hello" → "HELLO" |
| `lowercase` | Convert text to lowercase | "HELLO" → "hello" |
| `reverse` | Reverse the string | "hello" → "olleh" |
| `word_count` | Count words | "hello world" → "2" |

## Docker Images

| Service | Image |
|---------|-------|
| Backend | `yourusername/ai-task-backend` |
| Frontend | `yourusername/ai-task-frontend` |
| Worker | `yourusername/ai-task-worker` |

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (k3s or cloud)
- Argo CD installed
- Docker Hub account

### Setup

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply manifests (manual)
kubectl apply -k k8s/

# Or via Argo CD (auto-sync)
argocd app create ai-task-platform \
  --repo https://github.com/yourusername/ai-task-platform-infra \
  --path k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace ai-task-platform
```

## CI/CD Pipeline

The pipeline includes:

1. **Lint**: ESLint (JS), Flake8 (Python)
2. **Build**: Multi-stage Docker builds
3. **Push**: Images to Docker Hub
4. **Deploy**: Update infra repo + Argo CD sync

## Project Structure

```
ai-task-platform/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # Mongoose models
│   │   ├── queue/        # Bull queue
│   │   └── routes/       # API routes
│   ├── Dockerfile
│   └── package.json
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── api.js       # Axios instance
│   │   ├── App.jsx      # Main app
│   │   ├── context/     # Auth context
│   │   └── pages/       # React pages
│   ├── Dockerfile
│   └── package.json
├── worker/              # Python worker
│   ├── main.py          # Worker entry
│   ├── tasks.py         # Task processors
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml   # Local development
└── Dockerfile.*         # Multi-stage Dockerfiles

ai-task-platform-infra/  # Kubernetes manifests
├── k8s/
│   ├── namespace.yaml
│   ├── backend/
│   ├── frontend/
│   ├── worker/
│   ├── mongodb/
│   ├── redis/
│   └── ingress.yaml
└── .github/workflows/
    └── deploy.yml       # CI/CD pipeline
```

## Security

- **bcrypt** for password hashing (12 rounds)
- **JWT** for authentication (7-day expiry)
- **Helmet** for HTTP headers security
- **Rate limiting** (100 req/15min)
- **Non-root** Docker containers
- **Secrets** via Kubernetes Secrets

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection | mongodb://localhost:27017/ai-task-platform |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiry | 7d |

### Worker

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `MONGODB_URI` | MongoDB connection | mongodb://localhost:27017/ai-task-platform |
| `WORKER_QUEUE` | Queue name | task-processing |

## License

MIT
