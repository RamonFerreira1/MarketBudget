import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { Supermarket } from '../types';
import {
  getUserSupermarkets,
  saveSupermarket,
} from '../services/supermarketService';

interface Props {
  visible: boolean;
  onSelect: (supermarket: Supermarket | null) => void;
  onClose: () => void;
}

const SupermarketPicker: React.FC<Props> = ({ visible, onSelect, onClose }) => {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selected, setSelected] = useState<Supermarket | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setNewName('');
      loadSupermarkets();
    }
  }, [visible]);

  const loadSupermarkets = async () => {
    setLoading(true);
    try {
      const data = await getUserSupermarkets();
      setSupermarkets(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const mkt = await saveSupermarket(newName.trim());
      setSupermarkets((prev) => [...prev, mkt]);
      setSelected(mkt);
      setNewName('');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>🏪 Qual mercado você vai hoje?</Text>
          <Text style={styles.subtitle}>
            Salvaremos os preços deste mercado para comparação futura.
          </Text>

          {loading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginVertical: Spacing.xl }}
            />
          ) : (
            <>
              {supermarkets.length > 0 && (
                <FlatList
                  data={supermarkets}
                  keyExtractor={(item) => item.id}
                  horizontal={false}
                  numColumns={2}
                  columnWrapperStyle={styles.chipRow}
                  style={styles.chipList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        selected?.id === item.id && styles.chipSelected,
                      ]}
                      onPress={() =>
                        setSelected(selected?.id === item.id ? null : item)
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected?.id === item.id && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {selected?.id === item.id ? '✓ ' : ''}
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Novo mercado */}
              <View style={styles.newRow}>
                <TextInput
                  style={styles.input}
                  placeholder="+ Novo mercado..."
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleAddNew}
                />
                {newName.trim().length > 0 && (
                  <TouchableOpacity
                    style={[styles.addBtn, saving && { opacity: 0.6 }]}
                    onPress={handleAddNew}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={Colors.surface} size="small" />
                    ) : (
                      <Text style={styles.addBtnText}>Adicionar</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={() => onSelect(null)}>
              <Text style={styles.skipText}>Continuar sem mercado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.confirmText}>
                {selected ? `Ir para ${selected.name} →` : 'Selecione um mercado'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SupermarketPicker;

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
    maxHeight: '85%',
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
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  chipList: {
    maxHeight: 220,
    marginBottom: Spacing.base,
  },
  chipRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  addBtnText: {
    color: Colors.surface,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  actions: {
    gap: Spacing.sm,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.md,
  },
  confirmBtnDisabled: {
    backgroundColor: '#A0D3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  skipText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
});
