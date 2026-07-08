import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ShoppingItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import PriceTagBadge from './PriceTagBadge';
import UnitCalculatorModal from './UnitCalculatorModal';

interface MarketItemModalProps {
  visible: boolean;
  item: ShoppingItem | null;
  onClose: () => void;
  onConfirm: (id: string, actualQty: number, unitPrice: number, reason?: string) => void;
  loadingVariation?: boolean;
}

export const MarketItemModal: React.FC<MarketItemModalProps> = ({
  visible,
  item,
  onClose,
  onConfirm,
  loadingVariation = false,
}) => {
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [calcVisible, setCalcVisible] = useState(false);

  const REASON_OPTIONS = ['Em falta', 'Promoção', 'Preço Alto', 'Achei necessário', 'Outro'];

  useEffect(() => {
    if (item) {
      setQty(String(item.plannedQty));
      setPrice(item.unitPrice ? String(item.unitPrice) : '');
      setReason(item.qtyChangeReason || '');
    }
  }, [item]);

  if (!item) return null;

  const parsedQty = parseFloat(qty.replace(',', '.'));
  const parsedPrice = parseFloat(price.replace(',', '.'));
  const isValid = !isNaN(parsedQty) && parsedQty > 0 && !isNaN(parsedPrice) && parsedPrice > 0;
  const estimatedTotal =
    isValid ? parsedQty * parsedPrice : 0;

  const handleConfirm = () => {
    if (!isValid) return;
    const finalReason = parsedQty !== item.plannedQty ? reason : undefined;
    onConfirm(item.id, parsedQty, parsedPrice, finalReason);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Cabeçalho do produto */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            </View>
            {item.priceVariation && (
              <PriceTagBadge variation={item.priceVariation} size="md" />
            )}
          </View>

          {/* Loading de variação */}
          {loadingVariation && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Consultando histórico de preços...</Text>
            </View>
          )}

          {/* Quantidade real */}
          <Text style={styles.label}>Quantidade no Carrinho</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const v = parseFloat(qty.replace(',', '.'));
                if (!isNaN(v) && v > 1) setQty(String(v - 1));
              }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const v = parseFloat(qty.replace(',', '.'));
                setQty(String(isNaN(v) ? 1 : v + 1));
              }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Motivo de alteração de quantidade */}
          {isValid && parsedQty !== item.plannedQty && (
            <View style={styles.reasonContainer}>
              <Text style={styles.label}>Motivo da alteração ({item.plannedQty} → {parsedQty})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reasonRow}>
                {REASON_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.reasonChip, reason === opt && styles.reasonChipActive]}
                    onPress={() => setReason(opt)}
                  >
                    <Text style={[styles.reasonText, reason === opt && styles.reasonTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {reason === 'Outro' && (
                <TextInput
                  style={[styles.input, { marginTop: Spacing.sm }]}
                  placeholder="Qual o motivo?"
                  placeholderTextColor={Colors.textMuted}
                  value={reason === 'Outro' ? '' : reason}
                  onChangeText={setReason}
                />
              )}
            </View>
          )}

          {/* Preço unitário */}
          <View style={styles.priceLabelRow}>
            <Text style={styles.label}>Preço Unitário (R$)</Text>
            <TouchableOpacity
              style={styles.calcBtn}
              onPress={() => setCalcVisible(true)}
            >
              <Text style={styles.calcBtnText}>🧮 Comparar embalagens</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            placeholderTextColor={Colors.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          {/* Preview do total */}
          {isValid && (
            <View style={styles.totalPreview}>
              <Text style={styles.totalLabel}>Total calculado</Text>
              <Text style={styles.totalValue}>{formatCurrency(estimatedTotal)}</Text>
            </View>
          )}

          {/* Calculadora de Unidade */}
          <UnitCalculatorModal
            visible={calcVisible}
            onClose={() => setCalcVisible(false)}
            onSelectPrice={(p) => setPrice(String(p))}
          />

          {/* Botões */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !isValid && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <Text style={styles.confirmText}>✓ Confirmar</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  category: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
  loadingText: {
    fontSize: Typography.sm,
    color: Colors.primaryDark,
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calcBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  calcBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primaryDark,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: Typography.bold,
    lineHeight: 28,
  },
  qtyInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  reasonContainer: {
    marginBottom: Spacing.base,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  reasonChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  reasonText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  reasonTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.bold,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: Typography.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.medium,
  },
  totalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
});

export default MarketItemModal;
