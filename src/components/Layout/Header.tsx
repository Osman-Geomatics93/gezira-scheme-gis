import { useTheme } from '../../context/ThemeContext';
import type { MapLibrary } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  selectedMapLibrary: MapLibrary;
  onMapLibraryChange: (library: MapLibrary) => void;
}

export default function Header({
  onToggleSidebar,
  sidebarOpen,
  selectedMapLibrary,
  onMapLibraryChange
}: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <header className={`shadow-2xl transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white'
    }`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo */}
          <div className="bg-white rounded-lg p-2 shadow-lg">
            <img
              src="/images/logo.png"
              alt="HRC Logo"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback SVG icon if logo image doesn't exist
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <svg class="h-12 w-12 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  `;
                }
              }}
            />
          </div>

          {/* Title Section */}
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
              Gezira Irrigation Scheme
            </h1>
            <p className="text-xs text-blue-200 font-medium arabic-text" style={{ fontFamily: 'Cairo, sans-serif' }}>
              مشروع الجزيرة للري - مركز البحوث الهيدروليكية
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-3">
          {/* System Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white font-medium">Online</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="relative group bg-white/10 backdrop-blur-sm hover:bg-white/20 p-2 rounded-xl transition-all duration-300 transform hover:scale-110 border border-white/20"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="relative w-6 h-6">
              {/* Sun Icon (Light Mode) */}
              <svg
                className={`absolute inset-0 w-6 h-6 text-yellow-300 transition-all duration-500 ${
                  isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>

              {/* Moon Icon (Dark Mode) */}
              <svg
                className={`absolute inset-0 w-6 h-6 text-blue-200 transition-all duration-500 ${
                  isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </div>

            {/* Hover tooltip */}
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </div>
            </div>
          </button>

          {/* Map Library Selector */}
          <div className="flex items-center space-x-2">
            <label className="hidden md:block text-sm font-medium">
              Map:
            </label>
            <select
              value={selectedMapLibrary}
              onChange={(e) => onMapLibraryChange(e.target.value as MapLibrary)}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md"
            >
              <option value="leaflet">Leaflet</option>
              <option value="maplibre">MapLibre GL</option>
              <option value="openlayers">OpenLayers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Accent Border */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"></div>
    </header>
  );
}
