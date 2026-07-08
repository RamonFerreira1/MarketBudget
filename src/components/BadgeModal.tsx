import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Badge } from '../services/gamificationService';
import { useAppColors, AppColors } from '../store/useThemeStore';
import { Typography, Spacing, BorderRadius, Shadow } from '../theme';

interface BadgeModalProps {
  visible: boolean;
  badges: Badge[];
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ visible, badges, onClose }) => {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [visible, scaleAnim]);

  if (!visible || badges.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>🎉 Nova Conquista! 🎉</Text>
          <Text style={styles.subtitle}>Você desbloqueou novos selos:</Text>

          {badges.map((b) => (
            <View key={b.id} style={styles.badgeRow}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{b.icon}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.badgeName}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.description}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Incrível!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...Shadow.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: { fontSize: 28 },
  infoBox: { flex: 1 },
  badgeName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#92400E',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  closeText: {
    color: colors.surface,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});

export default BadgeModal;
