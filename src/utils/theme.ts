export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    workout: string;
    nutrition: string;
    steps: string;
    success: string;
    error: string;
    warning: string;
    modalOverlay: string;
    input: string;
    inputBorder: string;
  };
  isDark: boolean;
}

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#0F1419',     // Deep blue-black for modern look
    surface: '#1A1F2E',        // Rich navy blue surface
    surfaceAlt: '#242B3D',     // Lighter navy for depth
    text: '#FFFFFF',
    textSecondary: '#B8C5D6',  // Brighter secondary text
    border: '#2D3548',         // Subtle blue-gray border
    primary: '#00D9FF',        // Bright cyan - modern and cool
    workout: '#00D9FF',        // Bright cyan for workouts
    nutrition: '#FF6B9D',      // Vibrant pink
    steps: '#00E676',          // Electric green
    success: '#00E676',
    error: '#FF5252',
    warning: '#FFD740',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    input: '#1A1F2E',
    inputBorder: '#2D3548',
  },
};

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#F9F9F9',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E5E5E5',
    primary: '#007AFF',
    workout: '#007AFF',
    nutrition: '#FF6B6B',
    steps: '#4CAF50',
    success: '#4CAF50',
    error: '#FF3B30',
    warning: '#FFD60A',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    input: '#F9F9F9',
    inputBorder: '#DDD',
  },
};
