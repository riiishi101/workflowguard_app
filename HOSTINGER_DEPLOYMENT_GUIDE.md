# WorkflowGuard Deployment Guide - Hostinger VPS

## Prerequisites

### 1. Hostinger VPS Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended

### 2. Domain Setup
- Point your domain to Hostinger VPS IP
- Configure DNS A records:
  - `workflowguard.pro` → VPS IP
  - `api.workflowguard.pro` → VPS IP

## Step 1: Initial VPS Setup

### Connect to VPS
```bash
ssh root@your-vps-ip
```

### Update System
```bash
apt update && apt upgrade -y
```

### Install Required Software
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git
apt install git -y

# Install SSL (Certbot)
apt install certbot python3-certbot-nginx -y
```

## Step 2: Database Setup

### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE workflowguard_prod;
CREATE USER workflowguard WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE workflowguard_prod TO workflowguard;
\q
```

### Configure PostgreSQL for remote connections
```bash
# Edit postgresql.conf
nano /etc/postgresql/*/main/postgresql.conf
# Add: listen_addresses = 'localhost'

# Edit pg_hba.conf
nano /etc/postgresql/*/main/pg_hba.conf
# Add: local   workflowguard_prod   workflowguard   md5

# Restart PostgreSQL
systemctl restart postgresql
```

## Step 3: Deploy Application

### Clone Repository
```bash
cd /var/www
git clone https://github.com/riiishi101/workflowguard_app.git
cd workflowguard_app
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build
```

## Step 4: Environment Configuration

### Backend Environment (.env)
```bash
cd /var/www/workflowguard_app/backend
nano .env
```

Add the following configuration:
```env
# Database
DATABASE_URL="postgresql://workflowguard:your_secure_password@localhost:5432/workflowguard_prod"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# HubSpot Configuration
HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"
HUBSPOT_REDIRECT_URI="https://api.workflowguard.pro/api/auth/hubspot/callback"

# CORS
FRONTEND_URL="https://workflowguard.pro"
CORS_ORIGIN="https://workflowguard.pro"

# Server
NODE_ENV="production"
PORT=3001
HOST="0.0.0.0"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@workflowguard.pro"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET="your-session-secret-key"

# Logging
LOG_LEVEL="info"
```

### Frontend Environment
```bash
cd ../frontend
nano .env.production
```

Add:
```env
VITE_API_URL=https://api.workflowguard.pro/api
VITE_APP_URL=https://workflowguard.pro
VITE_ENVIRONMENT=production
```

## Step 5: PM2 Configuration

### Create PM2 Ecosystem File
```bash
cd /var/www/workflowguard_app
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'workflowguard-backend',
      script: './backend/dist/main.js',
      cwd: '/var/www/workflowguard_app/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/workflowguard/backend-error.log',
      out_file: '/var/log/workflowguard/backend-out.log',
      log_file: '/var/log/workflowguard/backend.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### Build Backend
```bash
cd backend
npm run build
```

### Create Log Directory
```bash
mkdir -p /var/log/workflowguard
chown -R www-data:www-data /var/log/workflowguard
```

## Step 6: Nginx Configuration

### Create Nginx Config
```bash
nano /etc/nginx/sites-available/workflowguard
```

```nginx
# Backend API Server
server {
    listen 80;
    server_name api.workflowguard.pro;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend Server
server {
    listen 80;
    server_name workflowguard.pro www.workflowguard.pro;
    root /var/www/workflowguard_app/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security
    location ~ /\. {
        deny all;
    }
}
```

### Enable Site
```bash
ln -s /etc/nginx/sites-available/workflowguard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 7: SSL Certificate

### Install SSL with Certbot
```bash
certbot --nginx -d workflowguard.pro -d www.workflowguard.pro -d api.workflowguard.pro
```

### Auto-renewal
```bash
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Start Application

### Start with PM2
```bash
cd /var/www/workflowguard_app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Set File Permissions
```bash
chown -R www-data:www-data /var/www/workflowguard_app
chmod -R 755 /var/www/workflowguard_app
```

## Step 9: Firewall Configuration

```bash
# Install UFW
apt install ufw -y

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432  # PostgreSQL (if needed)
ufw enable
```

## Step 10: Monitoring & Maintenance

### PM2 Monitoring
```bash
# View logs
pm2 logs workflowguard-backend

# Monitor processes
pm2 monit

# Restart application
pm2 restart workflowguard-backend

# View status
pm2 status
```

### Database Backup Script
```bash
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/workflowguard"
mkdir -p $BACKUP_DIR

pg_dump -U workflowguard -h localhost workflowguard_prod > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

## Step 11: Health Checks

### Create Health Check Script
```bash
nano /root/health-check.sh
```

```bash
#!/bin/bash
# Check if backend is running
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Backend is down, restarting..."
    pm2 restart workflowguard-backend
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is down, restarting..."
    systemctl restart nginx
fi
```

```bash
chmod +x /root/health-check.sh
crontab -e
# Add: */5 * * * * /root/health-check.sh
```

## Deployment Commands Summary

```bash
# Quick deployment update
cd /var/www/workflowguard_app
git pull origin main
cd backend && npm run build
cd ../frontend && npm run build
pm2 restart workflowguard-backend
```

## Troubleshooting

### Common Issues
1. **Port 3001 in use**: `lsof -i :3001` and kill process
2. **Database connection**: Check PostgreSQL status and credentials
3. **SSL issues**: Run `certbot renew` manually
4. **Memory issues**: Increase VPS RAM or optimize PM2 config

### Logs Location
- Backend: `/var/log/workflowguard/`
- Nginx: `/var/log/nginx/`
- PM2: `pm2 logs`

## Security Checklist
- [ ] Strong database passwords
- [ ] JWT secrets configured
- [ ] Firewall enabled
- [ ] SSL certificates installed
- [ ] Regular backups scheduled
- [ ] Security headers configured
- [ ] File permissions set correctly

Your WorkflowGuard app should now be live at:
- Frontend: https://workflowguard.pro
- Backend API: https://api.workflowguard.pro
