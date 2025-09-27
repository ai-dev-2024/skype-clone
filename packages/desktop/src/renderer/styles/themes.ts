export const lightTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    info: '#5AC8FA',
    light: '#F2F2F7',
    dark: '#1C1C1E',

    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    divider: '#E5E5EA',

    input: {
      background: '#FFFFFF',
      border: '#C6C6C8',
      focus: '#007AFF',
      error: '#FF3B30',
    },

    button: {
      primary: '#007AFF',
      secondary: '#8E8E93',
      success: '#34C759',
      danger: '#FF3B30',
    },

    message: {
      sent: '#007AFF',
      received: '#E5E5EA',
      text: '#FFFFFF',
      textReceived: '#1C1C1E',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    background: '#1C1C1E',
    surface: '#2C2C2E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    divider: '#38383A',

    input: {
      background: '#2C2C2E',
      border: '#38383A',
      focus: '#007AFF',
      error: '#FF3B30',
    },

    message: {
      sent: '#007AFF',
      received: '#38383A',
      text: '#FFFFFF',
      textReceived: '#FFFFFF',
    },
  },
};

export type Theme = typeof lightTheme;
