# 🔗 HubSpot Integration Setup - Real Workflows

## 🎯 **Problem Solved: Connect Your Real HubSpot Workflows**

You have real HubSpot workflows and want to test the actual features. Here's how to properly connect them:

## 🚀 **Step-by-Step Setup**

### **Step 1: Backend Environment Setup**

Create `backend/.env` file:
```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/workflowguard"
DIRECT_URL="postgresql://username:password@localhost:5432/workflowguard"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# HubSpot Configuration (YOUR REAL CREDENTIALS)
HUBSPOT_CLIENT_ID="your-actual-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-actual-hubspot-client-secret"
HUBSPOT_REDIRECT_URI="http://localhost:3000/api/auth/hubspot/callback"

# Application Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
COOKIE_SECRET="your-cookie-secret"
```

### **Step 2: Frontend Environment Setup**

Create `frontend/.env` file:
```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Application Configuration
VITE_APP_NAME="WorkflowGuard"
VITE_APP_VERSION="1.0.0"

# HubSpot Configuration (YOUR REAL CLIENT ID)
VITE_HUBSPOT_CLIENT_ID="your-actual-hubspot-client-id"

# Development Configuration
VITE_DEV_MODE="false"
VITE_ENABLE_ANALYTICS="true"
VITE_ENABLE_REALTIME="true"
```

### **Step 3: Database Setup**

#### **Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb workflowguard

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate

# Seed the database
npx prisma db seed
```

#### **Option B: Supabase (Recommended)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Update `DATABASE_URL` in backend `.env`
5. Run migrations and seed

### **Step 4: HubSpot App Configuration**

1. **Go to HubSpot Developer Portal**: https://developers.hubspot.com/
2. **Create/Edit Your App**:
   - App Name: WorkflowGuard
   - Redirect URL: `http://localhost:3000/api/auth/hubspot/callback`
   - Scopes: `contacts`, `workflows`
3. **Get Your Credentials**:
   - Copy Client ID and Client Secret
   - Update both backend and frontend `.env` files

### **Step 5: Start the Application**

#### **Start Backend First:**
```bash
cd backend
npm install
npm run start:dev
```

#### **Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔧 **What Happens Now**

### **1. OAuth Flow**
- Click "Connect HubSpot" in the app
- You'll be redirected to HubSpot for authorization
- Grant permissions to your app
- You'll be redirected back to WorkflowGuard

### **2. Workflow Selection**
- Your real HubSpot workflows will appear
- Select the workflows you want to protect
- Click "Start Protecting"

### **3. Dashboard Population**
- Your selected workflows will be saved to the database
- Dashboard will show your real workflow data
- All features will work with your actual workflows

## 🎯 **Expected Results**

### **After Setup, You'll See:**
- ✅ **Your Real Workflows**: Actual HubSpot workflows you created
- ✅ **Real Data**: Live workflow information from HubSpot
- ✅ **Version History**: Actual workflow versions and changes
- ✅ **Analytics**: Real usage data from your workflows
- ✅ **Sync Status**: Live sync status with HubSpot
- ✅ **All Features**: Rollback, monitoring, notifications

### **Dashboard Features with Real Data:**
- **Workflow List**: Your actual HubSpot workflows
- **Version Management**: Real workflow versions
- **Rollback Capability**: Restore previous versions
- **Analytics**: Real usage and performance data
- **Monitoring**: Live status of your workflows
- **Notifications**: Real alerts and updates

## 🚨 **Troubleshooting**

### **Issue 1: "Cannot connect to API"**
**Solution:**
- Ensure backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings in backend

### **Issue 2: "HubSpot OAuth failed"**
**Solution:**
- Verify HubSpot app configuration
- Check redirect URLs match exactly
- Ensure scopes include `workflows`

### **Issue 3: "No workflows found"**
**Solution:**
- Verify HubSpot app has workflow permissions
- Check if workflows exist in your HubSpot account
- Ensure OAuth flow completed successfully

### **Issue 4: "Database connection failed"**
**Solution:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in backend `.env`
- Run `npx prisma db push` to sync schema

## 🔍 **Verification Steps**

### **1. Check Backend Health**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### **2. Check Database Connection**
```bash
cd backend
npx prisma db push
# Should complete without errors
```

### **3. Check HubSpot Connection**
- Complete OAuth flow
- Check browser console for any errors
- Verify workflows appear in selection screen

### **4. Check Dashboard Data**
- After selecting workflows, check dashboard
- Verify real workflow names appear
- Check that version history loads

## 🎪 **Feature Testing Checklist**

### **Core Features to Test:**
- [ ] **Workflow Selection**: Your real workflows appear
- [ ] **Dashboard Population**: Real data shows up
- [ ] **Version History**: Actual workflow versions
- [ ] **Rollback**: Restore previous versions
- [ ] **Analytics**: Real usage data
- [ ] **Sync Status**: Live HubSpot sync
- [ ] **Notifications**: Real alerts
- [ ] **Settings**: User preferences

### **Advanced Features:**
- [ ] **Workflow Monitoring**: Real-time status
- [ ] **Audit Logs**: Activity tracking
- [ ] **Billing**: Usage tracking
- [ ] **API Access**: API key management
- [ ] **Webhooks**: External integrations

## 🎯 **Next Steps After Setup**

### **1. Test All Features**
- Navigate through all pages
- Test workflow operations
- Verify analytics data
- Check notification system

### **2. Customize Settings**
- Configure notification preferences
- Set up webhooks
- Manage API keys
- Update user profile

### **3. Production Deployment**
- Follow `DEPLOYMENT_GUIDE.md`
- Set up production database
- Configure production HubSpot app
- Deploy to Vercel or other platform

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Your real HubSpot workflows appear in the selection screen
- ✅ Dashboard shows your actual workflow data
- ✅ Version history contains real workflow versions
- ✅ Analytics show real usage metrics
- ✅ All features respond with real data

---

**Status**: 🔧 **REQUIRES SETUP**  
**Setup Time**: 15-30 minutes  
**Result**: Full integration with your real HubSpot workflows  
**Features**: 100% functional with real data 