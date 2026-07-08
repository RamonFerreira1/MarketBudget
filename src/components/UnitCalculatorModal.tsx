import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';

interface PackageOption {
  label: string;
  weight: string;   // ex: "500" (gramas ou ml)
  price: string;    // ex: "4.99"
}

interface UnitCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrice: (price: number) => void;
}

const UnitCalculatorModal: React.FC<UnitCalculatorModalProps> = ({
  visible,
  onClose,
  onSelectPrice,
}) => {
  const [packages, setPackages] = useState<PackageOption[]>([
    { label: 'Embalagem A', weight: '', price: '' },
    { label: 'Embalagem B', weight: '', price: '' },
  ]);
  const [unit, setUnit] = useState<'g' | 'ml' | 'un'>('g');

  const updatePackage = (idx: number, field: keyof PackageOption, value: string) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === idx ? { ...pkg, [field]: value } : pkg))
    );
  };

  const addPackage = () => {
    if (packages.length >= 4) return;
    setPackages((prev) => [
      ...prev,
      { label: `Embalagem ${String.fromCharCode(65 + prev.length)}`, weight: '', price: '' },
    ]);
  };

  const removePackage = (idx: number) => {
    if (packages.length <= 2) return;
    setPackages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calcula preço por 100 unidades (gramas/ml)
  const getPricePerUnit = (pkg: PackageOption): number | null => {
    const w = parseFloat(pkg.weight.replace(',', '.'));
    const p = parseFloat(pkg.price.replace(',', '.'));
    if (isNaN(w) || w <= 0 || isNaN(p) || p <= 0) return null;
    return (p / w) * 100;
  };

  const results = packages.map((pkg, idx) => ({
    idx,
    pkg,
    pricePerUnit: getPricePerUnit(pkg),
  }));

  const validResults = results.filter((r) => r.pricePerUnit !== null);
  const cheapestIdx = validResults.length > 0
    ? validResults.reduce((min, r) => (r.pricePerUnit! < min.pricePerUnit! ? r : min)).idx
    : -1;

  const unitLabel = unit === 'un' ? '100 un' : `100${unit}`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🧮 Calculadora de Unidade</Text>
              <Text style={styles.subtitle}>Compare qual embalagem sai mais barata</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Seletor de unidade */}
          <View style={styles.unitRow}>
            {(['g', 'ml', 'un'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {packages.map((pkg, idx) => {
              const pricePerUnit = getPricePerUnit(pkg);
              const isCheapest = idx === cheapestIdx && validResults.length > 1;

              return (
                <View
                  key={idx}
                  style={[styles.pkgCard, isCheapest && styles.pkgCardCheapest]}
                >
                  <View style={styles.pkgHeader}>
                    <View style={[styles.pkgDot, isCheapest && styles.pkgDotCheapest]} />
                    <Text style={[styles.pkgLabel, isCheapest && styles.pkgLabelCheapest]}>
                      {pkg.label} {isCheapest ? '🏆 Mais barata' : ''}
                    </Text>
                    {packages.length > 2 && (
                      <TouchableOpacity
                        onPress={() => removePackage(idx)}
                        style={styles.removePkgBtn}
                      >
                        <Text style={styles.removePkgText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.pkgInputRow}>
                    <View style={styles.pkgInputGroup}>
                      <Text style={styles.inputLabel}>Peso/Volume ({unit})</Text>
                      <TextInput
                        style={styles.pkgInput}
                        placeholder="ex: 500"
                        placeholderTextColor={Colors.textMuted}
                        value={pkg.weight}
                        onChangeText={(v) => updatePackage(idx, 'weight', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.pkgInputGroup}>
                      <Text style={styles.inputLabel}>Preço (R$)</Text>
                      <TextInput
                        style={styles.pkgInput}
                        placeholder="ex: 4,99"
                        placeholderTextColor={Colors.textMuted}
                        value={pkg.price}
                        onChangeText={(v) => updatePackage(idx, 'price', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  {pricePerUnit !== null && (
                    <View style={[styles.resultRow, isCheapest && styles.resultRowCheapest]}>
                      <Text style={[styles.resultLabel, isCheapest && { color: Colors.primaryDark }]}>
                        Preço por {unitLabel}
                      </Text>
                      <Text style={[styles.resultValue, isCheapest && { color: Colors.primaryDark }]}>
                        {formatCurrency(pricePerUnit)}
                      </Text>
                    </View>
                  )}

                  {pricePerUnit !== null && (
                    <TouchableOpacity
                      style={[styles.useBtn, isCheapest && styles.useBtnCheapest]}
                      onPress={() => {
                        const p = parseFloat(pkg.price.replace(',', '.'));
                        onSelectPrice(p);
                        onClose();
                      }}
                    >
                      <Text style={styles.useBtnText}>Usar este preço (R${pkg.price})</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {packages.length < 4 && (
              <TouchableOpacity style={styles.addPkgBtn} onPress={addPackage}>
                <Text style={styles.addPkgText}>+ Adicionar embalagem</Text>
              </TouchableOpacity>
            )}

            {validResults.length >= 2 && cheapestIdx >= 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  🏆 {packages[cheapestIdx].label} é a mais barata:{' '}
                  {formatCurrency(results[cheapestIdx].pricePerUnit!)} por {unitLabel}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '90%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
  },
  unitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  unitChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  unitChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  unitChipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  unitChipTextActive: {
    color: Colors.primaryDark,
  },
  pkgCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pkgCardCheapest: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pkgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pkgDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inactive,
  },
  pkgDotCheapest: {
    backgroundColor: Colors.primary,
  },
  pkgLabel: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  pkgLabelCheapest: {
    color: Colors.primaryDark,
  },
  removePkgBtn: {
    padding: Spacing.xs,
  },
  removePkgText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pkgInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pkgInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: Typography.medium,
  },
  pkgInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  resultRowCheapest: {
    backgroundColor: Colors.primary + '20',
  },
  resultLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  resultValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  useBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  useBtnCheapest: {
    backgroundColor: Colors.primary,
  },
  useBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  addPkgBtn: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  addPkgText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  summaryText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
});

export default UnitCalculatorModal;
