# AI Task Processing Platform - Architecture Document

## 1. System Overview

A production-ready AI Task Processing Platform built on the MERN stack with Python workers, designed for asynchronous task processing at scale. The system accepts text transformation tasks (uppercase, lowercase, reverse, word count) and processes them via a Redis-backed queue.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                    (Browser / Mobile)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                           │
│                   Port 3000 (nginx:80)                         │
│         Serves static files, proxies /api to backend          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API (JWT)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                            │
│                     Port 5000                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Auth    │  │  Tasks   │  │  Health  │  │     Helmet       │ │
│  │  Routes  │  │  Routes  │  │  Check   │  │  Rate Limiter    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│         │                                         │             │
│         ▼                                         ▼             │
│  ┌──────────┐  ┌──────────────────┐      ┌────────────┐         │
│  │  JWT     │  │  Bull Queue      │──────▶│   Redis    │         │
│  │  Auth    │  │  (Task Enqueue)  │      │   Queue    │         │
│  └──────────┘  └──────────────────┘      └─────┬──────┘         │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                              ┌─────────────────┴─────────────────┐
                              ▼                                   ▼
┌─────────────────────────────┐    ┌─────────────────────────────────┐
│     MongoDB                 │    │       Python Worker             │
│     Port 27017              │    │       (Multiple Replicas)       │
│                             │    │       Pulls from Redis          │
│  Collections:              │    │       Updates MongoDB directly  │
│  - users                    │    │                                 │
│  - tasks                    │    │  Operations:                   │
│                             │    │  - uppercase                   │
│  Indexes:                   │    │  - lowercase                   │
│  - users.email (unique)     │    │  - reverse                      │
│  - tasks.userId+status+date│    │  - word_count                  │
└─────────────────────────────┘    └─────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 Frontend (React + Vite)

| Aspect | Detail |
|--------|--------|
| Framework | React 18 with Vite build tool |
| State Management | React Context (AuthContext) |
| HTTP Client | Axios with JWT interceptor |
| Routing | React Router DOM v6 |
| Port | 80 (nginx), exposed as 3000 |

**Pages:**
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Task list + create task
- `/tasks/:id` - Task detail with logs

### 3.2 Backend (Node.js + Express)

| Aspect | Detail |
|--------|--------|
| Framework | Express.js |
| Auth | JWT + bcryptjs |
| Database | Mongoose ODM |
| Queue | Bull (Redis-backed) |
| Security | Helmet + Rate Limiter |

**Security Middleware Stack:**
1. `helmet()` - Security headers
2. `cors()` - Cross-origin resource sharing
3. `express.json()` - Body parser (10kb limit)
4. `rateLimit()` - 100 requests per 15 minutes

### 3.3 Worker (Python)

| Aspect | Detail |
|--------|--------|
| Language | Python 3.12 |
| Queue Client | redis-py (BRPOP) |
| Database | pymongo |
| Concurrency | Per-worker polling loop |

**Operations:**
```python
def uppercase(text): return text.upper()
def lowercase(text): return text.lower()
def reverse(text): return text[::-1]
def word_count(text): return str(len(text.split()))
```

---

## 4. Worker Scaling Strategy

### 4.1 Horizontal Pod Autoscaler (HPA)

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
minReplicas: 2
maxReplicas: 10
```

### 4.2 Scaling Logic

1. **Queue Depth Detection**: Each worker polls Redis with `BLPOP` (5-second timeout)
2. **Multiple Replicas**: All workers share the same queue; Redis ensures fair distribution
3. **Backoff Strategy**: Bull queue retries with exponential backoff (1s → 2s → 4s)
4. **Graceful Handling**: Failed jobs are marked and logged; dead letter queue for inspection

### 4.3 Scaling Decision Tree

```
                    ┌─────────────────┐
                    │  New Task       │
                    │  Submitted      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Add to Redis    │
                    │ Queue           │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Worker 1 picks │   │ Worker 2 picks │   │ Worker N picks │
│ up job         │   │ up job        │   │ up job        │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 5. High Volume Handling (100k Tasks/Day)

### 5.1 Capacity Analysis

| Metric | Value |
|--------|-------|
| Tasks/day | 100,000 |
| Tasks/hour | ~4,167 |
| Tasks/minute | ~69 |
| Tasks/second | ~1.16 |
| Peak burst (10x) | ~12/sec |

### 5.2 Scaling Calculations

- **Minimum Workers**: 2 (steady state: ~1 task/sec)
- **Target CPU**: 70% utilization at 10 tasks/second
- **Max Workers**: 10 (handles 12 tasks/second burst)

### 5.3 Throughput Optimizations

1. **Redis Queue**: O(1) enqueue/dequeue operations
2. **MongoDB Indexes**:
   - `Task`: compound index on `(userId, status, createdAt)`
   - `User`: unique index on `email`
3. **Connection Pooling**: Mongoose default pool size 100
4. **Batch Writes**: Task updates are individual (real-time needed)

### 5.4 Queue Monitoring

```javascript
// Recommended monitoring queries
bullQueue.getJobCounts()  // { waiting: 0, active: 5, completed: 1000, failed: 2 }
bullQueue.clean(10000, 100, 'completed')  // Clean old completed jobs
```

---

## 6. Database Indexing Strategy

### 6.1 MongoDB Indexes

