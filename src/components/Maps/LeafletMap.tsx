import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { SectorFeatureCollection, SectorDivision, SectorFeature, AreaCategory } from '../../types';
import { sectorColors, getAreaColor, getPatternStyle, hexWithOpacity } from '../../utils/symbology';
import AdvancedDrawingTools from './AdvancedDrawingTools';
import MapToolbar from './MapToolbar';
import HelpPanel from './HelpPanel';
import { useAuth } from '../../context/AuthContext';

interface LeafletMapProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  selectedAreaCategory?: AreaCategory;
  onAreaCategoryChange?: (category: AreaCategory) => void;
  onFeatureClick?: (feature: SectorFeature) => void;
  onDataUpdate?: () => void;
}

// Fix for default marker icon
// @ts-expect-error - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LeafletMap({ sectorsData, selectedSector, selectedAreaCategory, onAreaCategoryChange, onFeatureClick, onDataUpdate }: LeafletMapProps) {
  const { hasRole } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showDrawingInstructions, setShowDrawingInstructions] = useState(true);
  const canEdit = hasRole(['admin', 'editor']);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current, {
      center: [14.35, 33.0],
      zoom: 10,
      zoomControl: true,
      preferCanvas: true, // Use Canvas renderer for better performance
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    // Define base layers
    const baseLayers = {
      'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }),
      'Google Streets': L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
      }),
      'Google Satellite': L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
      }),
      'Google Hybrid': L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google',
        maxZoom: 20,
      }),
      'Esri WorldImagery': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19,
      }),
      'Esri WorldStreetMap': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19,
      }),
    };

    // Add default layer
    baseLayers['OpenStreetMap'].addTo(mapRef.current);

    // Add layer control
    L.control.layers(baseLayers, {}, { position: 'topleft' }).addTo(mapRef.current);

    // Add scale control
    L.control.scale({ position: 'bottomright' }).addTo(mapRef.current);

    // Mark map as ready
    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing layers safely
    layersRef.current.forEach(layer => {
      try {
        if (mapRef.current && layer) {
          mapRef.current.removeLayer(layer);
        }
      } catch (e) {
        console.warn('Error removing layer:', e);
      }
    });
    layersRef.current = [];

    const bounds: L.LatLngBounds[] = [];

    // Add GeoJSON layers
    Object.entries(sectorsData).forEach(([division, data]) => {
      if (!data) return;

      // Skip if a sector is selected and this isn't it
      if (selectedSector && division !== selectedSector) return;

      const sectorColor = sectorColors[division as SectorDivision];

      const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
        style: (feature) => {
          const props = feature?.properties;
          const area = props?.Design_A_F || 0;
          const style = getPatternStyle(props);

          return {
            fillColor: getAreaColor(area, sectorColor.primary),
            fillOpacity: style.fillOpacity,
            color: sectorColor.dark,
            weight: style.strokeWidth,
            opacity: 1,
            dashArray: area > 2000 ? '5, 5' : undefined,
          };
        },
        // Simplify geometries for better performance
        // @ts-expect-error - Leaflet options
        smoothFactor: 1.0,
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const area = props.Design_A_F || 0;
          const sectorColor = sectorColors[division as SectorDivision];

          // Create enhanced popup content with gradient header
          const popupContent = `
            <div class="min-w-[250px] overflow-hidden rounded-lg">
              <div class="p-3 text-white" style="background: ${sectorColor.gradient};">
                <h3 class="font-bold text-lg mb-1">${props.Canal_Name}</h3>
                <p class="text-sm opacity-90 arabic-text" style="font-family: 'Cairo', sans-serif; direction: rtl;">${props.Name_AR}</p>
              </div>
              <div class="p-3 bg-white">
                <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500 uppercase">Division</p>
                    <p class="font-semibold text-gray-800">${props.Division}</p>
                  </div>
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500 uppercase">Office</p>
                    <p class="font-semibold text-gray-800">${props.Office}</p>
                  </div>
                </div>
                <div class="space-y-2 text-sm border-t pt-2">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Nemra No:</span>
                    <span class="font-semibold text-gray-800">${props.No_Nemra}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Design Area:</span>
                    <span class="font-semibold text-gray-800">${props.Design_A_F} Feddan</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Shape Area:</span>
                    <span class="font-semibold text-gray-800">${(props.Shape_Area / 1000000).toFixed(2)} km²</span>
                  </div>
                  ${area > 2000 ? '<div class="mt-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">🏆 Very Large Plot</div>' : ''}
                  ${props.Remarks_1 ? `<p class="text-xs italic mt-2 p-2 bg-blue-50 rounded text-gray-700">${props.Remarks_1}</p>` : ''}
                </div>
              </div>
            </div>
          `;

          layer.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
          });

          layer.on('click', () => {
            if (onFeatureClick) {
              onFeatureClick(feature as unknown as SectorFeature);
            }
          });

          // Enhanced hover effects with smooth transitions
          layer.on('mouseover', function(this: L.Path) {
            const style = getPatternStyle(props);
            this.setStyle({
              fillOpacity: Math.min(style.fillOpacity + 0.2, 1),
              weight: style.strokeWidth * 1.5,
              color: sectorColor.light,
            });
            this.bringToFront();
          });

          layer.on('mouseout', function(this: L.Path) {
            const style = getPatternStyle(props);
            this.setStyle({
              fillOpacity: style.fillOpacity,
              weight: style.strokeWidth,
              color: sectorColor.dark,
            });
          });
        },
      });

      layer.addTo(mapRef.current!);
      layersRef.current.push(layer);

      const layerBounds = layer.getBounds();
      if (layerBounds.isValid()) {
        bounds.push(layerBounds);
      }
    });

    // Fit map to bounds
    if (bounds.length > 0) {
      const allBounds = bounds.reduce((acc, b) => acc.extend(b), bounds[0]);
      mapRef.current.fitBounds(allBounds, { padding: [50, 50] });
    }
  }, [sectorsData, selectedSector, onFeatureClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Toolbar */}
      <MapToolbar
        showHelp={showHelp}
        showLegend={showLegend}
        showDrawingInstructions={showDrawingInstructions}
        onToggleHelp={() => setShowHelp(!showHelp)}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onToggleDrawingInstructions={() => setShowDrawingInstructions(!showDrawingInstructions)}
        canEdit={canEdit}
      />

      {/* Help Panel */}
      {showHelp && <HelpPanel />}

      {/* Enhanced Legend */}
      {showLegend && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-xl p-4 z-[1000] border-2 border-gray-200">
        <h3 className="font-bold text-sm mb-3 text-gray-800 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Sectors & Area Categories
        </h3>

        {/* Sector Colors */}
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">DIVISIONS</p>
          {Object.entries(sectorColors).map(([sector, colors]) => (
            <div key={sector} className="flex items-center space-x-2 text-xs">
              <div
                className="w-5 h-5 rounded border-2 shadow-sm"
                style={{
                  background: colors.gradient,
                  borderColor: colors.dark
                }}
              />
              <span className="font-medium text-gray-700">{sector}</span>
            </div>
          ))}
        </div>

        {/* Area Categories - Interactive */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">AREA SIZE (Click to filter)</p>
            {selectedAreaCategory && (
              <button
                onClick={() => onAreaCategoryChange?.(null)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => onAreaCategoryChange?.(selectedAreaCategory === 'small' ? null : 'small')}
              className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                selectedAreaCategory === 'small'
                  ? 'bg-blue-100 border border-blue-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border border-gray-300" style={{ opacity: 0.3 }}></div>
                <span className="text-gray-700">Small</span>
              </div>
              <span className="text-gray-500">&lt; 500F</span>
            </button>
            <button
              onClick={() => onAreaCategoryChange?.(selectedAreaCategory === 'medium' ? null : 'medium')}
              className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                selectedAreaCategory === 'medium'
                  ? 'bg-blue-100 border border-blue-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border border-gray-300" style={{ opacity: 0.5 }}></div>
                <span className="text-gray-700">Medium</span>
              </div>
              <span className="text-gray-500">500-1000F</span>
            </button>
            <button
              onClick={() => onAreaCategoryChange?.(selectedAreaCategory === 'large' ? null : 'large')}
              className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                selectedAreaCategory === 'large'
                  ? 'bg-blue-100 border border-blue-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border border-gray-300" style={{ opacity: 0.7 }}></div>
                <span className="text-gray-700">Large</span>
              </div>
              <span className="text-gray-500">1-2K F</span>
            </button>
            <button
              onClick={() => onAreaCategoryChange?.(selectedAreaCategory === 'very-large' ? null : 'very-large')}
              className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                selectedAreaCategory === 'very-large'
                  ? 'bg-blue-100 border border-blue-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border-2 border-dashed border-gray-600" style={{ opacity: 0.9 }}></div>
                <span className="text-gray-700 font-semibold">V. Large</span>
              </div>
              <span className="text-gray-500">&gt; 2000F</span>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Advanced Drawing Tools */}
      {mapReady && (
        <AdvancedDrawingTools
          map={mapRef.current}
          onFeatureCreated={onDataUpdate}
          showInstructions={showDrawingInstructions}
          sectorsData={sectorsData}
        />
      )}
    </div>
  );
}
