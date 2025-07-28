# WorkflowGuard Backend Deployment Guide

## Render Deployment Setup

### 1. Environment Variables

You need to set the following environment variables in your Render dashboard:

#### Required Environment Variables:

1. **DATABASE_URL** (Required)
   - Your Supabase connection pooling URL
   - **IMPORTANT**: The `@` symbol in your password must be URL-encoded as `%40`
   - Your database URL: `postgresql://postgres.lynnyddkcfurwgzgekpn:Liverpoolisthebest%401998@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **DIRECT_URL** (Required)
   - Your Supabase direct connection URL for migrations
   - Your direct URL: `postgresql://postgres.lynnyddkcfurwgzgekpn:Liverpoolisthebest%401998@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

3. **JWT_SECRET** (Required)
   - A secure random string for JWT token signing
   - Generated value: `c88401bc2d87d640da4b4c661aca7a7b6efc0bfdec2389031024b8c9abe36156846f1fb6a295fe351fe710ae35eddfdf57cd5c95bdb819c136795e490e684c8e`

4. **HUBSPOT_CLIENT_ID** (Required)
   - Your HubSpot OAuth app client ID

5. **HUBSPOT_CLIENT_SECRET** (Required)
   - Your HubSpot OAuth app client secret

6. **HUBSPOT_REDIRECT_URI** (Required)
   - Your HubSpot OAuth redirect URI
   - Format: `https://your-backend-url.onrender.com/api/auth/callback`

7. **FRONTEND_URL** (Required)
   - Your frontend application URL
   - Example: `https://your-frontend-url.vercel.app`

8. **NODE_ENV** (Required)
   - Value: `production`

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

Your Supabase database is configured with connection pooling:
- **Connection Pooling URL**: `aws-0-us-west-1.pooler.supabase.com:6543`
- **Direct Connection URL**: `aws-0-us-west-1.pooler.supabase.com:5432`
- **Database**: `postgres`
- **Username**: `postgres.lynnyddkcfurwgzgekpn`
- **Password**: `Liverpoolisthebest@1998` (URL-encoded as `Liverpoolisthebest%401998`)

**Important Notes**:
- The `@` symbol in your password must be URL-encoded as `%40`
- **DATABASE_URL** uses connection pooling (port 6543) for better performance
- **DIRECT_URL** is used for migrations (port 5432)
- The application will automatically run migrations on startup

### 4. Troubleshooting

#### Common Issues:

1. **Database Connection Error**
   - ✅ Check if both `DATABASE_URL` and `DIRECT_URL` are correctly set
   - ✅ Verify Supabase database is running
   - ✅ Ensure network connectivity
   - ✅ Check database credentials

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
- Supabase connection pooling handles SSL automatically
- Set appropriate CORS origins in your environment variables

### 8. Quick Setup Script

Run the setup script to generate environment variables:

```bash
cd backend
node setup-env.js
```

This will output all the required environment variables with proper formatting. 

## Required Environment Variables

### Backend (NestJS)

- `DATABASE_URL`: Database connection string (required)
- `JWT_SECRET`: Secret for signing JWTs (required, no default)
- `CORS_ORIGIN`: Comma-separated list of allowed frontend origins for CORS (required in production, e.g. `https://workflowguard-app.vercel.app`)
- `FRONTEND_URL`: The main frontend URL, used for OAuth redirects and links (required, e.g. `https://workflowguard-app.vercel.app`)
- `SENTRY_DSN`: (Optional) Sentry DSN for error monitoring
- `NODE_ENV`: Set to `production` in production environments

**Security Note:**
- Never use wildcards (`*`) or leave `CORS_ORIGIN` empty in production. Only allow your actual frontend domain(s).
- Do not commit secrets or credentials to version control.

### Frontend (Vercel)

- `VITE_API_URL`: The base URL for the backend API (required, e.g. `https://your-backend.onrender.com/api`)
- Any OAuth or third-party keys as needed 

## API Documentation

- The backend provides interactive API documentation at `/api/docs` (Swagger UI).
- You can use this to explore, test, and understand all available API endpoints, request/response formats, and authentication requirements. 

## Backend Security Policies

### Rate Limiting
- Express rate limiting: 100 requests per 15 minutes per IP (configurable in `main.ts`).
- NestJS ThrottlerModule: also enabled for additional protection.
- **Recommendation:** Adjust limits as needed for your use case. Monitor for abuse.

### Input Validation
- All incoming requests are validated using `class-validator` DTOs and a global `ValidationPipe`.
- Only whitelisted properties are allowed; extra fields are rejected.
- **Recommendation:** Always use DTOs for new endpoints.

### Secure Headers
- `helmet` is used to set HTTP security headers (CSP, XSS, etc.).
- **Recommendation:** Review and customize CSP for your frontend’s needs.

### CORS
- Only allows origins specified in `CORS_ORIGIN` (required in production).
- **Recommendation:** Never use wildcards in production.

### Error Handling
- All unhandled exceptions are logged and reported to Sentry (if DSN is set).
- User-facing errors are generic; sensitive details are never exposed.

### General Recommendations
- Keep all dependencies up to date.
- Regularly audit for vulnerabilities (`npm audit`).
- Rotate secrets and credentials periodically. 