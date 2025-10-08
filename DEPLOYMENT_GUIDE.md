# 🚀 Deployment Guide - Gezira Scheme GIS

This guide will help you deploy your Gezira Scheme GIS application to the cloud in a modern and professional way.

## 📋 Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [Option 1: Railway (Recommended - Easiest)](#option-1-railway-recommended)
- [Option 2: Render (Alternative)](#option-2-render-alternative)
- [Option 3: Vercel + Railway (Best Performance)](#option-3-vercel--railway)
- [Post-Deployment Steps](#post-deployment-steps)

---

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                 USERS / BROWSERS                     │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐    ┌────────▼──────────┐
│  Frontend (Vercel) │    │  Backend (Railway) │
│  React + Vite      │◄───┤  Node.js + Express │
│  Static Files      │    │  REST API          │
└────────────────────┘    └────────┬───────────┘
                                   │
                          ┌────────▼──────────┐
                          │ Database (Railway) │
                          │ PostgreSQL+PostGIS │
                          └────────────────────┘
```

---

## 🎯 Option 1: Railway (Recommended - Easiest)

**Railway** hosts your backend, frontend, and database all in one place with automatic deployments from GitHub!

### Step 1: Sign Up for Railway

1. Go to: https://railway.app
2. Click **"Login with GitHub"**
3. Authorize Railway to access your repositories
4. You get **$5 free credit/month** (enough for development)

### Step 2: Deploy Backend + Database

1. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository: `Osman-Geomatics93/gezira-scheme-gis`

2. **Add PostgreSQL Database**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway automatically creates and connects the database

3. **Add PostGIS Extension**
   - Go to your PostgreSQL service → **"Data"** tab
   - Click **"Query"** and run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```

4. **Configure Backend Service**
   - Click on your main service
   - Go to **"Settings"** → **"Root Directory"** → Set to: `backend`
   - Go to **"Settings"** → **"Start Command"** → Set to: `npm start`
   - Go to **"Variables"** and add environment variables:

     ```
     NODE_ENV=production
     PORT=5000
     JWT_SECRET=your_super_secret_jwt_key_change_this
     JWT_EXPIRES_IN=7d
     FRONTEND_URL=https://your-app.railway.app
     ```

   - Railway automatically provides `DATABASE_URL` with PostgreSQL connection

5. **Update database connection in `backend/src/config/database.js`**
   - Railway provides a single `DATABASE_URL` instead of individual variables
   - I'll create a production-ready version

6. **Run Database Migrations**
   - In Railway dashboard, go to your backend service
   - Open **"Deployments"** → Select latest → **"View Logs"**
   - You can run migrations manually via Railway's CLI or shell

### Step 3: Deploy Frontend

**Option A: Deploy Frontend on Railway (Simpler)**

1. Click **"+ New Service"** in your Railway project
2. Select **"GitHub Repo"** → Choose your repo again
3. Configure:
   - **Root Directory**: Leave empty (default `/`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: Leave empty (Railway auto-detects)
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-service.railway.app
   ```

**Option B: Deploy Frontend on Vercel (Faster for users)**

1. Go to https://vercel.com
2. Click **"Import Project"** → **"Import Git Repository"**
3. Select: `Osman-Geomatics93/gezira-scheme-gis`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-service.railway.app
   ```
6. Click **"Deploy"**

### Step 4: Update Backend CORS

After deployment, update `backend/src/server.js` to allow your frontend domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend.railway.app', // Railway frontend
    'https://your-app.vercel.app', // Vercel frontend
  ],
  credentials: true,
};
```

---

## 🎯 Option 2: Render (Alternative)

**Render** is another excellent modern platform with a generous free tier.

### Step 1: Sign Up

1. Go to: https://render.com
2. Sign up with GitHub
3. Free tier includes 750 hours/month

### Step 2: Create PostgreSQL Database

1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Name: `gezira-gis-db`
3. Database: `gezira_scheme`
4. User: Choose username
5. Region: Choose closest to your users
6. Plan: **Free**
7. Click **"Create Database"**

8. **Add PostGIS Extension**:
   - Go to database → **"Connect"** → Copy **External Database URL**
   - Use a PostgreSQL client (pgAdmin, DBeaver) to connect
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Step 3: Deploy Backend

1. Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `Osman-Geomatics93/gezira-scheme-gis`
3. Configure:
   - **Name**: `gezira-gis-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - Click **"Advanced"** → **"Add Environment Variable"**
   - Add all variables from your `.env` file
   - For database, use the **Internal Database URL** from your PostgreSQL service

5. Click **"Create Web Service"**

### Step 4: Deploy Frontend

1. Dashboard → **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `gezira-gis-frontend`
   - **Root Directory**: Leave blank
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://gezira-gis-backend.onrender.com
   ```
5. Click **"Create Static Site"**

---

## 🎯 Option 3: Vercel + Railway (Best Performance)

**Best combo**: Vercel (frontend) + Railway (backend + database)

- **Vercel**: World-class CDN, instant deployments, perfect for React apps
- **Railway**: Easy database management, automatic PostGIS support

### Steps:

1. **Deploy Database + Backend to Railway** (see Option 1, Steps 1-2)
2. **Deploy Frontend to Vercel** (see Option 1, Step 3, Option B)

---

## 📝 Configuration Files Needed

### 1. Update `package.json` in backend

Add production start script if not present:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### 2. Update `vite.config.ts` for environment variables

Already configured! Your `src/services/api.ts` should use:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 3. Create `vercel.json` (for Vercel deployment)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 🔧 Post-Deployment Steps

### 1. Run Database Migrations

Connect to your production database and run all migrations:

```sql
-- Run these in order on your production database
-- 001_create_users_table.sql
-- 002_create_sectors_table.sql
-- 003_create_history_table.sql
-- 004_suspicious_activity_table.sql
```

### 2. Seed Initial Data (Users)

Run the seed script or manually insert users:

```bash
# If using Railway CLI
railway run npm run seed

# Or manually via SQL
INSERT INTO users (username, email, password, role) VALUES
  ('admin', 'admin@gezira.com', '$2b$10$...', 'admin'),
  ('editor', 'editor@gezira.com', '$2b$10$...', 'editor'),
  ('viewer', 'viewer@gezira.com', '$2b$10$...', 'viewer');
```

### 3. Import Sector Data

Upload your GeoJSON files via the application's import feature or directly via SQL.

### 4. Test Your Deployment

1. Visit your frontend URL
2. Try logging in with demo credentials
3. Test map functionality
4. Check that data loads correctly
5. Verify API endpoints work

### 5. Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Railway:**
1. Go to your service → Settings → Domains
2. Click "Generate Domain" or add custom domain
3. Update DNS with provided CNAME

---

## 🔒 Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set proper CORS origins
- [ ] Review rate limiting settings
- [ ] Set up database backups
- [ ] Configure environment variables correctly
- [ ] Never commit `.env` files
- [ ] Use Railway/Render secrets for sensitive data

---

## 📊 Monitoring & Maintenance

### Railway
- View logs: Service → Deployments → View Logs
- Monitor usage: Project → Settings → Usage
- Database metrics: PostgreSQL service → Metrics

### Vercel
- Analytics: Project → Analytics
- Logs: Project → Deployments → View Function Logs
- Performance: Built-in Web Vitals monitoring

### Render
- Logs: Service → Logs
- Metrics: Service → Metrics
- Health checks: Automatic endpoint monitoring

---

## 💰 Cost Estimates

### Railway (Recommended for start)
- **Free tier**: $5 credit/month
- **Typical usage**: $5-15/month for small projects
- **Includes**: Backend + Database + (optional) Frontend

### Vercel
- **Free tier**: Unlimited for personal projects
- **Pro**: $20/month (if needed for team)
- **Best for**: Frontend hosting

### Render
- **Free tier**: 750 hours/month
- **Database**: $7/month for PostgreSQL with PostGIS
- **Web service**: $7/month or free (with limitations)

### Recommended Setup for Production:
- **Vercel** (Frontend): Free
- **Railway** (Backend + Database): ~$10-15/month
- **Total**: ~$10-15/month

---

## 🚀 Quick Start - Deploy in 10 Minutes

### Fastest Method: Railway Only

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link to GitHub repo
railway link

# 5. Add PostgreSQL
railway add --database postgres

# 6. Deploy
railway up

# 7. Open in browser
railway open
```

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **PostGIS on Railway**: https://docs.railway.app/databases/postgresql

---

## ✅ Deployment Checklist

- [ ] GitHub repository is up to date
- [ ] All sensitive data is in `.gitignore`
- [ ] Backend `package.json` has `start` script
- [ ] Environment variables are configured
- [ ] Database has PostGIS extension
- [ ] Migrations are run on production database
- [ ] Initial users are seeded
- [ ] CORS is configured for production domains
- [ ] Application is tested on production URL
- [ ] Custom domain is configured (optional)

---

**🎉 Your Gezira Scheme GIS will be live on the internet!**

Choose your deployment platform and follow the steps above. Railway is recommended for the easiest setup!

Need help with deployment? Let me know which platform you prefer! 🚀
