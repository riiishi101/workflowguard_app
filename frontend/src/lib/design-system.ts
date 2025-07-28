// WorkflowGuard Design System
// Comprehensive UI/UX consistency across all screens

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
    card: '#ffffff',
    cardHover: '#f8fafc',
  },
  
  // Border Colors
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
    focus: '#3b82f6',
  },
  
  // Text Colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
    link: '#3b82f6',
    linkHover: '#2563eb',
  },
} as const;

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  docked: '10',
  dropdown: '1000',
  sticky: '1100',
  banner: '1200',
  overlay: '1300',
  modal: '1400',
  popover: '1500',
  skipLink: '1600',
  toast: '1700',
  tooltip: '1800',
} as const;

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Component-specific styles
export const components = {
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadow: shadows.md,
    backgroundColor: colors.background.card,
    border: `1px solid ${colors.border.light}`,
    transition: `all ${transitions.duration.normal} ${transitions.easing.ease}`,
    hover: {
      shadow: shadows.lg,
      transform: 'translateY(-2px)',
    },
  },
  button: {
    primary: {
      backgroundColor: colors.primary[600],
      color: colors.text.inverse,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.fontWeight.medium,
      transition: `all ${transitions.duration.fast} ${transitions.easing.ease}`,
      hover: {
        backgroundColor: colors.primary[700],
        transform: 'translateY(-1px)',
        shadow: shadows.md,
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.border.medium}`,
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.fontWeight.medium,
      transition: `all ${transitions.duration.fast} ${transitions.easing.ease}`,
      hover: {
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.dark,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.md}`,
      fontWeight: typography.fontWeight.normal,
      transition: `all ${transitions.duration.fast} ${transitions.easing.ease}`,
      hover: {
        backgroundColor: colors.background.secondary,
        color: colors.text.primary,
      },
    },
  },
  input: {
    border: `1px solid ${colors.border.medium}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    transition: `all ${transitions.duration.fast} ${transitions.easing.ease}`,
    focus: {
      borderColor: colors.border.focus,
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      outline: 'none',
    },
  },
  table: {
    header: {
      backgroundColor: colors.background.secondary,
      borderBottom: `1px solid ${colors.border.light}`,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary,
    },
    row: {
      borderBottom: `1px solid ${colors.border.light}`,
      transition: `background-color ${transitions.duration.fast} ${transitions.easing.ease}`,
      hover: {
        backgroundColor: colors.background.secondary,
      },
    },
  },
  badge: {
    success: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
      border: `1px solid ${colors.success[200]}`,
    },
    warning: {
      backgroundColor: colors.warning[100],
      color: colors.warning[700],
      border: `1px solid ${colors.warning[200]}`,
    },
    error: {
      backgroundColor: colors.error[100],
      color: colors.error[700],
      border: `1px solid ${colors.error[200]}`,
    },
    info: {
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
      border: `1px solid ${colors.primary[200]}`,
    },
  },
} as const;

// Layout constants
export const layout = {
  header: {
    height: '64px',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.border.light}`,
    padding: `0 ${spacing.lg}`,
  },
  sidebar: {
    width: '280px',
    backgroundColor: colors.background.secondary,
    borderRight: `1px solid ${colors.border.light}`,
  },
  content: {
    padding: spacing.lg,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  container: {
    padding: spacing.lg,
    maxWidth: '1400px',
    margin: '0 auto',
  },
} as const;

// Animation keyframes
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideDown: {
    from: { transform: 'translateY(-20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
} as const;

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  zIndex,
  transitions,
  components,
  layout,
  animations,
}; 