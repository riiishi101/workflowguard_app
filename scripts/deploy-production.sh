#!/bin/bash

# ========================================
# WorkflowGuard Production Deployment Script
# ========================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ========================================
# Configuration
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
ENV_FILE="$PROJECT_ROOT/.env"

# ========================================
# Pre-deployment Checks
# ========================================
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    success "Docker is installed"
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    success "Docker Compose is installed"
    
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error ".env file not found. Please copy env.example to .env and configure it"
    fi
    success ".env file exists"
    
    # Check required environment variables
    source "$ENV_FILE"
    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "HUBSPOT_CLIENT_ID"
        "HUBSPOT_CLIENT_SECRET"
        "HUBSPOT_REDIRECT_URI"
        "CORS_ORIGIN"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    success "All required environment variables are set"
}

# ========================================
# Security Validation
# ========================================
validate_security() {
    log "Validating security configuration..."
    
    source "$ENV_FILE"
    
    # Check JWT secret strength
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        error "JWT_SECRET must be at least 32 characters long"
    fi
    success "JWT_SECRET meets minimum length requirement"
    
    # Check if using HTTPS in production
    if [[ "$NODE_ENV" == "production" ]]; then
        if [[ ! "$CORS_ORIGIN" =~ ^https:// ]]; then
            warning "CORS_ORIGIN should use HTTPS in production"
        fi
    fi
    
    # Check database URL security
    if [[ "$DATABASE_URL" =~ password ]]; then
        success "Database URL contains password"
    else
        warning "Database URL might not contain password"
    fi
}

# ========================================
# Database Migration
# ========================================
run_database_migration() {
    log "Running database migrations..."
    
    cd "$BACKEND_DIR"
    
    # Generate Prisma client
    log "Generating Prisma client..."
    docker run --rm \
        -v "$(pwd):/app" \
        -w /app \
        --env-file "$ENV_FILE" \
        node:20-alpine \
        sh -c "npm ci && npx prisma generate"
    
    # Run migrations
    log "Running database migrations..."
    docker run --rm \
        -v "$(pwd):/app" \
        -w /app \
        --env-file "$ENV_FILE" \
        node:20-alpine \
        sh -c "npm ci && npx prisma migrate deploy"
    
    success "Database migrations completed"
}

# ========================================
# Build and Deploy
# ========================================
build_and_deploy() {
    log "Building and deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down --remove-orphans
    
    # Build images
    log "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout=300
    counter=0
    
    while [[ $counter -lt $timeout ]]; do
        if docker-compose ps | grep -q "healthy"; then
            success "All services are healthy"
            break
        fi
        sleep 5
        counter=$((counter + 5))
    done
    
    if [[ $counter -ge $timeout ]]; then
        error "Services failed to become healthy within $timeout seconds"
    fi
}

# ========================================
# Health Checks
# ========================================
run_health_checks() {
    log "Running health checks..."
    
    # Check backend health
    log "Checking backend health..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend health
    log "Checking frontend health..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
    
    # Check database connection
    log "Checking database connection..."
    cd "$BACKEND_DIR"
    if docker run --rm \
        --env-file "$ENV_FILE" \
        node:20-alpine \
        sh -c "npm ci && npx prisma db execute --stdin <<< 'SELECT 1'" > /dev/null 2>&1; then
        success "Database connection is healthy"
    else
        error "Database connection failed"
    fi
}

# ========================================
# SSL Certificate Setup
# ========================================
setup_ssl() {
    log "Setting up SSL certificates..."
    
    SSL_DIR="$PROJECT_ROOT/nginx/ssl"
    mkdir -p "$SSL_DIR"
    
    # Check if SSL certificates exist
    if [[ ! -f "$SSL_DIR/cert.pem" ]] || [[ ! -f "$SSL_DIR/key.pem" ]]; then
        warning "SSL certificates not found. Generating self-signed certificates..."
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        success "Self-signed SSL certificates generated"
        warning "For production, replace with proper SSL certificates"
    else
        success "SSL certificates found"
    fi
}

# ========================================
# Monitoring Setup
# ========================================
setup_monitoring() {
    log "Setting up monitoring..."
    
    MONITORING_DIR="$PROJECT_ROOT/monitoring"
    mkdir -p "$MONITORING_DIR"
    
    # Create Prometheus configuration
    cat > "$MONITORING_DIR/prometheus.yml" << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'workflowguard-backend'
    static_configs:
      - targets: ['workflowguard-backend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'workflowguard-frontend'
    static_configs:
      - targets: ['workflowguard-frontend:80']
    metrics_path: '/health'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s
EOF
    
    # Create Grafana directories
    mkdir -p "$MONITORING_DIR/grafana/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/datasources"
    
    # Create Grafana datasource
    cat > "$MONITORING_DIR/grafana/datasources/prometheus.yml" << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
    
    success "Monitoring configuration created"
}

# ========================================
# Backup Setup
# ========================================
setup_backup() {
    log "Setting up backup configuration..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    
    # Create backup script
    cat > "$PROJECT_ROOT/scripts/backup.sh" << 'EOF'
#!/bin/bash

set -euo pipefail

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="workflowguard_backup_${TIMESTAMP}.sql"

echo "Creating database backup: $BACKUP_FILE"

pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/backup.sh"
    success "Backup configuration created"
}

# ========================================
# Performance Optimization
# ========================================
optimize_performance() {
    log "Optimizing performance..."
    
    # Set Docker daemon limits
    if [[ -f "/etc/docker/daemon.json" ]]; then
        log "Docker daemon configuration found"
    else
        warning "Consider creating /etc/docker/daemon.json for performance tuning"
    fi
    
    # Check system resources
    log "Checking system resources..."
    
    # Memory check
    total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $total_mem -lt 2048 ]]; then
        warning "System has less than 2GB RAM. Consider upgrading for production use."
    else
        success "System has sufficient RAM: ${total_mem}MB"
    fi
    
    # Disk space check
    available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $available_space -lt 10 ]]; then
        warning "Less than 10GB disk space available. Consider freeing up space."
    else
        success "Sufficient disk space: ${available_space}GB"
    fi
}

