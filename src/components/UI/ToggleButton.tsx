interface ToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
}

export default function ToggleButton({ isOpen, onToggle, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-4 right-4 lg:hidden z-[1001] bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
      aria-label={label}
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  );
}
