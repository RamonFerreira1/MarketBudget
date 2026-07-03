import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

const CATEGORIES = [
  'Grãos', 'Laticínios', 'Carnes', 'Frutas', 'Verduras',
  'Bebidas', 'Higiene', 'Limpeza', 'Padaria', 'Congelados',
  'Temperos', 'Outros',
];

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

  React.useEffect(() => {
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
    }
  }, [visible, initialItem]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsedQty = parseInt(qty, 10);
    onAdd(trimmed, category, isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty);
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

          <Text style={styles.title}>{initialItem ? 'Editar Item' : 'Adicionar Item'}</Text>

          {/* Nome do produto */}
          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Arroz Tio João 5kg"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />

          {/* Quantidade */}
          <Text style={styles.label}>Quantidade Planejada</Text>
          <TextInput
            style={[styles.input, styles.qtyInput]}
            placeholder="1"
            placeholderTextColor={Colors.textMuted}
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
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Aviso: preço será preenchido no mercado */}
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
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  categoryTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.semibold,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.primaryDark,
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
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  addBtn: {
    flex: 2,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
});

export default AddItemModal;
