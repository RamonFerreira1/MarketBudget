import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LOCAL_USER_ID } from '../services/authService';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

const QUICK_AMOUNTS = [100, 150, 200, 300, 500];


export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const createSession = useShoppingStore((s) => s.createSession);

  const [rawValue, setRawValue] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Formata o input como moeda enquanto digita
  const handleChangeText = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setRawValue(numeric);
  };

  const displayValue = rawValue
    ? formatCurrency(parseFloat(rawValue) / 100)
    : '';

  const budget = parseFloat(rawValue) / 100;
  const isValid = budget >= 1;

  const handleStart = () => {
    if (!isValid) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      createSession(budget, LOCAL_USER_ID);
      navigation.navigate('PreList');
    });
  };

  const handleQuickAmount = (amount: number) => {
    setRawValue(String(amount * 100));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header verde */}
      <View style={styles.header}>
        <Text style={styles.appName}>🛒 MarketBudget</Text>
        <Text style={styles.tagline}>Compras inteligentes, bolso no controle</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card principal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Qual é o orçamento de hoje?</Text>
          <Text style={styles.cardSubtitle}>
            Defina o limite máximo que você quer gastar nesta compra.
          </Text>

          {/* Input de valor */}
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={Colors.textMuted}
              value={rawValue ? displayValue.replace('R$', '').trim() : ''}
              onChangeText={handleChangeText}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          {/* Valores rápidos */}
          <Text style={styles.quickLabel}>Valores rápidos</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickChip,
                  budget === amount && styles.quickChipActive,
                ]}
                onPress={() => handleQuickAmount(amount)}
              >
                <Text
                  style={[
                    styles.quickText,
                    budget === amount && styles.quickTextActive,
                  ]}
                >
                  {formatCurrency(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão principal */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.startBtn, !isValid && styles.startBtnDisabled]}
              onPress={handleStart}
              disabled={!isValid}
              activeOpacity={0.85}
            >
              <Text style={styles.startText}>Começar Lista  →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity 
          style={styles.historyBtn} 
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyBtnText}>📅 Ver Histórico de Compras</Text>
        </TouchableOpacity>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Como funciona</Text>
          {[
            { icon: '📋', text: 'Monte sua lista antes de ir ao mercado' },
            { icon: '🏪', text: 'No mercado, registre os preços reais' },
            { icon: '📊', text: 'Acompanhe se os preços subiram ou baixaram' },
            { icon: '🎯', text: 'Receba alertas antes de estourar o orçamento' },
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden', // Importante para o ScrollView não vazar a tela na Web
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
    fontWeight: Typography.medium,
  },
  body: {
    flexGrow: 1,
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 100, // Safe area para o final do scroll
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 64,
  },
  currencyPrefix: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  quickLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  quickText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  quickTextActive: {
    color: Colors.primaryDark,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.md,
  },
  startBtnDisabled: {
    backgroundColor: '#A0D3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  historyBtn: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  historyBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  startText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
    letterSpacing: 0.3,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  tipsTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default HomeScreen;
