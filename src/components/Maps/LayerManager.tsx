import { useState } from 'react';
import type { ImportedLayer } from '../../utils/fileImport';

interface LayerManagerProps {
  layers: ImportedLayer[];
  onToggleVisibility: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onChangeColor: (layerId: string, color: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onZoomToLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onToggleLabels: (layerId: string) => void;
  onChangeLabelField: (layerId: string, field: string) => void;
  onChangeLabelSize: (layerId: string, size: number) => void;
  onChangeLabelColor: (layerId: string, color: string) => void;
  onChangeLabelHaloColor: (layerId: string, color: string) => void;
  onChangeLabelHaloWidth: (layerId: string, width: number) => void;
  onChangeBrightness: (layerId: string, brightness: number) => void;
  onChangeContrast: (layerId: string, contrast: number) => void;
  onChangeSaturation: (layerId: string, saturation: number) => void;
  onChangeRedBand: (layerId: string, band: number) => void;
  onChangeGreenBand: (layerId: string, band: number) => void;
  onChangeBlueBand: (layerId: string, band: number) => void;
  onChangeGrayscaleBand: (layerId: string, band: number) => void;
  onChangeDisplayMode: (layerId: string, mode: 'rgb' | 'grayscale') => void;
}

export default function LayerManager({
  layers,
  onToggleVisibility,
  onRemoveLayer,
  onChangeColor,
  onChangeOpacity,
  onZoomToLayer,
  onMoveLayer,
  onToggleLabels,
  onChangeLabelField,
  onChangeLabelSize,
  onChangeLabelColor,
  onChangeLabelHaloColor,
  onChangeLabelHaloWidth,
  onChangeBrightness,
  onChangeContrast,
  onChangeSaturation,
  onChangeRedBand,
  onChangeGreenBand,
  onChangeBlueBand,
  onChangeGrayscaleBand,
  onChangeDisplayMode
}: LayerManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  if (layers.length === 0) {
    return null;
  }

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'geojson':
        return '📊';
      case 'kml':
        return '📍';
      case 'shapefile':
        return '🗺️';
      case 'raster':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const getFeatureCount = (layer: ImportedLayer) => {
    if (layer.type === 'raster') {
      const rasterData = layer.data as any;
      return `${rasterData.width}x${rasterData.height}`;
    }
    return (layer.data as any).features?.length || 0;
  };

  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-gray-50 px-4 py-2 rounded-lg shadow-xl border border-gray-200 flex items-center gap-2 transition-all"
        title="Layer Manager"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-sm font-medium">Layers ({layers.length})</span>
      </button>

      {/* Layer Manager Panel */}
      {isOpen && (
        <div className="mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-96 max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Layer Manager
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {layers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm font-medium">No layers imported</p>
              <p className="text-xs mt-1">Use the Import button to add layers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Layer Header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => onToggleVisibility(layer.id)}
                      className={`flex-shrink-0 ${
                        layer.visible ? 'text-blue-600' : 'text-gray-400'
                      }`}
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>

                    {/* Layer Ordering Controls */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => onMoveLayer(layer.id, 'up')}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-colors ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Move layer up"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onMoveLayer(layer.id, 'down')}
                        disabled={index === layers.length - 1}
                        className={`p-0.5 rounded transition-colors ${
                          index === layers.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Move layer down"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Layer Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getLayerIcon(layer.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {layer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getFeatureCount(layer)} features • {layer.type}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Color Indicator */}
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          expandedLayer === layer.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded Layer Controls */}
                  {expandedLayer === layer.id && (
                    <div className="p-3 space-y-3 bg-white border-t border-gray-200">
                      {/* Color Picker */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          COLOR
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={layer.color}
                            onChange={(e) => onChangeColor(layer.id, e.target.value)}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={layer.color}
                            onChange={(e) => onChangeColor(layer.id, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      {/* Opacity Slider */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          OPACITY: {Math.round(layer.opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Raster Stretch Controls - Only for raster layers */}
                      {layer.type === 'raster' && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-3">RASTER STRETCH</p>

                          {/* Brightness */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">
                              Brightness: {layer.brightness?.toFixed(2) || '0.00'}
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={layer.brightness || 0}
                              onChange={(e) => onChangeBrightness(layer.id, parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Contrast */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">
                              Contrast: {layer.contrast?.toFixed(2) || '0.00'}
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={layer.contrast || 0}
                              onChange={(e) => onChangeContrast(layer.id, parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Saturation */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">
                              Saturation: {layer.saturation?.toFixed(2) || '0.00'}
                            </label>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.05"
                              value={layer.saturation || 0}
                              onChange={(e) => onChangeSaturation(layer.id, parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Reset Stretch Button */}
                          <button
                            onClick={() => {
                              onChangeBrightness(layer.id, 0);
                              onChangeContrast(layer.id, 0);
                              onChangeSaturation(layer.id, 0);
                            }}
                            className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors"
                          >
                            🔄 Reset Stretch
                          </button>
                        </div>
                      )}

                      {/* Band Selection Controls - Only for raster layers with multiple bands */}
                      {layer.type === 'raster' && (layer.data as any).numBands > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-3">BAND COMBINATION</p>

                          {/* Display Mode Toggle */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">Display Mode:</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onChangeDisplayMode(layer.id, 'rgb')}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                                  layer.displayMode === 'rgb'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                disabled={(layer.data as any).numBands < 3}
                              >
                                RGB
                              </button>
                              <button
                                onClick={() => onChangeDisplayMode(layer.id, 'grayscale')}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                                  layer.displayMode === 'grayscale'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Grayscale
                              </button>
                            </div>
                          </div>

                          {/* RGB Band Selection */}
                          {layer.displayMode === 'rgb' && (layer.data as any).numBands >= 3 && (
                            <div className="space-y-2 mb-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Red Band: Band {(layer.redBand ?? 0) + 1}
                                </label>
                                <select
                                  value={layer.redBand ?? 0}
                                  onChange={(e) => onChangeRedBand(layer.id, parseInt(e.target.value))}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                  {Array.from({ length: (layer.data as any).numBands }, (_, i) => (
                                    <option key={i} value={i}>Band {i + 1}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Green Band: Band {(layer.greenBand ?? 1) + 1}
                                </label>
                                <select
                                  value={layer.greenBand ?? 1}
                                  onChange={(e) => onChangeGreenBand(layer.id, parseInt(e.target.value))}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                  {Array.from({ length: (layer.data as any).numBands }, (_, i) => (
                                    <option key={i} value={i}>Band {i + 1}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Blue Band: Band {(layer.blueBand ?? 2) + 1}
                                </label>
                                <select
                                  value={layer.blueBand ?? 2}
                                  onChange={(e) => onChangeBlueBand(layer.id, parseInt(e.target.value))}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {Array.from({ length: (layer.data as any).numBands }, (_, i) => (
                                    <option key={i} value={i}>Band {i + 1}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Grayscale Band Selection */}
                          {layer.displayMode === 'grayscale' && (
                            <div className="mb-3">
                              <label className="block text-xs text-gray-500 mb-1">
                                Band: Band {(layer.grayscaleBand ?? 0) + 1}
                              </label>
                              <select
                                value={layer.grayscaleBand ?? 0}
                                onChange={(e) => onChangeGrayscaleBand(layer.id, parseInt(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                              >
                                {Array.from({ length: (layer.data as any).numBands }, (_, i) => (
                                  <option key={i} value={i}>Band {i + 1}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Info about total bands */}
                          <p className="text-xs text-gray-500 italic">
                            Total bands available: {(layer.data as any).numBands}
                          </p>
                        </div>
                      )}

                      {/* Labels Section - Only for vector layers */}
                      {layer.type !== 'raster' && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-gray-600">
                              LABELS
                            </label>
                            <button
                              onClick={() => onToggleLabels(layer.id)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                layer.showLabels
                                  ? 'bg-green-100 text-green-700 font-semibold'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {layer.showLabels ? '✓ ON' : 'OFF'}
                            </button>
                          </div>

                        {layer.showLabels && 'features' in layer.data && layer.data.features?.[0]?.properties && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Label Field:</label>
                              <select
                                value={layer.labelField || ''}
                                onChange={(e) => onChangeLabelField(layer.id, e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">None</option>
                                {'features' in layer.data && layer.data.features[0] && Object.keys(layer.data.features[0].properties).map(field => (
                                  <option key={field} value={field}>{field}</option>
                                ))}
                              </select>
                            </div>

                            {/* Label Size */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Label Size: {layer.labelSize}px
                              </label>
                              <input
                                type="range"
                                min="8"
                                max="24"
                                step="1"
                                value={layer.labelSize}
                                onChange={(e) => onChangeLabelSize(layer.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Label Color */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Label Color:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={layer.labelColor}
                                  onChange={(e) => onChangeLabelColor(layer.id, e.target.value)}
                                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={layer.labelColor}
                                  onChange={(e) => onChangeLabelColor(layer.id, e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              </div>
                            </div>

                            {/* Label Halo Color */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Halo Color:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={layer.labelHaloColor}
                                  onChange={(e) => onChangeLabelHaloColor(layer.id, e.target.value)}
                                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={layer.labelHaloColor}
                                  onChange={(e) => onChangeLabelHaloColor(layer.id, e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              </div>
                            </div>

                            {/* Label Halo Width */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Halo Width: {layer.labelHaloWidth}px
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={layer.labelHaloWidth}
                                onChange={(e) => onChangeLabelHaloWidth(layer.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => onZoomToLayer(layer.id)}
                          className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded transition-colors"
                        >
                          🎯 Zoom to Layer
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove layer "${layer.name}"?`)) {
                              onRemoveLayer(layer.id);
                            }
                          }}
                          className="px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
