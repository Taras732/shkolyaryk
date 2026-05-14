export const colors = {
  primary: '#6C5CE7',
  primaryLight: '#EEEAFF',
  primaryDark: '#5546B8',
  secondary: '#FF6EC7',
  accentYellow: '#FFD93D',
  success: '#22C55E',
  error: '#EF4444',
  danger: '#EF4444',
  warning: '#FF9F43',
  surface: '#FFFFFF',
  surfaceSoft: '#F4F2FF',
  card: '#FFFFFF',
  bg: '#EFE9FF',
  bgGradientStart: '#DFE6FF',
  bgGradientEnd: '#F7E6FF',
  text: '#1F1B3A',
  textMuted: '#635E82',
  textDisabled: '#C4C0D9',
  border: '#E4DFF5',
  islandMath: '#FF6B35',
  islandLetters: '#4ECDC4',
  islandEnglish: '#FF85A1',
  islandLogic: '#845EC2',
  islandMemory: '#F9C74F',
  islandScience: '#43AA8B',
  islandEmotions: '#FF6F91',
  islandCreativity: '#4CC9F0',
  islandGeography: '#3B82F6',
  mascotKokoBg: '#FFF4C2',
  mascotKokoAccent: '#F4A300',
  mascotBambiBg: '#D6F5D6',
  mascotBambiAccent: '#2E8B57',
  mascotLisaBg: '#FFE0C2',
  mascotLisaAccent: '#E8721A',
  mascotSofiBg: '#E5D9FF',
  mascotSofiAccent: '#7B5EA7',
  avatarBg1: '#FFE0B2',
  avatarBg2: '#FFF9C4',
  avatarBg3: '#F8BBD0',
  avatarBg4: '#E1BEE7',
  avatarBg5: '#D7CCC8',
  avatarBg6: '#C4E9E4',
} as const;

export const gradients = {
  appShell: ['#DFE6FF', '#F7E6FF'] as const,
  primaryButton: ['#6C5CE7', '#8B7CF6'] as const,
  xpCard: ['#6C5CE7', '#8B7CF6'] as const,
  toastCelebrate: ['#FFD93D', '#FF9F43'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const shadows = {
  card: {
    boxShadow: '0px 6px 14px rgba(50, 40, 120, 0.08)',
    elevation: 3,
  },
  cardRaised: {
    boxShadow: '0px 10px 24px rgba(108, 92, 231, 0.25)',
    elevation: 8,
  },
  btn: {
    boxShadow: '0px 4px 12px rgba(108, 92, 231, 0.25)',
    elevation: 4,
  },
  btnPressed: {
    boxShadow: '0px 2px 6px rgba(108, 92, 231, 0.35)',
    elevation: 2,
  },
} as const;

export const fontFamily = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 48,
} as const;

export const typeScale = {
  toddler: { h1: 28, h2: 24, body: 20, caption: 18 },
  preschool: { h1: 26, h2: 22, body: 18, caption: 16 },
  grade1: { h1: 24, h2: 20, body: 16, caption: 14 },
  grade2: { h1: 24, h2: 20, body: 16, caption: 14 },
  parent: { h1: 24, h2: 20, body: 16, caption: 14 },
} as const;

export const tapTargets = {
  toddler: 64,
  preschool: 56,
  school: 48,
  parent: 44,
} as const;

export const lineHeightMultiplier = 1.4;
