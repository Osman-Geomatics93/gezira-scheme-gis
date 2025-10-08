# 🚀 Modern GitHub Deployment Guide

This guide will help you deploy the Gezira Scheme GIS application using GitHub in the most modern and professional way with automated CI/CD.

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              GITHUB REPOSITORY                       │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Frontend   │         │   Backend    │         │
│  │  React+Vite  │         │   Node.js    │         │
│  └──────┬───────┘         └──────┬───────┘         │
│         │                        │                  │
└─────────┼────────────────────────┼──────────────────┘
          │                        │
          │ GitHub Actions         │ GitHub Actions
          │                        │
          ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  GitHub Pages   │      │     Railway      │
│   (Frontend)    │◄─────┤  (Backend + DB)  │
│  Static Hosting │ API  │   PostgreSQL     │
└─────────────────┘      └──────────────────┘
```

## ✨ Features of This Setup

- ✅ **Automated CI/CD** - Push to main = auto deployment
- ✅ **GitHub Pages** - Free, fast, global CDN
- ✅ **GitHub Actions** - Automated testing and linting
- ✅ **Environment Secrets** - Secure configuration
- ✅ **Zero Downtime** - Continuous deployment
- ✅ **Modern Stack** - Latest best practices

---

## 🎯 Step 1: Setup GitHub Repository

### 1.1 Enable GitHub Pages

1. Go to your repository: `https://github.com/Osman-Geomatics93/gezira-scheme-gis`
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select:
   - **GitHub Actions** (not "Deploy from a branch")
4. Click **Save**

### 1.2 Add Repository Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.railway.app` | Your backend API URL |

---

## 🎯 Step 2: Deploy Backend to Railway

Railway will host your Node.js backend and PostgreSQL database.

### 2.1 Sign Up & Create Project

1. Go to **https://railway.app**
2. **Login with GitHub**
3. Click **New Project** → **Deploy from GitHub repo**
4. Select: `Osman-Geomatics93/gezira-scheme-gis`

### 2.2 Add PostgreSQL Database

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway automatically creates and connects the database

### 2.3 Enable PostGIS Extension

1. Click on **PostgreSQL** service → **Data** tab
2. Click **Query** and run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2.4 Configure Backend Service

1. Click on your main service
2. Go to **Settings**:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`

3. Go to **Variables** tab and add:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://osman-geomatics93.github.io/gezira-scheme-gis
```

Railway automatically provides `DATABASE_URL` for PostgreSQL.

### 2.5 Get Your Backend URL

1. Go to **Settings** → **Networking** → **Public Networking**
2. Click **Generate Domain**
3. Copy the URL (e.g., `https://gezira-backend.railway.app`)
4. **Update the GitHub secret** `VITE_API_URL` with this URL

---

## 🎯 Step 3: Configure & Deploy Frontend

### 3.1 Update API Configuration

The frontend is already configured to use environment variables. Check `src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 3.2 Set Base Path (If needed)

If deploying to `username.github.io/repo-name`, update in **GitHub Actions workflow**:

Edit `.github/workflows/deploy-frontend.yml` and add:

```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
    VITE_BASE_PATH: /gezira-scheme-gis/  # Add this line
```

**OR** for custom domain / root deployment, use:
```yaml
VITE_BASE_PATH: /
```

### 3.3 Update CORS in Backend

Edit `backend/src/server.js` to allow your GitHub Pages domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://osman-geomatics93.github.io',  // GitHub Pages
  ],
  credentials: true,
};
```

Commit and push this change to trigger Railway redeployment.

---

## 🎯 Step 4: Deploy!

### 4.1 Commit & Push Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: add GitHub Pages CI/CD deployment with Railway backend"

# Push to GitHub
git push origin main
```

### 4.2 Monitor Deployment

1. Go to **Actions** tab in your GitHub repo
2. Watch the workflows run:
   - ✅ **Test and Lint** - Runs on every push
   - ✅ **Deploy Frontend to GitHub Pages** - Deploys to Pages

3. Check Railway dashboard for backend deployment logs

### 4.3 Access Your Application

After successful deployment:

- **Frontend**: `https://osman-geomatics93.github.io/gezira-scheme-gis`
- **Backend**: `https://your-backend.railway.app`

---

## 🎯 Step 5: Database Setup (First Time Only)

### 5.1 Run Migrations

Connect to your Railway PostgreSQL and run migrations:

1. In Railway, click **PostgreSQL** → **Connect** → **Connection String**
2. Use a PostgreSQL client (pgAdmin, DBeaver, or Railway CLI)
3. Run these files in order:
   - `backend/migrations/001_create_users_table.sql`
   - `backend/migrations/002_create_sectors_table.sql`
   - `backend/migrations/003_create_history_table.sql`
   - `backend/migrations/004_suspicious_activity_table.sql`

### 5.2 Seed Initial Users

Run the seed script or manually insert:

