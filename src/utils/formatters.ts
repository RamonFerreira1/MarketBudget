// Utilitários de formatação para o app

// Formata número para moeda brasileira (R$ X.XXX,XX)
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

// Formata percentual
export const formatPercentage = (value: string | number): string => {
  return `${value}%`;
};

// Gera ID único simples
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Formata data para exibição
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
