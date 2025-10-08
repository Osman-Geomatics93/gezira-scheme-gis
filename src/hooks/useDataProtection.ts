import { useEffect, useState } from 'react';

interface DataProtectionOptions {
  disableRightClick?: boolean;
  disableDevTools?: boolean;
  disableTextSelection?: boolean;
  disableCopy?: boolean;
  showWatermark?: boolean;
}

/**
 * Custom hook to add data protection measures to prevent scraping and unauthorized downloads
 * NOTE: These are frontend measures and can be bypassed. Always implement server-side protections.
 */
export const useDataProtection = (options: DataProtectionOptions = {}) => {
  const {
    disableRightClick = true,
    disableDevTools = true,
    disableTextSelection = false,
    disableCopy = false,
    showWatermark = false,
  } = options;

  const [devToolsOpen, setDevToolsOpen] = useState(false);

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      if (disableRightClick) {
        e.preventDefault();
        console.warn('Right-click is disabled for data protection');
        // Optional: Show a toast notification
        return false;
      }
    };

    // Disable copy
    const handleCopy = (e: ClipboardEvent) => {
      if (disableCopy) {
        e.preventDefault();
        console.warn('Copying is disabled for data protection');
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      if (disableTextSelection) {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools opening
    let devToolsCheckInterval: NodeJS.Timeout;
    if (disableDevTools) {
      const detectDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const isOpen = widthThreshold || heightThreshold;

        if (isOpen && !devToolsOpen) {
          setDevToolsOpen(true);
          console.warn('⚠️ Developer tools detected. Data access is being monitored.');
        } else if (!isOpen && devToolsOpen) {
          setDevToolsOpen(false);
        }
      };

      devToolsCheckInterval = setInterval(detectDevTools, 1000);
    }

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12 (DevTools)
      if (disableDevTools && e.key === 'F12') {
        e.preventDefault();
        console.warn('Developer tools are disabled for data protection');
        return false;
      }

      // Prevent Ctrl+Shift+I (DevTools)
      if (disableDevTools && e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.warn('Developer tools are disabled for data protection');
        return false;
      }

      // Prevent Ctrl+Shift+J (Console)
      if (disableDevTools && e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (View Source)
      if (disableDevTools && e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        console.warn('Saving page is disabled for data protection');
        return false;
      }

      // Prevent Ctrl+C (Copy) if disableCopy is true
      if (disableCopy && e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    if (disableRightClick) {
      document.addEventListener('contextmenu', handleContextMenu);
    }
    if (disableCopy) {
      document.addEventListener('copy', handleCopy);
    }
    if (disableTextSelection) {
      document.addEventListener('selectstart', handleSelectStart);
    }
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      if (devToolsCheckInterval) {
        clearInterval(devToolsCheckInterval);
      }
    };
  }, [disableRightClick, disableDevTools, disableTextSelection, disableCopy, devToolsOpen]);

  return {
    devToolsOpen,
  };
};
