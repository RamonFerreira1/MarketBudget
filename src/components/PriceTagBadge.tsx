import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriceVariation } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface PriceTagBadgeProps {
  variation: PriceVariation;
  size?: 'sm' | 'md';
}

export const PriceTagBadge: React.FC<PriceTagBadgeProps> = ({
  variation,
  size = 'md',
}) => {
  const isUp = variation.direction === 'up';
  const bgColor = isUp ? Colors.priceUpBg : Colors.priceDownBg;
  const textColor = isUp ? Colors.priceUp : Colors.priceDown;
  const arrow = isUp ? '⬆' : '⬇';

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.arrow, { color: textColor, fontSize: isSmall ? 9 : 11 }]}>
        {arrow}
      </Text>
      <Text style={[styles.text, { color: textColor, fontSize: isSmall ? 10 : 12 }]}>
        {variation.percentage}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  arrow: {
    fontWeight: Typography.bold,
  },
  text: {
    fontWeight: Typography.semibold,
  },
});

export default PriceTagBadge;
