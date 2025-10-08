import { useState } from 'react';
import type { SectorDivision } from '../../types';

interface SymbologySettings {
  fillStyle: 'solid' | 'hollow' | 'pattern';
  fillOpacity: number;
  outlineColor: string;
  outlineWidth: number;
  colors: Record<SectorDivision, string>;
}

interface SymbologyControlProps {
  onSymbologyChange: (settings: SymbologySettings) => void;
}

export default function SymbologyControl({ onSymbologyChange }: SymbologyControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SymbologySettings>({
    fillStyle: 'solid',
    fillOpacity: 0.6,
    outlineColor: '#333333',
    outlineWidth: 2,
    colors: {
      East: '#3b82f6',
      West: '#10b981',
      North: '#f59e0b',
      South: '#ef4444',
    },
  });

  const updateSettings = (updates: Partial<SymbologySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSymbologyChange(newSettings);
  };

  const updateColor = (division: SectorDivision, color: string) => {
    const newColors = { ...settings.colors, [division]: color };
    updateSettings({ colors: newColors });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700
          text-white px-5 py-2.5 rounded-xl shadow-lg border border-purple-400
          flex items-center gap-2.5 transition-all duration-200
          hover:shadow-xl hover:scale-105 active:scale-95
          ${isOpen ? 'ring-2 ring-purple-300 ring-offset-2' : ''}
        `}
        title="Symbology Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="text-sm font-semibold tracking-wide">Symbology</span>
        {isOpen && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 w-80 max-h-[600px] overflow-y-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              Sector Symbology
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Fill Style */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              FILL STYLE
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ fillStyle: 'solid' })}
                className={`px-3 py-2 text-xs rounded border-2 transition-all ${
                  settings.fillStyle === 'solid'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                ⬛ Solid
              </button>
              <button
                onClick={() => updateSettings({ fillStyle: 'hollow' })}
                className={`px-3 py-2 text-xs rounded border-2 transition-all ${
                  settings.fillStyle === 'hollow'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                ⬜ Hollow
              </button>
              <button
                onClick={() => updateSettings({ fillStyle: 'pattern' })}
                className={`px-3 py-2 text-xs rounded border-2 transition-all ${
                  settings.fillStyle === 'pattern'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                ▦ Pattern
              </button>
            </div>
          </div>

          {/* Fill Opacity */}
          {settings.fillStyle !== 'hollow' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                FILL OPACITY: {Math.round(settings.fillOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.fillOpacity}
                onChange={(e) => updateSettings({ fillOpacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Division Colors */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              DIVISION COLORS
            </label>
            <div className="space-y-2">
              {(['East', 'West', 'North', 'South'] as SectorDivision[]).map((division) => (
                <div key={division} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">{division}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.colors[division]}
                      onChange={(e) => updateColor(division, e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors[division]}
                      onChange={(e) => updateColor(division, e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outline/Boundary Settings */}
          <div className="mb-4 pt-4 border-t">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              BOUNDARY COLOR
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="color"
                value={settings.outlineColor}
                onChange={(e) => updateSettings({ outlineColor: e.target.value })}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.outlineColor}
                onChange={(e) => updateSettings({ outlineColor: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-2">
              BOUNDARY WIDTH: {settings.outlineWidth}px
            </label>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={settings.outlineWidth}
              onChange={(e) => updateSettings({ outlineWidth: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Preset Styles */}
          <div className="pt-4 border-t">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              QUICK PRESETS
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({
                  fillStyle: 'solid',
                  fillOpacity: 0.7,
                  outlineColor: '#000000',
                  outlineWidth: 2,
                })}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                🎨 Default
              </button>
              <button
                onClick={() => updateSettings({
                  fillStyle: 'hollow',
                  fillOpacity: 0,
                  outlineColor: '#0066cc',
                  outlineWidth: 3,
                })}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                ⬜ Outline Only
              </button>
              <button
                onClick={() => updateSettings({
                  fillStyle: 'solid',
                  fillOpacity: 0.3,
                  outlineColor: '#ffffff',
                  outlineWidth: 1,
                })}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                👻 Transparent
              </button>
              <button
                onClick={() => updateSettings({
                  fillStyle: 'solid',
                  fillOpacity: 0.9,
                  outlineColor: '#333333',
                  outlineWidth: 4,
                })}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                💪 Bold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { SymbologySettings };
