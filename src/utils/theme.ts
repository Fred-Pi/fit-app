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
    surface: '#1C1C1E',
    surfaceAlt: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#98989D',
    border: '#38383A',
    primary: '#0A84FF',
    workout: '#0A84FF',
    nutrition: '#FF453A',
    steps: '#30D158',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FFD60A',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    input: '#1C1C1E',
    inputBorder: '#38383A',
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