# ========================================
# Security Hardening
# ========================================
harden_security() {
    log "Hardening security..."
    
    # Create .dockerignore files if they don't exist
    if [[ ! -f "$BACKEND_DIR/.dockerignore" ]]; then
        cat > "$BACKEND_DIR/.dockerignore" << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
*.log
logs
*.pid
*.seed
*.pid.lock
.npm
.eslintcache
.node_repl_history
*.tgz
.yarn-integrity
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF
    fi
    
    if [[ ! -f "$FRONTEND_DIR/.dockerignore" ]]; then
        cat > "$FRONTEND_DIR/.dockerignore" << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
dist
coverage
*.log
logs
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF
    fi
    
    success "Security hardening completed"
}

# ========================================
# Main Deployment Function
# ========================================
main() {
    log "Starting WorkflowGuard production deployment..."
    
    check_prerequisites
    validate_security
    setup_ssl
    setup_monitoring
    setup_backup
    optimize_performance
    harden_security
    run_database_migration
    build_and_deploy
    run_health_checks
    
    success "🎉 Deployment completed successfully!"
    
    log "Application URLs:"
    echo "  Frontend: https://localhost"
    echo "  Backend API: https://localhost/api"
    echo "  Health Check: https://localhost/health"
    echo "  Grafana: http://localhost:3001 (admin/admin)"
    echo "  Prometheus: http://localhost:9090"
    
    log "Next steps:"
    echo "  1. Replace self-signed SSL certificates with proper certificates"
    echo "  2. Configure your domain name in DNS"
    echo "  3. Set up monitoring alerts"
    echo "  4. Configure automated backups"
    echo "  5. Set up CI/CD pipeline"
}

# ========================================
# Script Execution
# ========================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 