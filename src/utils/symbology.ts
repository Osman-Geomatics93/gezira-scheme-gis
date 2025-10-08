import type { SectorDivision, SectorProperties } from '../types';

// Color schemes for different sectors
export const sectorColors: Record<SectorDivision, { primary: string; light: string; dark: string; gradient: string }> = {
  East: {
    primary: '#3b82f6',
    light: '#93c5fd',
    dark: '#1e40af',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
  },
  West: {
    primary: '#22c55e',
    light: '#86efac',
    dark: '#15803d',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
  },
  North: {
    primary: '#eab308',
    light: '#fde047',
    dark: '#a16207',
    gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
  },
  South: {
    primary: '#ef4444',
    light: '#fca5a5',
    dark: '#b91c1c',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  },
};

// Categorize features by area size
export function getAreaCategory(area: number): 'small' | 'medium' | 'large' | 'very-large' {
  if (area < 500) return 'small';
  if (area < 1000) return 'medium';
  if (area < 2000) return 'large';
  return 'very-large';
}

// Get color based on area (choropleth style)
export function getAreaColor(area: number, baseColor: string): string {
  const category = getAreaCategory(area);
  const opacity = {
    'small': 0.3,
    'medium': 0.5,
    'large': 0.7,
    'very-large': 0.9,
  };

  return `${baseColor}${Math.round(opacity[category] * 255).toString(16).padStart(2, '0')}`;
}

// Get stroke width based on area
export function getStrokeWidth(area: number, isHovered: boolean = false): number {
  const baseWidth = {
    'small': 1.5,
    'medium': 2,
    'large': 2.5,
    'very-large': 3,
  }[getAreaCategory(area)];

  return isHovered ? baseWidth * 1.5 : baseWidth;
}

// Get pattern/texture based on properties
export function getPatternStyle(props: SectorProperties): {
  fillOpacity: number;
  strokeWidth: number;
  fillPattern?: string;
} {
  const area = props.Design_A_F || 0;
  const category = getAreaCategory(area);

  return {
    fillOpacity: {
      'small': 0.4,
      'medium': 0.5,
      'large': 0.65,
      'very-large': 0.8,
    }[category],
    strokeWidth: getStrokeWidth(area),
    fillPattern: category === 'very-large' ? 'diagonal-stripe' : undefined,
  };
}

// Generate label style based on feature importance
export function getLabelStyle(props: SectorProperties): {
  fontSize: string;
  fontWeight: string;
  color: string;
  haloColor: string;
  haloWidth: number;
} {
  const area = props.Design_A_F || 0;
  const category = getAreaCategory(area);

  return {
    fontSize: {
      'small': '10px',
      'medium': '11px',
      'large': '12px',
      'very-large': '14px',
    }[category],
    fontWeight: category === 'very-large' ? '700' : '600',
    color: '#1f2937',
    haloColor: '#ffffff',
    haloWidth: 2,
  };
}

// Get hex color with opacity
export function hexWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Get gradient colors for area visualization
export function getGradientColors(division: SectorDivision): string[] {
  const colors = sectorColors[division];
  return [colors.light, colors.primary, colors.dark];
}

// Symbol sizes based on feature properties
export const symbolSizes = {
  small: 8,
  medium: 12,
  large: 16,
  veryLarge: 20,
};

// Animation durations
export const animationDurations = {
  hover: 200,
  select: 300,
  zoom: 1000,
};

// Legend configuration
export interface LegendItem {
  label: string;
  color: string;
  pattern?: string;
  description?: string;
}

export function getAreaLegendItems(division: SectorDivision): LegendItem[] {
  const colors = sectorColors[division];

  return [
    {
      label: '< 500 Feddan',
      color: hexWithOpacity(colors.primary, 0.3),
      description: 'Small plots',
    },
    {
      label: '500 - 1000 Feddan',
      color: hexWithOpacity(colors.primary, 0.5),
      description: 'Medium plots',
    },
    {
      label: '1000 - 2000 Feddan',
      color: hexWithOpacity(colors.primary, 0.7),
      description: 'Large plots',
    },
    {
      label: '> 2000 Feddan',
      color: hexWithOpacity(colors.primary, 0.9),
      pattern: 'diagonal-stripe',
      description: 'Very large plots',
    },
  ];
}

// Office-based color coding
export function getOfficeColor(office: string): string {
  const hash = office.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}
