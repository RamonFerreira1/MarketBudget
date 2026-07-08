// ─── Mapa central de metadados por categoria ──────────────────────────────────
// Usado em: AddItemModal, ProductCard, PreListScreen

export interface CategoryMeta {
  icon: string;  // emoji
  color: string; // cor de fundo para o badge
  textColor: string; // cor do texto do badge
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Grãos':      { icon: '🌾', color: '#FEF3C7', textColor: '#92400E' },
  'Laticínios': { icon: '🥛', color: '#EFF6FF', textColor: '#1D4ED8' },
  'Carnes':     { icon: '🥩', color: '#FEE2E2', textColor: '#991B1B' },
  'Frutas':     { icon: '🍎', color: '#FEF9C3', textColor: '#713F12' },
  'Verduras':   { icon: '🥦', color: '#DCFCE7', textColor: '#166534' },
  'Bebidas':    { icon: '🧴', color: '#F0F9FF', textColor: '#0369A1' },
  'Higiene':    { icon: '🧼', color: '#FAF5FF', textColor: '#6B21A8' },
  'Limpeza':    { icon: '🧹', color: '#ECFEFF', textColor: '#155E75' },
  'Padaria':    { icon: '🍞', color: '#FFF7ED', textColor: '#9A3412' },
  'Congelados': { icon: '🧊', color: '#EFF6FF', textColor: '#1E3A8A' },
  'Temperos':   { icon: '🧄', color: '#FDF4FF', textColor: '#701A75' },
  'Outros':     { icon: '🛒', color: '#F8FAFC', textColor: '#475569' },
};

export const CATEGORIES = Object.keys(CATEGORY_META);

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META['Outros'];
}
