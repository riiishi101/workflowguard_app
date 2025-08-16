#!/bin/bash

echo "🚀 WorkflowGuard Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Build backend
echo "🔨 Building backend..."
cd backend
npm install
npm run build
echo "✅ Backend built successfully"

# Build frontend
echo "🔨 Building frontend..."
cd ../frontend
npm install
npm run build
echo "✅ Frontend built successfully"

echo ""
echo "🎯 Next Steps:"
echo "For a secure and efficient deployment, we strongly recommend setting up a CI/CD pipeline using GitHub Actions, Render Blueprints, or Vercel's Git integration."
echo ""
echo "1.  **Automate Deployments**: Connect your GitHub repository to Render and Vercel to enable automatic deployments on every push to your main branch."
echo "2.  **Manage Secrets Safely**: Store your `DATABASE_URL` and `JWT_SECRET` in your hosting provider's secret management dashboard, not in your code."
echo "3.  **Review Deployment Guide**: For detailed instructions, refer to `AUTOMATIC_DEPLOYMENT_GUIDE.md`."
echo ""
echo "✅ Build preparation complete!" 