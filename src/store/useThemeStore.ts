import { create } from 'zustand';

// ─── Paleta clara (original) ──────────────────────────────────────────────────
export const LightColors = {
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#059669',
  background: '#F4F6F5',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  textPrimary: '#1A202C',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  danger: '#F87171',
  dangerBg: '#FEF2F2',
  warning: '#FBBF24',
  warningBg: '#FFFBEB',
  success: '#10B981',
  priceUp: '#EF4444',
  priceDown: '#10B981',
  priceUpBg: '#FEF2F2',
  priceDownBg: '#ECFDF5',
  inactive: '#CBD5E1',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// ─── Paleta escura ────────────────────────────────────────────────────────────
export const DarkColors = {
  primary: '#34D399',
  primaryLight: '#064E3B',
  primaryDark: '#10B981',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  divider: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  danger: '#F87171',
  dangerBg: '#450A0A',
  warning: '#FBBF24',
  warningBg: '#422006',
  success: '#34D399',
  priceUp: '#F87171',
  priceDown: '#34D399',
  priceUpBg: '#450A0A',
  priceDownBg: '#064E3B',
  inactive: '#334155',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type AppColors = typeof LightColors;

// ─── Store ────────────────────────────────────────────────────────────────────

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  colors: AppColors;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: false,
  colors: LightColors,
  toggle: () => {
    const next = !get().isDark;
    set({ isDark: next, colors: next ? DarkColors : LightColors });
  },
}));

/** Hook conveniente — retorna apenas as cores */
export const useAppColors = () => useThemeStore((s) => s.colors);
