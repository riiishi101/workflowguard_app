# WorkflowGuard Backend Deployment Guide

## Render Deployment Setup

### 1. Environment Variables

You need to set the following environment variables in your Render dashboard:

#### Required Environment Variables:

1. **DATABASE_URL** (Required)
   - Your Supabase PostgreSQL connection string
   - Format: `postgresql://username:password@host:port/database`
   - Example: `postgresql://postgres:password@db.lynnyddkcfurwgzgekpn.supabase.co:5432/postgres`

2. **JWT_SECRET** (Required)
   - A secure random string for JWT token signing
   - Generate one using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **HUBSPOT_CLIENT_ID** (Required)
   - Your HubSpot OAuth app client ID

4. **HUBSPOT_CLIENT_SECRET** (Required)
   - Your HubSpot OAuth app client secret

5. **HUBSPOT_REDIRECT_URI** (Required)
   - Your HubSpot OAuth redirect URI
   - Format: `https://your-backend-url.onrender.com/api/auth/callback`

6. **FRONTEND_URL** (Required)
   - Your frontend application URL
   - Example: `https://your-frontend-url.vercel.app`

### 2. Setting Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add each environment variable:
   - Click "Add Environment Variable"
   - Enter the key (e.g., `DATABASE_URL`)
   - Enter the value
   - Click "Save Changes"

### 3. Database Setup

Before deploying, ensure your Supabase database is properly configured:

1. **Database URL**: Make sure your `DATABASE_URL` is correctly formatted and includes all necessary parameters
2. **SSL Mode**: For Supabase, you might need to add `?sslmode=require` to your connection string
3. **Database Migrations**: The application will automatically run migrations on startup

### 4. Troubleshooting

#### Common Issues:

1. **Database Connection Error**
   - Check if `DATABASE_URL` is correctly set
   - Verify Supabase database is running
   - Ensure network connectivity
   - Check database credentials

2. **Port Issues**
   - Render automatically assigns port via `PORT` environment variable
   - The application listens on the assigned port

3. **Build Failures**
   - Check if all dependencies are properly installed
   - Verify Node.js version compatibility

### 5. Health Check

After deployment, you can test the API:

```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# API status
curl https://your-backend-url.onrender.com/api
```

### 6. Logs

Monitor your application logs in the Render dashboard:
- Go to your service
- Click on "Logs" tab
- Check for any error messages or connection issues

### 7. SSL and Security

- Render automatically provides SSL certificates
- Ensure your `DATABASE_URL` uses SSL if required by your database provider
- Set appropriate CORS origins in your environment variables 