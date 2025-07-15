## HubSpot Disconnect & Data Deletion (Compliance)

**Disconnect HubSpot:**
- Go to the Settings page.
- Click 'Disconnect HubSpot' to revoke all HubSpot access and tokens.

**Delete Your Account:**
- Go to the Profile tab in Settings.
- Click 'Delete Account' and confirm. All your data will be permanently deleted.

For support or data deletion requests, email: support@workflowguard.com 

## ⚠️ IMPORTANT: API URL Configuration

- You **must** set `VITE_API_URL` in your Vercel environment variables and local `.env` file to:
  
  ```
  VITE_API_URL=https://workflowguard-app-j3rl.onrender.com/api
  ```
- The `/api` prefix is required! The app will not work without it.
- There is **no fallback**. If this variable is missing or incorrect, API calls will fail with 404 or CORS errors. 