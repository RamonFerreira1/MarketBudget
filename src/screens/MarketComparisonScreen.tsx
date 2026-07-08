import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { getAllMarketsComparison } from '../services/priceHistoryService';
import { ProductMarketComparison, MarketPriceStat } from '../types';
import { useAppColors, AppColors } from '../store/useThemeStore';

const MarketComparisonScreen: React.FC = () => {
  const navigation = useNavigation();
  const [comparisons, setComparisons] = useState<ProductMarketComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllMarketsComparison();
      setComparisons(data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const trendIcon = (stat: MarketPriceStat) => {
    if (stat.trend === 'up') return `⬆ +${stat.trendPercent}%`;
    if (stat.trend === 'down') return `⬇ -${stat.trendPercent}%`;
    return '→ estável';
  };

  const trendColor = (stat: MarketPriceStat) => {
    if (stat.trend === 'up') return colors.priceUp;
    if (stat.trend === 'down') return colors.priceDown;
    return colors.textMuted;
  };

  const renderStat = (stat: MarketPriceStat, isFirst: boolean, isLast: boolean, comparison: ProductMarketComparison) => {
    const isCheapest = stat.supermarketName === comparison.cheapestMarket;
    const isMostExpensive = stat.supermarketName === comparison.mostExpensiveMarket;
    return (
      <View
        key={stat.supermarketId}
        style={[
          styles.statRow,
          isCheapest && styles.statRowCheapest,
          isMostExpensive && styles.statRowExpensive,
        ]}
      >
        <View style={styles.statLeft}>
          <View style={styles.statMarketRow}>
            <Text style={styles.statMarket} numberOfLines={1}>
              {stat.supermarketName}
            </Text>
            {isCheapest && <Text style={styles.badgeCheap}>✓ Mais barato</Text>}
            {isMostExpensive && !isCheapest && (
              <Text style={styles.badgeExpensive}>↑ Mais caro</Text>
            )}
          </View>
          <Text style={[styles.statTrend, { color: trendColor(stat) }]}>
            {trendIcon(stat)} · {stat.priceCount}× registrado
          </Text>
        </View>
        <View style={styles.statRight}>
          <Text style={[styles.statPrice, isCheapest && { color: colors.priceDown }, isMostExpensive && !isCheapest && { color: colors.priceUp }]}>
            {formatCurrency(stat.lastPrice)}
          </Text>
          <Text style={styles.statAvg}>média {formatCurrency(stat.avgPrice)}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ProductMarketComparison }) => {
    const isOpen = expanded === item.productName;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setExpanded(isOpen ? null : item.productName)}
      >
        {/* Header do produto */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productSummary}>
              🏪 {item.cheapestMarket} é{' '}
              <Text style={{ color: colors.priceDown, fontWeight: Typography.bold }}>
                {formatCurrency(item.priceDiff)} ({item.priceDiffPercent}%)
              </Text>{' '}
              mais barato
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.expandIcon}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </View>

        {/* Detalhe por mercado */}
        {isOpen && (
          <View style={styles.statsContainer}>
            <View style={styles.statsDivider} />
            {item.stats.map((stat, idx) =>
              renderStat(stat, idx === 0, idx === item.stats.length - 1, item)
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🏪 Comparação de Mercados</Text>
          <Text style={styles.headerSub}>Preços reais das suas compras</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analisando preços...</Text>
        </View>
      ) : comparisons.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Nenhuma comparação ainda</Text>
          <Text style={styles.emptyDesc}>
            Faça compras em ao menos 2 mercados diferentes com os mesmos produtos para ver a comparação aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={comparisons}
          keyExtractor={(item) => item.productName}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {comparisons.length} produto{comparisons.length !== 1 ? 's' : ''} com dados de múltiplos mercados
            </Text>
          }
        />
      )}
    </View>
  );
};

export default MarketComparisonScreen;

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    ...Platform.select({
      web: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
      default: { flex: 1 },
    }),
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: Spacing.xxxl + Spacing.base,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.surface,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: colors.surface,
  },
  headerSub: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.base,
    color: colors.textMuted,
    fontSize: Typography.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: 80,
  },
  listHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadow.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    paddingLeft: Spacing.sm,
  },
  productName: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  productSummary: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  expandIcon: {
    fontSize: Typography.xs,
    color: colors.textMuted,
  },
  statsContainer: {
    marginTop: Spacing.sm,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  statRowCheapest: {
    backgroundColor: colors.priceDownBg,
  },
  statRowExpensive: {
    backgroundColor: colors.priceUpBg,
  },
  statLeft: {
    flex: 1,
  },
  statMarketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statMarket: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  badgeCheap: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: colors.priceDown,
    backgroundColor: colors.priceDownBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.priceDown,
  },
  badgeExpensive: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: colors.priceUp,
    backgroundColor: colors.priceUpBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.priceUp,
  },
  statTrend: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statPrice: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: colors.textPrimary,
  },
  statAvg: {
    fontSize: Typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
