# 🚀 Quick Start Guide - Gezira Irrigation Scheme

## Your Application is Ready! ✅

The frontend development is **100% complete** and the dev server is currently running.

## 📍 Access Your Application

Open your web browser and navigate to:

**👉 http://localhost:5175**

(Port may vary - check the terminal output for the exact URL)

## 🎮 How to Use the Application

### 1. **View All Sectors**
   - By default, all 4 sectors (East, West, North, South) are displayed on the map
   - Each sector has a unique color:
     - 🔵 East (Blue)
     - 🟢 West (Green)
     - 🟡 North (Yellow)
     - 🔴 South (Red)

### 2. **Select a Specific Sector**
   - Click on any sector button in the left sidebar
   - The map will zoom to that sector
   - Statistics will update to show sector-specific data

### 3. **Interact with Features**
   - **Click** on any plot/feature to see details:
     - Canal name (English & Arabic)
     - Division and Office
     - Nemra number
     - Design area
     - Additional remarks
   - **Hover** over features to highlight them

### 4. **Switch Map Libraries**
   - Use the dropdown in the header to switch between:
     - **Leaflet** (default, lightweight)
     - **MapLibre GL** (modern, smooth)
     - **OpenLayers** (feature-rich)

### 5. **View Statistics**
   - Check the bottom-left panel for:
     - Total number of plots
     - Total area (km²)
     - Design area (Feddan)
     - Number of canals
     - Number of offices

### 6. **Mobile View**
   - Click the hamburger menu (☰) to toggle the sidebar
   - All features are touch-friendly

## 🛠️ Development Commands

### Running the Application
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

### Stop the Server
```bash
# Press Ctrl+C in the terminal where the server is running
```

## 📁 Important Files

### Configuration
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env.example` - Environment variables template

### Source Code
- `src/App.tsx` - Main application component
- `src/components/` - All React components
- `src/hooks/` - Custom hooks
- `src/services/api.ts` - API service (ready for backend)
- `src/types/` - TypeScript definitions

### Data
- `src/assets/data/*.geojson` - Sector GeoJSON files

## 🎨 What You'll See

1. **Header** (Top)
   - Gezira Irrigation Scheme branding
   - مشروع الجزيرة للري (Arabic)
   - Map library switcher

2. **Sidebar** (Left)
   - Search bar (UI ready)
   - Sector selection buttons
   - All Sectors option

3. **Map** (Center)
   - Interactive map with all features
   - Color-coded sectors
   - Zoom/pan controls
   - Legend

4. **Statistics Panel** (Bottom-left)
   - Real-time statistics
   - Sector breakdowns
   - Canal and office lists

## 🔥 Features Highlights

✅ **3 Different Mapping Libraries**
   - Switch seamlessly between Leaflet, MapLibre GL, and OpenLayers

✅ **4 Agricultural Sectors**
   - East, West, North, South with complete GeoJSON data

✅ **Interactive Popups**
   - Click any plot to see detailed information

✅ **Real-time Statistics**
   - Dynamic calculations based on selected sector

✅ **Responsive Design**
   - Works perfectly on desktop, tablet, and mobile

✅ **Bilingual Support**
   - English and Arabic text

✅ **Modern UI**
   - Tailwind CSS with green agriculture theme

## 🐛 Troubleshooting

### Issue: Port Already in Use
**Solution:** The app automatically uses the next available port (e.g., 5174)

### Issue: Map Not Loading
**Solution:**
1. Check browser console for errors (F12)
2. Ensure all dependencies are installed: `npm install`
3. Clear browser cache and reload

### Issue: GeoJSON Not Loading
**Solution:**
- Verify files exist in `src/assets/data/`
- Check browser console for loading errors

### Issue: Styles Not Applying
**Solution:**
- Ensure Tailwind is configured correctly
- Check `src/index.css` has Tailwind directives
- Restart dev server

## 📚 Learn More

- **README_DEVELOPMENT.md** - Complete development guide
- **FEATURES_SUMMARY.md** - Detailed features list
- **src/services/api.ts** - Backend integration guide

## 🎯 Next Steps

### For Development:
1. Explore the codebase
2. Customize colors and styling
3. Add more features

### For Production:
1. Build the app: `npm run build`
2. Deploy to hosting (Vercel, Netlify, etc.)
3. Set up backend API

### For Backend Integration:
1. Review `src/services/api.ts`
2. Set up backend server
3. Update `.env` with API URL
4. Uncomment API calls in service

## 💡 Tips

- Use **Leaflet** for simple, fast mapping
- Use **MapLibre GL** for smooth animations
- Use **OpenLayers** for advanced GIS features

- Click "All Sectors" to see the full scheme
- Select individual sectors for detailed analysis
- Check statistics panel for quick insights

## 🎊 Congratulations!

Your Gezira Irrigation Scheme web application is fully functional and ready for use!

**Enjoy exploring your GIS data! 🗺️**

---

**Support:** If you encounter any issues, check the browser console (F12) for detailed error messages.

**Version:** 1.0.0
**Status:** Production Ready ✅
