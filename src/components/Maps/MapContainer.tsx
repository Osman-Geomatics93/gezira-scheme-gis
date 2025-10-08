import type { MapLibrary, SectorFeatureCollection, SectorDivision, SectorFeature, AreaCategory } from '../../types';
import LeafletMap from './LeafletMap';
import EnhancedMapLibreMap from './EnhancedMapLibreMap';
import OpenLayersMap from './OpenLayersMap';

interface MapContainerProps {
  mapLibrary: MapLibrary;
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  selectedAreaCategory?: AreaCategory;
  onAreaCategoryChange?: (category: AreaCategory) => void;
  onFeatureClick?: (feature: SectorFeature) => void;
  onDataUpdate?: () => void;
}

export default function MapContainer({
  mapLibrary,
  sectorsData,
  selectedSector,
  selectedAreaCategory,
  onAreaCategoryChange,
  onFeatureClick,
  onDataUpdate
}: MapContainerProps) {
  return (
    <div className="w-full h-full relative">
      {/* Map Library Indicator */}
      <div className="absolute top-4 left-4 z-[999] bg-white px-3 py-1 rounded-md shadow-md text-xs font-medium text-gray-700">
        Using: {mapLibrary === 'leaflet' ? 'Leaflet' : mapLibrary === 'maplibre' ? 'MapLibre GL' : 'OpenLayers'}
      </div>

      {mapLibrary === 'leaflet' && (
        <LeafletMap
          key="leaflet-map"
          sectorsData={sectorsData}
          selectedSector={selectedSector}
          selectedAreaCategory={selectedAreaCategory}
          onAreaCategoryChange={onAreaCategoryChange}
          onFeatureClick={onFeatureClick}
          onDataUpdate={onDataUpdate}
        />
      )}

      {mapLibrary === 'maplibre' && (
        <EnhancedMapLibreMap
          key="maplibre-map"
          sectorsData={sectorsData}
          selectedSector={selectedSector}
          selectedAreaCategory={selectedAreaCategory}
          onAreaCategoryChange={onAreaCategoryChange}
          onFeatureClick={onFeatureClick}
        />
      )}

      {mapLibrary === 'openlayers' && (
        <OpenLayersMap
          key="openlayers-map"
          sectorsData={sectorsData}
          selectedSector={selectedSector}
          selectedAreaCategory={selectedAreaCategory}
          onAreaCategoryChange={onAreaCategoryChange}
          onFeatureClick={(props) => onFeatureClick?.({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [] } })}
        />
      )}
    </div>
  );
}
