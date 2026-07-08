import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAppColors, AppColors } from '../store/useThemeStore';
import { Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { generateShoppingList, AIProductSuggestion } from '../services/aiService';

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItems: (items: AIProductSuggestion[]) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ visible, onClose, onAddItems }) => {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIProductSuggestion[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await generateShoppingList(prompt);
      setSuggestions(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onAddItems(suggestions);
    setPrompt('');
    setSuggestions([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>✨ Assistente Inteligente</Text>
          <Text style={styles.subtitle}>Descreva o que você precisa planejar e eu crio a lista.</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex: Churrasco para 10 pessoas domingo..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          <TouchableOpacity 
            style={[styles.genBtn, loading && styles.btnDisabled]} 
            onPress={handleGenerate} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.genText}>Gerar Lista</Text>}
          </TouchableOpacity>

          {suggestions.length > 0 && (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsTitle}>Itens Sugeridos ({suggestions.length})</Text>
              <ScrollView style={styles.scroll}>
                {suggestions.map((s, i) => (
                  <Text key={i} style={styles.sugText}>• {s.quantity}x {s.name} <Text style={{color: colors.textMuted}}>({s.category})</Text></Text>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.addBtn} onPress={handleConfirm}>
                <Text style={styles.addText}>Adicionar todos à Lista</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadow.lg, maxHeight: '90%' },
  title: { fontSize: Typography.lg, fontWeight: Typography.extrabold, color: colors.primaryDark, marginBottom: 4 },
  subtitle: { fontSize: Typography.sm, color: colors.textSecondary, marginBottom: Spacing.lg },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, minHeight: 100, textAlignVertical: 'top', color: colors.textPrimary, marginBottom: Spacing.md },
  genBtn: { backgroundColor: colors.primary, padding: Spacing.base, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  genText: { color: colors.surface, fontWeight: Typography.bold, fontSize: Typography.base },
  resultsBox: { marginTop: Spacing.xl, flexShrink: 1 },
  resultsTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary, marginBottom: Spacing.sm },
  scroll: { maxHeight: 200, backgroundColor: colors.background, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  sugText: { fontSize: Typography.sm, color: colors.textPrimary, marginBottom: 4 },
  addBtn: { backgroundColor: '#10B981', padding: Spacing.base, borderRadius: BorderRadius.md, alignItems: 'center' },
  addText: { color: 'white', fontWeight: Typography.bold },
  closeBtn: { marginTop: Spacing.xl, alignItems: 'center', padding: Spacing.sm },
  closeText: { color: colors.textSecondary, fontWeight: Typography.bold },
});

export default AIAssistantModal;
