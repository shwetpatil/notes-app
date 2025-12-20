# Production Monitoring & Alerts Configuration

## Overview
Comprehensive monitoring setup for the Notes Application with alerting, dashboards, and incident management.

---

## 1. Sentry Configuration

### Alert Rules

#### High Priority Alerts
**Error Rate Spike**
- **Condition**: Error rate > 1% over 5 minutes
- **Notification**: Slack + PagerDuty
- **Action**: Page on-call engineer
```yaml
name: "High Error Rate"
condition: "error_rate > 1%"
window: 5m
channels: [slack, pagerduty]
```

**Critical API Failures**
- **Condition**: 5xx errors on critical endpoints (auth, notes CRUD)
- **Notification**: Slack + PagerDuty  
- **Action**: Immediate investigation
```yaml
name: "Critical API Failure"
condition: "status_code >= 500 AND endpoint IN [/api/auth/*, /api/notes/*]"
threshold: 5
window: 1m
```

#### Medium Priority Alerts
**Performance Degradation**
- **Condition**: P95 response time > 1s
- **Notification**: Slack
- **Action**: Performance review within 1 hour

**Memory Usage High**
- **Condition**: Memory > 85%
- **Notification**: Slack
- **Action**: Check for memory leaks

#### Low Priority Alerts
**Warning-Level Logs**
- **Condition**: > 100 warnings in 10 minutes
- **Notification**: Slack (non-urgent channel)
- **Action**: Review during business hours

### Sentry Dashboard Configuration
```bash
# Navigate to Sentry Dashboard
https://sentry.io/organizations/your-org/projects/notes-app/

# Configure:
1. Performance Monitoring: ON
2. Release Tracking: ON
3. Source Maps: Uploaded
4. Error Grouping: Smart
5. Data Retention: 90 days
```

---

## 2. Redis Monitoring

### Metrics to Track
- **Memory Usage**: Current vs Max
- **Hit Rate**: Cache hit percentage
- **Connections**: Active connections
- **Commands/sec**: Throughput
- **Evicted Keys**: Memory pressure indicator

### Redis Dashboard (Grafana)
```json
{
  "dashboard": "Redis Performance",
  "panels": [
    {
      "title": "Memory Usage",
      "query": "redis_memory_used_bytes / redis_memory_max_bytes * 100",
      "threshold": { "warning": 80, "critical": 90 }
    },
    {
      "title": "Cache Hit Rate",
      "query": "rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) * 100",
      "target": "> 80%"
    },
    {
      "title": "Commands Per Second",
      "query": "rate(redis_commands_processed_total[1m])"
    }
  ]
}
```

### Redis Alerts
```yaml
# High memory usage
- alert: RedisHighMemory
  expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.85
  for: 5m
  annotations:
    summary: "Redis memory usage is above 85%"
    
# Low hit rate
- alert: RedisLowHitRate
  expr: rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) < 0.7
  for: 10m
  annotations:
    summary: "Redis cache hit rate below 70%"

# Connection issues
- alert: RedisConnectionFailures
  expr: rate(redis_rejected_connections_total[5m]) > 0
  annotations:
    summary: "Redis rejecting connections"
```

---

## 3. Rate Limiting Monitoring

### Metrics to Track
- **Blocked Requests**: Total requests blocked per endpoint
- **Block Rate**: Percentage of requests blocked
- **Top Blocked IPs**: IPs with most blocks
- **Endpoint Abuse**: Which endpoints are being abused

### Rate Limit Dashboard
```typescript
// Dashboard query example
{
  "blocked_requests_per_minute": "sum(rate(rate_limit_blocked_total[1m])) by (endpoint)",
  "block_rate_percent": "sum(rate_limit_blocked_total) / sum(rate_limit_total) * 100",
  "top_blocked_ips": "topk(10, sum(rate_limit_blocked_total) by (ip_address))"
}
```

### Rate Limit Alerts
```yaml
# High block rate on auth endpoints
- alert: HighAuthRateLimitBlocks
  expr: rate(rate_limit_blocked_total{endpoint=~"/api/auth/.*"}[5m]) > 10
  for: 2m
  annotations:
    summary: "Possible brute force attack on auth endpoints"
    action: "Review blocked IPs and consider IP banning"

# Unusual rate limit pattern
- alert: RateLimitSpike
  expr: rate(rate_limit_blocked_total[5m]) > avg_over_time(rate(rate_limit_blocked_total[1h])) * 3
  annotations:
    summary: "Rate limit blocks spiking"
```

