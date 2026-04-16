import { Platform } from 'react-native';

const tintColorLight = '#d2a907'; // Brand Gold
const tintColorDark = '#fff';

export const Colors = {
  light: {
    brand: '#d2a907',
    text: '#11181C',
    background: '#FFFFFF',
    card: '#F5F5F5',
    border: '#E0E0E0',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    brand: '#d2a907',
    text: '#ECEDEE',
    background: '#121212',
    card: '#1E1E1E',
    border: '#333333',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Error yahan se aa raha tha, ye missing tha:
export const Fonts = Platform.select({
    ios: {
      sans: 'system-ui',
      serif: 'ui-serif',
      rounded: 'ui-rounded',
      mono: 'ui-monospace',
    },
    default: {
      sans: 'normal',
      serif: 'serif',
      rounded: 'normal',
      mono: 'monospace',
    },
  });
