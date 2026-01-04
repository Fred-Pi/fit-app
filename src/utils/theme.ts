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
    background: '#0A0A0A',
    surface: '#1E1E22',        // Richer, slightly blue-tinted surface
    surfaceAlt: '#2A2A30',     // More depth with subtle blue tone
    text: '#FFFFFF',
    textSecondary: '#A0A0A8',  // Slightly brighter for better readability
    border: '#3A3A42',         // Richer border color with blue undertone
    primary: '#3A9BFF',        // Brighter, more vibrant blue
    workout: '#3A9BFF',        // Vibrant blue for workouts
    nutrition: '#FF5E6D',      // Warmer, more appealing red
    steps: '#32D760',          // More vibrant green
    success: '#32D760',
    error: '#FF5E6D',
    warning: '#FFD60A',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    input: '#1E1E22',
    inputBorder: '#3A3A42',
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
