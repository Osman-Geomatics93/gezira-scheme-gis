export default function HelpPanel() {
  return (
    <div className="absolute bottom-20 right-4 bg-white rounded-lg shadow-2xl p-4 z-[1000] max-w-sm border-2 border-purple-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-purple-800 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Keyboard Shortcuts
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        {/* Navigation */}
        <div>
          <p className="font-semibold text-gray-800 mb-1.5 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Navigation
          </p>
          <div className="ml-4 space-y-1 text-gray-700">
            <div className="flex justify-between items-center">
              <span>Pan map</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Click + Drag</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Zoom in/out</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Scroll Wheel</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Zoom to extent</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Double Click</kbd>
            </div>
          </div>
        </div>

        {/* Drawing */}
        <div className="border-t border-gray-300 pt-2">
          <p className="font-semibold text-gray-800 mb-1.5 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Drawing Tools
          </p>
          <div className="ml-4 space-y-1 text-gray-700">
            <div className="flex justify-between items-center">
              <span>Finish drawing</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Double Click</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Cancel drawing</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">ESC</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Delete last point</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Backspace</kbd>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t border-gray-300 pt-2">
          <p className="font-semibold text-gray-800 mb-1.5 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Features
          </p>
          <div className="ml-4 space-y-1 text-gray-700">
            <div className="flex justify-between items-center">
              <span>Feature info</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Click Feature</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Edit feature</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Edit Mode</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Select multiple</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Shift + Click</kbd>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="border-t border-gray-300 pt-2">
          <p className="font-semibold text-green-700 mb-1.5 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Pro Tips
          </p>
          <ul className="ml-4 space-y-1 text-xs text-gray-600">
            <li>• Use basemap switcher for satellite imagery</li>
            <li>• Toggle layers for better visibility</li>
            <li>• Measurements shown in real-time</li>
            <li>• Click legend items to filter by area size</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
