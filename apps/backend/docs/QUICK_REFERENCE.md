# 🚀 Vertical Scaling Quick Reference

## Common Commands

### Development
```bash
# Single instance (default)
pnpm dev

# Cluster mode (recommended)
pnpm dev:cluster

# Interactive menu
./quick-start.sh
```

### Production
```bash
# Build
pnpm build

# Run single instance
pnpm start

# Run cluster mode (recommended)
pnpm start:cluster
```

### Docker
```bash
# Development
pnpm docker:up
pnpm docker:logs

# Production
pnpm docker:prod:build
pnpm docker:prod:up
pnpm docker:prod:logs
pnpm docker:prod:down
```

## Key Environment Variables

```env
# Enable cluster mode
CLUSTER_MODE=true

# Number of worker processes (default: CPU count)
MAX_WORKERS=4

# Memory monitoring
ENABLE_MEMORY_MONITORING=true
MEMORY_THRESHOLD_MB=512

# Node.js heap size (in MB)
NODE_OPTIONS=--max-old-space-size=2048
```

## Configuration Quick Guide

### 2-Core Server (4GB RAM)
```env
MAX_WORKERS=2
MAX_OLD_SPACE_SIZE=1536
BACKEND_CPU_LIMIT=2
BACKEND_MEMORY_LIMIT=4G
```

### 4-Core Server (8GB RAM)
```env
MAX_WORKERS=4
MAX_OLD_SPACE_SIZE=1536
BACKEND_CPU_LIMIT=4
BACKEND_MEMORY_LIMIT=8G
```

### 8-Core Server (16GB RAM)
```env
MAX_WORKERS=7
MAX_OLD_SPACE_SIZE=2048
BACKEND_CPU_LIMIT=8
BACKEND_MEMORY_LIMIT=16G
```

## Health Check

```bash
curl http://localhost:3001/api/health
```

## View Logs

```bash
# Docker
docker logs -f notes-backend-prod

# Find worker processes
ps aux | grep node

# Monitor resources
docker stats
```

## Troubleshooting

### Workers keep restarting
- Check: `docker logs notes-backend-prod`
- Increase: `MAX_OLD_SPACE_SIZE`
- Reduce: `MAX_WORKERS`

### High memory usage
- Enable monitoring: `ENABLE_MEMORY_MONITORING=true`
- Check logs for memory warnings
- Adjust heap size accordingly

### CPU not fully utilized
- Increase `MAX_WORKERS`
- Check Docker CPU limits

## Documentation

- 📖 **Full Guide**: [SCALING.md](./SCALING.md)
- 🚀 **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 📊 **Diagrams**: [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
- ✅ **Checklist**: [CHECKLIST.md](./CHECKLIST.md)

## Support

1. Check logs
2. Review [SCALING.md](./SCALING.md) troubleshooting
3. Verify environment configuration
4. Check Docker resources

---

**Quick Start**: `../quick-start.sh` or `pnpm dev:cluster`
