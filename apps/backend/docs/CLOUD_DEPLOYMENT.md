# Cloud Auto-Scaling Deployment Guide

Complete guide for deploying the Notes App backend with auto-scaling on AWS, GCP, and Azure.

## 📋 Table of Contents

1. [AWS ECS Fargate](#aws-ecs-fargate)
2. [Google Cloud Run](#google-cloud-run)
3. [Azure Container Instances](#azure-container-instances)
4. [Comparison](#platform-comparison)
5. [Cost Estimates](#cost-estimates)

---

## 🟧 AWS ECS Fargate

### Prerequisites

- AWS Account
- AWS CLI installed
- Docker installed
- GitHub account (for CI/CD)

### Step 1: Setup AWS Resources

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
```

### Step 2: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name notes-backend \
  --region us-east-1

# Save the repository URI (output from above command)
ECR_URI="YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/notes-backend"
```

### Step 3: Build and Push Initial Image

```bash
cd apps/backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Build and push
docker build -t notes-backend .
docker tag notes-backend:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### Step 4: Deploy CloudFormation Stack

```bash
# Update task-definition.json with your ECR URI
cd infrastructure/aws

# Deploy the stack
aws cloudformation create-stack \
  --stack-name notes-app-ecs \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SubnetIds,ParameterValue="subnet-xxxxx\\,subnet-yyyyy" \
    ParameterKey=ECRImageUri,ParameterValue=$ECR_URI:latest \
    ParameterKey=MinCapacity,ParameterValue=2 \
    ParameterKey=MaxCapacity,ParameterValue=10 \
    ParameterKey=DatabaseUrl,ParameterValue="postgresql://..." \
    ParameterKey=SessionSecret,ParameterValue="your-secret" \
    ParameterKey=RedisUrl,ParameterValue="redis://..." \
  --capabilities CAPABILITY_IAM

# Check stack status
aws cloudformation describe-stacks \
  --stack-name notes-app-ecs \
  --query 'Stacks[0].StackStatus'

# Get load balancer URL
aws cloudformation describe-stacks \
  --stack-name notes-app-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

### Step 5: Setup GitHub Actions

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

The workflow will automatically deploy on push to main.

### Auto-Scaling Configuration

AWS ECS scales based on:
- **CPU Utilization**: Target 70% (scales out at >70%, scales in at <70%)
- **Memory Utilization**: Target 80%
- **Request Count**: Target 1000 requests/target
- **Min Instances**: 2
- **Max Instances**: 10
- **Scale Out Cooldown**: 60 seconds
- **Scale In Cooldown**: 300 seconds

### Monitoring

```bash
# View service metrics
aws ecs describe-services \
  --cluster notes-app-cluster \
  --services notes-backend-service

# View CloudWatch logs
aws logs tail /ecs/notes-backend --follow

# View scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/notes-app-cluster/notes-backend-service
```

---

## 🔵 Google Cloud Run

### Prerequisites

- GCP Account with billing enabled
- gcloud CLI installed
- Docker installed

### Step 1: Setup GCP

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init

# Set project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 2: Create Secrets

```bash
# Create secrets
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-
echo -n "your-secret-key" | gcloud secrets create session-secret --data-file=-
echo -n "redis://..." | gcloud secrets create redis-url --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Repeat for other secrets
```

### Step 3: Build and Deploy

```bash
cd apps/backend

# Build and push to GCR
gcloud builds submit --tag gcr.io/$PROJECT_ID/notes-backend

# Deploy to Cloud Run
gcloud run deploy notes-backend \
  --image gcr.io/$PROJECT_ID/notes-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --cpu 2 \
  --memory 2Gi \
  --min-instances 2 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,BACKEND_PORT=3001,CLUSTER_MODE=false \
  --set-secrets DATABASE_URL=database-url:latest,SESSION_SECRET=session-secret:latest,REDIS_URL=redis-url:latest
```

### Step 4: Setup GitHub Actions

Create a service account and download key:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account github-actions@${PROJECT_ID}.iam.gserviceaccount.com
```

Add `GCP_SA_KEY` secret to GitHub with the contents of `key.json`.

### Auto-Scaling Configuration

Cloud Run scales based on:
- **Concurrent Requests**: Target 80 requests/instance
- **Min Instances**: 2 (always running)
- **Max Instances**: 10
- **CPU Allocation**: Always allocated (no throttling)
- **Scale to Zero**: Disabled (min instances = 2)

### Monitoring

```bash
# View service details
gcloud run services describe notes-backend --region us-central1

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=notes-backend" \
  --limit 50 --format json

# View metrics in Cloud Console
open "https://console.cloud.google.com/run/detail/us-central1/notes-backend/metrics"
```

---

## 🔷 Azure Container Instances

### Prerequisites

- Azure Account
- Azure CLI installed
- Docker installed

### Step 1: Setup Azure

```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create \
  --name notes-app-rg \
  --location eastus
```

### Step 2: Create Container Registry

```bash
# Create ACR
az acr create \
  --resource-group notes-app-rg \
  --name notesappacr \
  --sku Basic

# Login to ACR
az acr login --name notesappacr

# Build and push
cd apps/backend
az acr build \
  --registry notesappacr \
  --image notes-backend:latest .
```

### Step 3: Deploy Container Instance

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name notesappacr --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name notesappacr --query passwords[0].value --output tsv)

# Deploy container
az container create \
  --resource-group notes-app-rg \
  --name notes-backend-cg \
  --image notesappacr.azurecr.io/notes-backend:latest \
  --registry-login-server notesappacr.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label notes-backend \
  --ports 3001 \
  --cpu 2 \
  --memory 4 \
  --restart-policy Always \
  --environment-variables \
    NODE_ENV=production \
    BACKEND_PORT=3001 \
    CLUSTER_MODE=false \
  --secure-environment-variables \
    DATABASE_URL="postgresql://..." \
    SESSION_SECRET="your-secret" \
    REDIS_URL="redis://..." \
  --location eastus

# Get FQDN
az container show \
  --resource-group notes-app-rg \
  --name notes-backend-cg \
  --query ipAddress.fqdn \
  --output tsv
```

### Step 4: Setup GitHub Actions

Create a service principal:

```bash
az ad sp create-for-rbac \
  --name "github-actions-sp" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/notes-app-rg \
  --sdk-auth

# Output will be JSON - add as AZURE_CREDENTIALS secret in GitHub
```

### Auto-Scaling Configuration

**Note**: Azure Container Instances doesn't have built-in auto-scaling. For auto-scaling, consider:
- **Azure Container Apps** (recommended) - Has built-in auto-scaling
- **Azure Kubernetes Service (AKS)** - Full orchestration with auto-scaling

### Monitoring

```bash
# View container status
az container show \
  --resource-group notes-app-rg \
  --name notes-backend-cg

# View logs
az container logs \
  --resource-group notes-app-rg \
  --name notes-backend-cg \
  --follow
```

---

## 📊 Platform Comparison

| Feature | AWS ECS Fargate | Google Cloud Run | Azure Container Instances |
|---------|----------------|------------------|---------------------------|
| **Auto-Scaling** | ✅ Yes (CPU, Memory, Requests) | ✅ Yes (Concurrent requests) | ❌ No (use Container Apps) |
| **Min Instances** | 2+ | 0-1000 | N/A |
| **Max Instances** | Unlimited | 1000 | N/A |
| **Cold Starts** | None (min instances) | Minimal | None |
| **Load Balancer** | Application Load Balancer | Built-in | Manual setup needed |
| **Health Checks** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Blue/Green Deploy** | ✅ Yes | ✅ Yes (traffic split) | ❌ Manual |
| **Monitoring** | CloudWatch | Cloud Monitoring | Azure Monitor |
| **Secrets Management** | Secrets Manager | Secret Manager | Key Vault |
| **VPC Support** | ✅ Yes | ✅ Yes (VPC Connector) | ✅ Yes (VNet) |
| **Setup Complexity** | Medium | Easy | Easy |
| **Cost Model** | Per vCPU/Memory/hour | Per request + compute | Per vCPU/Memory/second |

## 💰 Cost Estimates

### AWS ECS Fargate
**Configuration**: 2-10 instances, 1vCPU, 2GB RAM each

| Usage | Monthly Cost |
|-------|--------------|
| Min (2 instances, 24/7) | ~$60 |
| Medium (5 instances avg) | ~$150 |
| Max (10 instances, 24/7) | ~$300 |

### Google Cloud Run
**Configuration**: 2-10 instances, 1vCPU, 2GB RAM, 1M requests/month

| Usage | Monthly Cost |
|-------|--------------|
| Min (2 instances always on) | ~$50 |
| Medium (100k requests) | ~$10-20 |
| High (1M requests) | ~$50-100 |

**Note**: Cloud Run is cheapest for variable traffic due to scale-to-zero.

### Azure Container Instances
**Configuration**: 1 instance, 2vCPU, 4GB RAM (no auto-scaling)

| Usage | Monthly Cost |
|-------|--------------|
| 1 instance (24/7) | ~$90 |

**Recommendation**: Use Azure Container Apps for auto-scaling (~$50-150/month).

## 🎯 Recommendations

### Choose AWS ECS Fargate if:
- ✅ You need fine-grained control over scaling
- ✅ You're already using AWS services
- ✅ You need VPC integration
- ✅ You want predictable performance

### Choose Google Cloud Run if:
- ✅ You want the simplest deployment
- ✅ You have variable traffic patterns
- ✅ You want automatic HTTPS
- ✅ You want to minimize costs

### Choose Azure if:
- ✅ You're already using Azure services
- ✅ Use Container Apps (not Container Instances) for auto-scaling
- ✅ You need enterprise support

## 🚀 Next Steps

1. Choose your platform
2. Follow the setup guide above
3. Configure GitHub Actions secrets
4. Push to main branch to trigger deployment
5. Monitor your application

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)

---

Need help? Check the monitoring dashboards or logs on your chosen platform!
