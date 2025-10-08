import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StreetViewProps {
  lat: number;
  lng: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function StreetView({ lat, lng, isOpen, onClose }: StreetViewProps) {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isOpen || !streetViewRef.current) return;

    setLoading(true);
    setIsAvailable(true);

    // Initialize Google Street View
    const initStreetView = () => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps not loaded');
        return;
      }

      const streetViewService = new google.maps.StreetViewService();
      const position = { lat, lng };

      // Check if Street View is available at this location
      streetViewService.getPanorama(
        {
          location: position,
          radius: 50, // Search within 50 meters
          source: google.maps.StreetViewSource.OUTDOOR,
        },
        (data, status) => {
          setLoading(false);

          if (status === google.maps.StreetViewStatus.OK && data) {
            // Street View is available
            setIsAvailable(true);

            // Create panorama
            if (streetViewRef.current) {
              panoramaRef.current = new google.maps.StreetViewPanorama(
                streetViewRef.current,
                {
                  position: position,
                  pov: {
                    heading: 0,
                    pitch: 0,
                  },
                  zoom: 1,
                  addressControl: true,
                  linksControl: true,
                  panControl: true,
                  enableCloseButton: false,
                  zoomControl: true,
                  fullscreenControl: true,
                  motionTracking: true,
                  motionTrackingControl: true,
                }
              );

              console.log('✅ Street View loaded successfully');
            }
          } else {
            // No Street View available
            setIsAvailable(false);
            console.log('⚠️ Street View not available at this location');
          }
        }
      );
    };

    // Load Google Maps API if not already loaded
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
      script.async = true;
      script.defer = true;
      script.onload = initStreetView;
      document.head.appendChild(script);
    } else {
      initStreetView();
    }

    return () => {
      // Cleanup
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }
    };
  }, [lat, lng, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Street View Panel */}
      <div
        className={`relative w-full max-w-6xl h-[80vh] m-4 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`absolute top-0 left-0 right-0 z-10 px-6 py-4 border-b backdrop-blur-md transition-colors duration-300 ${
            isDark
              ? 'bg-gray-900/95 border-gray-700'
              : 'bg-white/95 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Street View Icon */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <div>
                <h2
                  className={`text-xl font-bold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Google Street View
                </h2>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all hover:scale-110 ${
                isDark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="Close Street View"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Street View Container */}
        <div className="w-full h-full pt-20">
          {loading && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p
                className={`text-lg font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Loading Street View...
              </p>
            </div>
          )}

          {!isAvailable && !loading && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div className="bg-yellow-500/20 p-6 rounded-full mb-6">
                <svg
                  className="w-20 h-20 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3
                className={`text-2xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Street View Not Available
              </h3>
              <p
                className={`text-center max-w-md ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Google Street View imagery is not available at this location.
                Try clicking on a different location, preferably near roads or
                populated areas.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Close and Try Another Location
              </button>
            </div>
          )}

          {/* Google Street View will be rendered here */}
          <div
            ref={streetViewRef}
            className="w-full h-full"
            style={{ display: loading || !isAvailable ? 'none' : 'block' }}
          />
        </div>

        {/* Instructions Footer */}
        {isAvailable && !loading && (
          <div
            className={`absolute bottom-0 left-0 right-0 px-6 py-3 border-t backdrop-blur-md transition-colors duration-300 ${
              isDark
                ? 'bg-gray-900/95 border-gray-700'
                : 'bg-white/95 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🖱️</span>
                <span
                  className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Drag to look around
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">⬆️</span>
                <span
                  className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Click arrows to move
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">🔍</span>
                <span
                  className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Scroll to zoom
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
