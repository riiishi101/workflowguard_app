# 🚀 WorkflowGuard Production Deployment Test Checklist

## ✅ Pre-Deployment Checklist
- [x] Environment variables set in Vercel/Render
- [x] All localhost references updated to https://workflowguard-app-j3rl.onrender.com
- [x] HubSpot OAuth redirect URI configured
- [x] Database connection established
- [x] Code pushed to main branch

## 🧪 Post-Deployment Tests

### 1. Basic Site Access
- [ ] Visit https://www.workflowguard.pro
- [ ] Site loads without errors
- [ ] Welcome modal appears for new users
- [ ] No console errors in browser devtools

### 2. Authentication Flow
- [ ] Click "Connect Your HubSpot Account"
- [ ] Redirects to HubSpot OAuth page
- [ ] After authorization, redirects back to dashboard
- [ ] JWT cookie is set properly
- [ ] User is authenticated

### 3. User Onboarding
- [ ] After OAuth, shows workflow selection page
- [ ] Can select workflows to protect
- [ ] Can skip workflow selection
- [ ] Redirects to dashboard after selection

### 4. Dashboard Functionality
- [ ] Dashboard loads with user's workflows
- [ ] Can view workflow versions
- [ ] Can perform rollback operations
- [ ] Settings page accessible
- [ ] Logout functionality works

### 5. API Endpoints
- [ ] /api/auth/me returns user data
- [ ] /api/workflows returns workflow list
- [ ] /api/auth/logout clears cookies
- [ ] WebSocket connections work (if applicable)

## 🔧 Troubleshooting

### If Welcome Modal Doesn't Appear:
- Check browser console for errors
- Verify VITE_API_URL is set correctly
- Check CORS configuration

### If OAuth Fails:
- Verify HUBSPOT_REDIRECT_URI matches exactly
- Check HubSpot app configuration
- Ensure all required scopes are enabled

### If Dashboard Shows Empty:
- Check database connection
- Verify user has HubSpot connection
- Check workflow selection in localStorage

## 📞 Support
If any tests fail, check:
1. Environment variables in deployment platform
2. Database connectivity
3. HubSpot app configuration
4. Browser console for errors 