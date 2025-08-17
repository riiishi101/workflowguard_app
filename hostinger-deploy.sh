#!/bin/bash

# WorkflowGuard Deployment Script for Hostinger VPS
# Run this script on your VPS after initial setup

set -e

echo "🚀 Starting WorkflowGuard deployment..."

# Configuration
APP_DIR="/var/www/workflowguard_app"
LOG_DIR="/var/log/workflowguard"
BACKUP_DIR="/var/backups/workflowguard"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
apt install postgresql postgresql-contrib -y

# Install Nginx
print_status "Installing Nginx..."
apt install nginx -y

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# Install other dependencies
print_status "Installing additional packages..."
apt install git certbot python3-certbot-nginx ufw -y

# Create directories
print_status "Creating directories..."
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR
chown -R www-data:www-data $LOG_DIR

# Clone repository if not exists
if [ ! -d "$APP_DIR" ]; then
    print_status "Cloning repository..."
    cd /var/www
    git clone https://github.com/riiishi101/workflowguard_app.git
else
    print_status "Repository exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
fi

# Set permissions
print_status "Setting file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Backend setup
print_status "Setting up backend..."
cd $APP_DIR/backend

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create it with your configuration."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
fi

# Install backend dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Build backend
npm run build

# Frontend setup
print_status "Setting up frontend..."
cd $APP_DIR/frontend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Creating template..."
    cat > .env.production << EOF
VITE_API_URL=https://api.workflowguard.pro/api
VITE_APP_URL=https://workflowguard.pro
VITE_ENVIRONMENT=production
EOF
fi

# Install frontend dependencies and build
npm install
npm run build

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/workflowguard << 'EOF'
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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/workflowguard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Create health check script
print_status "Creating health check script..."
cat > /root/health-check.sh << 'EOF'
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
EOF

chmod +x /root/health-check.sh

# Create database backup script
print_status "Creating database backup script..."
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/workflowguard"
mkdir -p $BACKUP_DIR

# Replace with your actual database credentials
DB_USER="workflowguard"
DB_NAME="workflowguard_prod"

pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Configure firewall
print_status "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Start services
print_status "Starting services..."
systemctl enable postgresql
systemctl enable nginx
systemctl start postgresql
systemctl restart nginx

# Start application with PM2
print_status "Starting application..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_status "Deployment completed!"
print_warning "Next steps:"
echo "1. Configure your database credentials in backend/.env"
echo "2. Run database migrations: cd $APP_DIR/backend && npx prisma migrate deploy"
echo "3. Set up SSL certificates: certbot --nginx -d workflowguard.pro -d api.workflowguard.pro"
echo "4. Configure your HubSpot app credentials in .env"
echo "5. Test your application at http://your-domain"

print_status "Useful commands:"
echo "- View logs: pm2 logs"
echo "- Restart app: pm2 restart workflowguard-backend"
echo "- Check status: pm2 status"
echo "- Update app: cd $APP_DIR && git pull && ./hostinger-deploy.sh"
