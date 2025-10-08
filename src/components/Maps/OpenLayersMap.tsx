import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { fromLonLat } from 'ol/proj';
import LayerGroup from 'ol/layer/Group';
import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import type { SectorFeatureCollection, SectorDivision, SectorProperties, AreaCategory } from '../../types';
import { sectorColors, getAreaColor, getPatternStyle, hexWithOpacity } from '../../utils/symbology';

interface OpenLayersMapProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  selectedAreaCategory?: AreaCategory;
  onAreaCategoryChange?: (category: AreaCategory) => void;
  onFeatureClick?: (feature: SectorProperties) => void;
}

export default function OpenLayersMap({ sectorsData, selectedSector, selectedAreaCategory, onAreaCategoryChange, onFeatureClick }: OpenLayersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const vectorLayersRef = useRef<VectorLayer<VectorSource>[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || !popupRef.current) return;

    // Create popup overlay
    overlayRef.current = new Overlay({
      element: popupRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });

    // Define base layers
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: true,
    });

    const googleStreetsLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        attributions: '&copy; Google',
      }),
      visible: false,
    });

    const googleSatelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attributions: '&copy; Google',
      }),
      visible: false,
    });

    const esriImageryLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '&copy; Esri',
      }),
      visible: false,
    });

    // Initialize map
    mapRef.current = new Map({
      target: mapContainerRef.current,
      layers: [osmLayer, googleStreetsLayer, googleSatelliteLayer, esriImageryLayer],
      view: new View({
        center: fromLonLat([33.0, 14.35]),
        zoom: 9,
      }),
      controls: defaultControls().extend([
        new ScaleLine({
          units: 'metric',
        }),
      ]),
      overlays: [overlayRef.current],
    });

    // Add basemap switcher
    const basemapControl = document.createElement('div');
    basemapControl.className = 'ol-control';
    basemapControl.style.cssText = 'position: absolute; top: 10px; left: 10px; background: white; border-radius: 4px; padding: 2px; z-index: 1000; box-shadow: 0 0 0 2px rgba(0,0,0,.1);';
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
        const basemaps = {
          osm: osmLayer,
          googleStreets: googleStreetsLayer,
          googleSatellite: googleSatelliteLayer,
          esriImagery: esriImageryLayer,
        };

        Object.values(basemaps).forEach(layer => layer.setVisible(false));
        basemaps[target.value as keyof typeof basemaps].setVisible(true);
      });
    }

    mapRef.current.getTargetElement().appendChild(basemapControl);

    // Enhanced click handler with modern popup
    mapRef.current.on('click', (evt) => {
      const feature = mapRef.current!.forEachFeatureAtPixel(evt.pixel, (feature) => feature);

      if (feature) {
        const props = feature.getProperties() as SectorProperties;
        const geometry = feature.getGeometry();
        const area = props.Design_A_F || 0;

        if (!geometry) return;

        // Find sector color
        const division = props.Division as SectorDivision;
        const sectorColor = sectorColors[division] || sectorColors.East;

        const popupContent = `
          <div class="bg-white rounded-lg shadow-lg min-w-[250px] overflow-hidden">
            <button class="popup-closer absolute top-2 right-2 text-white hover:text-gray-200 z-10">&times;</button>
            <div class="p-3 text-white" style="background: ${sectorColor.gradient};">
              <h3 class="font-bold text-lg mb-1">${props.Canal_Name || 'N/A'}</h3>
              <p class="text-sm opacity-90 arabic-text" style="font-family: 'Cairo', sans-serif; direction: rtl;">${props.Name_AR || ''}</p>
            </div>
            <div class="p-3">
              <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                <div class="bg-gray-50 p-2 rounded">
                  <p class="text-xs text-gray-500 uppercase">Division</p>
                  <p class="font-semibold text-gray-800">${props.Division || 'N/A'}</p>
                </div>
                <div class="bg-gray-50 p-2 rounded">
                  <p class="text-xs text-gray-500 uppercase">Office</p>
                  <p class="font-semibold text-gray-800">${props.Office || 'N/A'}</p>
                </div>
              </div>
              <div class="space-y-2 text-sm border-t pt-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Nemra No:</span>
                  <span class="font-semibold text-gray-800">${props.No_Nemra || 'N/A'}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Design Area:</span>
                  <span class="font-semibold text-gray-800">${props.Design_A_F || 'N/A'} Feddan</span>
                </div>
                ${area > 2000 ? '<div class="mt-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">🏆 Very Large Plot</div>' : ''}
                ${props.Remarks_1 ? `<p class="text-xs italic mt-2 p-2 bg-blue-50 rounded text-gray-700">${props.Remarks_1}</p>` : ''}
              </div>
            </div>
          </div>
        `;

        if (popupRef.current) {
          popupRef.current.innerHTML = popupContent;
          overlayRef.current?.setPosition(evt.coordinate);

          // Close button handler
          const closer = popupRef.current.querySelector('.popup-closer');
          if (closer) {
            closer.addEventListener('click', () => {
              overlayRef.current?.setPosition(undefined);
            });
          }
        }

        if (onFeatureClick) {
          onFeatureClick(props);
        }
      } else {
        overlayRef.current?.setPosition(undefined);
      }
    });

    // Change cursor on hover
    mapRef.current.on('pointermove', (evt) => {
      const pixel = mapRef.current!.getEventPixel(evt.originalEvent);
      const hit = mapRef.current!.hasFeatureAtPixel(pixel);
      mapRef.current!.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
    };
  }, [onFeatureClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing vector layers
    vectorLayersRef.current.forEach((layer) => {
      mapRef.current!.removeLayer(layer);
    });
    vectorLayersRef.current = [];

    const allFeatures: any[] = [];

    // Add sector layers with enhanced styling
    Object.entries(sectorsData).forEach(([division, data]) => {
      if (!data) return;
      if (selectedSector && division !== selectedSector) return;

      const sectorColor = sectorColors[division as SectorDivision];

      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(data, {
          featureProjection: 'EPSG:3857',
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature: Feature<Geometry>) => {
          const props = feature.getProperties() as SectorProperties;
          const area = props.Design_A_F || 0;
          const style = getPatternStyle(props);

          return new Style({
            fill: new Fill({
              color: getAreaColor(area, sectorColor.primary),
            }),
            stroke: new Stroke({
              color: sectorColor.dark,
              width: style.strokeWidth,
              lineDash: area > 2000 ? [5, 5] : undefined,
            }),
          });
        },
      });

      mapRef.current!.addLayer(vectorLayer);
      vectorLayersRef.current.push(vectorLayer);

      allFeatures.push(...vectorSource.getFeatures());
    });

    // Fit to extent
    if (allFeatures.length > 0) {
      const extent = vectorLayersRef.current[0].getSource()?.getExtent();
      if (extent) {
        mapRef.current!.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    }
  }, [sectorsData, selectedSector, onFeatureClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Popup container */}
      <div ref={popupRef} className="absolute z-10" />

      {/* Enhanced Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 z-10 border border-gray-200">
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
    </div>
  );
}
