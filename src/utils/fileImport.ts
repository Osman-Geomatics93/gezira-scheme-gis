import * as shapefile from 'shapefile';
import * as toGeoJSON from '@tmcw/togeojson';
import JSZip from 'jszip';
import * as GeoTIFF from 'geotiff';

export interface ImportedLayer {
  id: string;
  name: string;
  type: 'geojson' | 'kml' | 'shapefile' | 'raster';
  data: GeoJSON.FeatureCollection | RasterData;
  visible: boolean;
  color: string;
  opacity: number;
  showLabels: boolean;
  labelField: string | null;
  labelSize: number;
  labelColor: string;
  labelHaloColor: string;
  labelHaloWidth: number;
  zIndex: number;
  // Raster-specific controls
  brightness?: number;  // -1.0 to 1.0
  contrast?: number;    // -1.0 to 1.0
  saturation?: number;  // -1.0 to 1.0
  // Band selection (for multi-band rasters)
  redBand?: number;     // Band index for red channel (0-based)
  greenBand?: number;   // Band index for green channel (0-based)
  blueBand?: number;    // Band index for blue channel (0-based)
  grayscaleBand?: number; // Band index for grayscale display (0-based)
  displayMode?: 'rgb' | 'grayscale'; // Display mode
}

export interface RasterData {
  type: 'raster';
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[west, south], [east, north]]
  width: number;
  height: number;
  bands?: Uint8ClampedArray[]; // Individual normalized bands for band selection
  numBands: number;
}

/**
 * Parse GeoJSON file
 */
export async function parseGeoJSON(file: File): Promise<GeoJSON.FeatureCollection> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Handle both FeatureCollection and single Feature
  if (data.type === 'FeatureCollection') {
    return data;
  } else if (data.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [data]
    };
  } else if (data.type === 'GeometryCollection') {
    return {
      type: 'FeatureCollection',
      features: data.geometries.map((geom: any) => ({
        type: 'Feature',
        geometry: geom,
        properties: {}
      }))
    };
  } else if (data.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(data.type)) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: data,
        properties: {}
      }]
    };
  }

  throw new Error('Invalid GeoJSON format');
}

/**
 * Parse KML file
 */
export async function parseKML(file: File): Promise<GeoJSON.FeatureCollection> {
  const text = await file.text();
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(text, 'text/xml');

  // Check for parsing errors
  const parseError = kmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid KML format');
  }

  const geojson = toGeoJSON.kml(kmlDoc);
  return geojson as GeoJSON.FeatureCollection;
}

/**
 * Parse Shapefile (ZIP containing .shp, .shx, .dbf, .prj)
 */
export async function parseShapefile(file: File): Promise<GeoJSON.FeatureCollection> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find required files
  const shpFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.shp'));
  const dbfFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.dbf'));

  if (!shpFile) {
    throw new Error('Shapefile must contain a .shp file');
  }

  // Extract buffers
  const shpBuffer = await zip.files[shpFile].async('arraybuffer');
  const dbfBuffer = dbfFile ? await zip.files[dbfFile].async('arraybuffer') : null;

  // Parse shapefile
  const features: GeoJSON.Feature[] = [];

  const source = dbfBuffer
    ? await shapefile.open(shpBuffer, dbfBuffer)
    : await shapefile.open(shpBuffer);

  let result = await source.read();
  while (!result.done) {
    if (result.value) {
      features.push(result.value);
    }
    result = await source.read();
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Normalize raster values to 0-255 range
 */
function normalizeRasterValues(values: any): Uint8ClampedArray {
  const normalized = new Uint8ClampedArray(values.length);

  // Find min and max values
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (!isNaN(val) && isFinite(val)) {
      min = Math.min(min, val);
      max = Math.max(max, val);
    }
  }

  // Handle edge cases
  if (!isFinite(min) || !isFinite(max) || min === max) {
    // If all values are the same or invalid, return middle gray
    normalized.fill(128);
    return normalized;
  }

  // Normalize to 0-255
  const range = max - min;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (isNaN(val) || !isFinite(val)) {
      normalized[i] = 0;
    } else {
      normalized[i] = Math.round(((val - min) / range) * 255);
    }
  }

  return normalized;
}

/**
 * Parse GeoTIFF file
 */
