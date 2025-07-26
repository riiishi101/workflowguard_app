# 🚀 WorkflowGuard Production Deployment Guide

## 📋 Overview

This guide covers deploying the enhanced WorkflowGuard application to production with all the latest improvements including:
- Optimized bundle sizes (275KB main chunk vs 841KB)
- Enhanced error handling and monitoring
- Real-time workflow sync status
- Comprehensive dashboard widgets
- Advanced analytics and health monitoring

## ✅ Pre-Deployment Checklist

### Environment Configuration
- [ ] **Backend Environment Variables** (copy `backend/env.example` to `backend/.env`)
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

- [ ] **Frontend Environment Variables** (copy `frontend/env.example` to `frontend/.env`)
  ```bash
  VITE_API_URL="https://yourdomain.com/api"
  VITE_APP_NAME="WorkflowGuard"
  VITE_SENTRY_DSN="your-sentry-dsn"
  ```

### Database Setup
- [ ] **PostgreSQL Database**
  ```sql
  CREATE DATABASE workflowguard;
  CREATE USER workflowguard_user WITH PASSWORD 'secure_password';
  GRANT ALL PRIVILEGES ON DATABASE workflowguard TO workflowguard_user;
  ```

- [ ] **Run Migrations**
  ```bash
  cd backend
  npx prisma migrate deploy
  npx prisma generate
  ```

- [ ] **Apply RLS Policies** (Security)
  ```bash
  # Run the SQL script in Supabase dashboard or via psql
  # File: backend/supabase-rls-fix.sql
  ```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Backend Deployment
1. **Connect Repository to Vercel**
   ```bash
   # In Vercel dashboard, import your repository
   # Set root directory to: backend
   ```

2. **Configure Environment Variables**
   - Add all backend environment variables in Vercel dashboard
   - Ensure `VERCEL=1` is set

3. **Build Settings**
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

#### Frontend Deployment
1. **Create New Vercel Project**
   - Set root directory to: `frontend`
   - Framework Preset: `Vite`

2. **Configure Environment Variables**
   - Add all frontend environment variables

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Option 2: Docker Compose

1. **Update docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - JWT_SECRET=${JWT_SECRET}
         # ... other env vars
       depends_on:
         - postgres
     
     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend
     
     postgres:
       image: postgres:14
       environment:
         - POSTGRES_DB=workflowguard
         - POSTGRES_USER=workflowguard_user
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Deploy**
   ```bash
   docker-compose up -d
   ```

## 🔧 Post-Deployment Verification

### 1. Health Checks
```bash
# Basic health check
curl https://yourdomain.com/health

# Readiness check (includes DB connectivity)
curl https://yourdomain.com/ready

# Metrics endpoint
curl https://yourdomain.com/metrics
```

### 2. Frontend Tests
- [ ] Visit `https://yourdomain.com`
- [ ] Welcome modal appears for new users
- [ ] HubSpot OAuth flow works
- [ ] Dashboard loads with widgets
- [ ] No console errors in browser devtools

### 3. Backend API Tests
```bash
# Test authentication
curl -X POST https://yourdomain.com/api/auth/hubspot

# Test workflow endpoints
curl -H "Authorization: Bearer YOUR_JWT" \
     https://yourdomain.com/api/workflows

# Test sync status
curl -H "Authorization: Bearer YOUR_JWT" \
     https://yourdomain.com/api/workflows/sync-status
```

### 4. Performance Tests
- [ ] Bundle size verification (should be ~275KB main chunk)
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Real-time features working

## 📊 Monitoring Setup

### 1. Sentry Integration
```javascript
// Already configured in ErrorBoundary component
// Add your Sentry DSN to environment variables
```

### 2. Prometheus Metrics
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'workflowguard'
    static_configs:
      - targets: ['yourdomain.com:3000']
    metrics_path: '/metrics'
```

### 3. Health Monitoring
```bash
# Set up uptime monitoring for:
# - https://yourdomain.com/health
# - https://yourdomain.com/ready
# - https://yourdomain.com/api/workflows
```

## 🔒 Security Checklist

- [ ] **JWT_SECRET** is strong and unique
- [ ] **Database credentials** are secure
- [ ] **HubSpot OAuth** is properly configured
- [ ] **CORS** is configured for your domain
- [ ] **Rate limiting** is enabled
- [ ] **HTTPS** is enforced
- [ ] **RLS policies** are applied to database
- [ ] **Environment variables** are not committed to git

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   cd backend
   npx prisma db push
   ```

3. **HubSpot OAuth Issues**
   - Verify redirect URI matches exactly
   - Check HubSpot app configuration
   - Ensure all required scopes are enabled

4. **CORS Errors**
   - Update CORS_ORIGIN in backend
   - Check frontend API_URL configuration

### Performance Issues

1. **Slow Page Loads**
   - Verify bundle optimization is working
   - Check CDN configuration
   - Monitor API response times

2. **High Memory Usage**
   - Monitor Node.js memory usage
   - Check for memory leaks in WebSocket connections
   - Optimize database queries

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple backend instances
- Database connection pooling
- Redis for session storage (if needed)

### Performance Optimization
- Enable compression (already configured)
- Use CDN for static assets
- Database indexing
- Caching strategies

## 🔄 Update Process

### Backend Updates
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
cd backend
npm install

# 3. Run migrations
npx prisma migrate deploy

# 4. Build and deploy
npm run build
# Deploy to your platform
```

### Frontend Updates
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
cd frontend
npm install

# 3. Build
npm run build

# 4. Deploy
# Deploy to your platform
```

## 📞 Support

For production support:
- **Email**: support@workflowguard.pro
- **Documentation**: https://docs.workflowguard.pro
- **Status Page**: https://status.workflowguard.pro
- **GitHub Issues**: For bug reports and feature requests

## 🎯 Success Metrics

Monitor these key metrics after deployment:
- **Uptime**: > 99.9%
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Error Rate**: < 0.1%
- **User Satisfaction**: > 4.5/5

---

**Last Updated**: July 2024
**Version**: 1.0.0
**Author**: WorkflowGuard Team 