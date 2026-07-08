import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import {
  getActivePromotions,
  savePromotion,
  deletePromotion,
  daysUntilExpiry,
  Promotion,
} from '../services/promotionService';
import { formatCurrency } from '../utils/formatters';
import { useAppColors, AppColors } from '../store/useThemeStore';

interface PromotionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const PromotionsModal: React.FC<PromotionsModalProps> = ({ visible, onClose }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [market, setMarket] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [saving, setSaving] = useState(false);

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (visible) {
      loadPromos();
      setShowForm(false);
      resetForm();
    }
  }, [visible]);

  const loadPromos = async () => {
    setLoading(true);
    const data = await getActivePromotions();
    setPromotions(data);
    setLoading(false);
  };

  const resetForm = () => {
    setProductName('');
    setPrice('');
    setMarket('');
    setExpiryDays('7');
  };

  const handleSave = async () => {
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (!productName.trim() || !market.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Campos obrigatórios', 'Preencha nome do produto, preço e mercado.');
      return;
    }
    const days = parseInt(expiryDays, 10);
    const expiresAt = new Date(Date.now() + (isNaN(days) || days < 1 ? 7 : days) * 24 * 60 * 60 * 1000).toISOString();

    setSaving(true);
    await savePromotion({ productName: productName.trim(), price: parsedPrice, supermarketName: market.trim(), expiresAt });
    setSaving(false);
    setShowForm(false);
    resetForm();
    loadPromos();
  };

  const handleDelete = (promo: Promotion) => {
    Alert.alert(
      'Remover promoção',
      `Remover promoção de "${promo.productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deletePromotion(promo.id);
            loadPromos();
          },
        },
      ]
    );
  };

  const getDaysLabel = (expiresAt: string) => {
    const days = daysUntilExpiry(expiresAt);
    if (days <= 0) return 'Expirou';
    if (days === 1) return 'Expira hoje';
    return `Expira em ${days} dias`;
  };

  const getDaysColor = (expiresAt: string) => {
    const days = daysUntilExpiry(expiresAt);
    if (days <= 1) return colors.danger;
    if (days <= 3) return colors.warning;
    return colors.primary;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🏷️ Promoções</Text>
              <Text style={styles.subtitle}>Ofertas registradas no mercado</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Formulário de nova promoção */}
          {!showForm ? (
            <TouchableOpacity
              style={styles.addPromoBtn}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addPromoBtnText}>+ Registrar Promoção</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Nova Promoção</Text>

              <Text style={styles.label}>Produto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Arroz Tio João 5kg"
                placeholderTextColor={colors.textMuted}
                value={productName}
                onChangeText={setProductName}
                autoFocus
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Preço (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Válido por (dias)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="7"
                    placeholderTextColor={colors.textMuted}
                    value={expiryDays}
                    onChangeText={setExpiryDays}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Supermercado</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Carrefour"
                placeholderTextColor={colors.textMuted}
                value={market}
                onChangeText={setMarket}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setShowForm(false); resetForm(); }}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={colors.surface} />
                    : <Text style={styles.saveBtnText}>💾 Salvar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de promoções */}
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : promotions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏷️</Text>
              <Text style={styles.emptyTitle}>Nenhuma promoção ativa</Text>
              <Text style={styles.emptyText}>
                Registre promoções que encontrar no mercado para não esquecer.
              </Text>
            </View>
          ) : (
            <FlatList
              data={promotions}
              keyExtractor={(p) => p.id}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              renderItem={({ item: promo }) => (
                <View style={styles.promoCard}>
                  <View style={styles.promoLeft}>
                    <Text style={styles.promoName}>{promo.productName}</Text>
                    <Text style={styles.promoMarket}>📍 {promo.supermarketName}</Text>
                    <View style={[styles.expireBadge, { backgroundColor: getDaysColor(promo.expiresAt) + '20' }]}>
                      <Text style={[styles.expireText, { color: getDaysColor(promo.expiresAt) }]}>
                        ⏰ {getDaysLabel(promo.expiresAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.promoRight}>
                    <Text style={styles.promoPrice}>{formatCurrency(promo.price)}</Text>
                    <TouchableOpacity
                      style={styles.deletePromoBtn}
                      onPress={() => handleDelete(promo)}
                    >
                      <Text style={styles.deletePromoBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.border,
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
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: Typography.bold,
  },
  addPromoBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPromoBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.primaryDark,
  },
  form: {
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.base,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: colors.textPrimary,
    marginBottom: Spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: colors.surface,
  },
  list: { marginTop: Spacing.sm },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoLeft: { flex: 1 },
  promoName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  promoMarket: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expireBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  expireText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  promoRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  promoPrice: {
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: colors.primary,
  },
  deletePromoBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePromoBtnText: { fontSize: 14 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.base },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PromotionsModal;
