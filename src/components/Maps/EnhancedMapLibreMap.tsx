import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import type { SectorFeatureCollection, SectorDivision, SectorFeature, AreaCategory } from '../../types';
import { sectorColors, hexWithOpacity } from '../../utils/symbology';
import SymbologyControl, { type SymbologySettings } from './SymbologyControl';
import FileImport from './FileImport';
import LayerManager from './LayerManager';
import StreetView from './StreetView';
import { type ImportedLayer, type RasterData, calculateBounds } from '../../utils/fileImport';

interface EnhancedMapLibreMapProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  selectedAreaCategory?: AreaCategory;
  onAreaCategoryChange?: (category: AreaCategory) => void;
  onFeatureClick?: (feature: SectorFeature) => void;
}

export default function EnhancedMapLibreMap({
  sectorsData,
  selectedSector,
  selectedAreaCategory,
  onAreaCategoryChange,
  onFeatureClick
}: EnhancedMapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Measurement state
  const [measurementMode, setMeasurementMode] = useState<'none' | 'distance' | 'area'>('none');
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [measurementResult, setMeasurementResult] = useState<string>('');

  // 3D state
  const [is3DMode, setIs3DMode] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [globeMode, setGlobeMode] = useState(false);

  // Symbology state
  const [symbologySettings, setSymbologySettings] = useState<SymbologySettings>({
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

  // Imported layers state
  const [importedLayers, setImportedLayers] = useState<ImportedLayer[]>([]);

  // Sector visibility state
  const [sectorVisibility, setSectorVisibility] = useState<Record<SectorDivision, boolean>>({
    East: true,
    West: true,
    North: true,
    South: true,
  });

  // Sector label state
  const [sectorLabels, setSectorLabels] = useState({
    enabled: false,
    field: 'Canal_Name',
    size: 12,
    color: '#000000',
    haloColor: '#ffffff',
    haloWidth: 2
  });

  // UI state
  const [legendOpen, setLegendOpen] = useState(true);
  const [toolbarExpanded, setToolbarExpanded] = useState(true);

  // Street View state
  const [streetViewMode, setStreetViewMode] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [streetViewOpen, setStreetViewOpen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Get MapTiler API key from environment
    const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '6t6fR0k71vMZ6xpQBlCF';

    const basemapStyles = {
      osm: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      // MapTiler Styles (Vector)
      maptilerStreets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      maptilerSatellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`,
      maptilerHybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
      maptilerTopo: `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`,
      maptilerBasic: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
      maptilerBright: `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`,
      maptilerPastel: `https://api.maptiler.com/maps/pastel/style.json?key=${MAPTILER_KEY}`,
      maptilerVoyager: `https://api.maptiler.com/maps/voyager-v2/style.json?key=${MAPTILER_KEY}`,
      // Other providers
      googleStreets: {
        version: 8,
        sources: {
          'google': {
            type: 'raster',
            tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'],
            tileSize: 256,
            attribution: '© Google',
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
            attribution: '© Google',
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
            attribution: '© Esri',
          },
        },
        layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
      },
    };

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyles.maptilerStreets, // Use MapTiler Streets as default
      center: [33.0, 14.35],
      zoom: 9,
      attributionControl: { compact: false },
    });

    const map = mapRef.current;

    // Add enhanced controls
    map.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'top-right');

    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-right');

    // Add basemap switcher
    const basemapControl = document.createElement('div');
    basemapControl.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    basemapControl.style.cssText = 'position: absolute; top: 10px; left: 10px; background: white; border-radius: 4px; z-index: 1000; box-shadow: 0 0 0 2px rgba(0,0,0,.1);';
    basemapControl.innerHTML = `
      <select style="padding: 8px 10px; border: none; font-size: 13px; cursor: pointer; outline: none; background: white; border-radius: 4px;">
        <optgroup label="🗺️ MapTiler (Premium)">
          <option value="maptilerStreets" selected>MapTiler Streets</option>
          <option value="maptilerSatellite">MapTiler Satellite</option>
          <option value="maptilerHybrid">MapTiler Hybrid</option>
          <option value="maptilerTopo">MapTiler Topo</option>
          <option value="maptilerBasic">MapTiler Basic</option>
          <option value="maptilerBright">MapTiler Bright</option>
          <option value="maptilerPastel">MapTiler Pastel</option>
          <option value="maptilerVoyager">MapTiler Voyager</option>
        </optgroup>
        <optgroup label="🌐 Other Sources">
          <option value="osm">OpenStreetMap</option>
          <option value="googleStreets">Google Streets</option>
          <option value="googleSatellite">Google Satellite</option>
          <option value="esriImagery">Esri Imagery</option>
        </optgroup>
      </select>
    `;

    const select = basemapControl.querySelector('select');
    if (select) {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const style = basemapStyles[target.value as keyof typeof basemapStyles];
        map.setStyle(style as any);
      });
    }

    map.getContainer().appendChild(basemapControl);

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '350px',
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle measurement mode
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      // Handle Street View mode
      if (streetViewMode) {
        setStreetViewLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        setStreetViewOpen(true);
        return;
      }

      if (measurementMode === 'none') return;

      const newPoints = [...measurementPoints, [e.lngLat.lng, e.lngLat.lat] as [number, number]];
      setMeasurementPoints(newPoints);

      // Update measurement layer
      if (map.getSource('measurement')) {
        if (measurementMode === 'distance' && newPoints.length >= 2) {
          const line = turf.lineString(newPoints);
          const length = turf.length(line, { units: 'kilometers' });
          setMeasurementResult(`Distance: ${length.toFixed(2)} km`);

          (map.getSource('measurement') as maplibregl.GeoJSONSource).setData(line);
        } else if (measurementMode === 'area' && newPoints.length >= 3) {
          const closedPoints = [...newPoints, newPoints[0]];
          const polygon = turf.polygon([closedPoints]);
          const area = turf.area(polygon) / 4200; // Convert to Feddan (1 Feddan ≈ 4200 m²)
          setMeasurementResult(`Area: ${area.toFixed(2)} Feddan`);

          (map.getSource('measurement') as maplibregl.GeoJSONSource).setData(polygon);
        }
      } else {
        // Add measurement source and layers
        const geojson: GeoJSON.Feature = measurementMode === 'distance'
          ? turf.lineString(newPoints)
          : turf.point(newPoints[0]);

        map.addSource('measurement', {
          type: 'geojson',
          data: geojson as any
        });

        if (measurementMode === 'distance') {
          map.addLayer({
            id: 'measurement-line',
            type: 'line',
            source: 'measurement',
            paint: {
              'line-color': '#ff0000',
              'line-width': 3,
              'line-dasharray': [2, 2]
            }
          });
        } else {
          map.addLayer({
            id: 'measurement-fill',
            type: 'fill',
            source: 'measurement',
            paint: {
              'fill-color': '#ff0000',
              'fill-opacity': 0.3
            }
          });
          map.addLayer({
            id: 'measurement-outline',
            type: 'line',
            source: 'measurement',
            paint: {
              'line-color': '#ff0000',
              'line-width': 2
            }
          });
        }

        // Add points layer
        map.addLayer({
          id: 'measurement-points',
          type: 'circle',
          source: 'measurement',
          paint: {
            'circle-radius': 6,
            'circle-color': '#ff0000',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });
      }

      // Add marker for each point
      new maplibregl.Marker({ color: '#ff0000' })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .addTo(map);
    };

    if (measurementMode !== 'none' || streetViewMode) {
      map.getCanvas().style.cursor = streetViewMode ? 'pointer' : 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getCanvas().style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [measurementMode, measurementPoints, streetViewMode]);

  // Clear measurements
  const clearMeasurements = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove measurement layers
    ['measurement-line', 'measurement-fill', 'measurement-outline', 'measurement-points'].forEach(layerId => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
    if (map.getSource('measurement')) map.removeSource('measurement');

    // Remove markers
    const markers = document.querySelectorAll('.maplibregl-marker');
    markers.forEach(marker => marker.remove());

    setMeasurementPoints([]);
    setMeasurementResult('');
    setMeasurementMode('none');
  };

  // Toggle 3D mode
  const toggle3DMode = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const newMode = !is3DMode;
    setIs3DMode(newMode);

    if (newMode) {
      // Animate to 3D view
      map.easeTo({
        pitch: 60,
        bearing: -20,
        duration: 1000
      });
    } else {
      // Return to 2D view
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  };

  // Toggle terrain
  const toggleTerrain = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const newTerrainState = !terrainEnabled;
    setTerrainEnabled(newTerrainState);

    if (newTerrainState) {
      // Add terrain source
      if (!map.getSource('terrainSource')) {
        map.addSource('terrainSource', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256
        });
      }
      map.setTerrain({ source: 'terrainSource', exaggeration: 1.5 });
    } else {
      map.setTerrain(null);
    }
  };

  // Toggle Globe Mode
  const toggleGlobeMode = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const newGlobeMode = !globeMode;
    setGlobeMode(newGlobeMode);

    if (newGlobeMode) {
      console.log('🌍 Activating Globe Mode...');

      // FIRST: Set projection to globe BEFORE changing style
      try {
        map.setProjection({ type: 'globe' });
        console.log('✅ Globe projection set');
      } catch (e) {
        console.error('❌ Failed to set globe projection:', e);
      }

      // Use OpenMapTiles demo style with country boundaries
      const globeStyle = {
        version: 8,
        projection: { type: 'globe' },
        sources: {
          'openmaptiles': {
            type: 'vector',
            tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#d4e6f1'
            }
          },
          {
            id: 'water',
            type: 'fill',
            source: 'openmaptiles',
            'source-layer': 'water',
            paint: {
              'fill-color': '#b4d2e6'
            }
          },
          {
            id: 'landcover',
            type: 'fill',
            source: 'openmaptiles',
            'source-layer': 'landcover',
            paint: {
              'fill-color': '#e6f0e6'
            }
          },
          {
            id: 'boundary',
            type: 'line',
            source: 'openmaptiles',
            'source-layer': 'boundary',
            filter: ['==', 'admin_level', 2],
            paint: {
              'line-color': '#999999',
              'line-width': 1.5
            }
          },
          {
            id: 'place-country',
            type: 'symbol',
            source: 'openmaptiles',
            'source-layer': 'place',
            filter: ['==', 'class', 'country'],
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 13,
              'text-font': ['Open Sans Regular']
            },
            paint: {
              'text-color': '#333333',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            }
          }
        ]
      };

      // Now set the style
      map.setStyle(globeStyle as any);
      console.log('✅ Globe style applied');

      // Wait for style to load
      map.once('styledata', () => {
        console.log('✅ Style loaded');

        // Force globe projection again after style loads
        setTimeout(() => {
          map.setProjection({ type: 'globe' });
          console.log('✅ Globe projection re-applied after style load');

          // Check current projection
          const currentProj = map.getProjection();
          console.log('Current projection:', currentProj);

          // Zoom to globe view
          map.flyTo({
            center: [15, 20],
            zoom: 1.0,
            pitch: 0,
            bearing: 0,
            duration: 2000,
            essential: true
          });
        }, 200);

        // Start auto-rotation
        let userInteracting = false;

        const spinGlobe = () => {
          if (!userInteracting && globeMode) {
            const center = map.getCenter();
            center.lng += 0.3;
            map.easeTo({ center, duration: 1000, easing: (t) => t });
          }
        };

        const rotationInterval = setInterval(spinGlobe, 1000);
        (map as any)._globeRotation = rotationInterval;

        // Interaction handlers
        map.on('mousedown', () => { userInteracting = true; });
        map.on('mouseup', () => { userInteracting = false; });
        map.on('dragend', () => { userInteracting = false; });
      });

    } else {
      // Clear rotation interval
      if ((map as any)._globeRotation) {
        clearInterval((map as any)._globeRotation);
        (map as any)._globeRotation = null;
      }

      if ((map as any)._globeRotating) {
        (map as any)._globeRotating.stop();
        (map as any)._globeRotating = null;
      }

      // Switch back to regular basemap style
      const basemapStyles = {
        osm: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        }
      };

      map.setStyle(basemapStyles.osm as any);

      // Wait for style to load
      map.once('style.load', () => {
        map.setProjection('mercator');

        // Zoom back to Sudan/Gezira area
        map.easeTo({
          center: [33.0, 14.35],
          zoom: 9,
          pitch: 0,
          bearing: 0,
          duration: 2000
        });
      });
    }
  };

  // Export map to image
  const exportMapImage = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    map.once('render', () => {
      const canvas = map.getCanvas();
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `gezira-map-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataURL;
      link.click();
    });
    map.triggerRepaint();
  };

  // Imported layer management
  const handleLayerImport = (layer: ImportedLayer) => {
    setImportedLayers(prev => [...prev, layer]);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleRemoveLayer = (layerId: string) => {
    setImportedLayers(prev => prev.filter(layer => layer.id !== layerId));
  };

  const handleChangeLayerColor = (layerId: string, color: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, color } : layer
      )
    );
  };

  const handleChangeLayerOpacity = (layerId: string, opacity: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
  };

  const handleZoomToLayer = (layerId: string) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const layer = importedLayers.find(l => l.id === layerId);
    if (!layer) return;

    if (layer.type === 'raster') {
      // For raster layers, use the bounds directly
      const rasterData = layer.data as any;
      map.fitBounds(rasterData.bounds as any, { padding: 50, duration: 1000 });
    } else {
      // For vector layers, calculate bounds
      const bounds = calculateBounds(layer.data as any);
      if (bounds) {
        map.fitBounds(bounds as any, { padding: 50, duration: 1000 });
      }
    }
  };

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    setImportedLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId);
      if (index === -1) return prev;

      const newLayers = [...prev];
      if (direction === 'up' && index > 0) {
        [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      } else if (direction === 'down' && index < newLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      }

      // Update z-indices
      return newLayers.map((layer, i) => ({ ...layer, zIndex: newLayers.length - i }));
    });
  };

  const handleToggleLabels = (layerId: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, showLabels: !layer.showLabels } : layer
      )
    );
  };

  const handleChangeLabelField = (layerId: string, field: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, labelField: field } : layer
      )
    );
  };

  const handleChangeLabelSize = (layerId: string, size: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, labelSize: size } : layer
      )
    );
  };

  const handleChangeLabelColor = (layerId: string, color: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, labelColor: color } : layer
      )
    );
  };

  const handleChangeLabelHaloColor = (layerId: string, color: string) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, labelHaloColor: color } : layer
      )
    );
  };

  const handleChangeLabelHaloWidth = (layerId: string, width: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, labelHaloWidth: width } : layer
      )
    );
  };

  const handleChangeBrightness = (layerId: string, brightness: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, brightness } : layer
      )
    );
  };

  const handleChangeContrast = (layerId: string, contrast: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, contrast } : layer
      )
    );
  };

  const handleChangeSaturation = (layerId: string, saturation: number) => {
    setImportedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, saturation } : layer
      )
    );
  };

  // Helper function to regenerate raster image with selected bands
  const regenerateRasterImage = (layer: ImportedLayer): string => {
    if (layer.type !== 'raster') return '';

    const rasterData = layer.data as RasterData;
    if (!rasterData.bands || rasterData.bands.length === 0) {
      return rasterData.imageUrl; // Return original if no bands available
    }

    const { width, height, bands } = rasterData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return rasterData.imageUrl;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const totalPixels = width * height;

    if (layer.displayMode === 'rgb' && rasterData.numBands >= 3) {
      // RGB mode - use selected bands
      const rBandIdx = layer.redBand ?? 0;
      const gBandIdx = layer.greenBand ?? 1;
      const bBandIdx = layer.blueBand ?? 2;

      const rBand = bands[rBandIdx];
      const gBand = bands[gBandIdx];
      const bBand = bands[bBandIdx];

      for (let i = 0; i < totalPixels; i++) {
        data[i * 4] = rBand[i];
        data[i * 4 + 1] = gBand[i];
        data[i * 4 + 2] = bBand[i];
        data[i * 4 + 3] = 255;
      }
    } else {
      // Grayscale mode - use selected grayscale band
      const bandIdx = layer.grayscaleBand ?? 0;
      const band = bands[bandIdx];

      for (let i = 0; i < totalPixels; i++) {
        const value = band[i];
        data[i * 4] = value;
        data[i * 4 + 1] = value;
        data[i * 4 + 2] = value;
        data[i * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const handleChangeRedBand = (layerId: string, band: number) => {
    setImportedLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const updatedLayer = { ...layer, redBand: band };
        // Regenerate image with new band selection
        const newImageUrl = regenerateRasterImage(updatedLayer);
        return {
          ...updatedLayer,
          data: {
            ...(updatedLayer.data as RasterData),
            imageUrl: newImageUrl
          }
        };
      })
    );
  };

  const handleChangeGreenBand = (layerId: string, band: number) => {
    setImportedLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const updatedLayer = { ...layer, greenBand: band };
        const newImageUrl = regenerateRasterImage(updatedLayer);
        return {
          ...updatedLayer,
          data: {
            ...(updatedLayer.data as RasterData),
            imageUrl: newImageUrl
          }
        };
      })
    );
  };

  const handleChangeBlueBand = (layerId: string, band: number) => {
    setImportedLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const updatedLayer = { ...layer, blueBand: band };
        const newImageUrl = regenerateRasterImage(updatedLayer);
        return {
          ...updatedLayer,
          data: {
            ...(updatedLayer.data as RasterData),
            imageUrl: newImageUrl
          }
        };
      })
    );
  };

  const handleChangeGrayscaleBand = (layerId: string, band: number) => {
    setImportedLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const updatedLayer = { ...layer, grayscaleBand: band };
        const newImageUrl = regenerateRasterImage(updatedLayer);
        return {
          ...updatedLayer,
          data: {
            ...(updatedLayer.data as RasterData),
            imageUrl: newImageUrl
          }
        };
      })
    );
  };

  const handleChangeDisplayMode = (layerId: string, mode: 'rgb' | 'grayscale') => {
    setImportedLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const updatedLayer = { ...layer, displayMode: mode };
        const newImageUrl = regenerateRasterImage(updatedLayer);
        return {
          ...updatedLayer,
          data: {
            ...(updatedLayer.data as RasterData),
            imageUrl: newImageUrl
          }
        };
      })
    );
  };

  // Load sector data
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const loadData = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', loadData);
        return;
      }

      // Remove existing sector layers
      const divisions: SectorDivision[] = ['East', 'West', 'North', 'South'];
      divisions.forEach((division) => {
        const layerId = `sector-${division.toLowerCase()}`;
        const lineLayerId = `sector-${division.toLowerCase()}-line`;
        const labelLayerId = `sector-${division.toLowerCase()}-label`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      });

      let bounds: maplibregl.LngLatBounds | null = null;

      // Add sector layers with enhanced styling
      Object.entries(sectorsData).forEach(([division, data]) => {
        if (!data) return;
        if (selectedSector && division !== selectedSector) return;

        // Check visibility state
        if (!sectorVisibility[division as SectorDivision]) return;

        const layerId = `sector-${division.toLowerCase()}`;
        const lineLayerId = `sector-${division.toLowerCase()}-line`;
        const sectorColor = sectorColors[division as SectorDivision];

        map.addSource(layerId, {
          type: 'geojson',
          data: data as any,
        });

        // Get division color from symbology settings
        const divisionColor = symbologySettings.colors[division as SectorDivision] || sectorColor.primary;

        // Fill layer or Fill-extrusion layer based on 3D mode
        if (is3DMode) {
          map.addLayer({
            id: layerId,
            type: 'fill-extrusion',
            source: layerId,
            paint: {
              'fill-extrusion-color': divisionColor,
              'fill-extrusion-height': [
                '*',
                ['get', 'Design_A_F'],
                5 // Scale factor: 1 Feddan = 5 units height
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': symbologySettings.fillStyle === 'hollow' ? 0 : symbologySettings.fillOpacity,
            },
          });
        } else {
          map.addLayer({
            id: layerId,
            type: 'fill',
            source: layerId,
            paint: {
              'fill-color': divisionColor,
              'fill-opacity': symbologySettings.fillStyle === 'hollow' ? 0 : [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                Math.min(symbologySettings.fillOpacity + 0.2, 1),
                symbologySettings.fillOpacity
              ],
            },
          });
        }

        // Line layer
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': symbologySettings.outlineColor,
            'line-width': symbologySettings.outlineWidth,
          },
        });

        // Label layer for sectors
        if (sectorLabels.enabled && sectorLabels.field) {
          map.addLayer({
            id: `sector-${division.toLowerCase()}-label`,
            type: 'symbol',
            source: layerId,
            layout: {
              'text-field': ['get', sectorLabels.field],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': sectorLabels.size,
              'text-offset': [0, 0],
              'text-anchor': 'center',
              'text-max-width': 12
            },
            paint: {
              'text-color': sectorLabels.color,
              'text-halo-color': sectorLabels.haloColor,
              'text-halo-width': sectorLabels.haloWidth,
              'text-halo-blur': 1
            }
          });
        }

        // Click handler
        map.on('click', layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties;
          const area = props?.Design_A_F || 0;

          const popupContent = `
            <div class="min-w-[250px]">
              <div class="p-3 text-white" style="background: ${sectorColor.gradient};">
                <h3 class="font-bold text-lg mb-1">${props?.Canal_Name || 'N/A'}</h3>
                <p class="text-sm opacity-90 arabic-text" style="font-family: 'Cairo', sans-serif; direction: rtl;">${props?.Name_AR || ''}</p>
              </div>
              <div class="p-3 bg-white">
                <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500">Division</p>
                    <p class="font-semibold">${props?.Division || 'N/A'}</p>
                  </div>
                  <div class="bg-gray-50 p-2 rounded">
                    <p class="text-xs text-gray-500">Office</p>
                    <p class="font-semibold">${props?.Office || 'N/A'}</p>
                  </div>
                </div>
                <div class="space-y-2 text-sm border-t pt-2">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Nemra No:</span>
                    <span class="font-semibold">${props?.No_Nemra || 'N/A'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Design Area:</span>
                    <span class="font-semibold">${area.toFixed(2)} Feddan</span>
                  </div>
                  ${area > 2000 ? '<div class="mt-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">🏆 Very Large Plot</div>' : ''}
                </div>
              </div>
            </div>
          `;

          popupRef.current?.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
          if (onFeatureClick) onFeatureClick(feature as unknown as SectorFeature);
        });

        // Hover effects
        let hoveredFeatureId: string | number | null = null;

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mousemove', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            if (hoveredFeatureId !== null) {
              map.setFeatureState({ source: layerId, id: hoveredFeatureId }, { hover: false });
            }
            hoveredFeatureId = e.features[0].id as string | number;
            map.setFeatureState({ source: layerId, id: hoveredFeatureId }, { hover: true });
          }
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoveredFeatureId !== null) {
            map.setFeatureState({ source: layerId, id: hoveredFeatureId }, { hover: false });
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

      if (bounds) {
        map.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.isStyleLoaded()) {
      loadData();
    } else {
      map.once('load', loadData);
    }
  }, [sectorsData, selectedSector, onFeatureClick, is3DMode, symbologySettings, sectorVisibility, sectorLabels]);

  // Render imported layers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const renderImportedLayers = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', renderImportedLayers);
        return;
      }

      // Remove all imported layer sources and layers
      importedLayers.forEach(layer => {
        const fillLayerId = `imported-fill-${layer.id}`;
        const lineLayerId = `imported-line-${layer.id}`;
        const pointLayerId = `imported-point-${layer.id}`;
        const labelLayerId = `imported-label-${layer.id}`;
        const rasterLayerId = `imported-raster-${layer.id}`;

        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      });

      // Add visible imported layers
      importedLayers.forEach(layer => {
        if (!layer.visible) return;

        // Handle raster layers
        if (layer.type === 'raster') {
          const rasterData = layer.data as any;
          const bounds = rasterData.bounds;

          console.log('Adding raster layer:', layer.name, {
            bounds,
            imageUrl: rasterData.imageUrl.substring(0, 50) + '...',
            opacity: layer.opacity
          });

          // MapLibre image source requires coordinates: [top-left, top-right, bottom-right, bottom-left]
          const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
            [bounds[0][0], bounds[1][1]], // top-left: [west, north]
            [bounds[1][0], bounds[1][1]], // top-right: [east, north]
            [bounds[1][0], bounds[0][1]], // bottom-right: [east, south]
            [bounds[0][0], bounds[0][1]]  // bottom-left: [west, south]
          ];

          try {
            // Validate coordinates are within valid lat/lon range
            const isValidLatLon = coordinates.every(coord =>
              coord[0] >= -180 && coord[0] <= 180 &&
              coord[1] >= -90 && coord[1] <= 90
            );

            if (!isValidLatLon) {
              console.warn('⚠️ Raster bounds are outside valid lat/lon range, using Sudan region as default');
              // Use Sudan region as default bounds
              coordinates[0] = [21.8, 23.0];  // top-left
              coordinates[1] = [38.6, 23.0];  // top-right
              coordinates[2] = [38.6, 8.0];   // bottom-right
              coordinates[3] = [21.8, 8.0];   // bottom-left
            }

            map.addSource(layer.id, {
              type: 'image',
              url: rasterData.imageUrl,
              coordinates: coordinates
            });

            // Convert brightness/contrast/saturation to valid MapLibre ranges
            const brightness = layer.brightness || 0;
            const contrast = layer.contrast || 0;
            const saturation = layer.saturation || 0;

            map.addLayer({
              id: `imported-raster-${layer.id}`,
              type: 'raster',
              source: layer.id,
              paint: {
                'raster-opacity': layer.opacity,
                'raster-fade-duration': 0,
                'raster-brightness-min': Math.max(0, brightness),
                'raster-brightness-max': Math.min(1, 1 + brightness),
                'raster-contrast': contrast * 0.5 + 0.5, // Convert -1,1 to 0,1
                'raster-saturation': saturation
              }
            });

            console.log('✅ Raster layer added successfully:', layer.name);
          } catch (error) {
            console.error('❌ Error adding raster layer:', error);
          }

          // Add click handler for raster layer
          map.on('click', `imported-raster-${layer.id}`, (e) => {
            const popupContent = `
              <div class="min-w-[200px]">
                <div class="p-2 text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h3 class="font-bold text-sm">${layer.name}</h3>
                  <p class="text-xs opacity-90">Raster Image</p>
                </div>
                <div class="p-2 bg-white">
                  <div class="text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Type:</span>
                      <span class="font-semibold">Raster</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Dimensions:</span>
                      <span class="font-semibold">${rasterData.width}x${rasterData.height}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Opacity:</span>
                      <span class="font-semibold">${Math.round(layer.opacity * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            `;

            popupRef.current?.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
          });

          // Hover effect
          map.on('mouseenter', `imported-raster-${layer.id}`, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', `imported-raster-${layer.id}`, () => {
            map.getCanvas().style.cursor = '';
          });

          return; // Skip vector layer rendering for raster layers
        }

        // Type guard: at this point, layer.data must be a FeatureCollection
        if (!('features' in layer.data)) {
          console.error('Invalid vector layer data');
          return;
        }

        const vectorData = layer.data;

        // Add vector source
        map.addSource(layer.id, {
          type: 'geojson',
          data: vectorData
        });

        // Determine geometry types in the layer
        const hasPolygons = vectorData.features.some(f =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
        );
        const hasLines = vectorData.features.some(f =>
          f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
        );
        const hasPoints = vectorData.features.some(f =>
          f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint'
        );

        // Add polygon layers
        if (hasPolygons) {
          map.addLayer({
            id: `imported-fill-${layer.id}`,
            type: 'fill',
            source: layer.id,
            filter: ['any',
              ['==', ['geometry-type'], 'Polygon'],
              ['==', ['geometry-type'], 'MultiPolygon']
            ],
            paint: {
              'fill-color': layer.color,
              'fill-opacity': layer.opacity
            }
          });

          map.addLayer({
            id: `imported-line-${layer.id}`,
            type: 'line',
            source: layer.id,
            filter: ['any',
              ['==', ['geometry-type'], 'Polygon'],
              ['==', ['geometry-type'], 'MultiPolygon'],
              ['==', ['geometry-type'], 'LineString'],
              ['==', ['geometry-type'], 'MultiLineString']
            ],
            paint: {
              'line-color': layer.color,
              'line-width': 2
            }
          });
        } else if (hasLines) {
          // Add line layers
          map.addLayer({
            id: `imported-line-${layer.id}`,
            type: 'line',
            source: layer.id,
            filter: ['any',
              ['==', ['geometry-type'], 'LineString'],
              ['==', ['geometry-type'], 'MultiLineString']
            ],
            paint: {
              'line-color': layer.color,
              'line-width': 3,
              'line-opacity': layer.opacity
            }
          });
        }

        // Add point layers
        if (hasPoints) {
          map.addLayer({
            id: `imported-point-${layer.id}`,
            type: 'circle',
            source: layer.id,
            filter: ['any',
              ['==', ['geometry-type'], 'Point'],
              ['==', ['geometry-type'], 'MultiPoint']
            ],
            paint: {
              'circle-radius': 6,
              'circle-color': layer.color,
              'circle-opacity': layer.opacity,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2
            }
          });
        }

        // Add label layer if enabled
        if (layer.showLabels && layer.labelField) {
          map.addLayer({
            id: `imported-label-${layer.id}`,
            type: 'symbol',
            source: layer.id,
            layout: {
              'text-field': ['get', layer.labelField],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': layer.labelSize,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-max-width': 12
            },
            paint: {
              'text-color': layer.labelColor,
              'text-halo-color': layer.labelHaloColor,
              'text-halo-width': layer.labelHaloWidth,
              'text-halo-blur': 1
            }
          });
        }

        // Add click handler for popups
        const layerIds = [
          `imported-fill-${layer.id}`,
          `imported-line-${layer.id}`,
          `imported-point-${layer.id}`
        ].filter(id => map.getLayer(id));

        layerIds.forEach(layerId => {
          map.on('click', layerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties || {};

            // Format properties for display
            const propsHTML = Object.entries(props)
              .filter(([key]) => key !== 'geometry')
              .map(([key, value]) => `
                <div class="flex justify-between border-b border-gray-200 py-1">
                  <span class="text-xs text-gray-600 font-medium">${key}:</span>
                  <span class="text-xs text-gray-800 ml-2">${value}</span>
                </div>
              `)
              .join('');

            const popupContent = `
              <div class="min-w-[200px] max-w-[300px]">
                <div class="p-2 text-white" style="background: ${layer.color};">
                  <h3 class="font-bold text-sm">${layer.name}</h3>
                  <p class="text-xs opacity-90">${feature.geometry.type}</p>
                </div>
                <div class="p-2 bg-white max-h-64 overflow-y-auto">
                  ${propsHTML || '<p class="text-xs text-gray-500">No properties</p>'}
                </div>
              </div>
            `;

            popupRef.current?.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
          });

          // Add hover effect
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        });
      });
    };

    if (map.isStyleLoaded()) {
      renderImportedLayers();
    } else {
      map.once('load', renderImportedLayers);
    }
  }, [importedLayers]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Modern Collapsible Toolbar */}
      <div className="absolute top-4 left-52 z-10">
        {/* Main Toggle Button */}
        <button
          onClick={() => setToolbarExpanded(!toolbarExpanded)}
          className={`mb-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-white flex items-center gap-2 transition-all duration-300 transform hover:scale-105 ${
            toolbarExpanded ? 'shadow-blue-500/50' : 'shadow-xl'
          }`}
          title={toolbarExpanded ? "Hide Tools" : "Show Tools"}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${toolbarExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="font-bold text-sm">
            {toolbarExpanded ? 'Hide Tools' : 'Map Tools'}
          </span>
          {!toolbarExpanded && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {[globeMode, is3DMode, measurementMode !== 'none'].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Expandable Toolbar Content */}
        <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden transition-all duration-500 ease-in-out ${
          toolbarExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-4 space-y-3">
            {/* View Tools Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">View Tools</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleGlobeMode}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                    globeMode
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                  }`}
                  title="Toggle Globe View (3D Earth)"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">🌍</span>
                    <span className="text-xs font-semibold">{globeMode ? 'GLOBE ON' : 'Globe'}</span>
                  </div>
                </button>

                <button
                  onClick={toggle3DMode}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                    is3DMode
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                  }`}
                  title="Toggle 3D View"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">🎬</span>
                    <span className="text-xs font-semibold">{is3DMode ? '3D ON' : '3D OFF'}</span>
                  </div>
                </button>
              </div>

              {is3DMode && (
                <button
                  onClick={toggleTerrain}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-md transform hover:scale-105 ${
                    terrainEnabled
                      ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                  }`}
                  title="Toggle Terrain"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🏔️</span>
                    <span className="font-semibold">{terrainEnabled ? 'Terrain ON' : 'Terrain OFF'}</span>
                  </div>
                </button>
              )}
            </div>

            {/* Measurement Tools Section */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-orange-500 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Measurement Tools</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    clearMeasurements();
                    setMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance');
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                    measurementMode === 'distance'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-blue-50 hover:to-blue-100'
                  }`}
                  title="Measure Distance"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">📏</span>
                    <span className="text-xs font-semibold">Distance</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    clearMeasurements();
                    setMeasurementMode(measurementMode === 'area' ? 'none' : 'area');
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                    measurementMode === 'area'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-blue-50 hover:to-blue-100'
                  }`}
                  title="Measure Area"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">📐</span>
                    <span className="text-xs font-semibold">Area</span>
                  </div>
                </button>
              </div>

              {measurementPoints.length > 0 && (
                <button
                  onClick={clearMeasurements}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  title="Clear Measurements"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🗑️</span>
                    <span className="font-semibold">Clear Measurements</span>
                  </div>
                </button>
              )}
            </div>

            {/* Street View Section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-indigo-500 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Street View</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
              </div>

              <button
                onClick={() => {
                  setStreetViewMode(!streetViewMode);
                  if (streetViewMode) {
                    // Disable street view mode
                    setStreetViewOpen(false);
                  }
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  streetViewMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 animate-pulse'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-indigo-50 hover:to-purple-50'
                }`}
                title="Click map to open Street View"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold">{streetViewMode ? 'Street View ON' : 'Street View'}</span>
                </div>
              </button>
            </div>

            {/* Export Section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Export</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>

              <button
                onClick={exportMapImage}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Export Map to Image"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📸</span>
                  <span className="font-semibold">Export Map</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Globe Mode Information */}
      {globeMode && (
        <div className="absolute bottom-24 left-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-xl px-4 py-3 z-10 border border-cyan-400 max-w-xs animate-pulse">
          <p className="text-xs font-bold mb-1 flex items-center">
            <span className="text-2xl mr-2">🌍</span>
            GLOBE MODE - PLANET EARTH
          </p>
          <p className="text-xs opacity-90 mb-1">
            You're viewing Earth as a 3D sphere! The globe auto-rotates slowly.
          </p>
          <p className="text-xs opacity-90 mb-1">
            🖱️ Drag to spin • Scroll to zoom
          </p>
          <p className="text-xs opacity-75 mt-2">
            Zoom in to see your Gezira Scheme in Sudan 🇸🇩
          </p>
        </div>
      )}

      {/* 3D Mode Information */}
      {is3DMode && !globeMode && (
        <div className="absolute bottom-24 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-xl px-4 py-3 z-10 border border-purple-400 max-w-xs">
          <p className="text-xs font-bold mb-1 flex items-center">
            <span className="text-lg mr-2">🎬</span>
            3D MODE ACTIVE
          </p>
          <p className="text-xs opacity-90">
            Sectors are extruded based on their area (Design_A_F). Taller = Larger area.
          </p>
          <p className="text-xs opacity-75 mt-1">
            Use mouse to rotate • Ctrl+Drag to tilt
          </p>
        </div>
      )}

      {/* Measurement Result */}
      {measurementResult && (
        <div className="absolute top-20 left-52 bg-white rounded-lg shadow-xl px-4 py-2 z-10 border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">{measurementResult}</p>
          <p className="text-xs text-gray-500 mt-1">
            {measurementMode === 'area' && measurementPoints.length < 3 && 'Click to add points'}
            {measurementMode === 'distance' && measurementPoints.length < 2 && 'Click to add points'}
          </p>
        </div>
      )}

      {/* Modern Legend Panel */}
      <div className="absolute top-4 right-4 z-[999]">
        {/* Legend Toggle Button */}
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="mb-2 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl"
          title={legendOpen ? "Hide Legend" : "Show Legend"}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">Legend</span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${legendOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Legend Content */}
        {legendOpen && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 p-5 w-80 max-h-[calc(100vh-120px)] overflow-y-auto animate-fadeIn">
            <h3 className="font-bold text-sm mb-4 text-gray-800 flex items-center pb-3 border-b border-gray-200">
              <span className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-2"></span>
              Sectors & Area Categories
            </h3>

        {/* Sector Colors */}
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">DIVISIONS</p>
          {Object.entries(sectorColors).map(([sector, colors]) => (
            <div key={sector} className="flex items-center justify-between text-xs group">
              <div className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 rounded border-2 shadow-sm"
                  style={{
                    background: colors.gradient,
                    borderColor: colors.dark,
                    opacity: sectorVisibility[sector as SectorDivision] ? 1 : 0.3
                  }}
                />
                <span className={`font-medium ${sectorVisibility[sector as SectorDivision] ? 'text-gray-700' : 'text-gray-400'}`}>
                  {sector}
                </span>
              </div>
              <button
                onClick={() => setSectorVisibility(prev => ({
                  ...prev,
                  [sector]: !prev[sector as SectorDivision]
                }))}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  sectorVisibility[sector as SectorDivision] ? 'text-blue-600' : 'text-gray-400'
                }`}
                title={sectorVisibility[sector as SectorDivision] ? 'Hide sector' : 'Show sector'}
              >
                {sectorVisibility[sector as SectorDivision] ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Sector Labels */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">SECTOR LABELS</p>
            <button
              onClick={() => setSectorLabels(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sectorLabels.enabled
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sectorLabels.enabled ? '✓ ON' : 'OFF'}
            </button>
          </div>

          {sectorLabels.enabled && (
            <div className="space-y-2 mt-3">
              {/* Label Field */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Field:</label>
                <select
                  value={sectorLabels.field}
                  onChange={(e) => setSectorLabels(prev => ({ ...prev, field: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="Canal_Name">Canal Name</option>
                  <option value="Name_AR">Arabic Name</option>
                  <option value="No_Nemra">Nemra No</option>
                  <option value="Division">Division</option>
                  <option value="Office">Office</option>
                </select>
              </div>

              {/* Label Size */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Size: {sectorLabels.size}px</label>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={sectorLabels.size}
                  onChange={(e) => setSectorLabels(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Label Color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sectorLabels.color}
                    onChange={(e) => setSectorLabels(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sectorLabels.color}
                    onChange={(e) => setSectorLabels(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Halo Color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Halo:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sectorLabels.haloColor}
                    onChange={(e) => setSectorLabels(prev => ({ ...prev, haloColor: e.target.value }))}
                    className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sectorLabels.haloColor}
                    onChange={(e) => setSectorLabels(prev => ({ ...prev, haloColor: e.target.value }))}
                    className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Halo Width */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Halo Width: {sectorLabels.haloWidth}px</label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.5"
                  value={sectorLabels.haloWidth}
                  onChange={(e) => setSectorLabels(prev => ({ ...prev, haloWidth: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Area Categories */}
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
            {[
              { value: 'small', label: 'Small', range: '< 500F' },
              { value: 'medium', label: 'Medium', range: '500-1000F' },
              { value: 'large', label: 'Large', range: '1-2K F' },
              { value: 'very-large', label: 'V. Large', range: '> 2000F' },
            ].map(({ value, label, range }) => (
              <button
                key={value}
                onClick={() => onAreaCategoryChange?.(selectedAreaCategory === value ? null : value as AreaCategory)}
                className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                  selectedAreaCategory === value
                    ? 'bg-blue-100 border border-blue-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded border border-gray-300" style={{ opacity: value === 'very-large' ? 0.9 : (value === 'large' ? 0.7 : (value === 'medium' ? 0.5 : 0.3)) }}></div>
                  <span className={`text-gray-700 ${value === 'very-large' ? 'font-semibold' : ''}`}>{label}</span>
                </div>
                <span className="text-gray-500">{range}</span>
              </button>
            ))}
          </div>
        </div>
          </div>
        )}

        {/* Action Buttons - Always Visible */}
        <div className="flex gap-2 mt-2">
          <FileImport onLayerImport={handleLayerImport} />
          <SymbologyControl onSymbologyChange={setSymbologySettings} />
        </div>
      </div>

      {/* Layer Manager */}
      <LayerManager
        layers={importedLayers}
        onToggleVisibility={handleToggleLayerVisibility}
        onRemoveLayer={handleRemoveLayer}
        onChangeColor={handleChangeLayerColor}
        onChangeOpacity={handleChangeLayerOpacity}
        onZoomToLayer={handleZoomToLayer}
        onMoveLayer={handleMoveLayer}
        onToggleLabels={handleToggleLabels}
        onChangeLabelField={handleChangeLabelField}
        onChangeLabelSize={handleChangeLabelSize}
        onChangeLabelColor={handleChangeLabelColor}
        onChangeLabelHaloColor={handleChangeLabelHaloColor}
        onChangeLabelHaloWidth={handleChangeLabelHaloWidth}
        onChangeBrightness={handleChangeBrightness}
        onChangeContrast={handleChangeContrast}
        onChangeSaturation={handleChangeSaturation}
        onChangeRedBand={handleChangeRedBand}
        onChangeGreenBand={handleChangeGreenBand}
        onChangeBlueBand={handleChangeBlueBand}
        onChangeGrayscaleBand={handleChangeGrayscaleBand}
        onChangeDisplayMode={handleChangeDisplayMode}
      />

      {/* Street View Mode Indicator */}
      {streetViewMode && (
        <div className="absolute top-24 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-2xl px-5 py-4 z-[1000] border-2 border-white animate-pulse max-w-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">🗺️ Street View Mode Active</p>
              <p className="text-xs opacity-90">Click anywhere on the map to view ground-level photos</p>
            </div>
            <button
              onClick={() => setStreetViewMode(false)}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
              title="Exit Street View Mode"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Street View Component */}
      {streetViewLocation && (
        <StreetView
          lat={streetViewLocation.lat}
          lng={streetViewLocation.lng}
          isOpen={streetViewOpen}
          onClose={() => {
            setStreetViewOpen(false);
            setStreetViewLocation(null);
          }}
        />
      )}
    </div>
  );
}
