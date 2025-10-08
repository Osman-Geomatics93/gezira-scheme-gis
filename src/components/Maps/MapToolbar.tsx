import { useState } from 'react';

interface MapToolbarProps {
  showHelp: boolean;
  showLegend: boolean;
  showDrawingInstructions: boolean;
  onToggleHelp: () => void;
  onToggleLegend: () => void;
  onToggleDrawingInstructions: () => void;
  canEdit: boolean;
}

export default function MapToolbar({
  showHelp,
  showLegend,
  showDrawingInstructions,
  onToggleHelp,
  onToggleLegend,
  onToggleDrawingInstructions,
  canEdit,
}: MapToolbarProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="absolute top-4 right-4 z-[1001]">
      {/* Collapsible Toolbar */}
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 flex items-center justify-between cursor-pointer hover:from-green-700 hover:to-blue-700 transition-all"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-semibold text-sm">Map Controls</span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Buttons Panel */}
        {expanded && (
          <div className="p-3 space-y-2">
            {/* Legend Toggle */}
            <button
              onClick={onToggleLegend}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                showLegend
                  ? 'bg-green-100 border-2 border-green-500 text-green-800'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Legend</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${showLegend ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </button>

            {/* Drawing Instructions Toggle (only for admin/editor) */}
            {canEdit && (
              <button
                onClick={onToggleDrawingInstructions}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  showDrawingInstructions
                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-sm font-medium">Drawing Help</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${showDrawingInstructions ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              </button>
            )}

            {/* Help Toggle */}
            <button
              onClick={onToggleHelp}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                showHelp
                  ? 'bg-purple-100 border-2 border-purple-500 text-purple-800'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Keyboard Shortcuts</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${showHelp ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
            </button>

            {/* Quick Actions Divider */}
            <div className="border-t border-gray-300 my-2"></div>

            {/* Info Text */}
            <div className="text-xs text-gray-600 text-center py-1">
              Click toggles to show/hide panels
            </div>
          </div>
        )}
      </div>

      {/* Compact Toggle Button when collapsed */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-2 rounded-lg shadow-xl hover:from-green-700 hover:to-blue-700 transition-all"
          title="Show Map Controls"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      )}
    </div>
  );
}
