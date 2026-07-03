import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ShoppingItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import PriceTagBadge from './PriceTagBadge';

interface ProductCardProps {
  item: ShoppingItem;
  mode: 'pre-list' | 'in-market';
  onPress: (item: ShoppingItem) => void;
  onRemove?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  mode,
  onPress,
  onRemove,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress(item);
  };

  // ─── Estados visuais ────────────────────────────────────────────────────────
  const isInCart = item.addedToCart;
  const hasPrice = item.unitPrice !== null;

  const cardBorderColor = isInCart ? Colors.primary : Colors.border;
  const cardBg = isInCart ? Colors.primaryLight : Colors.surface;

  // Ícone de categoria (emoji simples)
  const categoryEmoji = getCategoryEmoji(item.category);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorderColor,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Indicador de status lateral */}
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: isInCart
                ? Colors.primary
                : mode === 'in-market'
                ? Colors.warning
                : Colors.inactive,
            },
          ]}
        />

        {/* Conteúdo principal */}
        <View style={styles.content}>
          {/* Linha superior: Emoji + Nome + Badge de preço */}
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <Text style={styles.emoji}>{categoryEmoji}</Text>
              <View style={styles.nameBlock}>
                <Text
                  style={[
                    styles.name,
                    isInCart && { textDecorationLine: 'none' },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            </View>

            {/* Badge de variação de preço */}
            {item.priceVariation && (
              <PriceTagBadge variation={item.priceVariation} size="sm" />
            )}
          </View>

          {/* Linha inferior: Quantidade | Preço | Total */}
          {mode === 'in-market' && !hasPrice ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintIcon}>👆</Text>
              <Text style={styles.hintText}>
                Toque para informar o preço e a quantidade pega (Planejado: {item.plannedQty})
              </Text>
            </View>
          ) : (
            <View style={styles.bottomRow}>
              {/* Quantidade */}
              <View style={styles.infoChip}>
                <Text style={styles.infoLabel}>Qtd</Text>
                <Text style={styles.infoValue}>
                  {isInCart && item.actualQty !== null
                    ? item.actualQty
                    : item.plannedQty}
                </Text>
              </View>

              {/* Preço unitário */}
              <View style={styles.infoChip}>
                <Text style={styles.infoLabel}>Un.</Text>
                <Text style={styles.infoValue}>
                  {hasPrice ? formatCurrency(item.unitPrice!) : '—'}
                </Text>
              </View>

              {/* Total */}
              <View style={[styles.infoChip, styles.totalChip]}>
                <Text style={styles.infoLabel}>Total</Text>
                <Text style={[styles.totalValue]}>
                  {item.totalPrice !== null
                    ? formatCurrency(item.totalPrice)
                    : '—'}
                </Text>
              </View>
            </View>
          )}

          {/* Tooltip de variação de preço */}
          {item.priceVariation && (
            <Text style={styles.priceTooltip}>
              {item.priceVariation.direction === 'up' ? '🔴' : '🟢'}{' '}
              {item.priceVariation.direction === 'up'
                ? `${item.priceVariation.percentage}% mais caro que da última vez (era ${formatCurrency(item.priceVariation.previousPrice)})`
                : `${item.priceVariation.percentage}% mais barato que da última vez (era ${formatCurrency(item.priceVariation.previousPrice)})`}
            </Text>
          )}
          
          {/* Motivo de alteração de qtd */}
          {item.qtyChangeReason && (
            <Text style={[styles.priceTooltip, { marginTop: 2, color: '#F39C12' }]}>
              ⚠️ Qtd alterada: {item.qtyChangeReason}
            </Text>
          )}
        </View>

        {/* Botão de remoção (apenas pre-list) */}
        {mode === 'pre-list' && onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(item.id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Checkmark quando no carrinho */}
        {isInCart && (
          <View style={styles.checkMark}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Mapeia categorias para emojis
function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Grãos': '🌾',
    'Laticínios': '🥛',
    'Carnes': '🥩',
    'Frutas': '🍎',
    'Verduras': '🥦',
    'Bebidas': '🧴',
    'Higiene': '🧼',
    'Limpeza': '🧹',
    'Padaria': '🍞',
    'Congelados': '🧊',
    'Temperos': '🧄',
    'Outros': '🛒',
  };
  return map[category] ?? '🛒';
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  category: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoChip: {
    backgroundColor: Colors.divider,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    minWidth: 56,
  },
  totalChip: {
    backgroundColor: Colors.primaryLight,
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  totalValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginTop: 1,
  },
  priceTooltip: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  hintIcon: {
    fontSize: 16,
  },
  hintText: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.semibold,
  },
  removeBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
  },
  checkMark: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 13,
    color: Colors.surface,
    fontWeight: Typography.bold,
  },
});

export default ProductCard;
