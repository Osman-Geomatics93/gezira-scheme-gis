# Gezira Scheme Backend API

Full-stack GIS backend with PostgreSQL + PostGIS, Node.js, Express, and JWT authentication.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
```

### 3. Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE gezira_scheme;

# Connect to database
\c gezira_scheme

# Enable PostGIS
CREATE EXTENSION postgis;

# Exit
\q
```

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Seed Database (Import GeoJSON)
```bash
npm run seed
```

### 6. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:5000

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── sectorsController.js # CRUD operations
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   └── (future ORM models)
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   └── sectorsRoutes.js      # Sectors endpoints
│   ├── utils/
│   │   ├── migrate.js            # Database migrations
│   │   └── seed.js               # Import GeoJSON data
│   └── server.js                 # Main application
├── .env                          # Environment variables
├── .env.example                  # Example env file
└── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/logout` - Logout (protected)

### Sectors
- `GET /api/sectors` - Get all sectors (with filters)
- `GET /api/sectors/:id` - Get single sector
- `POST /api/sectors` - Create sector (admin/editor)
- `PUT /api/sectors/:id` - Update sector (admin/editor)
- `DELETE /api/sectors/:id` - Delete sector (admin only)
- `GET /api/sectors/division/:division` - Get by division
- `GET /api/sectors/:id/history` - Get change history

## 👥 User Roles

1. **admin** - Full access (create, edit, delete)
2. **editor** - Can edit data
3. **viewer** - Read-only access

## 🗄️ Database Schema

### users
- id, username, email, password_hash, full_name, role, is_active

### sectors
- id, objectid_1, objectid, feature_id, no_nemra, canal_name, office
- division, name_ar, design_a_f, remarks_1, shape_leng, shape_le_1
- shape_area, geometry (PostGIS), created_at, updated_at, created_by, updated_by

### change_history
- id, sector_id, user_id, action, field_name, old_value, new_value, changed_at

### user_sessions
- id, user_id, token_hash, ip_address, user_agent, expires_at

## 📦 Dependencies

- express - Web framework
- pg - PostgreSQL client
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- cors - CORS middleware
- dotenv - Environment variables
- helmet - Security headers
- morgan - HTTP logging
- express-validator - Input validation

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection protection
- CORS configuration
- Helmet security headers

## 📝 Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gezira_scheme
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testing

```bash
# Test database connection
npm run migrate

# Check if server starts
npm run dev
```

## 📚 Next Steps

1. Complete remaining controller files
2. Add API routes
3. Create seed script
4. Test all endpoints
5. Connect frontend

---

Created for Gezira Irrigation Scheme Management System
