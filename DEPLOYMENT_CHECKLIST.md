# 🚀 WorkflowGuard Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend (Render Deployment)
- [x] TypeScript errors fixed
- [x] Database schema updated for PostgreSQL
- [x] Environment variables configured
- [x] Build script working
- [x] Production start script configured
- [x] Render.yaml configuration created
- [x] Dockerfile created

### Frontend (Vercel Deployment)
- [x] API configuration updated for production
- [x] Vercel.json configuration created
- [x] Environment variables configured
- [x] Build script working

### Database (Neon PostgreSQL)
- [x] Database URL configured
- [x] Schema ready for PostgreSQL
- [x] Prisma client generated

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Deploy Backend to Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: `workflowguard-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Port: `4000`
6. Add Environment Variables:
   ```
   # WARNING: Do not commit secrets to your repository.
   # Use your hosting provider's secret management solution.
   DATABASE_URL=YOUR_DATABASE_URL
   DIRECT_URL=YOUR_DIRECT_DATABASE_URL
   JWT_SECRET=YOUR_JWT_SECRET
   PORT=4000
   NODE_ENV=production
   ```

### Step 3: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   ```
   VITE_API_URL=https://api.workflowguard.pro/api
   ```

### Step 4: Configure Custom Domain
1. In Render: Configure custom domain `api.workflowguard.pro`
2. In Vercel: Configure custom domain `www.workflowguard.pro`

## 🔧 Post-Deployment Tasks

### Database Setup
```bash
# After backend is deployed, run database migrations
npx prisma db push
npx prisma db seed
```

### Testing
- [ ] Test backend API endpoints
- [ ] Test frontend application
- [ ] Test user registration/login
- [ ] Test workflow creation
- [ ] Test HubSpot integration

## 📊 Monitoring
- [ ] Set up error monitoring (Sentry)
- [ ] Set up performance monitoring
- [ ] Configure logging
- [ ] Set up health checks

## 🔒 Security
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Configure security headers 