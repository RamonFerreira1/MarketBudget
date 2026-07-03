// Paleta de cores do MarketBudget
export const Colors = {
  // Primárias
  primary: '#10B981',        // Verde esmeralda
  primaryLight: '#D1FAE5',   // Verde claro (fundo suave)
  primaryDark: '#059669',    // Verde escuro

  // Neutros
  background: '#F4F6F5',     // Cinza clarinho (fundo de tela)
  surface: '#FFFFFF',        // Branco (cards)
  border: '#E2E8F0',         // Bordas suaves
  divider: '#F1F5F9',

  // Texto
  textPrimary: '#1A202C',    // Quase preto
  textSecondary: '#64748B',  // Cinza médio
  textMuted: '#94A3B8',      // Cinza claro

  // Alertas
  danger: '#F87171',         // Vermelho coral
  dangerBg: '#FEF2F2',       // Fundo vermelho suave
  warning: '#FBBF24',        // Amarelo atenção
  warningBg: '#FFFBEB',      // Fundo amarelo suave
  success: '#10B981',        // Verde sucesso

  // Preço
  priceUp: '#EF4444',        // Vermelho preço subiu
  priceDown: '#10B981',      // Verde preço baixou
  priceUpBg: '#FEF2F2',
  priceDownBg: '#ECFDF5',

  // Estado inativo
  inactive: '#CBD5E1',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Typography = {
  // Tamanhos
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,

  // Pesos
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
