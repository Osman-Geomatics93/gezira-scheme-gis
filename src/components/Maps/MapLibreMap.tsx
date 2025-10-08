import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { SectorFeatureCollection, SectorDivision, SectorFeature, AreaCategory } from '../../types';
import { sectorColors, getAreaColor, hexWithOpacity } from '../../utils/symbology';

interface MapLibreMapProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  selectedAreaCategory?: AreaCategory;
  onAreaCategoryChange?: (category: AreaCategory) => void;
  onFeatureClick?: (feature: SectorFeature) => void;
}

export default function MapLibreMap({ sectorsData, selectedSector, selectedAreaCategory, onAreaCategoryChange, onFeatureClick }: MapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Store basemap styles
    const basemapStyles = {
      osm: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      googleStreets: {
        version: 8,
        sources: {
          'google': {
            type: 'raster',
            tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'google', type: 'raster', source: 'google' }],
      },
      googleSatellite: {
        version: 8,
        sources: {
          'google': {
            type: 'raster',
            tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'google', type: 'raster', source: 'google' }],
      },
      esriImagery: {
        version: 8,
        sources: {
          'esri': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
      },
    };

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyles.osm,
      center: [33.0, 14.35],
      zoom: 9,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    // Add basemap switcher
    const basemapControl = document.createElement('div');
    basemapControl.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    basemapControl.style.cssText = 'position: absolute; top: 10px; left: 10px; background: white; border-radius: 4px; z-index: 1000; box-shadow: 0 0 0 2px rgba(0,0,0,.1);';
    basemapControl.innerHTML = `
      <select style="padding: 8px 10px; border: none; font-size: 13px; cursor: pointer; outline: none; background: white; border-radius: 4px;">
        <option value="osm">OpenStreetMap</option>
        <option value="googleStreets">Google Streets</option>
        <option value="googleSatellite">Google Satellite</option>
        <option value="esriImagery">Esri Imagery</option>
      </select>
    `;

    const select = basemapControl.querySelector('select');
    if (select) {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const style = basemapStyles[target.value as keyof typeof basemapStyles];
        mapRef.current?.setStyle(style);
      });
    }

    mapRef.current.getContainer().appendChild(basemapControl);

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const loadData = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', loadData);
        return;
      }
      // Remove existing sector layers and sources
      const divisions: SectorDivision[] = ['East', 'West', 'North', 'South'];
      divisions.forEach((division) => {
        const layerId = `sector-${division.toLowerCase()}`;
        const lineLayerId = `sector-${division.toLowerCase()}-line`;

        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      });

      let bounds: maplibregl.LngLatBounds | null = null;

      // Add sector layers
      Object.entries(sectorsData).forEach(([division, data]) => {
        if (!data) return;
        if (selectedSector && division !== selectedSector) return;

        const layerId = `sector-${division.toLowerCase()}`;
        const lineLayerId = `sector-${division.toLowerCase()}-line`;
        const sectorColor = sectorColors[division as SectorDivision];

        // Add source
        map.addSource(layerId, {
          type: 'geojson',
          // @ts-expect-error - MapLibre type compatibility
          data: data,
        });

        // Add fill layer with data-driven styling
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'Design_A_F'],
              0, hexWithOpacity(sectorColor.primary, 0.3),
              500, hexWithOpacity(sectorColor.primary, 0.5),
              1000, hexWithOpacity(sectorColor.primary, 0.7),
              2000, hexWithOpacity(sectorColor.primary, 0.9)
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              0.6
            ],
          },
        });

        // Add line layer with gradient effect
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              sectorColor.light,
              sectorColor.dark
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['get', 'Design_A_F'],
              0, 1.5,
              500, 2,
              1000, 2.5,
              2000, 3
            ],
            'line-opacity': 1,
          },
        });

        // Click event
        map.on('click', layerId, (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const props = feature.properties;
          const area = props?.Design_A_F || 0;

          const popupContent = `
            <div class="min-w-[250px] overflow-hidden rounded-lg">
              <div class="p-3 text-white" style="background: ${sectorColor.gradient};">
                <h3 class="font-bold text-lg mb-1">${props?.Canal_Name || 'N/A'}</h3>
                <p class="text-sm opacity-90 arabic-text" style="font-family: 'Cairo', sans-serif; direction: rtl;">${props?.Name_AR || ''}</p>
              </div>
              <div class="p-3 bg-white">
                <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500 uppercase">Division</p>
                    <p class="font-semibold text-gray-800">${props?.Division || 'N/A'}</p>
                  </div>
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500 uppercase">Office</p>
                    <p class="font-semibold text-gray-800">${props?.Office || 'N/A'}</p>
                  </div>
                </div>
                <div class="space-y-2 text-sm border-t pt-2">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Nemra No:</span>
                    <span class="font-semibold text-gray-800">${props?.No_Nemra || 'N/A'}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Design Area:</span>
                    <span class="font-semibold text-gray-800">${props?.Design_A_F || 'N/A'} Feddan</span>
                  </div>
                  ${area > 2000 ? '<div class="mt-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">🏆 Very Large Plot</div>' : ''}
                  ${props?.Remarks_1 ? `<p class="text-xs italic mt-2 p-2 bg-blue-50 rounded text-gray-700">${props.Remarks_1}</p>` : ''}
                </div>
              </div>
            </div>
          `;

          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);

          if (onFeatureClick) {
            onFeatureClick(feature as unknown as SectorFeature);
          }
        });

        // Enhanced hover effect with feature state
        let hoveredFeatureId: string | number | null = null;

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mousemove', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            if (hoveredFeatureId !== null) {
              map.setFeatureState(
                { source: layerId, id: hoveredFeatureId },
                { hover: false }
              );
            }
            hoveredFeatureId = e.features[0].id as string | number;
            map.setFeatureState(
              { source: layerId, id: hoveredFeatureId },
              { hover: true }
            );
          }
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: layerId, id: hoveredFeatureId },
              { hover: false }
            );
          }
          hoveredFeatureId = null;
        });

        // Calculate bounds
        data.features.forEach((feature) => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord) => {
              if (!bounds) {
                bounds = new maplibregl.LngLatBounds(coord as [number, number], coord as [number, number]);
              } else {
                bounds.extend(coord as [number, number]);
              }
            });
          }
        });
      });

      // Fit to bounds
      if (bounds) {
        map.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.isStyleLoaded()) {
      loadData();
    } else {
      map.once('load', loadData);
    }
  }, [sectorsData, selectedSector, onFeatureClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Enhanced Legend */}
      <div className="absolute top-4 right-14 bg-white rounded-lg shadow-xl p-4 z-10 border border-gray-200">
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
                <div className="w-4 h-4 rounded border-2 border-gray-600" style={{ opacity: 0.9 }}></div>
                <span className="text-gray-700 font-semibold">V. Large</span>
              </div>
              <span className="text-gray-500">&gt; 2000F</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
