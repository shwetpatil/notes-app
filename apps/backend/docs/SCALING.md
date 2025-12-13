# Backend Vertical Scaling Configuration

## Environment Variables for Vertical Scaling

Add these to your `.env` file:

```env
# Cluster Configuration
CLUSTER_MODE=true
MAX_WORKERS=4                        # Maximum number of worker processes (defaults to CPU count)

# Memory Configuration
ENABLE_MEMORY_MONITORING=true        # Enable memory usage monitoring
MEMORY_THRESHOLD_MB=512              # Memory warning threshold in MB

# Node.js Memory Settings (set via NODE_OPTIONS)
# NODE_OPTIONS=--max-old-space-size=2048  # Heap size limit in MB

# Server Configuration
BACKEND_PORT=3001
NODE_ENV=production
```

## Running in Cluster Mode

### Development (with auto-reload)
```bash
pnpm dev:cluster
```

### Production
```bash
pnpm build
pnpm start:cluster
```

### Single Instance (default)
```bash
pnpm dev    # Development
pnpm start  # Production
```

## Resource Allocation

### CPU Cores
- **MAX_WORKERS**: Controls number of Node.js worker processes
  - Default: Number of CPU cores
  - Recommended: CPU cores - 1 (leave one core for system)
  - Example: For 8 cores, set `MAX_WORKERS=7`

### Memory
- **--max-old-space-size**: Node.js heap size limit
  - Default: ~1.4GB
  - Set via: `NODE_OPTIONS=--max-old-space-size=2048`
  - Calculate: Total RAM / Number of Workers
  - Example: 16GB RAM, 4 workers → 3GB per worker → use 2048-3072MB

### Memory Monitoring
- Enable with `ENABLE_MEMORY_MONITORING=true`
- Set warning threshold with `MEMORY_THRESHOLD_MB`
- Logs memory usage every 60 seconds
- Alerts when threshold exceeded

## Docker Resource Limits

Configure in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'        # Maximum CPU cores
          memory: 8G       # Maximum memory
        reservations:
          cpus: '2'        # Minimum CPU cores
          memory: 4G       # Minimum memory
```

## Scaling Strategies

### Vertical Scaling (Single Server)
✅ Implemented:
- Node.js clustering for multi-core utilization
- Configurable worker processes
- Memory monitoring and limits
- Automatic worker restart on failure
- Graceful shutdown handling

**When to use:**
- Cost optimization (single server)
- Moderate traffic (up to ~10k req/min)
- Stateful applications
- Development/staging environments

### Limitations
- Single point of failure
- Limited by hardware
- No load balancing across servers

### Recommended Specifications

| Traffic Level | CPU Cores | RAM | Workers | Heap Size |
|--------------|-----------|-----|---------|-----------|
| Low (<1k req/min) | 2-4 | 4GB | 2-3 | 1024MB |
| Medium (1-10k req/min) | 4-8 | 8-16GB | 4-7 | 2048MB |
| High (>10k req/min) | 8+ | 16GB+ | 7+ | 3072MB |

## Monitoring

### Worker Status
Check logs for:
- `✅ Worker [PID] started` - Worker initialized
- `💚 Worker [PID] is online` - Worker ready
- `⚠️ Worker [PID] died` - Worker crashed
- `🔄 Restarting worker...` - Automatic restart

### Memory Usage
When monitoring enabled:
```
📊 Worker [PID] Memory: RSS=256MB, Heap=128MB
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

## Performance Tips

1. **Worker Count**: Start with CPU cores - 1, monitor and adjust
2. **Memory**: Set heap size to 70-80% of available memory per worker
3. **Rate Limiting**: Configured at 100 req/15min per IP
4. **Body Limits**: Set to 10MB, adjust based on needs
5. **Session Store**: Consider Redis for production (currently in-memory)

## Troubleshooting

### Workers Keep Dying
- Check memory limits with `ENABLE_MEMORY_MONITORING=true`
- Increase `--max-old-space-size`
- Reduce `MAX_WORKERS`

### High Memory Usage
- Lower `MAX_WORKERS`
- Increase `--max-old-space-size` per worker
- Check for memory leaks in application code

### CPU Not Fully Utilized
- Increase `MAX_WORKERS` (up to CPU count)
- Verify cluster mode is enabled
- Check system CPU limits in Docker

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `MAX_WORKERS` appropriately
- [ ] Set `--max-old-space-size` based on available RAM
- [ ] Enable memory monitoring in production
- [ ] Configure Docker resource limits
- [ ] Set up external monitoring (PM2, New Relic, etc.)
- [ ] Configure Redis session store for multi-worker support
- [ ] Set appropriate rate limits for your traffic
- [ ] Enable HTTPS and secure cookies
- [ ] Configure backup and recovery procedures
