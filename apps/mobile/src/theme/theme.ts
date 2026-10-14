export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  bgSecondary: string;
  card: string;
  cardElevated: string;
  cardBorder: string;
  cardBorderHighlight: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Brand & Accents (Method X Palette)
  primary: string;         // Signature Teal (#0D9488)
  primaryLight: string;    // #14B8A6
  primaryBg: string;       // #F0FDFA
  
  // Semantics
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;
  
  // Soft Inset Tints from Method X
  tintTeal: string;
  tintBlue: string;
  tintRose: string;
  tintMint: string;
  
  // Shadows & Navigation
  divider: string;
  shadowColor: string;
  navBg: string;
  navBorder: string;
}

export const LightTheme: ThemeColors = {
  mode: 'light',
  bg: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardBorderHighlight: '#CBD5E1',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  
  primary: '#0D9488',       // Method X signature teal
  primaryLight: '#14B8A6',
  primaryBg: '#F0FDFA',
  
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#F43F5E',
  dangerBg: '#FFF1F2',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  
  tintTeal: '#F0FDFA',
  tintBlue: '#EFF6FF',
  tintRose: '#FFF1F2',
  tintMint: '#ECFDF5',
  
  divider: '#E2E8F0',
  shadowColor: '#64748B',
  navBg: 'rgba(255, 255, 255, 0.98)',
  navBorder: 'rgba(226, 232, 240, 0.9)'
};

export const DarkTheme: ThemeColors = {
  mode: 'dark',
  bg: '#070A12',
  bgSecondary: '#0B1120',
  card: 'rgba(15, 23, 42, 0.88)',
  cardElevated: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderHighlight: 'rgba(13, 148, 136, 0.35)',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#070A12',
  
  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryBg: 'rgba(20, 184, 166, 0.15)',
  
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  info: '#38BDF8',
  infoBg: 'rgba(56, 189, 248, 0.15)',
  
  tintTeal: 'rgba(13, 148, 136, 0.15)',
  tintBlue: 'rgba(2, 132, 199, 0.15)',
  tintRose: 'rgba(244, 63, 94, 0.15)',
  tintMint: 'rgba(16, 185, 129, 0.15)',
  
  divider: 'rgba(255, 255, 255, 0.08)',
  shadowColor: '#000000',
  navBg: 'rgba(12, 17, 30, 0.95)',
  navBorder: 'rgba(255, 255, 255, 0.1)'
};
