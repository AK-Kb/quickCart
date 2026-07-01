import { Platform } from 'react-native';

// Brand colors from the logo
const BRAND_BLUE = '#0B6A9C';   // From the "Q" and "QUICK"
const BRAND_ORANGE = '#FF6B00'; // From the "C" and "CART"

export const Colors = {
  light: {
    primary: BRAND_BLUE,
    secondary: BRAND_ORANGE,
    accent: BRAND_ORANGE,
    background: '#FFFFFF',
    surface: '#F4F8FA',
    card: '#FFFFFF',
    text: '#1C2D35',
    textMuted: '#607D8B',
    border: '#E0E7EC',
    notification: BRAND_ORANGE,
    tint: BRAND_BLUE,
    icon: '#546E7A',
    tabIconDefault: '#90A4AE',
    tabIconSelected: BRAND_BLUE,
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    primaryLight: '#E6F4FE',
    secondaryLight: '#FFEFE5',
  },
  dark: {
    primary: '#1A81B8', // Slightly lighter/brighter blue for dark mode contrast
    secondary: BRAND_ORANGE,
    accent: BRAND_ORANGE,
    background: '#0E171B',
    surface: '#18252C',
    card: '#1C2B33',
    text: '#ECEFF1',
    textMuted: '#90A4AE',
    border: '#2C3E47',
    notification: BRAND_ORANGE,
    tint: '#1A81B8',
    icon: '#90A4AE',
    tabIconDefault: '#546E7A',
    tabIconSelected: '#1A81B8',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#E57373',
    info: '#64B5F6',
    primaryLight: '#143141',
    secondaryLight: '#412614',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Courier',
    bold: 'System',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    mono: 'monospace',
    bold: 'normal',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    fontFamily: Fonts.sans,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    fontFamily: Fonts.sans,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: Fonts.sans,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: Fonts.sans,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
};

const Theme = {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Fonts,
  Typography,
};

export default Theme;
