import { useState, useRef } from 'react';
import { parseFile, validateFile, type ImportedLayer } from '../../utils/fileImport';

interface FileImportProps {
  onLayerImport: (layer: ImportedLayer) => void;
}

export default function FileImport({ onLayerImport }: FileImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        // Parse file
        const layer = await parseFile(file);
        onLayerImport(layer);

        setSuccess(`Successfully imported: ${file.name}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
          text-white px-5 py-2.5 rounded-xl shadow-lg border border-blue-400
          flex items-center gap-2.5 transition-all duration-200
          hover:shadow-xl hover:scale-105 active:scale-95
          ${isOpen ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
        `}
        title="Import Spatial Files"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-sm font-semibold tracking-wide">Import</span>
        {isOpen && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Import Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 w-96 animate-fadeIn">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Import Spatial Files
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Supported Formats */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2">SUPPORTED FORMATS</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1">Vector:</p>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  GeoJSON
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  KML
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Shapefile (ZIP)
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1">Raster:</p>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  GeoTIFF
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  PNG/JPEG
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  ENVI (.img/.dat)
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  ERDAS Imagine
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Maximum file size: 500MB
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".geojson,.json,.kml,.zip,.tif,.tiff,.png,.jpg,.jpeg,.img,.dat,.hdr"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 font-medium">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports multiple files
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">TIPS</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Shapefiles must be zipped with .shp, .shx, .dbf files</li>
              <li>• ENVI files: Upload .img/.dat file (optional: .hdr for georeferencing)</li>
              <li>• PNG/JPEG: Optional world file (.pgw/.jgw) for coordinates</li>
              <li>• Imported layers appear in the Layer Manager</li>
              <li>• Click on features to view their properties</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
