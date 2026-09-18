export const Colors = {
  light: {
    primary: '#1B5E20',
    primaryDark: '#14481a',
    primaryLight: '#e8f5e9',
    background: '#ffffff',
    surface: '#f7f8f7',
    line: '#e5e7e5',
    text: '#1a1f1a',
    textSoft: '#6b7280',
    textMuted: '#9ca3af',
    white: '#ffffff',
    whatsappGreen: '#dcf8c6',
    chatBg: '#e5ddd5',
    blue: '#2563EB',
    green: '#16A34A',
    orange: '#EA580C',
    red: '#DC2626',
    yellow: '#F59E0B',
    purple: '#7C3AED',
  },
  dark: {
    primary: '#1B5E20',
    primaryDark: '#14481a',
    primaryLight: '#1a3a1e',
    background: '#111311',
    surface: '#1a1d1a',
    line: '#2a2f2a',
    text: '#e8ece8',
    textSoft: '#a3aaa3',
    textMuted: '#6b736b',
    white: '#ffffff',
    whatsappGreen: '#dcf8c6',
    chatBg: '#1a1f1a',
    blue: '#60A5FA',
    green: '#4ADE80',
    orange: '#FB923C',
    red: '#F87171',
    yellow: '#FBBF24',
    purple: '#A78BFA',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const FUTA_GATE = {
  lat: 7.3086,
  lng: 5.137,
};

export const API_BASE_URL = (() => {
  // In Expo Go on a real device, replace with your machine's LAN IP.
  return 'http://localhost:5000';
})();