import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import type { MapLibrary, SectorDivision } from '../../types';

interface MainLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedMapLibrary: MapLibrary;
  onMapLibraryChange: (library: MapLibrary) => void;
  selectedSector: SectorDivision | null;
  onSectorSelect: (sector: SectorDivision | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultsCount?: number;
}

export default function MainLayout({
  children,
  sidebarOpen,
  onToggleSidebar,
  selectedMapLibrary,
  onMapLibraryChange,
  selectedSector,
  onSectorSelect,
  searchQuery,
  onSearchChange,
  searchResultsCount = 0
}: MainLayoutProps) {
  const { isDark } = useTheme();

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      <Header
        onToggleSidebar={onToggleSidebar}
        sidebarOpen={sidebarOpen}
        selectedMapLibrary={selectedMapLibrary}
        onMapLibraryChange={onMapLibraryChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          selectedSector={selectedSector}
          onSectorSelect={onSectorSelect}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchResultsCount={searchResultsCount}
        />

        <main className={`flex-1 relative flex flex-col transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
