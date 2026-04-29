# README
AI Task Processing Platform - Infrastructure Repository

This repository contains Kubernetes manifests and Argo CD configuration for the AI Task Processing Platform.

## Structure

```
ai-task-platform-infra/
├── k8s/
│   ├── namespace.yaml         # Project namespace
│   ├── backend/               # Backend deployment, service, config
│   ├── frontend/              # Frontend deployment, service, config
│   ├── worker/                # Worker deployment, config, HPA
│   ├── mongodb/              # MongoDB deployment, PVC
│   ├── redis/                # Redis deployment, PVC
│   └── ingress.yaml           # Ingress configuration
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD pipeline
└── argocd/
    └── application.yaml      # Argo CD Application
```

## Setup

### Prerequisites

- Kubernetes cluster (k3s or cloud)
- kubectl configured
- Argo CD installed

### Initial Setup

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Apply all manifests
kubectl apply -k k8s/

# Or with Argo CD
argocd app create ai-task-platform --repo <your-repo-url> --path k8s
```

## Updating Images

Images are updated automatically via CI/CD. To update manually:

```bash
# Update image tag in deployment files
sed -i 's/\${IMAGE_TAG}/<new-tag>/g' k8s/backend/deployment.yaml
sed -i 's/\${IMAGE_TAG}/<new-tag>/g' k8s/worker/deployment.yaml
sed -i 's/\${IMAGE_TAG}/<new-tag>/g' k8s/frontend/deployment.yaml
```

## Secrets

Set these secrets before deployment:

```bash
kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET="your-production-secret" \
  --namespace=ai-task-platform
```
