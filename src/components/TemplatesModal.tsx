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
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  ShoppingTemplate,
} from '../services/templateService';
import { ShoppingItem } from '../types';

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  currentItems: ShoppingItem[];
  onLoadTemplate: (items: ShoppingTemplate['items']) => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({
  visible,
  onClose,
  currentItems,
  onLoadTemplate,
}) => {
  const [templates, setTemplates] = useState<ShoppingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTemplates();
      setShowSaveForm(false);
      setNewName('');
    }
  }, [visible]);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await getTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (currentItems.length === 0) {
      Alert.alert('Lista vazia', 'Adicione itens à lista antes de salvar como template.');
      return;
    }
    setSaving(true);
    await saveTemplate(trimmed, currentItems);
    setSaving(false);
    setNewName('');
    setShowSaveForm(false);
    loadTemplates();
  };

  const handleLoad = (template: ShoppingTemplate) => {
    Alert.alert(
      `Carregar "${template.name}"`,
      `Isso adicionará ${template.items.length} itens à sua lista atual. Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Carregar',
          onPress: () => {
            onLoadTemplate(template.items);
            onClose();
          },
        },
      ]
    );
  };

  const handleDelete = (template: ShoppingTemplate) => {
    Alert.alert(
      'Excluir Template',
      `Deseja excluir o template "${template.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(template.id);
            loadTemplates();
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📋 Listas Salvas</Text>
              <Text style={styles.subtitle}>Templates para reutilizar</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Botão salvar atual */}
          {!showSaveForm ? (
            <TouchableOpacity
              style={styles.saveCurrentBtn}
              onPress={() => setShowSaveForm(true)}
              disabled={currentItems.length === 0}
            >
              <Text style={styles.saveCurrentText}>
                💾 Salvar lista atual como template ({currentItems.length} itens)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.saveForm}>
              <Text style={styles.saveFormLabel}>Nome do template</Text>
              <View style={styles.saveFormRow}>
                <TextInput
                  style={styles.saveInput}
                  placeholder="Ex: Compra semanal"
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.saveConfirmBtn, !newName.trim() && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={!newName.trim() || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Text style={styles.saveConfirmText}>Salvar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveCancelBtn}
                  onPress={() => setShowSaveForm(false)}
                >
                  <Text style={styles.saveCancelText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de templates */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: Spacing.xl }}
            />
          ) : templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Nenhum template salvo</Text>
              <Text style={styles.emptyText}>
                Salve sua lista atual para reutilizá-la na próxima compra.
              </Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(t) => t.id}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              renderItem={({ item: tpl }) => (
                <View style={styles.templateCard}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{tpl.name}</Text>
                    <Text style={styles.templateMeta}>
                      {tpl.items.length} itens · {formatDate(tpl.createdAt)}
                    </Text>
                    <Text style={styles.templateItems} numberOfLines={1}>
                      {tpl.items.map((i) => i.name).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.loadBtn}
                      onPress={() => handleLoad(tpl)}
                    >
                      <Text style={styles.loadBtnText}>Carregar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(tpl)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
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
    maxHeight: '85%',
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
    fontSize: Typography.xl,
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
  saveCurrentBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  saveCurrentText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  saveForm: {
    marginBottom: Spacing.base,
  },
  saveFormLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  saveFormRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  saveInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  saveConfirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  saveConfirmText: {
    color: Colors.surface,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  saveCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCancelText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
  },
  list: {
    marginTop: Spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  templateName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  templateMeta: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: Typography.medium,
  },
  templateItems: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  templateActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  loadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  loadBtnText: {
    color: Colors.surface,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TemplatesModal;
