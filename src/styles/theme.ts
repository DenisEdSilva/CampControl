import type { ViewStyle, TextStyle } from 'react-native';

export const theme = {
  colors: {
    background: '#f6e9cf',
    card: '#fffaf0',
    textPrimary: '#878175',
    textSecondary: '#a19a8e',
    textOnPrimary: '#f6e9cf',
    accent: '#ff4757',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#878175',
    } as TextStyle,
    body: {
      fontSize: 16,
      color: '#878175',
    } as TextStyle,
  },
  cardStyle: {
    backgroundColor: '#fffaf0',
    borderRadius: 12,
    elevation: 3,
  } as ViewStyle,
  buttonStyle: {
    backgroundColor: '#878175',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  } as ViewStyle,
};