export async function parseGeoTIFF(file: File): Promise<RasterData> {
  const arrayBuffer = await file.arrayBuffer();
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  // Get image dimensions
  const width = image.getWidth();
  const height = image.getHeight();

  // Get bounding box
  const bbox = image.getBoundingBox();
  const bounds: [[number, number], [number, number]] = [
    [bbox[0], bbox[1]], // [west, south]
    [bbox[2], bbox[3]]  // [east, north]
  ];

  // Read raster data
  const rasters = await image.readRasters();

  // Handle different band counts
  const numBands = rasters.length;

  // Normalize all bands and store them
  const normalizedBands: Uint8ClampedArray[] = [];
  for (let i = 0; i < numBands; i++) {
    normalizedBands.push(normalizeRasterValues(rasters[i]));
  }

  // Convert to RGB image for initial display
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  if (numBands >= 3) {
    // RGB or RGBA - use first 3 bands as RGB
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = normalizedBands[0][i];     // R
      data[i * 4 + 1] = normalizedBands[1][i]; // G
      data[i * 4 + 2] = normalizedBands[2][i]; // B
      data[i * 4 + 3] = 255; // A
    }
  } else if (numBands === 1) {
    // Grayscale - use first band
    for (let i = 0; i < width * height; i++) {
      const value = normalizedBands[0][i];
      data[i * 4] = value;
      data[i * 4 + 1] = value;
      data[i * 4 + 2] = value;
      data[i * 4 + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const imageUrl = canvas.toDataURL('image/png');

  return {
    type: 'raster',
    imageUrl,
    bounds,
    width,
    height,
    bands: normalizedBands,
    numBands
  };
}

/**
 * Parse ENVI format (.hdr + .img/.dat)
 */
export async function parseENVI(imageFile: File, headerFile?: File): Promise<RasterData> {
  let width = 512;
  let height = 512;
  let bands = 1;
  let dataType = 1; // byte
  let interleave = 'bsq';
  let byteOrder = 0; // little endian
  let mapInfo: any = null;

  // Parse header file if provided
  if (headerFile) {
    const headerText = await headerFile.text();
    const lines = headerText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('samples')) {
        width = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('lines')) {
        height = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('bands')) {
        bands = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('data type')) {
        dataType = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('interleave')) {
        interleave = trimmed.split('=')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('byte order')) {
        byteOrder = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('map info')) {
        // Parse map info for georeferencing
        const mapInfoStr = trimmed.substring(trimmed.indexOf('{') + 1, trimmed.indexOf('}'));
        mapInfo = mapInfoStr.split(',').map(s => s.trim());
      }
    }
  }

  // Read binary raster data
  const arrayBuffer = await imageFile.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  // Read all pixel values for all bands
  const totalPixels = width * height;
  const bytesPerValue = dataType === 1 ? 1 : dataType === 2 ? 2 : dataType === 4 ? 4 : 1;

  // Store all bands
  const allBands: number[][] = [];
  for (let b = 0; b < bands; b++) {
    allBands.push(new Array(totalPixels));
  }

  // Read data based on interleave format
  let offset = 0;
  if (interleave === 'bsq') {
    // Band Sequential: Band1[all pixels], Band2[all pixels], ...
    for (let b = 0; b < bands; b++) {
      for (let i = 0; i < totalPixels; i++) {
        if (dataType === 1) {
          allBands[b][i] = dataView.getUint8(offset);
        } else if (dataType === 2) {
          allBands[b][i] = dataView.getInt16(offset, byteOrder === 0);
        } else if (dataType === 4) {
          allBands[b][i] = dataView.getFloat32(offset, byteOrder === 0);
        }
        offset += bytesPerValue;
      }
    }
  } else if (interleave === 'bil') {
    // Band Interleaved by Line: Line1[Band1, Band2, ...], Line2[Band1, Band2, ...], ...
    for (let row = 0; row < height; row++) {
      for (let b = 0; b < bands; b++) {
        for (let col = 0; col < width; col++) {
          const pixelIndex = row * width + col;
          if (dataType === 1) {
            allBands[b][pixelIndex] = dataView.getUint8(offset);
          } else if (dataType === 2) {
            allBands[b][pixelIndex] = dataView.getInt16(offset, byteOrder === 0);
          } else if (dataType === 4) {
            allBands[b][pixelIndex] = dataView.getFloat32(offset, byteOrder === 0);
          }
          offset += bytesPerValue;
        }
      }
    }
  } else if (interleave === 'bip') {
    // Band Interleaved by Pixel: Pixel1[Band1, Band2, ...], Pixel2[Band1, Band2, ...], ...
    for (let i = 0; i < totalPixels; i++) {
      for (let b = 0; b < bands; b++) {
        if (dataType === 1) {
          allBands[b][i] = dataView.getUint8(offset);
        } else if (dataType === 2) {
          allBands[b][i] = dataView.getInt16(offset, byteOrder === 0);
        } else if (dataType === 4) {
          allBands[b][i] = dataView.getFloat32(offset, byteOrder === 0);
        }
        offset += bytesPerValue;
      }
    }
  }

  // Normalize all bands
  const normalizedBands: Uint8ClampedArray[] = [];
  for (let b = 0; b < bands; b++) {
    normalizedBands.push(normalizeRasterValues(allBands[b]));
  }

  // Apply first band to canvas for initial display
  if (bands >= 3) {
    // RGB display with first 3 bands
    for (let i = 0; i < totalPixels; i++) {
      pixels[i * 4] = normalizedBands[0][i];
      pixels[i * 4 + 1] = normalizedBands[1][i];
      pixels[i * 4 + 2] = normalizedBands[2][i];
      pixels[i * 4 + 3] = 255;
    }
  } else {
    // Grayscale display with first band
    for (let i = 0; i < totalPixels; i++) {
      const value = normalizedBands[0][i];
      pixels[i * 4] = value;
      pixels[i * 4 + 1] = value;
      pixels[i * 4 + 2] = value;
      pixels[i * 4 + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const imageUrl = canvas.toDataURL('image/png');

  // Calculate bounds from map info or use defaults
  let bounds: [[number, number], [number, number]];
  if (mapInfo && mapInfo.length >= 6) {
    const pixelSize = parseFloat(mapInfo[5]);
    const upperLeftX = parseFloat(mapInfo[3]);
    const upperLeftY = parseFloat(mapInfo[4]);

    bounds = [
      [upperLeftX, upperLeftY - (height * pixelSize)], // [west, south]
      [upperLeftX + (width * pixelSize), upperLeftY]   // [east, north]
    ];
  } else {
    bounds = [[0, 0], [1, 1]];
  }

  return {
    type: 'raster',
    imageUrl,
    bounds,
    width,
    height,
    bands: normalizedBands,
    numBands: bands
  };
}

/**
 * Parse ERDAS Imagine format (.img)
 */
export async function parseERDAS(file: File): Promise<RasterData> {
  // ERDAS Imagine format is complex with embedded header
  // For now, try to read it as a basic binary raster
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // Try to extract basic information from header (first 512 bytes typically)
  // This is a simplified approach - full ERDAS parsing is very complex
  let width = 512;
  let height = 512;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  // Simple grayscale reading (this is very basic and may not work for all ERDAS files)
  const headerSize = 512; // Approximate header size
  const totalPixels = width * height;
  const rawValues = new Array(totalPixels);

  // Read raw values
  for (let i = 0; i < totalPixels; i++) {
    rawValues[i] = dataView.getUint8(headerSize + i);
  }

  // Normalize values
  const normalized = normalizeRasterValues(rawValues);

  // Apply to canvas
  for (let i = 0; i < totalPixels; i++) {
    const value = normalized[i];
    pixels[i * 4] = value;
    pixels[i * 4 + 1] = value;
    pixels[i * 4 + 2] = value;
    pixels[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const imageUrl = canvas.toDataURL('image/png');

  return {
    type: 'raster',
    imageUrl,
    bounds: [[0, 0], [1, 1]],
    width,
    height,
    bands: [normalized],
    numBands: 1
  };
}

/**
 * Parse image file with world file (PNG, JPEG)
 */
export async function parseImageWithWorldFile(imageFile: File, worldFile?: File): Promise<RasterData> {
  // Create image URL
  const imageUrl = URL.createObjectURL(imageFile);

  // Load image to get dimensions
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const width = img.width;
  const height = img.height;

  // Extract band data from the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Draw image to canvas
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Extract RGB bands
  const totalPixels = width * height;
  const rBand = new Uint8ClampedArray(totalPixels);
  const gBand = new Uint8ClampedArray(totalPixels);
  const bBand = new Uint8ClampedArray(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    rBand[i] = data[i * 4];
    gBand[i] = data[i * 4 + 1];
    bBand[i] = data[i * 4 + 2];
  }

  // Parse world file if provided
  let bounds: [[number, number], [number, number]];

  if (worldFile) {
    const worldText = await worldFile.text();
    const lines = worldText.trim().split('\n').map(l => parseFloat(l.trim()));

    if (lines.length >= 6) {
      const [xScale, , , yScale, xOrigin, yOrigin] = lines;
      const east = xOrigin + (width * xScale);
      const south = yOrigin + (height * yScale);

      bounds = [
        [xOrigin, south],  // [west, south]
        [east, yOrigin]    // [east, north]
      ];
    } else {
      throw new Error('Invalid world file format');
    }
  } else {
    // Default bounds if no world file
    bounds = [[0, 0], [1, 1]];
  }

  return {
    type: 'raster',
    imageUrl,
    bounds,
    width,
    height,
    bands: [rBand, gBand, bBand],
    numBands: 3
  };
}

/**
 * Parse file based on extension
 */
export async function parseFile(file: File): Promise<ImportedLayer> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  let data: GeoJSON.FeatureCollection | RasterData;
  let type: 'geojson' | 'kml' | 'shapefile' | 'raster';

  try {
    // Handle raster formats
    if (extension === 'tif' || extension === 'tiff') {
      data = await parseGeoTIFF(file);
      type = 'raster';
    } else if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
      data = await parseImageWithWorldFile(file);
      type = 'raster';
    } else if (extension === 'img' || extension === 'dat') {
      // ENVI format (.img or .dat) - header file is optional
      data = await parseENVI(file);
      type = 'raster';
    } else if (extension === 'hdr') {
      // ENVI header file - need to wait for the corresponding .img or .dat file
      throw new Error('Please upload the .img or .dat file along with the .hdr file');
    }
    // Handle vector formats
    else if (extension === 'geojson' || extension === 'json') {
      data = await parseGeoJSON(file);
      type = 'geojson';
    } else if (extension === 'kml') {
      data = await parseKML(file);
      type = 'kml';
    } else if (extension === 'zip') {
      data = await parseShapefile(file);
      type = 'shapefile';
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    // Generate random color for the layer
    const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

    // Get first property name for default label field (for vector layers)
    let defaultLabelField: string | null = null;
    if (type !== 'raster' && 'features' in data) {
      const firstFeature = data.features[0];
      const propertyNames = firstFeature?.properties ? Object.keys(firstFeature.properties) : [];
      defaultLabelField = propertyNames.find(p =>
        p.toLowerCase().includes('name') ||
        p.toLowerCase().includes('label') ||
        p.toLowerCase().includes('id')
      ) || propertyNames[0] || null;
    }

    // Set default band selection for raster layers
    let defaultRedBand, defaultGreenBand, defaultBlueBand, defaultGrayscaleBand, defaultDisplayMode: 'rgb' | 'grayscale';
    if (type === 'raster') {
      const rasterData = data as RasterData;
      if (rasterData.numBands >= 3) {
        // Default to RGB mode with first 3 bands
        defaultRedBand = 0;
        defaultGreenBand = 1;
        defaultBlueBand = 2;
        defaultGrayscaleBand = 0;
        defaultDisplayMode = 'rgb';
      } else {
        // Default to grayscale mode with first band
        defaultRedBand = 0;
        defaultGreenBand = 0;
        defaultBlueBand = 0;
        defaultGrayscaleBand = 0;
        defaultDisplayMode = 'grayscale';
      }
    }

    return {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      type,
      data,
      visible: true,
      color,
      opacity: type === 'raster' ? 1.0 : 0.6,
      showLabels: false,
      labelField: defaultLabelField,
      labelSize: 12,
      labelColor: '#000000',
      labelHaloColor: '#ffffff',
      labelHaloWidth: 2,
      zIndex: Date.now(),
      brightness: 0,
      contrast: 0,
      saturation: 0,
      redBand: defaultRedBand,
      greenBand: defaultGreenBand,
      blueBand: defaultBlueBand,
      grayscaleBand: defaultGrayscaleBand,
      displayMode: defaultDisplayMode
    };
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024; // 500MB for raster data
  const validExtensions = ['geojson', 'json', 'kml', 'zip', 'tif', 'tiff', 'png', 'jpg', 'jpeg', 'img', 'dat', 'hdr'];
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file format. Supported formats: ${validExtensions.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

/**
 * Calculate bounds of a FeatureCollection
 */
export function calculateBounds(data: GeoJSON.FeatureCollection): [[number, number], [number, number]] | null {
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  const processCoordinates = (coords: any) => {
    if (Array.isArray(coords)) {
      if (typeof coords[0] === 'number') {
        // Single coordinate pair
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      } else {
        // Nested coordinates
        coords.forEach(processCoordinates);
      }
    }
  };

  data.features.forEach(feature => {
    if (feature.geometry) {
      processCoordinates(feature.geometry.coordinates);
    }
  });

  if (minLng === Infinity) {
    return null;
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}
