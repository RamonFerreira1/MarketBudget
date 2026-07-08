import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { useAppColors, AppColors } from '../store/useThemeStore';

interface BudgetAlertModalProps {
  visible: boolean;
  overAmount: number;
  onClose: () => void;
  onRemoveItems: () => void;
}

export const BudgetAlertModal: React.FC<BudgetAlertModalProps> = ({
  visible,
  overAmount,
  onClose,
  onRemoveItems,
}) => {
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Ícone de alerta */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚠️</Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>Limite Ultrapassado!</Text>

          {/* Mensagem */}
          <Text style={styles.message}>
            Você ultrapassou seu orçamento em
          </Text>
          <Text style={styles.amount}>{formatCurrency(overAmount)}</Text>
          <Text style={styles.subMessage}>
            Considere remover alguns itens do carrinho ou ajustar as quantidades.
          </Text>

          {/* Botões */}
          <TouchableOpacity style={styles.reviewBtn} onPress={onRemoveItems}>
            <Text style={styles.reviewText}>📋 Revisar Itens</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueText}>Continuar mesmo assim</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
    ...Shadow.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  amount: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: colors.danger,
    marginVertical: Spacing.xs,
  },
  subMessage: {
    fontSize: Typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  reviewBtn: {
    width: '100%',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.danger,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.surface,
  },
  continueBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  continueText: {
    fontSize: Typography.sm,
    color: colors.textMuted,
    fontWeight: Typography.medium,
  },
});

export default BudgetAlertModal;
