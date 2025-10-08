import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/Auth/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import MapContainer from './components/Maps/MapContainer';
import StatsPanel from './components/Dashboard/StatsPanel';
import EditableAttributeTable from './components/Dashboard/EditableAttributeTable';
import { DataProtection } from './components/Security/DataProtection';
import { useSectorData } from './hooks/useSectorData';
import { getAreaCategory } from './utils/symbology';
import type { MapLibrary, SectorDivision, SectorFeature, AreaCategory } from './types';

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  console.log('App component rendering');
  const { sectorsData, loading, error, reloadData } = useSectorData();
  console.log('Loading:', loading, 'Error:', error, 'Data:', sectorsData);
  const [selectedMapLibrary, setSelectedMapLibrary] = useState<MapLibrary>('leaflet');
  const [selectedSector, setSelectedSector] = useState<SectorDivision | null>(null);
  const [selectedAreaCategory, setSelectedAreaCategory] = useState<AreaCategory>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [filteredSectorsData, setFilteredSectorsData] = useState(sectorsData);

  const handleSectorSelect = (sector: SectorDivision | null) => {
    setSelectedSector(sector);
    setSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFeatureClick = (feature: SectorFeature) => {
    console.log('Feature clicked:', feature);
  };

  // Apply both search and area category filters
  const applyFilters = (query: string, areaCategory: AreaCategory) => {
    console.log('Applying filters - Query:', query, 'Category:', areaCategory);
    console.log('Sectors data available:', Object.keys(sectorsData).filter(k => sectorsData[k as SectorDivision] !== null));

    const filtered: typeof sectorsData = {
      East: null,
      West: null,
      North: null,
      South: null,
    };

    Object.entries(sectorsData).forEach(([division, data]) => {
      if (!data) {
        console.log(`${division}: No data available`);
        return;
      }

      // Calculate area statistics for this division
      const areas = data.features.map(f => f.properties.Design_A_F || 0);
      const minArea = Math.min(...areas);
      const maxArea = Math.max(...areas);
      const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;

      console.log(`${division}: Starting with ${data.features.length} features`);
      console.log(`${division}: Area range: ${minArea.toFixed(2)} - ${maxArea.toFixed(2)} Feddan (avg: ${avgArea.toFixed(2)})`);
      let matchedFeatures = data.features;

      // Apply search filter
      if (query.trim()) {
        const searchLower = query.toLowerCase();
        matchedFeatures = matchedFeatures.filter((feature) => {
          const props = feature.properties;
          return (
            props.Canal_Name?.toLowerCase().includes(searchLower) ||
            props.Name_AR?.includes(query) ||
            props.Office?.toLowerCase().includes(searchLower) ||
            props.Division?.toLowerCase().includes(searchLower) ||
            props.No_Nemra?.toString().includes(query)
          );
        });
        console.log(`${division}: After search filter: ${matchedFeatures.length} features`);
      }

      // Apply area category filter
      if (areaCategory) {
        const beforeFilter = matchedFeatures.length;
        matchedFeatures = matchedFeatures.filter((feature) => {
          const area = feature.properties.Design_A_F || 0;
          const category = getAreaCategory(area);
          return category === areaCategory;
        });
        console.log(`${division}: After area filter (${areaCategory}): ${matchedFeatures.length} features (was ${beforeFilter})`);
      }

      if (matchedFeatures.length > 0) {
        filtered[division as SectorDivision] = {
          ...data,
          features: matchedFeatures,
        };
        console.log(`${division}: Added to filtered data with ${matchedFeatures.length} features`);
      } else {
        console.log(`${division}: No matches, excluded from filtered data`);
      }
    });

    console.log('Final filtered sectors:', Object.keys(filtered).filter(k => filtered[k as SectorDivision] !== null));
    setFilteredSectorsData(filtered);
  };

  // Filter sectors based on search query
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, selectedAreaCategory);
  };

  // Filter sectors based on area category
  const handleAreaCategoryChange = (category: AreaCategory) => {
    setSelectedAreaCategory(category);
    applyFilters(searchQuery, category);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Gezira Scheme Data...</p>
          <p className="text-sm text-gray-500 mt-2 arabic-text" style={{ fontFamily: 'Cairo, sans-serif' }}>
            مشروع الجزيرة للري
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error Loading Data</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataProtection
      disableRightClick={true}
      disableDevTools={true}
      disableTextSelection={false}
      disableCopy={false}
      showWatermark={false}
    >
      <MainLayout
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        selectedMapLibrary={selectedMapLibrary}
        onMapLibraryChange={setSelectedMapLibrary}
        selectedSector={selectedSector}
        onSectorSelect={handleSectorSelect}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchResultsCount={
          searchQuery.trim()
            ? Object.values(filteredSectorsData).reduce((acc, data) => acc + (data?.features.length || 0), 0)
            : 0
        }
      >
        <div className="relative w-full h-full">
          <MapContainer
            mapLibrary={selectedMapLibrary}
            sectorsData={searchQuery.trim() || selectedAreaCategory ? filteredSectorsData : sectorsData}
            selectedSector={selectedSector}
            selectedAreaCategory={selectedAreaCategory}
            onAreaCategoryChange={handleAreaCategoryChange}
            onFeatureClick={handleFeatureClick}
            onDataUpdate={reloadData}
          />

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-4 z-[999] flex flex-col space-y-2">
            {/* Dashboard Toggle Button */}
            <button
              onClick={() => setDashboardVisible(!dashboardVisible)}
              className="bg-white hover:bg-gray-50 px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-2 transition-all hover:shadow-xl group"
              title={dashboardVisible ? 'Hide Dashboard' : 'Show Dashboard'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${dashboardVisible ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {dashboardVisible ? 'Hide' : 'Show'} Stats
              </span>
            </button>

            {/* Attribute Table Button */}
            <button
              onClick={() => setTableVisible(!tableVisible)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg border border-green-700 flex items-center space-x-2 transition-all hover:shadow-xl group"
              title="Open Attribute Table"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">
                Attribute Table
              </span>
            </button>
          </div>

          {/* Stats Panel with smooth animation */}
          <div className={`
            fixed bottom-4 right-4 w-96
            hidden md:block
            transition-all duration-300 ease-in-out
            z-[1000]
            ${dashboardVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-full pointer-events-none'
            }
          `}>
            <StatsPanel
              sectorsData={searchQuery.trim() || selectedAreaCategory ? filteredSectorsData : sectorsData}
              selectedSector={selectedSector}
            />
          </div>

          {/* Attribute Table */}
          {tableVisible && (
            <EditableAttributeTable
              sectorsData={searchQuery.trim() || selectedAreaCategory ? filteredSectorsData : sectorsData}
              selectedSector={selectedSector}
              onClose={() => setTableVisible(false)}
              onDataUpdate={reloadData}
            />
          )}
        </div>
      </MainLayout>
    </DataProtection>
  );
}

// Wrap with ThemeProvider and AuthProvider
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
