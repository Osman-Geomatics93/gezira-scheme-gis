# 🌍 Gezira Irrigation Scheme - GIS Management System

<div align="center">

![Gezira Scheme](https://img.shields.io/badge/Gezira-Scheme-green?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-23.11-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.5-008BB9?style=for-the-badge&logo=postgis&logoColor=white)](https://postgis.net/)

**A modern, full-stack GIS web application for managing and visualizing the Gezira Irrigation Scheme sectors in Sudan**

[🚀 Features](#-features) • [💻 Demo](#-demo) • [🛠️ Installation](#-installation) • [🌐 Deployment](#-deployment) • [📚 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

The **Gezira Irrigation Scheme GIS Management System** is a comprehensive web-based platform designed to manage, visualize, and analyze the irrigation sectors of the Gezira Scheme - one of the largest irrigation projects in Africa. This system provides real-time data visualization, interactive mapping, and advanced GIS capabilities for efficient water resource management.

### Key Highlights

- 🗺️ **Interactive Mapping** with multiple map libraries (Leaflet, MapLibre, OpenLayers)
- 🔐 **Role-Based Access Control** (Admin, Editor, Viewer)
- 📊 **Real-time Statistics** and data analytics
- 🛡️ **Advanced Security** with rate limiting and scraping prevention
- 📱 **Responsive Design** optimized for all devices
- 🎨 **Modern UI/UX** with glassmorphism and smooth animations
- 🌐 **Multi-language Support** (English, Arabic)

---

## ✨ Features

### 🗺️ **GIS & Mapping**
- **Multi-Library Support**: Choose between Leaflet, MapLibre GL, or OpenLayers
- **Interactive Layers**: Vector tiles, WMS/WFS services, custom overlays
- **Drawing Tools**: Create, edit, and delete features
- **Symbology Control**: Customize colors, styles, and classifications
- **Area-Based Filtering**: Filter sectors by size categories
- **Search Functionality**: Find sectors by name, canal, office, or division
- **Spatial Analysis**: Calculate areas, distances, and perform queries

### 📊 **Data Management**
- **CRUD Operations**: Full create, read, update, delete capabilities
- **Batch Updates**: Edit multiple sectors simultaneously
- **History Tracking**: View complete edit history with user attribution
- **Import/Export**: Support for GeoJSON, KML, Shapefile formats
- **Attribute Tables**: Sortable, filterable tabular data views
- **Real-time Statistics**: Dynamic charts and summary panels

### 🔐 **Security & Access Control**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Three-tier access (Admin/Editor/Viewer)
- **Rate Limiting**: Prevent API abuse (100 req/15min general, 30 req/15min data)
- **Scraping Detection**: IP-based tracking and automatic blocking
- **Request Logging**: Comprehensive audit trail in PostgreSQL
- **Data Watermarking**: Track data leaks with unique fingerprints
- **Frontend Protection**: Disable right-click, dev tools warnings

### 🎨 **User Experience**
- **Modern Login Page**: Glassmorphism design with animations
- **Quick Login Buttons**: One-click demo credential filling
- **Dark Mode Ready**: Theme support infrastructure
- **Responsive Layout**: Mobile, tablet, and desktop optimized
- **Loading States**: Smooth transitions and progress indicators
- **Error Handling**: User-friendly error messages

### 🚀 **Performance**
- **Lazy Loading**: Optimized component loading
- **Data Pagination**: Efficient handling of large datasets (max 100 records/request)
- **Caching Strategy**: Redis-ready architecture
- **Database Indexing**: Optimized PostGIS spatial queries
- **CDN Ready**: Static asset optimization

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI Framework |
| **TypeScript** | 5.6.2 | Type Safety |
| **Vite** | 7.1.9 | Build Tool |
| **TailwindCSS** | 3.4.15 | Styling |
| **Leaflet** | 1.9.4 | Interactive Maps |
| **MapLibre GL** | 5.0.0 | Vector Tiles |
| **OpenLayers** | 11.1.0 | Advanced GIS |
| **Axios** | 1.7.9 | HTTP Client |

### **Backend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 23.11.0 | Runtime |
| **Express** | 4.21.2 | Web Framework |
| **PostgreSQL** | 16+ | Database |
| **PostGIS** | 3.5+ | Spatial Extension |
| **JWT** | 9.0.2 | Authentication |
| **Bcrypt** | 5.1.1 | Password Hashing |
| **Express Rate Limit** | 7.5.0 | Rate Limiting |
| **Helmet** | 8.0.0 | Security Headers |
| **Morgan** | 1.10.0 | Logging |
| **CORS** | 2.8.5 | Cross-Origin |

### **Database**
- **PostgreSQL 16** with **PostGIS 3.5** for spatial data
- Optimized indexes for spatial queries
- Audit tables for history tracking
- Security logging tables

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  React   │  │TypeScript│  │Tailwind  │              │
│  │  + Vite  │  │          │  │   CSS    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └─────────────┼──────────────┘                    │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────┼──────────────────────────────────┐
│                      │  API LAYER                        │
│  ┌───────────────────▼────────────────────┐             │
│  │         Express.js Server              │             │
│  │  ┌──────────┐  ┌──────────┐           │             │
│  │  │   Auth   │  │Security  │           │             │
│  │  │Middleware│  │Middleware│           │             │
│  │  └──────────┘  └──────────┘           │             │
│  │  ┌──────────┐  ┌──────────┐           │             │
│  │  │ Routes   │  │Controllers│           │             │
│  │  └──────────┘  └──────────┘           │             │
│  └───────────────────┬────────────────────┘             │
└──────────────────────┼──────────────────────────────────┘
                       │ SQL / PostGIS
┌──────────────────────┼──────────────────────────────────┐
│                      │  DATA LAYER                       │
│  ┌───────────────────▼────────────────────┐             │
│  │         PostgreSQL + PostGIS            │             │
│  │  ┌──────────┐  ┌──────────┐           │             │
│  │  │ Sectors  │  │  Users   │           │             │
│  │  │  Table   │  │  Table   │           │             │
│  │  └──────────┘  └──────────┘           │             │
│  │  ┌──────────┐  ┌──────────┐           │             │
│  │  │ History  │  │ Security │           │             │
│  │  │  Table   │  │   Logs   │           │             │
│  │  └──────────┘  └──────────┘           │             │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Installation

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18+ recommended, v23+ ideal)
- **PostgreSQL** (v16+)
- **PostGIS** extension (v3.5+)
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gezira-scheme-gis.git
   cd gezira-scheme-gis
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Setup PostgreSQL Database**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE gezira_scheme;
   \c gezira_scheme
   CREATE EXTENSION postgis;
   \q

   # Run migrations
   cd backend
   psql -U postgres -d gezira_scheme -f migrations/001_create_users_table.sql
   psql -U postgres -d gezira_scheme -f migrations/002_create_sectors_table.sql
   psql -U postgres -d gezira_scheme -f migrations/003_create_history_table.sql
   psql -U postgres -d gezira_scheme -f migrations/004_suspicious_activity_table.sql
   ```

4. **Configure Environment Variables**
   ```bash
   # Create .env file in backend directory
   cp backend/.env.example backend/.env

   # Edit .env with your settings
   ```

   Required environment variables:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gezira_scheme
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your_super_secret_key_change_this_in_production
   JWT_EXPIRES_IN=7d

   # Frontend
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Editor | editor | editor123 |
| Viewer | viewer | viewer123 |

**⚠️ Important:** Change these credentials in production!

---

## 📖 Usage

### Basic Workflow

1. **Login** - Use credentials or quick login buttons
2. **View Map** - Select division (East/West/North/South)
3. **Filter Data** - Search by name, area, canal, or office
4. **Analyze** - View statistics and charts
5. **Edit** (Admin/Editor only) - Update sector attributes
6. **Export** - Download data in various formats

### API Endpoints

#### Authentication
```http
POST /api/auth/register      # Register new user (Admin only)
POST /api/auth/login         # Login and get JWT token
GET  /api/auth/profile       # Get current user profile
PUT  /api/auth/profile       # Update profile
POST /api/auth/change-password  # Change password
POST /api/auth/logout        # Logout
```

#### Sectors
```http
GET    /api/sectors                    # Get all sectors (paginated)
GET    /api/sectors/:id                # Get single sector
GET    /api/sectors/division/:division # Get by division
GET    /api/sectors/:id/history        # Get edit history
POST   /api/sectors                    # Create new sector
PUT    /api/sectors/:id                # Update sector
POST   /api/sectors/batch-update       # Batch update
DELETE /api/sectors/:id                # Delete sector (Admin only)
```

---

## 🌐 Deployment

### Modern GitHub Deployment with CI/CD

This application is configured for **automated deployment** using GitHub Actions:

- ✅ **Frontend**: GitHub Pages with auto-deployment
- ✅ **Backend**: Railway with PostgreSQL + PostGIS
- ✅ **CI/CD**: Automated testing, linting, and deployment
- ✅ **CDN**: Global distribution via GitHub Pages

#### Quick Deployment

1. **Enable GitHub Pages** in repository settings (Source: GitHub Actions)
2. **Deploy Backend** to Railway (one-click from GitHub)
3. **Set Secrets** in GitHub Actions (VITE_API_URL)
4. **Push to main** → Automatic deployment! 🚀

#### Documentation

- 📘 **[Complete Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)** - Modern GitHub + Railway setup
- 📘 **[Alternative Platforms](DEPLOYMENT_GUIDE.md)** - Vercel, Render, and other options
- 📘 **[Quick Start](DEPLOY_NOW.md)** - Deploy in 10 minutes

**Live Demo**: `https://osman-geomatics93.github.io/gezira-scheme-gis`

---

## 🛡️ Security Features

### Implemented Protections

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Password hashing with bcrypt
   - Token expiration and refresh

2. **Rate Limiting**
   - General API: 100 requests/15 minutes
   - Data endpoints: 30 requests/15 minutes
   - Auth endpoints: 5 attempts/15 minutes

3. **Scraping Prevention**
   - IP-based request tracking
   - Automatic blocking after 20 requests/minute
   - User-agent filtering
   - Request fingerprinting

4. **Data Protection**
   - Pagination limits (max 100 records)
   - Data watermarking with unique IDs
   - Frontend right-click disabling
   - DevTools detection warnings

For detailed security documentation, see [DATA_PROTECTION_SECURITY.md](DATA_PROTECTION_SECURITY.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

<div align="center">

### **Osman Ibrahim**

Full-Stack GIS Developer | System Architect

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/yourusername)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:your.email@example.com)

**Specializing in:** GIS Web Development | React | Node.js | PostgreSQL/PostGIS | Spatial Analysis

</div>

---

## 🙏 Acknowledgments

- **Gezira Scheme Authority** - For providing the spatial data
- **PostGIS Community** - For the amazing spatial database extension
- **Leaflet/MapLibre/OpenLayers** - For excellent mapping libraries
- **React Community** - For the robust frontend framework

---

## 📞 Support

If you have any questions or need help:

- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/gezira-scheme-gis/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/gezira-scheme-gis/discussions)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ in Sudan 🇸🇩

</div>
