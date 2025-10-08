import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { SectorDivision } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  selectedSector: SectorDivision | null;
  onSectorSelect: (sector: SectorDivision | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultsCount?: number;
}

const sectors: { id: SectorDivision; name: string; nameAr: string; color: string }[] = [
  { id: 'East', name: 'East of Managil', nameAr: 'شرق المناقل', color: 'bg-blue-500' },
  { id: 'West', name: 'West Division', nameAr: 'القسم الغربي', color: 'bg-green-500' },
  { id: 'North', name: 'North Division', nameAr: 'القسم الشمالي', color: 'bg-yellow-500' },
  { id: 'South', name: 'South Division', nameAr: 'القسم الجنوبي', color: 'bg-red-500' },
];

export default function Sidebar({
  isOpen,
  selectedSector,
  onSectorSelect,
  searchQuery,
  onSearchChange,
  searchResultsCount = 0
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'editor':
        return 'bg-blue-100 text-blue-700';
      case 'viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => onSectorSelect(null)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className={`p-4 border-b transition-colors duration-300 ${
            isDark
              ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800'
              : 'border-gray-200 bg-gradient-to-r from-green-50 to-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate transition-colors duration-300 ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>{user?.fullName || user?.username}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400'
                    : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                }`}
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className={`p-4 border-b transition-colors duration-300 ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search canals, offices, nemra..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <p className={`mt-2 text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Found {searchResultsCount} plot{searchResultsCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Sectors */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>Agricultural Sectors</h2>

            {/* All Sectors Button */}
            <button
              onClick={() => onSectorSelect(null)}
              className={`w-full mb-3 p-4 rounded-lg text-left transition-all ${
                selectedSector === null
                  ? 'bg-green-600 text-white shadow-md'
                  : isDark
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">All Sectors</p>
                  <p className="text-sm opacity-80 arabic-text" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    جميع القطاعات
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400" />
              </div>
            </button>

            {/* Individual Sectors */}
            {sectors.map((sector) => (
              <button
                key={sector.id}
                onClick={() => onSectorSelect(sector.id)}
                className={`w-full mb-3 p-4 rounded-lg text-left transition-all ${
                  selectedSector === sector.id
                    ? 'bg-green-600 text-white shadow-md'
                    : isDark
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{sector.name}</p>
                    <p className="text-sm opacity-80 arabic-text" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {sector.nameAr}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${sector.color}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Gezira Irrigation Scheme Management System
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              v1.0.0 - 2025
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
