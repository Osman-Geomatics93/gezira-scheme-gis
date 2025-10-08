import React from 'react';
import { useDataProtection } from '../../hooks/useDataProtection';

interface DataProtectionProps {
  children: React.ReactNode;
  disableRightClick?: boolean;
  disableDevTools?: boolean;
  disableTextSelection?: boolean;
  disableCopy?: boolean;
  showWatermark?: boolean;
}

/**
 * Component that wraps content with data protection measures
 * Prevents scraping, unauthorized downloads, and data theft
 */
export const DataProtection: React.FC<DataProtectionProps> = ({
  children,
  disableRightClick = true,
  disableDevTools = true,
  disableTextSelection = false,
  disableCopy = false,
  showWatermark = false,
}) => {
  const { devToolsOpen } = useDataProtection({
    disableRightClick,
    disableDevTools,
    disableTextSelection,
    disableCopy,
    showWatermark,
  });

  // Blur content when dev tools are open (optional visual deterrent)
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    userSelect: disableTextSelection ? 'none' : 'auto',
    WebkitUserSelect: disableTextSelection ? 'none' : 'auto',
  };

  return (
    <div style={containerStyle}>
      {/* Dev Tools Warning Overlay */}
      {devToolsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          ⚠️ Developer Tools Detected - Your activity is being monitored and logged
        </div>
      )}

      {/* Watermark Overlay (if enabled) */}
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 200px,
              rgba(0, 0, 0, 0.02) 200px,
              rgba(0, 0, 0, 0.02) 400px
            )`,
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              fontSize: '48px',
              color: 'rgba(0, 0, 0, 0.05)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            CONFIDENTIAL - DO NOT DISTRIBUTE
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};

export default DataProtection;