```sql
-- Use bcrypt to hash passwords first, then insert
INSERT INTO users (username, email, password, role) VALUES
  ('admin', 'admin@gezira.com', '$2b$10$hashed_password', 'admin'),
  ('editor', 'editor@gezira.com', '$2b$10$hashed_password', 'editor'),
  ('viewer', 'viewer@gezira.com', '$2b$10$hashed_password', 'viewer');
```

---

## 🔧 Continuous Deployment Workflow

Once setup is complete, every time you:

1. **Push to `main` branch** → Triggers:
   - Automated tests & linting
   - Frontend build & deploy to GitHub Pages
   - Backend deploy to Railway (if changes detected)

2. **Create Pull Request** → Triggers:
   - Automated tests & linting
   - Build verification

3. **Manual Deployment** → Go to Actions tab → Click workflow → "Run workflow"

---

## 🎨 Optional: Custom Domain

### For GitHub Pages (Frontend)

1. **Purchase a domain** (e.g., from Namecheap, Google Domains)
2. **Add Custom Domain** in GitHub:
   - Go to **Settings** → **Pages**
   - Enter your domain (e.g., `gezira-gis.com`)
3. **Configure DNS** at your domain provider:
   ```
   Type: A
   Host: @
   Value: 185.199.108.153

   Type: A
   Host: @
   Value: 185.199.109.153

   Type: A
   Host: @
   Value: 185.199.110.153

   Type: A
   Host: @
   Value: 185.199.111.153

   Type: CNAME
   Host: www
   Value: osman-geomatics93.github.io
   ```
4. **Enable HTTPS** (automatic after DNS propagation)

### For Railway (Backend)

1. In Railway, go to your backend service → **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter `api.your-domain.com`
4. Add CNAME record at your DNS provider:
   ```
   Type: CNAME
   Host: api
   Value: your-backend.railway.app
   ```

---

## 📊 Environment Variables Reference

### Frontend (.env.production - DO NOT COMMIT)

For local production build testing only:
```env
VITE_API_URL=https://your-backend.railway.app
VITE_BASE_PATH=/
```

**Note:** In production, these come from GitHub Actions secrets.

### Backend (Railway Environment Variables)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://... (auto-provided by Railway)
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://osman-geomatics93.github.io/gezira-scheme-gis
```

---

## 🔒 Security Checklist

- [x] HTTPS enabled (automatic on GitHub Pages & Railway)
- [ ] Strong JWT secret (32+ characters, random)
- [ ] CORS properly configured with exact domains
- [ ] No `.env` files in repository
- [ ] All secrets stored in GitHub Actions & Railway
- [ ] Database connection uses SSL
- [ ] Default passwords changed
- [ ] Rate limiting enabled (if implemented)

---

## 📈 Performance Optimizations

The setup includes:

- ✅ **Code Splitting** - Separate chunks for React, Maps, and Geo libraries
- ✅ **Terser Minification** - Smallest bundle size
- ✅ **CDN Delivery** - GitHub Pages uses Fastly CDN
- ✅ **Asset Optimization** - Optimized builds via Vite
- ✅ **Railway Edge** - Backend on Railway's global network

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch"

**Solution:** Check that:
1. Backend is running on Railway
2. `VITE_API_URL` secret in GitHub matches Railway backend URL
3. CORS is configured in backend to allow GitHub Pages domain

### GitHub Pages deployment fails

**Solution:**
1. Check Actions tab for error logs
2. Verify GitHub Pages is enabled with **GitHub Actions** source
3. Check that build completes successfully

### Backend deployment fails on Railway

**Solution:**
1. Check Railway logs for errors
2. Verify `package.json` has `"start": "node src/server.js"`
3. Ensure root directory is set to `backend`

### Database connection errors

**Solution:**
1. Verify PostGIS extension is installed
2. Check DATABASE_URL is automatically provided by Railway
3. Ensure backend is using Railway's DATABASE_URL

---

## 📞 Resources

- **GitHub Pages Docs**: https://docs.github.com/pages
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Railway Docs**: https://docs.railway.app
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

## 💰 Cost Breakdown

| Service | Plan | Cost | What's Included |
|---------|------|------|-----------------|
| **GitHub Pages** | Free | $0/month | Unlimited static hosting, 100GB bandwidth/month |
| **GitHub Actions** | Free | $0/month | 2,000 minutes/month for private repos |
| **Railway** | Hobby | $5/month | $5 credit - Backend + PostgreSQL (enough for small projects) |
| **Railway** | Pro | ~$15/month | Better performance & scaling |
| **Total (Start)** | - | **$0-5/month** | Perfect for development & small production |

---

## 🎉 You're All Set!

Your modern, automated deployment is ready!

### What happens now:

1. **Push code** → Automatic deployment
2. **Users visit** → Fast, global CDN delivery
3. **Monitor** → GitHub Actions + Railway dashboards
4. **Scale** → Upgrade Railway as needed

**Live URL**: `https://osman-geomatics93.github.io/gezira-scheme-gis`

Need help? Check the Actions logs or Railway deployment logs for detailed information! 🚀
