const brandGold = '#d2a907';
const richBlack = '#0a0a0a';
const pureWhite = '#ffffff';

export const Colors = {
  light: {
    brand: brandGold,
    text: '#1C1C1E',
    subtext: '#636366',
    background: '#F8F9FA', // Soft premium grey-white
    card: '#FFFFFF',
    border: '#E5E5EA',
    tint: brandGold,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: brandGold,
    error: '#FF3B30',
    success: '#34C759',
  },
  dark: {
    brand: brandGold,
    text: '#F2F2F7',
    subtext: '#8E8E93',
    background: richBlack,
    card: '#1C1C1E',
    border: '#38383A',
    tint: pureWhite,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: pureWhite,
    error: '#FF453A',
    success: '#30D158',
  },
};

export const Fonts = Platform.select({
    ios: {
      sans: 'Inter, system-ui',
      bold: 'Inter-Bold, system-ui',
      medium: 'Inter-Medium, system-ui',
      mono: 'ui-monospace',
    },
    default: {
      sans: 'Inter, sans-serif',
      bold: 'Inter-Bold, sans-serif',
      medium: 'Inter-Medium, sans-serif',
      mono: 'monospace',
    },
  });
