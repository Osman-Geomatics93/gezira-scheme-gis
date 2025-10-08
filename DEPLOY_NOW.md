# 🚀 Deploy Your GIS App in 10 Minutes

## ✨ Quick Start - Railway (Easiest & Recommended)

Railway hosts everything in one place - your best option!

### Step 1: Sign Up (1 minute)
1. Go to: **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway ✅

### Step 2: Deploy (5 minutes)
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select: `Osman-Geomatics93/gezira-scheme-gis`
3. Railway automatically detects and deploys! 🎉

### Step 3: Add Database (2 minutes)
1. In your project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for it to provision
3. Click on PostgreSQL service → **"Query"** tab
4. Run this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### Step 4: Configure Environment (2 minutes)

Click on your **web service** → **"Variables"** tab → Add these:

```
NODE_ENV=production
JWT_SECRET=your_random_secret_at_least_32_characters_long_12345678
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app-name.railway.app
```

**Note**: Railway automatically connects `DATABASE_URL` from PostgreSQL!

### Step 5: Set Root Directory

1. Click on your service → **"Settings"**
2. **Root Directory**: Set to `backend`
3. **Start Command**: Set to `npm start`
4. Click **"Deploy"**

### Step 6: Run Migrations

After deployment, you need to run database migrations:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate --workdir backend
```

**Option B: Manual SQL (Easier)**
1. Go to PostgreSQL service → **"Query"** tab
2. Copy and paste all SQL from these files:
   - `backend/migrations/001_create_users_table.sql`
   - `backend/migrations/002_create_sectors_table.sql`
   - `backend/migrations/003_create_history_table.sql`
   - `backend/migrations/004_suspicious_activity_table.sql`

### Step 7: Get Your Live URL! 🌐

1. Go to your web service
2. Click **"Settings"** → **"Networking"** → **"Generate Domain"**
3. Your app is now live at: `https://your-app-name.railway.app` 🎉

---

## 🎯 Alternative: Vercel (Frontend) + Railway (Backend)

For **maximum performance** with global CDN:

### Deploy Backend to Railway
Follow Steps 1-6 above

### Deploy Frontend to Vercel

1. Go to: **https://vercel.com**
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repo: `Osman-Geomatics93/gezira-scheme-gis`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

6. Click **"Deploy"** 🚀

7. Your frontend will be at: `https://your-project.vercel.app`

---

## 📋 Post-Deployment Checklist

After deployment, do these:

### 1. Update CORS in Backend

Edit `backend/src/server.js` and update CORS origins:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.railway.app',
    'https://your-frontend-domain.vercel.app',
  ],
  credentials: true,
};
```

Commit and push:
```bash
git add backend/src/server.js
git commit -m "chore: update CORS for production"
git push
```

Railway will automatically redeploy!

### 2. Create Admin User

Connect to your database and create an admin user:

```sql
-- Generate password hash for 'admin123' (example)
-- In production, use a strong password!
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$YourBcryptHashHere',  -- Use bcrypt to hash your password
  'Administrator',
  'admin'
);
```

Or use the seed script if available.

### 3. Import Sector Data

Use your application's import feature to upload the GeoJSON files:
- `sectors/East.geojson`
- `sectors/West.geojson`
- `sectors/North.geojson`
- `sectors/South.geojson`

### 4. Test Everything

Visit your live URL and test:
- ✅ Login works
- ✅ Map displays sectors
- ✅ Data loads from all divisions
- ✅ Editing features work (if admin/editor)
- ✅ API responds correctly

---

## 💰 Cost Breakdown

### Railway (Recommended)
- **Free Tier**: $5/month credit (hobby usage)
- **Starter Plan**: $5/month base + usage (~$10-15 total)
- **Includes**: Backend + Database + Optional Frontend

### Vercel (If using)
- **Free**: Unlimited for personal projects
- **Pro**: $20/month (only if you need team features)

### **Total Cost for Production Setup**
- **Option 1 (Railway Only)**: $5-15/month
- **Option 2 (Vercel + Railway)**: $10-15/month

---

## 🔧 Useful Commands

```bash
# View Railway logs
railway logs

# Open Railway dashboard
railway open

# SSH into Railway container
railway shell

# Run database migrations
railway run npm run migrate --workdir backend

# View environment variables
railway variables
```

---

## 🎉 You're Done!

Your Gezira Scheme GIS application is now **LIVE ON THE INTERNET**! 🌍

**Share your app**:
- Production URL: `https://your-app-name.railway.app`
- GitHub Repo: https://github.com/Osman-Geomatics93/gezira-scheme-gis

**Next Steps**:
1. Share the link with your team
2. Add custom domain (optional)
3. Set up monitoring and alerts
4. Configure automated backups

---

## 🆘 Troubleshooting

### "Module not found" error
- Make sure `backend` is set as Root Directory
- Verify `npm install` ran successfully in build logs

### Database connection fails
- Check that PostGIS extension is installed
- Verify `DATABASE_URL` is automatically set by Railway
- Check database service is running

### CORS errors
- Update `backend/src/server.js` with your frontend URL
- Make sure `credentials: true` is set
- Redeploy after changes

### Frontend can't reach backend
- Verify `VITE_API_URL` environment variable is set correctly
- Check backend service is running and healthy
- Test API endpoint: `https://your-backend.railway.app/health`

---

**Need help?** Check the full guide: `DEPLOYMENT_GUIDE.md`

**Made with ❤️ by Osman Ibrahim - Full-Stack GIS Developer**
