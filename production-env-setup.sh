#!/bin/bash
# Production Environment Setup Script for Hostinger VPS

echo "Setting up production environment variables..."

# Create backend .env file
cat > /root/workflowguard_app/backend/.env << EOF
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/workflowguard"
DIRECT_URL="postgresql://user:password@localhost:5432/workflowguard"

# JWT Configuration
JWT_SECRET="your-secure-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=4000
NODE_ENV=production

# HubSpot Configuration - REPLACE WITH YOUR ACTUAL VALUES
HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"
HUBSPOT_REDIRECT_URI="https://api.workflowguard.pro/api/auth/hubspot/callback"

# Frontend URLs
VITE_API_URL="https://api.workflowguard.pro/api"
DOMAIN="www.workflowguard.pro"

# Razorpay Configuration
RAZORPAY_KEY_ID="rzp_live_R6PjXR1FYupO0Y"
RAZORPAY_KEY_SECRET="O5McpwbAgoiSNMJDQetruaTK"

# Security
ENABLE_HTTPS=true
TRUST_PROXY=1
COOKIE_SECRET="your-secure-cookie-secret"
EOF

echo "Environment file created at /root/workflowguard_app/backend/.env"
echo ""
echo "IMPORTANT: You must update the following values:"
echo "1. HUBSPOT_CLIENT_ID - Get from your HubSpot app"
echo "2. HUBSPOT_CLIENT_SECRET - Get from your HubSpot app"
echo "3. JWT_SECRET - Generate a secure random string"
echo "4. COOKIE_SECRET - Generate a secure random string"
echo "5. DATABASE_URL - Your actual database connection string"
echo ""
echo "After updating, restart containers:"
echo "docker-compose down && docker-compose up --build -d"
