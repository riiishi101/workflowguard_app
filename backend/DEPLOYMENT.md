# Deployment Guide: Render + Supabase

## Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string (it looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)

## Step 2: Deploy to Render

1. Go to [render.com](https://render.com) and create an account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `workflowguard-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

## Step 3: Set Environment Variables

In your Render service dashboard, add these environment variables:

```
NODE_ENV=production
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret_key
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=https://your-backend-url.onrender.com/api/auth/callback
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Step 4: Run Database Migrations

After deployment, you'll need to run Prisma migrations:

1. In Render dashboard, go to your service
2. Click "Shell" tab
3. Run: `npx prisma migrate deploy`

## Step 5: Update Frontend

Update your frontend's `VITE_API_URL` to point to your Render backend URL.

## Step 6: Update HubSpot OAuth

Update your HubSpot app's redirect URI to: `https://your-backend-url.onrender.com/api/auth/callback`

## Troubleshooting

- **Database connection issues**: Make sure your Supabase connection string is correct
- **CORS errors**: Add your frontend URL to CORS settings in your NestJS app
- **Migration errors**: Run migrations manually in Render shell 