---

## 4. Application Performance Monitoring (APM)

### Web Vitals Tracking
**Target Metrics:**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 800ms

**Dashboard:** Real User Monitoring (RUM)
```javascript
// Web Vitals configuration
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to Google Analytics
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
  
  // Alert if threshold exceeded
  const thresholds = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    TTFB: 800
  };
  
  if (metric.value > thresholds[metric.name]) {
    // Log warning
    console.warn(`Web Vital threshold exceeded: ${metric.name} = ${metric.value}`);
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 5. Database Monitoring

### PostgreSQL Metrics
- **Connection Pool**: Active vs Available
- **Query Performance**: Slow query log (> 1s)
- **Lock Waits**: Blocking queries
- **Cache Hit Rate**: Buffer cache efficiency
- **Replication Lag**: For replicas

### Alerts
```yaml
# Slow queries
- alert: SlowDatabaseQueries
  expr: avg(query_duration_seconds) by (query_name) > 1
  for: 5m
  
# Connection pool exhaustion
- alert: DatabaseConnectionPoolFull
  expr: database_connections_active / database_connections_max > 0.9
  
# High replication lag
- alert: DatabaseReplicationLag
  expr: database_replication_lag_seconds > 30
```

---

## 6. Infrastructure Monitoring

### System Metrics
- **CPU Usage**: Per container/instance
- **Memory Usage**: Per container/instance
- **Disk I/O**: Read/write throughput
- **Network I/O**: Bandwidth usage

### Container Health
```yaml
# Docker health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 7. Incident Management

### Runbooks

#### High Error Rate
1. Check Sentry for error patterns
2. Review recent deployments (rollback if needed)
3. Check database connectivity
4. Review Redis status
5. Scale up if traffic spike

#### Database Connection Issues
1. Check connection pool settings
2. Review active connections
3. Identify long-running queries
4. Kill blocking queries if necessary
5. Restart database if corrupted

#### Memory Leak
1. Capture heap snapshot
2. Analyze with Chrome DevTools
3. Identify growing objects
4. Deploy fix
5. Monitor memory trends

### On-Call Schedule
```yaml
Primary: Developer Team (rotating weekly)
Secondary: DevOps Team
Escalation: Engineering Manager (after 30 min)
```

### Incident Severity Levels
- **P0 (Critical)**: Service down, data loss - Response: Immediate
- **P1 (High)**: Significant feature broken - Response: < 1 hour
- **P2 (Medium)**: Minor feature issue - Response: < 4 hours  
- **P3 (Low)**: Cosmetic issue - Response: Next business day

---

## 8. Monitoring Stack Setup

### Recommended Tools
1. **Sentry**: Error tracking & performance
2. **Grafana**: Dashboards & visualization
3. **Prometheus**: Metrics collection
4. **Alertmanager**: Alert routing
5. **PagerDuty**: Incident management
6. **Slack**: Team notifications

### Quick Setup
```bash
# Install monitoring stack (Docker Compose)
cd infrastructure/monitoring
docker-compose up -d

# Services:
# - Grafana: http://localhost:3000
# - Prometheus: http://localhost:9090
# - Alertmanager: http://localhost:9093
```

---

## 9. Environment Variables

```bash
# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

# Redis Monitoring
REDIS_MONITORING_ENABLED=true

# Performance Monitoring
ENABLE_APM=true
APM_SAMPLE_RATE=0.1  # 10% of requests

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
PAGERDUTY_API_KEY=xxx
```

---

## 10. Testing Alerts

```bash
# Test Sentry alert
curl -X POST https://your-api.com/api/test-error

# Test rate limit alert
for i in {1..100}; do
  curl https://your-api.com/api/notes
done

# Test memory alert (requires access to container)
docker exec notes-backend node -e "const arr = []; while(true) arr.push(new Array(1000000))"
```

---

## Maintenance Checklist

### Weekly
- [ ] Review Sentry issues and trends
- [ ] Check dashboard metrics for anomalies
- [ ] Review slow query logs
- [ ] Verify alert channels are working

### Monthly
- [ ] Review and adjust alert thresholds
- [ ] Update runbooks based on incidents
- [ ] Performance optimization review
- [ ] Cost analysis of monitoring tools

### Quarterly
- [ ] Update on-call rotation
- [ ] Conduct incident response drill
- [ ] Review monitoring coverage
- [ ] Evaluate new monitoring tools

---

**Last Updated**: December 13, 2025
**Version**: 1.0
**Owner**: DevOps Team
