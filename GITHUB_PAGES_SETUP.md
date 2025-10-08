# ✅ Final Steps to Enable GitHub Pages

Your GitHub Actions workflows are running successfully! Now complete the setup:

## 📋 Step 1: Enable GitHub Pages (2 minutes)

1. **Go to Repository Settings**
   ```
   https://github.com/Osman-Geomatics93/gezira-scheme-gis/settings/pages
   ```

2. **Configure GitHub Pages**
   - Under **"Source"**, select: **GitHub Actions** (not "Deploy from a branch")
   - Click **Save** if needed

3. **Wait for Deployment** (2-3 minutes)
   - The workflow "Deploy Frontend to GitHub Pages" will run
   - Check status at: `https://github.com/Osman-Geomatics93/gezira-scheme-gis/actions`

---

## 📋 Step 2: Deploy Backend to Railway (5 minutes)

### Quick Railway Setup

1. **Sign Up & Create Project**
   - Go to: https://railway.app
   - Login with GitHub
   - Click **New Project** → **Deploy from GitHub repo**
   - Select: `Osman-Geomatics93/gezira-scheme-gis`

2. **Add PostgreSQL Database**
   - Click **+ New** → **Database** → **Add PostgreSQL**
   - Railway auto-connects it to your backend

3. **Enable PostGIS**
   - Click PostgreSQL service → **Data** tab → **Query**
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

4. **Configure Backend Service**
   - Click your service → **Settings**
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `npm start`

5. **Add Environment Variables** (Settings → Variables)
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your_super_secret_key_change_this_to_something_random_and_long
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://osman-geomatics93.github.io/gezira-scheme-gis
   ```
   Note: Railway automatically provides `DATABASE_URL`

6. **Get Backend URL**
   - Go to **Settings** → **Networking** → **Generate Domain**
   - Copy the URL (e.g., `https://gezira-backend-production.up.railway.app`)

---

## 📋 Step 3: Connect Frontend to Backend

1. **Add GitHub Secret**
   - Go to: `https://github.com/Osman-Geomatics93/gezira-scheme-gis/settings/secrets/actions`
   - Click **New repository secret**
   - Name: `VITE_API_URL`
   - Value: Your Railway backend URL (from Step 2.6)
   - Click **Add secret**

2. **Trigger Redeployment**
   - Go to: `https://github.com/Osman-Geomatics93/gezira-scheme-gis/actions`
   - Click **Deploy Frontend to GitHub Pages** workflow
   - Click **Run workflow** → **Run workflow**

---

## 📋 Step 4: Update Backend CORS (Important!)

Your backend needs to allow requests from GitHub Pages.

### Option A: Via Railway Dashboard
1. Go to your backend service on Railway
2. Open **Variables** tab
3. Update `FRONTEND_URL` to:
   ```
   https://osman-geomatics93.github.io
   ```

### Option B: Update Code (Recommended)
1. Edit `backend/src/server.js` locally
2. Find the CORS configuration and update:
   ```javascript
   // CORS configuration
   app.use(cors({
     origin: function (origin, callback) {
       if (!origin) return callback(null, true);

       // Allow localhost for development
       if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
         return callback(null, true);
       }

       // Allow GitHub Pages
       if (origin === 'https://osman-geomatics93.github.io') {
         return callback(null, true);
       }

       // Production frontend
       if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
         return callback(null, true);
       }

       callback(new Error('Not allowed by CORS'));
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```
3. Commit and push (Railway will auto-deploy)

---

## 📋 Step 5: Setup Database (First Time Only)

### Run Database Migrations

Use Railway's PostgreSQL Query interface:

1. **Create Users Table**
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL DEFAULT 'viewer',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Create Sectors Table**
   ```sql
   CREATE TABLE IF NOT EXISTS sectors (
     id SERIAL PRIMARY KEY,
     objectid_1 INTEGER,
     objectid INTEGER,
     sector_id INTEGER,
     no_nemra INTEGER,
     canal_name VARCHAR(255),
     name_ar VARCHAR(255),
     office VARCHAR(255),
     division VARCHAR(50),
     design_a_f DOUBLE PRECISION,
     remarks_1 TEXT,
     shape_leng DOUBLE PRECISION,
     shape_le_1 DOUBLE PRECISION,
     shape_area DOUBLE PRECISION,
     geometry GEOMETRY(Geometry, 4326),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX IF NOT EXISTS idx_sectors_division ON sectors(division);
   CREATE INDEX IF NOT EXISTS idx_sectors_geometry ON sectors USING GIST(geometry);
   ```

3. **Create History Table**
   ```sql
   CREATE TABLE IF NOT EXISTS sector_history (
     id SERIAL PRIMARY KEY,
     sector_id INTEGER REFERENCES sectors(id),
     user_id INTEGER REFERENCES users(id),
     action VARCHAR(50),
     old_values JSONB,
     new_values JSONB,
     changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **Seed Admin User**
   ```sql
   -- Password: admin123 (hashed with bcrypt)
   INSERT INTO users (username, email, password, role) VALUES
   ('admin', 'admin@gezira.com', '$2b$10$YourHashedPasswordHere', 'admin')
   ON CONFLICT (username) DO NOTHING;
   ```

   **Note**: Generate proper bcrypt hash using Node.js:
   ```bash
   node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
   ```

---

## ✅ Verification Checklist

- [ ] GitHub Pages enabled with "GitHub Actions" source
- [ ] GitHub Actions workflows passing (green checkmarks)
- [ ] Railway backend deployed and running
- [ ] PostgreSQL database has PostGIS extension
- [ ] Backend environment variables configured
- [ ] GitHub secret VITE_API_URL added
- [ ] Backend CORS allows GitHub Pages domain
- [ ] Database migrations completed
- [ ] Admin user created

---

## 🌐 Access Your Application

Once all steps are complete:

- **Frontend**: https://osman-geomatics93.github.io/gezira-scheme-gis
- **Backend**: https://your-backend.railway.app
- **Backend Health**: https://your-backend.railway.app/health

---

## 🐛 Troubleshooting

### Frontend shows 404
- **Cause**: GitHub Pages not enabled or still deploying
- **Fix**: Enable GitHub Pages in Settings, wait for deployment to complete

### Frontend loads but API calls fail
- **Cause**: Backend not deployed or CORS not configured
- **Fix**:
  1. Check Railway backend is running
  2. Verify CORS configuration includes GitHub Pages domain
  3. Check browser console for specific error messages

### Backend deployment fails
- **Cause**: Missing environment variables or wrong root directory
- **Fix**:
  1. Verify Root Directory = `backend`
  2. Check all environment variables are set
  3. View Railway logs for specific errors

### Database connection errors
- **Cause**: PostGIS not enabled or wrong DATABASE_URL
- **Fix**:
  1. Run `CREATE EXTENSION IF NOT EXISTS postgis;`
  2. Verify DATABASE_URL is auto-provided by Railway
  3. Check PostgreSQL service is running

---

## 📞 Need Help?

- **GitHub Actions Status**: https://github.com/Osman-Geomatics93/gezira-scheme-gis/actions
- **Railway Dashboard**: https://railway.app/project/your-project-id
- **Full Documentation**: See `GITHUB_PAGES_DEPLOYMENT.md`

---

**🎉 Once everything is set up, your GIS application will be live and accessible worldwide!**
