# 🚀 Complete Setup Guide - Gezira Scheme Full-Stack Application

## Prerequisites
- ✅ PostgreSQL 14+ with PostGIS extension installed
- ✅ Node.js 18+ installed
- ✅ npm or yarn installed

---

## Phase 1: Database Setup

### Step 1: Create PostgreSQL Database
```bash
# Open PostgreSQL command line (Windows)
psql -U postgres

# Or on Linux/Mac
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE gezira_scheme;

-- Connect to the database
\c gezira_scheme

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- Exit
\q
```

### Step 2: Configure Backend Environment
```bash
cd backend

# Copy environment template
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gezira_scheme
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD_HERE

JWT_SECRET=change_this_to_random_secret_key_min_32_chars
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Backend Dependencies
```bash
npm install
```

### Step 4: Run Database Migrations
```bash
npm run migrate
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database tables created successfully!
🎉 Migration completed successfully
```

---

## Phase 2: Import GeoJSON Data

You need to create the seed script. Create this file:

**`backend/src/utils/seed.js`**
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your GeoJSON files
const dataPath = path.join(__dirname, '../../../src/assets/data');

const importGeoJSON = async () => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create admin user
    console.log('Creating admin user...');
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ('admin', 'admin@gezira.sd', $1, 'System Administrator', 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [passwordHash]);

    console.log('✅ Admin user created (username: admin, password: admin123)');

    // Import sectors data
    const divisions = ['East', 'West', 'North', 'South'];

    for (const division of divisions) {
      console.log(`\\nImporting ${division} sector...`);

      const filePath = path.join(dataPath, `${division}.geojson`);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        continue;
      }

      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const feature of geojson.features) {
        const props = feature.properties;
        const geometry = JSON.stringify(feature.geometry);

        await client.query(`
          INSERT INTO sectors (
            objectid_1, objectid, feature_id, no_nemra, canal_name,
            office, division, name_ar, design_a_f, remarks_1,
            shape_leng, shape_le_1, shape_area, geometry
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            ST_GeomFromGeoJSON($14)
          )
        `, [
          props.OBJECTID_1, props.OBJECTID, props.Id, props.No_Nemra,
          props.Canal_Name, props.Office, division, props.Name_AR,
          props.Design_A_F, props.Remarks_1, props.Shape_Leng,
          props.Shape_Le_1, props.Shape_Area, geometry
        ]);
      }

      console.log(`✅ Imported ${geojson.features.length} features from ${division}`);
    }

    await client.query('COMMIT');
    console.log('\\n🎉 All data imported successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    client.release();
  }
};

importGeoJSON()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run the seed:
```bash
npm run seed
```

---

## Phase 3: Complete Backend Files

I've already created:
- ✅ `src/config/database.js`
- ✅ `src/middleware/auth.js`
- ✅ `src/controllers/authController.js`
- ✅ `src/utils/migrate.js`

You still need to create (or I can provide them):

1. **`src/controllers/sectorsController.js`** - CRUD operations for sectors
2. **`src/routes/authRoutes.js`** - Authentication routes
3. **`src/routes/sectorsRoutes.js`** - Sectors routes
4. **`src/server.js`** - Main Express application

Would you like me to create these files now?

---

## Phase 4: Test Backend

```bash
# Start server
npm run dev

# Server should start on http://localhost:5000
```

Test endpoints:
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'

# Get sectors (use token from login)
curl http://localhost:5000/api/sectors \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Phase 5: Frontend Integration

After backend is running, update frontend:

1. Create API service layer
2. Add authentication context
3. Create login/register components
4. Make attribute table editable
5. Connect to backend API

---

## 🔑 Default Credentials

After running seed script:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: admin

---

## 📊 Next Steps

1. ✅ Database setup complete
2. ✅ Backend structure created
3. ⏳ Need to complete remaining controller/route files
4. ⏳ Need to seed database
5. ⏳ Need to create frontend auth components
6. ⏳ Need to make table editable

**Shall I continue creating the remaining backend files (sectors controller, routes, server.js)?**
