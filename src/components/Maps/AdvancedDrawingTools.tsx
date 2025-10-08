import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { useAuth } from '../../context/AuthContext';
import { sectorsAPI } from '../../services/api';
import NewFeatureDialog, { type NewFeatureData } from './NewFeatureDialog';

interface AdvancedDrawingToolsProps {
  map: L.Map | null;
  onFeatureCreated?: () => void;
  showInstructions?: boolean;
  sectorsData?: Record<string, any>;
}

type DrawingTool = 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | 'edit' | 'delete' | null;

export default function AdvancedDrawingTools({ map, onFeatureCreated, showInstructions = true, sectorsData }: AdvancedDrawingToolsProps) {
  const { hasRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [measurements, setMeasurements] = useState({ area: 0, perimeter: 0 });
  const [drawnLayer, setDrawnLayer] = useState<L.Layer | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>(null);
  const [liveMeasurement, setLiveMeasurement] = useState<string>('');
  const canEdit = hasRole(['admin', 'editor']);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Initialize drawing layers
  useEffect(() => {
    if (!map || !canEdit) return;

    console.log('🎨 Initializing Advanced Drawing Tools...');

    // Create feature group for drawn items
    drawnItemsRef.current = new L.FeatureGroup();
    map.addLayer(drawnItemsRef.current);

    // Initialize draw control with all tools
    try {
      drawControlRef.current = new L.Control.Draw({
        position: 'topleft',
        draw: {
          marker: {
            icon: L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            }),
          },
          polyline: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 4,
            },
            showLength: true,
            metric: true,
          },
          polygon: {
            allowIntersection: true, // Allow polygons with crossing lines
            drawError: {
              color: '#e74c3c',
              message: '<strong>Error:</strong> Shape edges cannot cross!',
              timeout: 2500,
            },
            shapeOptions: {
              color: '#2563eb',
              weight: 3,
              fillOpacity: 0.2,
            },
            showArea: true,
            metric: true,
            repeatMode: false,
          },
          rectangle: {
            shapeOptions: {
              color: '#16a34a',
              weight: 3,
              fillOpacity: 0.2,
            },
            showArea: true,
            metric: true,
          },
          circle: {
            shapeOptions: {
              color: '#ea580c',
              weight: 3,
              fillOpacity: 0.2,
            },
            showRadius: true,
            metric: true,
          },
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
          edit: {
            selectedPathOptions: {
              maintainColor: true,
              opacity: 0.8,
              dashArray: '10, 10',
            },
          },
        },
      });

      map.addControl(drawControlRef.current);
      console.log('✅ Advanced Drawing controls added!');
    } catch (error) {
      console.error('❌ Error creating draw control:', error);
      return;
    }

    // Handle draw events
    const onDrawStart = (e: any) => {
      console.log('🎨 Draw started:', e.layerType);
      if (e.layerType === 'polygon') {
        setLiveMeasurement('🔷 Drawing polygon... Click points, double-click to finish');
      } else if (e.layerType === 'polyline') {
        setLiveMeasurement('📏 Drawing line... Click points, double-click to finish');
      } else if (e.layerType === 'rectangle') {
        setLiveMeasurement('▭ Click and drag to draw rectangle');
      } else if (e.layerType === 'circle') {
        setLiveMeasurement('⭕ Click center, then drag for radius');
      } else if (e.layerType === 'marker') {
        setLiveMeasurement('📍 Click to place marker');
      }
    };

    const onDrawStop = () => {
      console.log('🎨 Draw stopped');
      setLiveMeasurement('');
    };

    const onDrawVertex = (e: any) => {
      const vertexCount = e.layers ? e.layers.getLayers().length : 0;
      console.log('🎨 Vertex added, total:', vertexCount);

      // Show helpful message for polygon drawing
      if (e.layerType === 'polygon') {
        setLiveMeasurement(`🔷 Polygon: ${vertexCount + 1} points | Double-click or click first point to close`);
      } else if (e.layerType === 'polyline') {
        setLiveMeasurement(`📏 Line: ${vertexCount + 1} points | Double-click to finish`);
      }
    };

    const onDrawCreated = (e: any) => {
      console.log('🎨 Feature created:', e.layerType);
      const layer = e.layer;

      if (!drawnItemsRef.current) return;
      drawnItemsRef.current.addLayer(layer);

      // Calculate measurements based on type
      const geoJSON = layer.toGeoJSON();
      let area = 0;
      let perimeter = 0;

      if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        area = turf.area(geoJSON); // in square meters
        perimeter = turf.length(turf.polygonToLine(geoJSON), { units: 'meters' });
      } else if (e.layerType === 'circle') {
        const radius = layer.getRadius();
        area = Math.PI * radius * radius;
        perimeter = 2 * Math.PI * radius;
      } else if (e.layerType === 'polyline') {
        perimeter = turf.length(geoJSON, { units: 'meters' });
      }

      const areaInFeddan = area / 4200; // 1 Feddan = 4200 m²

      setMeasurements({
        area: areaInFeddan,
        perimeter: perimeter,
      });
      setDrawnLayer(layer);

      // Only show dialog for polygons/rectangles/circles (area features)
      if (e.layerType === 'polygon' || e.layerType === 'rectangle' || e.layerType === 'circle') {
        setDialogOpen(true);
      } else {
        // For markers and lines, just add to map without dialog
        console.log('✅ Measurement feature added to map');
      }

      setLiveMeasurement('');
    };

    const onDrawEdited = (e: any) => {
      const editedCount = e.layers.getLayers().length;
      console.log('✏️ Features edited:', editedCount);

      // Show success notification
      setLiveMeasurement(`✅ ${editedCount} feature${editedCount > 1 ? 's' : ''} edited successfully!`);
      setTimeout(() => setLiveMeasurement(''), 3000);

      // Optionally update backend here
      // You can add API call to update features if needed
    };

    const onDrawDeleted = (e: any) => {
      const deletedCount = e.layers.getLayers().length;
      console.log('🗑️ Features deleted:', deletedCount);

      // Show success notification
      setLiveMeasurement(`🗑️ ${deletedCount} feature${deletedCount > 1 ? 's' : ''} deleted successfully!`);
      setTimeout(() => setLiveMeasurement(''), 3000);

      // Optionally delete from backend here
      // You can add API call to delete features if needed
    };

    const onDrawEditStart = () => {
      console.log('✏️ Edit mode started');
      setLiveMeasurement('✏️ Edit Mode: Click a feature to edit, then drag vertices to reshape');
    };

    const onDrawEditStop = () => {
      console.log('✏️ Edit mode stopped');
      setLiveMeasurement('');
    };

    const onDrawDeleteStart = () => {
      console.log('🗑️ Delete mode started');
      setLiveMeasurement('🗑️ Delete Mode: Click features to select, then click Save to delete');
    };

    const onDrawDeleteStop = () => {
      console.log('🗑️ Delete mode stopped');
      setLiveMeasurement('');
    };

    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.DRAWVERTEX, onDrawVertex);
    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on(L.Draw.Event.EDITSTART, onDrawEditStart);
    map.on(L.Draw.Event.EDITSTOP, onDrawEditStop);
    map.on(L.Draw.Event.DELETESTART, onDrawDeleteStart);
    map.on(L.Draw.Event.DELETESTOP, onDrawDeleteStop);

    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.DRAWVERTEX, onDrawVertex);
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off(L.Draw.Event.EDITSTART, onDrawEditStart);
      map.off(L.Draw.Event.EDITSTOP, onDrawEditStop);
      map.off(L.Draw.Event.DELETESTART, onDrawDeleteStart);
      map.off(L.Draw.Event.DELETESTOP, onDrawDeleteStop);

      if (drawControlRef.current && map) {
        map.removeControl(drawControlRef.current);
      }
      if (drawnItemsRef.current && map) {
        map.removeLayer(drawnItemsRef.current);
      }
    };
  }, [map, canEdit]);

  const handleSave = async (formData: NewFeatureData) => {
    if (!drawnLayer) return;

    try {
      // Get GeoJSON from drawn layer
      let geoJSON = (drawnLayer as any).toGeoJSON();

      // Convert Circle to Polygon (Leaflet circles are not valid GeoJSON)
      if ((drawnLayer as any).getRadius) {
        const center = (drawnLayer as L.Circle).getLatLng();
        const radius = (drawnLayer as L.Circle).getRadius();
        const circle = turf.circle([center.lng, center.lat], radius / 1000, { units: 'kilometers', steps: 64 });
        geoJSON = circle;
      }

      // Prepare data for backend
      const sectorData = {
        canal_name: formData.canal_name,
        name_ar: formData.name_ar,
        office: formData.office,
        division: formData.division,
        no_nemra: formData.no_nemra,
        design_a_f: formData.design_a_f,
        remarks_1: formData.remarks_1,
        shape_area: measurements.area * 4200, // Convert back to m²
        shape_leng: measurements.perimeter,
        geometry: geoJSON.geometry,
      };

      console.log('Creating new sector:', sectorData);

      // Save to backend
      const response = await sectorsAPI.create(sectorData);

      if (response.success) {
        console.log('✅ Sector created successfully:', response.data);

        // Close dialog
        setDialogOpen(false);
        setDrawnLayer(null);

        // Remove the temporary drawn layer
        if (map && drawnLayer && drawnItemsRef.current) {
          drawnItemsRef.current.removeLayer(drawnLayer);
        }

        // Notify parent to reload data
        if (onFeatureCreated) {
          onFeatureCreated();
        }

        // Show success message
        alert(`Canal "${formData.canal_name}" created successfully!`);
      }
    } catch (error) {
      console.error('❌ Error creating sector:', error);
      alert('Failed to create canal. Please try again.');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    // Remove the temporary drawn layer
    if (map && drawnLayer && drawnItemsRef.current) {
      drawnItemsRef.current.removeLayer(drawnLayer);
      setDrawnLayer(null);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <NewFeatureDialog
        isOpen={dialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        measurements={measurements}
        sectorsData={sectorsData}
      />

      {/* Live Measurement Display */}
      {liveMeasurement && (
        <div className="absolute top-32 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl px-4 py-3 z-[1000] border-2 border-white animate-pulse">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-sm">{liveMeasurement}</span>
          </div>
        </div>
      )}

      {/* Enhanced Drawing Instructions */}
      {!dialogOpen && showInstructions && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs border-2 border-green-500">
          <h3 className="font-bold text-sm mb-2 text-gray-800 flex items-center">
            <span className="text-green-600 mr-2">🎨</span>
            Advanced Drawing Tools
          </h3>
          <div className="text-xs text-gray-700 space-y-1.5">
            <div className="flex items-start">
              <span className="font-semibold text-blue-600 min-w-[70px]">📍 Marker:</span>
              <span>Add point features</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-600 min-w-[70px]">📏 Line:</span>
              <span>Measure distances</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-green-600 min-w-[70px]">🔷 Polygon:</span>
              <span>Draw custom shapes</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-green-600 min-w-[70px]">▭ Rectangle:</span>
              <span>Quick rectangular fields</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-orange-600 min-w-[70px]">⭕ Circle:</span>
              <span>Circular irrigation areas</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-purple-600 min-w-[70px]">✏️ Edit:</span>
              <span>Modify existing shapes</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-red-600 min-w-[70px]">🗑️ Delete:</span>
              <span>Remove drawn features</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            <p className="font-semibold text-green-700 mb-1">💡 Tips:</p>
            <ul className="space-y-0.5 ml-2">
              <li>• Click points to draw</li>
              <li>• Double-click to finish</li>
              <li>• ESC to cancel</li>
              <li>• Area auto-calculated in Feddan</li>
              <li>• Measurements shown in real-time</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
