import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { formatCurrency } from '../utils/formatters';

interface BudgetProgressBarProps {
  animated?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ animated = true }) => {
  const budget = useBudgetStore((s) => s.budget);
  const totalSpent = useBudgetStore((s) => s.totalSpent);
  const remaining = useBudgetStore((s) => s.remaining());
  const percentage = useBudgetStore((s) => s.percentage());
  const status = useBudgetStore((s) => s.status());

  const animWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animWidth, {
      toValue: percentage,
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [percentage]);

  const barColor =
    status === 'exceeded'
      ? Colors.danger
      : status === 'warning'
      ? Colors.warning
      : Colors.primary;

  const bgColor =
    status === 'exceeded'
      ? Colors.dangerBg
      : status === 'warning'
      ? Colors.warningBg
      : Colors.primaryLight;

  const width = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Labels superiores */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Gasto</Text>
          <Text style={[styles.value, { color: barColor }]}>
            {formatCurrency(totalSpent)}
          </Text>
        </View>
        <View style={styles.centerLabel}>
          <Text style={[styles.percentText, { color: barColor }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.rightAlign}>
          <Text style={styles.label}>Restante</Text>
          <Text
            style={[
              styles.value,
              { color: remaining < 0 ? Colors.danger : Colors.textPrimary },
            ]}
          >
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 ? ' acima' : ''}
          </Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Label do orçamento total */}
      <Text style={styles.budgetTotal}>
        Orçamento: {formatCurrency(budget)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  centerLabel: {
    alignItems: 'center',
  },
  percentText: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  track: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  budgetTotal: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default BudgetProgressBar;
