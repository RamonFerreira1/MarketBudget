import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { CATEGORIES, getCategoryMeta } from '../constants/categories';
import { getFavorites, toggleFavorite } from '../services/favoritesService';
import { useAppColors, AppColors } from '../store/useThemeStore';
import BarcodeScannerModal from './BarcodeScannerModal';
import { BarcodeProductInfo } from '../services/barcodeService';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string, plannedQty: number) => void;
  initialItem?: { name: string; category: string; plannedQty: number } | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onAdd,
  initialItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Outros');
  const [qty, setQty] = useState('1');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (visible) {
      if (initialItem) {
        setName(initialItem.name);
        setCategory(initialItem.category);
        setQty(String(initialItem.plannedQty));
      } else {
        setName('');
        setCategory('Outros');
        setQty('1');
      }
      // Load favorites when modal opens
      setLoadingFavs(true);
      getFavorites()
        .then(setFavorites)
        .finally(() => setLoadingFavs(false));
    }
  }, [visible, initialItem]);

  const isCurrentFavorite = favorites.includes(name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  const handleToggleFavorite = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTogglingFav(true);
    const updated = await toggleFavorite(trimmed);
    setFavorites(updated);
    setTogglingFav(false);
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsedQty = parseInt(qty, 10);
    onAdd(trimmed, category, isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty);
    onClose();
  };

  const handlePickFavorite = (favName: string) => {
    setName(favName);
    setShowFavorites(false);
  };

  const handleProductScanned = (product: BarcodeProductInfo) => {
    setName(product.name);
    // Tenta adivinhar a categoria (bem rudimentar, mas ajuda)
    const lname = product.name.toLowerCase();
    if (lname.includes('leite') || lname.includes('queijo')) setCategory('Laticínios');
    else if (lname.includes('carne') || lname.includes('frango')) setCategory('Açougue');
    else if (lname.includes('pão') || lname.includes('bolo')) setCategory('Padaria');
    else if (lname.includes('sabão') || lname.includes('detergente')) setCategory('Limpeza');
    else setCategory('Outros');
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

          <Text style={styles.title}>{initialItem ? 'Editar Item' : 'Adicionar Item'}</Text>

          {/* Seção de Favoritos */}
          {!initialItem && (
            <TouchableOpacity
              style={styles.favToggleBtn}
              onPress={() => setShowFavorites(!showFavorites)}
            >
              <Text style={styles.favToggleText}>⭐ Favoritos</Text>
              <Text style={styles.favToggleArrow}>{showFavorites ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}

          {showFavorites && (
            <View style={styles.favSection}>
              {loadingFavs ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : favorites.length === 0 ? (
                <Text style={styles.favEmpty}>Nenhum favorito ainda. Adicione produtos com ⭐</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favRow}>
                  {favorites.map((fav) => (
                    <TouchableOpacity
                      key={fav}
                      style={styles.favChip}
                      onPress={() => handlePickFavorite(fav)}
                    >
                      <Text style={styles.favChipText}>⭐ {fav}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Nome do produto */}
          <Text style={styles.label}>Nome do Produto</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Ex: Arroz Tio João 5kg"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus={!showFavorites}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => setScannerVisible(true)}
            >
              <Text style={styles.scanBtnIcon}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.favBtn, isCurrentFavorite && styles.favBtnActive]}
              onPress={handleToggleFavorite}
              disabled={!name.trim() || togglingFav}
            >
              <Text style={styles.favBtnIcon}>{isCurrentFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quantidade */}
          <Text style={styles.label}>Quantidade Planejada</Text>
          <TextInput
            style={[styles.input, styles.qtyInput]}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
            returnKeyType="done"
          />

          {/* Categoria */}
          <Text style={styles.label}>Categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => {
              const meta = getCategoryMeta(cat);
              const isActive = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isActive && { backgroundColor: meta.color, borderColor: meta.textColor },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryIcon}>{meta.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && { color: meta.textColor, fontWeight: Typography.semibold },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Aviso */}
          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>ℹ️</Text>
            <Text style={styles.noticeText}>
              O preço será preenchido quando você estiver no mercado.
            </Text>
          </View>

          {/* Botões */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Text style={styles.addText}>{initialItem ? 'Salvar' : 'Adicionar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onProductFound={handleProductScanned}
      />
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
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.base,
  },
  favToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: Spacing.sm,
  },
  favToggleText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: '#92400E',
  },
  favToggleArrow: {
    fontSize: Typography.xs,
    color: '#92400E',
  },
  favSection: {
    marginBottom: Spacing.base,
    minHeight: 44,
    justifyContent: 'center',
  },
  favEmpty: {
    fontSize: Typography.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  favRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  favChip: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  favChipText: {
    fontSize: Typography.sm,
    color: '#92400E',
    fontWeight: Typography.semibold,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  nameInput: {
    flex: 1,
    marginBottom: 0,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnIcon: { fontSize: 20 },
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  favBtnIcon: {
    fontSize: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: colors.textPrimary,
    marginBottom: Spacing.base,
  },
  qtyInput: {
    width: 100,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.base,
    marginBottom: Spacing.base,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    fontWeight: Typography.medium,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.sm,
    color: colors.primaryDark,
    fontWeight: Typography.medium,
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
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
  },
  addBtn: {
    flex: 2,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.surface,
  },
});

export default AddItemModal;