```javascript
// User Model
userSchema.index({ email: 1 }, { unique: true });

// Task Model
taskSchema.index({ userId: 1, status: 1, createdAt: -1 });
taskSchema.index({ createdAt: -1 });
```

### 6.2 Query Patterns

| Query | Index Used | Efficiency |
|-------|------------|------------|
| `GET /tasks?status=pending` | `(userId, status, createdAt)` | Index scan |
| `GET /tasks/:id` | `_id` | Primary key |
| `GET /tasks` (sorted) | `(userId, createdAt)` | Covered |

### 6.3 Write Optimization

- Task updates use `$set` to modify only changed fields
- Indexes support the write operations (no index rebuilding)

---

## 7. Redis Failure Handling

### 7.1 Connection Resilience

```python
while True:
    try:
        result = redis_client.blpop(queue_name, timeout=5)
        if result:
            _, raw_job = result
            process_job(json.loads(raw_job))
    except redis.ConnectionError:
        logger.error("Redis connection error")
        time.sleep(5)  # Retry after 5 seconds
```

### 7.2 Bull Queue Retry Configuration

```javascript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000  // 1s, 2s, 4s
  },
  removeOnComplete: 100,  // Keep last 100
  removeOnFail: 1000      // Keep last 1000
}
```

### 7.3 Failure Modes

| Failure | Response |
|---------|----------|
| Redis down | Worker retries with backoff; jobs stay in queue |
| Worker crash | Kubernetes restarts pod; Bull re-queues active job |
| MongoDB down | Worker logs error; job stays failed; manual retry |
| Network partition | Kubernetes liveness probe fails; pod restarted |

---

## 8. Staging and Production Deployment

### 8.1 Environment Separation

```
┌─────────────────┐     ┌─────────────────┐
│    Staging      │     │   Production    │
├─────────────────┤     ├─────────────────┤
│ Namespace:      │     │ Namespace:      │
│ ai-task-staging │     │ ai-task-prod    │
├─────────────────┤     ├─────────────────┤
│ ConfigMaps:     │     │ ConfigMaps:     │
│ - NODE_ENV=     │     │ - NODE_ENV=     │
│   staging       │     │   production    │
│ - API endpoints │     │ - API endpoints │
├─────────────────┤     ├─────────────────┤
│ Image Tags:     │     │ Image Tags:     │
│ v1.0.0-staging  │     │ v1.0.0-prod     │
└─────────────────┘     └─────────────────┘
```

### 8.2 Argo CD Applications

```yaml
# Staging Application
spec:
  destination:
    namespace: ai-task-staging
  source:
    targetRevision: staging

# Production Application
spec:
  destination:
    namespace: ai-task-prod
  source:
    targetRevision: main  # Requires PR for changes
```

### 8.3 Deployment Promotion Flow

```
Feature Branch → PR → main (staging auto-sync)
                                    │
                                    ▼ (manual promotion)
                              production release
```

### 8.4 GitOps Workflow

1. Developer pushes code to `main`
2. GitHub Actions builds Docker images
3. Image tag updated in `ai-task-platform-infra`
4. Argo CD detects change, auto-syncs to cluster
5. Rolling deployment updates pods

---

## 9. Security Considerations

### 9.1 Authentication

- **bcrypt**: 12 rounds for password hashing
- **JWT**: 7-day expiry, stored in Authorization header
- **Token refresh**: Not implemented (re-login after expiry)

### 9.2 API Security

| Protection | Implementation |
|------------|----------------|
| Password hashing | bcryptjs (12 rounds) |
| JWT verification | jsonwebtoken library |
| Security headers | Helmet middleware |
| Rate limiting | 100 req/15min per IP |
| Input validation | express-validator |
| SQL/NoSQL injection | Mongoose sanitization |

### 9.3 Container Security

- **Non-root users**: All containers run as non-root
- **Read-only filesystem**: Not configured (needs PVC write access)
- **Resource limits**: CPU and memory limits on all pods
- **Secrets**: Kubernetes Secrets (not in code/env files)

### 9.4 Secrets Management

```bash
# Create production secrets
kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET="production-secret" \
  --namespace=ai-task-platform
```

---

## 10. Monitoring and Observability

### 10.1 Health Checks

| Endpoint | Check | Interval |
|----------|-------|----------|
| `/health` | HTTP GET | 15s liveness, 10s readiness |
| MongoDB | `db.adminCommand('ping')` | 10s |
| Redis | `redis-cli ping` | 10s |

### 10.2 Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 11. Disaster Recovery

### 11.1 Data Backups

| Data | Backup Strategy |
|------|------------------|
| MongoDB | PersistentVolume with PVC (5Gi) |
| Redis | PersistentVolume with PVC (1Gi) |
| Images | Docker Hub (rebuild from code) |
| K8s configs | Git repository (ai-task-platform-infra) |

### 11.2 Recovery Procedures

1. **MongoDB failure**: PVC persists data; pod restart recovers
2. **Redis failure**: Jobs are durable in Redis; restart recovers queue
3. **Complete cluster failure**: Argo CD re-applies all manifests from git

---

## 12. Performance Benchmarks

| Operation | Latency Target |
|-----------|----------------|
| Auth (login/register) | < 200ms |
| Task create | < 100ms |
| Task list (paginated) | < 150ms |
| Task process (worker) | < 500ms |

---

*Document Version: 1.0*
*Last Updated: 2026-04-29*
