# Gezira Irrigation Scheme - Web Application

A modern, full-featured GIS web application for managing and visualizing the Gezira Irrigation Scheme agricultural sectors.

## 🌟 Features

### ✅ Implemented Features

1. **Multiple Map Libraries**
   - Leaflet (lightweight, easy to use)
   - MapLibre GL (modern, vector tiles support)
   - OpenLayers (feature-rich, powerful)
   - Easy switching between libraries via dropdown

2. **Interactive Map Features**
   - 4 Agricultural sectors (East, West, North, South) with GeoJSON data
   - Color-coded sector visualization
   - Interactive popups with detailed information
   - Hover effects on features
   - Zoom and pan controls
   - Scale bar
   - Legend display

3. **Data Visualization**
   - Real-time statistics dashboard
   - Total plots, area, and design area metrics
   - Canal and office listings
   - Sector-specific breakdowns
   - Arabic and English text support

4. **Responsive Design**
   - Mobile-friendly interface
   - Collapsible sidebar
   - Adaptive layout for all screen sizes
   - Modern UI with Tailwind CSS

5. **Project Structure**
   - TypeScript for type safety
   - Component-based architecture
   - Custom hooks for data management
   - Service layer for future API integration

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

The application will run at:
- **Local**: http://localhost:5173 (or next available port)

## 📁 Project Structure

```
Gezira_Scheme/
├── src/
│   ├── components/
│   │   ├── Layout/          # Layout components (Header, Sidebar, MainLayout)
│   │   ├── Maps/            # Map components (Leaflet, MapLibre, OpenLayers)
│   │   ├── Dashboard/       # Dashboard components (StatsPanel)
│   │   └── UI/              # Reusable UI components
│   ├── hooks/               # Custom React hooks (useSectorData)
│   ├── services/            # API services for backend integration
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── assets/
│   │   └── data/            # GeoJSON files (East, West, North, South)
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── sectors/                 # Original GeoJSON files
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

## 🗺️ Map Libraries

### Leaflet
- Lightweight and simple
- Great for basic mapping needs
- Extensive plugin ecosystem

### MapLibre GL
- Modern vector tile rendering
- Smooth animations
- GPU-accelerated

### OpenLayers
- Feature-rich
- Advanced GIS capabilities
- Highly customizable

## 📊 Data Structure

Each sector GeoJSON contains:
- **OBJECTID_1, OBJECTID**: Unique identifiers
- **No_Nemra**: Nemra number
- **Canal_Name**: Canal name (English)
- **Name_AR**: Canal name (Arabic)
- **Office**: Office name
- **Division**: Division name
- **Design_A_F**: Design area in Feddan
- **Shape_Area**: Calculated area
- **Remarks_1**: Additional notes

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_DEFAULT_MAP_CENTER_LAT=14.35
VITE_DEFAULT_MAP_CENTER_LNG=33.0
VITE_DEFAULT_ZOOM=10
```

## 🛠️ Future Development

### Backend Integration

The application is structured for easy backend integration:

1. Update `src/services/api.ts` with your API endpoints
2. Uncomment the fetch calls in the API service
3. Set `VITE_API_URL` in your `.env` file

### Planned Features

- [ ] Advanced search and filtering
- [ ] Data export (GeoJSON, Shapefile, CSV)
- [ ] User authentication
- [ ] Real-time data updates
- [ ] Irrigation schedule management
- [ ] Crop data integration
- [ ] Weather data overlay
- [ ] Historical data visualization
- [ ] Print/PDF export
- [ ] Offline mode

## 🎨 Customization

### Colors

Sector colors are defined in each map component:
```typescript
const sectorColors: Record<SectorDivision, string> = {
  East: '#3b82f6',   // Blue
  West: '#22c55e',   // Green
  North: '#eab308',  // Yellow
  South: '#ef4444',  // Red
};
```

### Tailwind Configuration

Customize the theme in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: { ... }
    }
  }
}
```

## 📦 Dependencies

### Core
- React 19
- TypeScript 5.9
- Vite 7

### Mapping Libraries
- Leaflet 1.9
- React Leaflet 5.0
- MapLibre GL 5.8
- OpenLayers 10.6

### Styling
- Tailwind CSS 4.1
- PostCSS 8.5
- Autoprefixer 10.4

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is in use, Vite will automatically try the next available port.

### GeoJSON Loading Issues
Ensure GeoJSON files are in `src/assets/data/` directory.

### Map Not Displaying
Check browser console for errors and ensure all dependencies are installed.

## 📄 License

This project is part of the Gezira Irrigation Scheme Management System.

## 👨‍💻 Development

Built with ❤️ for the Gezira Irrigation Scheme

---

**Status**: ✅ Frontend Development Complete
**Next Steps**: Backend API Integration
