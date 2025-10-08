import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { useAuth } from '../../context/AuthContext';
import { sectorsAPI } from '../../services/api';
import NewFeatureDialog, { type NewFeatureData } from './NewFeatureDialog';

interface DrawingToolsLayerProps {
  map: L.Map | null;
  onFeatureCreated?: () => void;
}

export default function DrawingToolsLayer({ map, onFeatureCreated }: DrawingToolsLayerProps) {
  const { hasRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [measurements, setMeasurements] = useState({ area: 0, perimeter: 0 });
  const [drawnLayer, setDrawnLayer] = useState<L.Layer | null>(null);
  const canEdit = hasRole(['admin', 'editor']);
  const setupRef = useRef(false);

  console.log('🎨 DrawingToolsLayer mounted - Map:', !!map, 'Can Edit:', canEdit);

  useEffect(() => {
    if (!map || !canEdit) {
      console.log('🎨 DrawingToolsLayer: Skipping setup - Map:', !!map, 'Can Edit:', canEdit);
      return;
    }

    // Prevent double setup
    if (setupRef.current) {
      console.log('🎨 DrawingToolsLayer: Already set up, skipping');
      return;
    }
    setupRef.current = true;

    console.log('🎨 DrawingToolsLayer: Setting up drawing controls...');
    console.log('🔍 L.Draw available:', !!L.Draw);
    console.log('🔍 L.Control.Draw available:', !!L.Control.Draw);

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize draw control
    let drawControl;
    try {
      drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: '#2563eb',
            weight: 3,
            fillOpacity: 0.2,
          },
          showArea: true,
          metric: true,
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
        polyline: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

      map.addControl(drawControl);
      console.log('✅ Drawing controls added to map!');
    } catch (error) {
      console.error('❌ Error creating draw control:', error);
      return;
    }

    // Handle draw created event
    const onDrawCreated = (e: any) => {
      console.log('🎨 Draw created event:', e.layerType);
      const layer = e.layer;
      drawnItems.addLayer(layer);

      // Calculate measurements
      const geoJSON = layer.toGeoJSON();
      const area = turf.area(geoJSON); // in square meters
      const areaInFeddan = area / 4200; // 1 Feddan = 4200 m²

      let perimeter = 0;
      if (geoJSON.geometry.type === 'Polygon') {
        perimeter = turf.length(turf.polygonToLine(geoJSON), { units: 'meters' });
      } else if (geoJSON.geometry.type === 'Circle' || e.layerType === 'circle') {
        // For circles, calculate circumference
        const radius = (layer as L.Circle).getRadius();
        perimeter = 2 * Math.PI * radius;
      }

      setMeasurements({
        area: areaInFeddan,
        perimeter: perimeter,
      });
      setDrawnLayer(layer);
      setDialogOpen(true);
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);

    // Add listeners for draw start/stop to debug
    map.on(L.Draw.Event.DRAWSTART, () => console.log('🎨 Draw started'));
    map.on(L.Draw.Event.DRAWSTOP, () => console.log('🎨 Draw stopped'));
    map.on(L.Draw.Event.DRAWVERTEX, () => console.log('🎨 Draw vertex added'));

    return () => {
      setupRef.current = false;
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.DRAWSTART);
      map.off(L.Draw.Event.DRAWSTOP);
      map.off(L.Draw.Event.DRAWVERTEX);
      if (drawControl) {
        map.removeControl(drawControl);
      }
      map.removeLayer(drawnItems);
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
        if (map && drawnLayer) {
          map.removeLayer(drawnLayer);
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
    if (map && drawnLayer) {
      map.removeLayer(drawnLayer);
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
      />

      {/* Drawing Instructions */}
      {!dialogOpen && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
          <h3 className="font-bold text-sm mb-2 text-gray-800">🎨 Drawing Tools</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>Polygon:</strong> Click points to draw free-form shape</li>
            <li>• <strong>Rectangle:</strong> Click and drag for rectangular field</li>
            <li>• <strong>Circle:</strong> Click center, then drag for radius</li>
            <li>• Double-click or click first point again to finish</li>
            <li>• <strong className="text-green-600">Area is auto-calculated in Feddan</strong></li>
          </ul>
        </div>
      )}
    </>
  );
}
