# 🚀 Automatic Deployment Guide

## ✅ **Production Ready Configuration**

Your application is now configured for automatic deployment to:
- **Backend**: Render (with PostgreSQL database)
- **Frontend**: Vercel (with automatic builds)

## 📋 **Deployment Files Created**

### 1. **render.yaml** - Backend Deployment Configuration
- ✅ PostgreSQL database connection
- ✅ Environment variables configured
- ✅ Build and start commands set
- ✅ Production security settings

### 2. **vercel.json** - Frontend Deployment Configuration
- ✅ Static build configuration
- ✅ API route proxying
- ✅ Security headers
- ✅ SPA routing support

### 3. **.github/workflows/deploy.yml** - GitHub Actions
- ✅ Automatic testing on push
- ✅ Backend deployment to Render
- ✅ Frontend deployment to Vercel
- ✅ Branch protection (main only)

## 🚀 **Step-by-Step Deployment Setup**

### **Step 1: Push Changes to GitHub**

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "🚀 Production Ready: PostgreSQL database, security features, and automatic deployment"

# Push to main branch
git push origin main
```

### **Step 2: Set Up Render (Backend)**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `workflowguard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: `Node`

5. **Add Environment Variables:**
   ```
   # WARNING: Do not commit secrets to your repository.
   # Use your hosting provider's secret management solution.
   NODE_ENV=production
   DATABASE_URL=YOUR_DATABASE_URL
   DIRECT_URL=YOUR_DIRECT_DATABASE_URL
   JWT_SECRET=YOUR_JWT_SECRET
   JWT_EXPIRES_IN=7d
   HUBSPOT_CLIENT_ID=YOUR_HUBSPOT_CLIENT_ID
   HUBSPOT_CLIENT_SECRET=YOUR_HUBSPOT_CLIENT_SECRET
   HUBSPOT_REDIRECT_URI=https://api.workflowguard.pro/api/auth/hubspot/callback
   VITE_API_URL=https://api.workflowguard.pro/api
   DOMAIN=www.workflowguard.pro
   RENDER_URL=api.workflowguard.pro
   VERCEL_URL=www.workflowguard.pro
   ENABLE_ANALYTICS=true
   ```

6. **Click "Create Web Service"**

### **Step 3: Set Up Vercel (Frontend)**

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variables:**
   ```
   VITE_API_URL=https://api.workflowguard.pro/api
   DOMAIN=www.workflowguard.pro
   ```

6. **Click "Deploy"**

### **Step 4: Configure GitHub Secrets (Optional - for automatic deployment)**

If you want automatic deployment via GitHub Actions, add these secrets to your repository:

1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**
3. **Add the following secrets:**

   **For Render:**
   - `RENDER_SERVICE_ID`: Your Render service ID
   - `RENDER_API_KEY`: Your Render API key

   **For Vercel:**
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

## 🔗 **Production URLs**

After deployment, your application will be available at:
- **Backend API**: `https://api.workflowguard.pro`
- **Frontend**: `https://www.workflowguard.pro`

## ✅ **Production Features Enabled**

### **Backend (Render):**
- ✅ PostgreSQL database with Neon
- ✅ JWT authentication
- ✅ HubSpot integration
- ✅ Security headers
- ✅ Rate limiting
- ✅ Input validation
- ✅ Automatic backups
- ✅ SSL encryption

### **Frontend (Vercel):**
- ✅ Static file serving
- ✅ API route proxying
- ✅ Security headers
- ✅ SPA routing
- ✅ CDN optimization
- ✅ Automatic builds

### **Automatic Deployment:**
- ✅ GitHub Actions workflow
- ✅ Testing on every push
- ✅ Automatic deployment to production
- ✅ Branch protection
- ✅ Build verification

## 🧪 **Testing Your Deployment**

### **1. Backend Health Check:**
```bash
curl https://api.workflowguard.pro/api
```

### **2. Frontend Access:**
```bash
curl https://www.workflowguard.pro
```

### **3. Database Connection:**
```bash
curl https://api.workflowguard.pro/api/workflow/debug/state
```

## 🔧 **Troubleshooting**

### **If Backend Deployment Fails:**
1. Check Render logs for build errors
2. Verify environment variables are set
3. Ensure database connection is working
4. Check Node.js version compatibility

### **If Frontend Deployment Fails:**
1. Check Vercel build logs
2. Verify API URL is correct
3. Ensure all dependencies are installed
4. Check for TypeScript compilation errors

### **If Database Connection Fails:**
1. Verify Neon database credentials
2. Check SSL connection settings
3. Ensure database schema is pushed
4. Verify network connectivity

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ Backend responds to health checks
- ✅ Frontend loads without errors
- ✅ Database queries work
- ✅ HubSpot OAuth flow works
- ✅ Workflow protection features function
- ✅ All API endpoints respond correctly

## 📊 **Monitoring**

### **Render Monitoring:**
- Automatic health checks
- Performance metrics
- Error logging
- Resource usage

### **Vercel Monitoring:**
- Build status
- Performance analytics
- Error tracking
- User analytics

---

## 🚀 **Ready for Production!**

Your application is now configured for automatic deployment with:
- ✅ **PostgreSQL database** with Neon
- ✅ **Security features** enabled
- ✅ **Automatic deployment** via GitHub Actions
- ✅ **Production monitoring** and logging
- ✅ **SSL encryption** and security headers

**Push your changes and watch the magic happen!** 🎉 