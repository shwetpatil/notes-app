# 🚀 Cloud Deployment Quick Reference

## Choose Your Platform

### AWS ECS Fargate
```bash
# Setup
aws ecr create-repository --repository-name notes-backend
aws cloudformation create-stack --stack-name notes-app-ecs \
  --template-body file://infrastructure/aws/cloudformation-template.yaml

# GitHub Secrets Needed
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
```

### Google Cloud Run  
```bash
# Setup
gcloud builds submit --tag gcr.io/PROJECT_ID/notes-backend
gcloud run deploy notes-backend --image gcr.io/PROJECT_ID/notes-backend

# GitHub Secrets Needed
- GCP_SA_KEY (service account JSON)
```

### Azure Container Instances
```bash
# Setup
az acr create --name notesappacr --sku Basic
az container create --name notes-backend-cg

# GitHub Secrets Needed
- AZURE_CREDENTIALS
- ACR_USERNAME
- ACR_PASSWORD
```

## Auto-Scaling Features

| Platform | Min | Max | Scales On | Cold Start |
|----------|-----|-----|-----------|------------|
| AWS ECS | 2 | 10 | CPU, Memory, Requests | None |
| GCP Cloud Run | 2 | 10 | Concurrent Requests | ~1s |
| Azure ACI | Manual | Manual | N/A | None |

## Monthly Costs (Estimate)

| Platform | Light Usage | Medium | Heavy |
|----------|-------------|--------|-------|
| AWS ECS | $60 | $150 | $300 |
| GCP Cloud Run | $50 | $80 | $150 |
| Azure ACI | $90 | $90 | $180 |

## Deploy Commands

```bash
# AWS
git push origin main  # Triggers deploy-aws-ecs.yml

# GCP
git push origin main  # Triggers deploy-gcp-cloudrun.yml

# Azure
git push origin main  # Triggers deploy-azure-aci.yml
```

## Monitor

```bash
# AWS
aws ecs describe-services --cluster notes-app-cluster

# GCP
gcloud run services describe notes-backend

# Azure
az container show --name notes-backend-cg
```

---

**Full Guide**: [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md)
