// GeoJSON Feature Properties
export interface SectorProperties {
  OBJECTID_1: number;
  OBJECTID: number;
  Id: number;
  No_Nemra: number;
  Canal_Name: string;
  Office: string;
  Division: string;
  'A±': number;
  Name_AR: string;
  Design_A_F: number;
  Remarks_1: string | null;
  Shape_Leng: number;
  Shape_Le_1: number;
  Shape_Area: number;
}

// GeoJSON Geometry
export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

// GeoJSON Feature
export interface SectorFeature {
  type: 'Feature';
  properties: SectorProperties;
  geometry: GeoJSONGeometry;
}

// GeoJSON FeatureCollection
export interface SectorFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: SectorFeature[];
}

// Sector Division
export type SectorDivision = 'East' | 'West' | 'North' | 'South';

// Area Category
export type AreaCategory = 'small' | 'medium' | 'large' | 'very-large' | null;

// Map Library Type
export type MapLibrary = 'leaflet' | 'maplibre' | 'openlayers';

// Sector Statistics
export interface SectorStats {
  division: SectorDivision;
  totalFeatures: number;
  totalArea: number;
  totalDesignArea: number;
  canals: string[];
  offices: string[];
}

// Application State
export interface AppState {
  selectedMapLibrary: MapLibrary;
  selectedSector: SectorDivision | null;
  selectedFeature: SectorFeature | null;
  searchQuery: string;
  sidebarOpen: boolean;
}

// Filter Options
export interface FilterOptions {
  division?: SectorDivision;
  office?: string;
  canal?: string;
  minArea?: number;
  maxArea?: number;
}
