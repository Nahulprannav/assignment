# AI Task Processing Platform - COMPLETE SETUP GUIDE

A production-ready MERN stack AI Task Processing Platform with Python worker.

**This guide is FREE and runs entirely on your local machine using Docker.**

---

## WHAT THIS PROJECT DOES

1. Register/Login as a user
2. Create AI tasks (uppercase, lowercase, reverse text, word count)
3. Tasks run in BACKGROUND (async) via Redis queue
4. Check task status and see results

---

## STEP 1: INSTALL DOCKER (Already done!)

You already have Docker Desktop installed. Good!

---

## STEP 2: RUN THE APPLICATION

Open Terminal (PowerShell or Command Prompt) and run:

```bash
cd "C:\Users\nahul\Desktop\ollama code\ai-task-platform"
docker-compose up
```

Wait 2-3 minutes for everything to start. You'll see logs like:
- "Connected to MongoDB"
- "Server running on port 5000"

---

## STEP 3: ACCESS THE APP

Open your browser and go to: **http://localhost:3000**

You should see the Login page. Click "Sign Up" to create an account, then login.

---

## STEP 4: USE THE APP

1. Click **"+ New Task"**
2. Enter a title (e.g., "My first task")
3. Choose an operation:
   - **uppercase** - makes text BIG
   - **lowercase** - makes text small
   - **reverse** - reverses text backwards
   - **word_count** - counts words
4. Enter some text in the input box
5. Click **"Create Task"**
6. Click on your task to see it processing and the result!

---

## STOPPING THE APP

Press `Ctrl+C` in the terminal to stop.

To remove all containers: `docker-compose down`

To start again: `docker-compose up`

---

## WHAT'S RUNNING

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React web app |
| Backend | http://localhost:5000 | API server |
| MongoDB | localhost:27017 | Database |
| Redis | localhost:6379 | Queue |

---

## IF SOMETHING BREAKS

Check logs:
```bash
docker-compose logs backend
docker-compose logs worker
docker-compose logs mongodb
```

Restart everything:
```bash
docker-compose down
docker-compose up
```

---

## Architecture

```
Browser → Frontend (React) → Backend (Node.js) → MongoDB
                    ↓
              Redis Queue
                    ↓
              Worker (Python) → Updates MongoDB
```

---

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
