// Type declarations for Google Maps JavaScript API
declare namespace google {
  namespace maps {
    class StreetViewPanorama {
      constructor(element: HTMLElement, options?: StreetViewPanoramaOptions);
      setPosition(position: LatLng | LatLngLiteral): void;
      setPov(pov: StreetViewPov): void;
      setZoom(zoom: number): void;
    }

    class StreetViewService {
      getPanorama(
        request: StreetViewLocationRequest,
        callback: (data: StreetViewPanoramaData | null, status: StreetViewStatus) => void
      ): void;
    }

    interface StreetViewPanoramaOptions {
      position?: LatLng | LatLngLiteral;
      pov?: StreetViewPov;
      zoom?: number;
      addressControl?: boolean;
      linksControl?: boolean;
      panControl?: boolean;
      enableCloseButton?: boolean;
      zoomControl?: boolean;
      fullscreenControl?: boolean;
      motionTracking?: boolean;
      motionTrackingControl?: boolean;
    }

    interface StreetViewPov {
      heading: number;
      pitch: number;
    }

    interface StreetViewLocationRequest {
      location: LatLng | LatLngLiteral;
      radius?: number;
      source?: StreetViewSource;
    }

    interface StreetViewPanoramaData {
      location: StreetViewLocation;
    }

    interface StreetViewLocation {
      latLng: LatLng;
      pano: string;
    }

    enum StreetViewStatus {
      OK = 'OK',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }

    enum StreetViewSource {
      DEFAULT = 'default',
      OUTDOOR = 'outdoor',
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
  }
}

interface Window {
  google: typeof google;
}
