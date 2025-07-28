# WorkflowGuard Production Deployment Guide

## Overview
This guide covers deploying WorkflowGuard to production environments with proper security, monitoring, and scalability considerations.

## Prerequisites
- Node.js 20+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- SSL Certificate
- HubSpot Developer Account

## Environment Configuration

### Backend Environment Variables
Copy `backend/env.example` to `backend/.env` and configure:

```bash
# Required
DATABASE_URL="postgresql://user:pass@host:5432/workflowguard"
JWT_SECRET="your-super-secret-jwt-key"
HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"
HUBSPOT_REDIRECT_URI="https://yourdomain.com/api/auth/callback"

# Optional but recommended
NODE_ENV="production"
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

### Frontend Environment Variables
Copy `frontend/env.example` to `frontend/.env` and configure:

```bash
VITE_API_URL="https://yourdomain.com/api"
VITE_APP_NAME="WorkflowGuard"
VITE_SENTRY_DSN="your-sentry-dsn"
```

## Database Setup

1. **Create Database**
```sql
CREATE DATABASE workflowguard;
CREATE USER workflowguard_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE workflowguard TO workflowguard_user;
```

2. **Run Migrations**
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

3. **Seed Data (Optional)**
```bash
npm run seed
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Update docker-compose.yml** with your environment variables
2. **Deploy**:
```bash
docker-compose up -d
```

### Option 2: Manual Deployment

#### Backend
```bash
cd backend
npm install --production
npm run build
npm run start:prod
```

#### Frontend
```bash
cd frontend
npm install
npm run build:prod
# Serve with nginx or similar
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] HubSpot OAuth is properly configured
- [ ] CORS is configured for your domain
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Environment variables are not committed to git

## Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes DB connectivity)
- `GET /metrics` - Prometheus metrics

### Monitoring Setup
1. **Prometheus** - Collect metrics from `/metrics` endpoint
2. **Grafana** - Visualize metrics and create dashboards
3. **Sentry** - Error tracking and performance monitoring
4. **Logs** - Centralized logging (ELK stack, etc.)

## SSL/TLS Configuration

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        root /var/www/workflowguard;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup Strategy

### Database Backups
```bash
# Daily backup script
pg_dump workflowguard > backup_$(date +%Y%m%d).sql
```

### File Backups
- Configuration files
- SSL certificates
- Environment files

## Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple backend instances
- Database connection pooling
- Redis for session storage (if needed)

### Performance Optimization
- Enable compression
- Use CDN for static assets
- Database indexing
- Caching strategies

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL
   - Verify network connectivity
   - Check PostgreSQL logs

2. **HubSpot OAuth Issues**
   - Verify client ID/secret
   - Check redirect URI configuration
   - Ensure domain is whitelisted

3. **CORS Errors**
   - Update CORS_ORIGIN in backend
   - Check frontend API_URL configuration

### Logs
- Backend logs: `docker logs workflowguard-backend`
- Database logs: Check PostgreSQL logs
- Nginx logs: `/var/log/nginx/`

## Support

For production support:
- Email: support@workflowguard.pro
- Documentation: https://docs.workflowguard.pro
- Status page: https://status.workflowguard.pro 