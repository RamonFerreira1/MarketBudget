import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { getUserSessions } from '../services/shoppingListService';
import { getCurrentUserId } from '../services/authService';
import { formatCurrency } from '../utils/formatters';
import { ShoppingSession } from '../types';
import { useAppColors, AppColors } from '../store/useThemeStore';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getLast6Months(): { key: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ key: getMonthKey(d), label: MONTHS_PT[d.getMonth()] });
  }
  return result;
}

async function loadMonthlyGoal(): Promise<number> {
  const uid = getCurrentUserId();
  if (!uid) return 0;
  try {
    const d = await getDoc(doc(db, 'users', uid, 'data', 'monthlyGoal'));
    return d.exists() ? (d.data().amount ?? 0) : 0;
  } catch { return 0; }
}

async function saveMonthlyGoal(amount: number): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await setDoc(doc(db, 'users', uid, 'data', 'monthlyGoal'), { amount });
}

// ─── Componente ──────────────────────────────────────────────────────────────

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ShoppingSession[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const [s, g] = await Promise.all([getUserSessions(), loadMonthlyGoal()]);
        if (!active) return;
        setSessions(s.filter((x) => x.status === 'completed'));
        setMonthlyGoal(g);
        setGoalInput(g > 0 ? String(g) : '');
        setLoading(false);
      };
      load();
      return () => { active = false; };
    }, [])
  );

  // ─── Cálculos ──────────────────────────────────────────────────────────────

  const last6 = getLast6Months();
  const currentMonthKey = getMonthKey(new Date());

  // Gastos por mês
  const spendingByMonth: Record<string, number> = {};
  for (const s of sessions) {
    const d = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt as any);
    const key = getMonthKey(d);
    spendingByMonth[key] = (spendingByMonth[key] ?? 0) + s.totalSpent;
  }

  const chartData = last6.map((m) => ({
    ...m,
    amount: spendingByMonth[m.key] ?? 0,
  }));

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);
  const currentMonthSpent = spendingByMonth[currentMonthKey] ?? 0;

  // Produto mais caro do mês atual
  const currentMonthSessions = sessions.filter((s) => {
    const d = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt as any);
    return getMonthKey(d) === currentMonthKey;
  });

  let mostExpensiveItem = { name: '—', price: 0 };
  for (const sess of currentMonthSessions) {
    for (const item of (sess.items ?? [])) {
      if ((item.totalPrice ?? 0) > mostExpensiveItem.price) {
        mostExpensiveItem = { name: item.name, price: item.totalPrice ?? 0 };
      }
    }
  }

  // Mercado mais visitado no mês
  const marketCount: Record<string, number> = {};
  for (const sess of currentMonthSessions) {
    if (sess.supermarketName) {
      marketCount[sess.supermarketName] = (marketCount[sess.supermarketName] ?? 0) + 1;
    }
  }
  const topMarket = Object.entries(marketCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // Meta progresso
  const goalProgress = monthlyGoal > 0 ? Math.min(currentMonthSpent / monthlyGoal, 1) : 0;
  const goalSaved = monthlyGoal > 0 ? monthlyGoal - currentMonthSpent : 0;
  const isGoalExceeded = monthlyGoal > 0 && currentMonthSpent > monthlyGoal;

  // Mês anterior (para comparar)
  const prevMonthKey = getMonthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const prevMonthSpent = spendingByMonth[prevMonthKey] ?? 0;
  const monthDiff = currentMonthSpent - prevMonthSpent;
  const monthDiffPct = prevMonthSpent > 0 ? ((monthDiff / prevMonthSpent) * 100).toFixed(1) : null;

  const handleSaveGoal = async () => {
    const amount = parseFloat(goalInput.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    setSavingGoal(true);
    await saveMonthlyGoal(amount);
    setMonthlyGoal(amount);
    setEditingGoal(false);
    setSavingGoal(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>📊 Dashboard</Text>
          <Text style={styles.headerSub}>Visão geral dos seus gastos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo do mês atual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Este Mês</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1.4 }]}>
              <Text style={styles.statLabel}>Total Gasto</Text>
              <Text style={styles.statValue}>{formatCurrency(currentMonthSpent)}</Text>
              {monthDiffPct && (
                <View style={[styles.trendBadge, monthDiff > 0 ? styles.trendUp : styles.trendDown]}>
                  <Text style={[styles.trendText, monthDiff > 0 ? styles.trendTextUp : styles.trendTextDown]}>
                    {monthDiff > 0 ? '↑' : '↓'} {Math.abs(parseFloat(monthDiffPct))}% vs mês anterior
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statLabel}>Compras</Text>
              <Text style={styles.statValue}>{currentMonthSessions.length}</Text>
              <Text style={styles.statSub}>sessões</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>🏆 Item mais caro</Text>
              <Text style={styles.statNameValue} numberOfLines={1}>{mostExpensiveItem.name}</Text>
              <Text style={styles.statSub}>{formatCurrency(mostExpensiveItem.price)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>🏪 Mais visitado</Text>
              <Text style={styles.statNameValue} numberOfLines={1}>{topMarket}</Text>
            </View>
          </View>
        </View>

        {/* Gráfico de barras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos dos Últimos 6 Meses</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {chartData.map((d) => {
                const barHeight = maxAmount > 0 ? Math.max((d.amount / maxAmount) * 120, d.amount > 0 ? 8 : 2) : 2;
                const isCurrent = d.key === currentMonthKey;
                return (
                  <View key={d.key} style={styles.barGroup}>
                    {d.amount > 0 && (
                      <Text style={styles.barLabel}>{formatCurrency(d.amount).replace('R$\u00a0', '')}</Text>
                    )}
                    <View style={[
                      styles.bar,
                      { height: barHeight },
                      isCurrent ? styles.barCurrent : styles.barPast,
                    ]} />
                    <Text style={[styles.barMonthLabel, isCurrent && styles.barMonthLabelCurrent]}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Mês atual</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.inactive, marginLeft: Spacing.base }]} />
              <Text style={styles.legendText}>Meses anteriores</Text>
            </View>
          </View>
        </View>

        {/* Meta mensal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Meta Mensal de Gastos</Text>
          <View style={styles.goalCard}>
            {monthlyGoal > 0 && !editingGoal ? (
              <>
                <View style={styles.goalInfo}>
                  <View style={styles.goalAmounts}>
                    <Text style={styles.goalSpent}>{formatCurrency(currentMonthSpent)}</Text>
                    <Text style={styles.goalOf}>de {formatCurrency(monthlyGoal)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editGoalBtn}
                    onPress={() => { setEditingGoal(true); setGoalInput(String(monthlyGoal)); }}
                  >
                    <Text style={styles.editGoalText}>Editar</Text>
                  </TouchableOpacity>
                </View>

                {/* Barra de progresso */}
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    { width: `${Math.min(goalProgress * 100, 100)}%` as any },
                    isGoalExceeded ? styles.progressExceeded : styles.progressOk,
                  ]} />
                </View>

                <View style={styles.goalFooter}>
                  {isGoalExceeded ? (
                    <Text style={styles.goalExceededText}>
                      ⚠️ Meta estourada em {formatCurrency(Math.abs(goalSaved))}
                    </Text>
                  ) : (
                    <Text style={styles.goalSavedText}>
                      ✅ Faltam {formatCurrency(goalSaved)} para atingir a meta
                    </Text>
                  )}
                  <Text style={styles.goalPct}>{Math.round(goalProgress * 100)}%</Text>
                </View>
              </>
            ) : (
              <View style={styles.goalSetup}>
                {monthlyGoal === 0 && !editingGoal ? (
                  <>
                    <Text style={styles.goalEmptyText}>
                      Defina um limite mensal de gastos e acompanhe seu progresso.
                    </Text>
                    <TouchableOpacity
                      style={styles.setGoalBtn}
                      onPress={() => setEditingGoal(true)}
                    >
                      <Text style={styles.setGoalBtnText}>Definir Meta</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.goalInputLabel}>Limite mensal (R$)</Text>
                    <View style={styles.goalInputRow}>
                      <TextInput
                        style={styles.goalInput}
                        placeholder="Ex: 500,00"
                        placeholderTextColor={colors.textMuted}
                        value={goalInput}
                        onChangeText={setGoalInput}
                        keyboardType="decimal-pad"
                        autoFocus={editingGoal}
                      />
                      <TouchableOpacity
                        style={[styles.goalSaveBtn, savingGoal && { opacity: 0.6 }]}
                        onPress={handleSaveGoal}
                        disabled={savingGoal}
                      >
                        {savingGoal
                          ? <ActivityIndicator size="small" color={colors.surface} />
                          : <Text style={styles.goalSaveBtnText}>Salvar</Text>
                        }
                      </TouchableOpacity>
                      {editingGoal && monthlyGoal > 0 && (
                        <TouchableOpacity
                          style={styles.goalCancelBtn}
                          onPress={() => { setEditingGoal(false); setGoalInput(String(monthlyGoal)); }}
                        >
                          <Text style={styles.goalCancelText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Histórico mensal rápido */}
        {chartData.some((d) => d.amount > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico por Mês</Text>
            {[...chartData].reverse().filter((d) => d.amount > 0).map((d) => (
              <View key={d.key} style={styles.historyRow}>
                <Text style={styles.historyMonth}>{d.label}</Text>
                <View style={styles.historyBarTrack}>
                  <View style={[
                    styles.historyBarFill,
                    { width: `${(d.amount / maxAmount) * 100}%` as any },
                    d.key === currentMonthKey ? styles.historyBarCurrent : styles.historyBarPast,
                  ]} />
                </View>
                <Text style={styles.historyAmount}>{formatCurrency(d.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: colors.surface, fontWeight: Typography.bold },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.extrabold, color: colors.surface },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: 40, gap: Spacing.base },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: 4,
    ...Shadow.sm,
  },
  statLabel: { fontSize: Typography.xs, color: colors.textMuted, fontWeight: Typography.medium },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: colors.textPrimary },
  statNameValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },
  statSub: { fontSize: Typography.xs, color: colors.textSecondary },
  trendBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 2 },
  trendUp: { backgroundColor: colors.dangerBg },
  trendDown: { backgroundColor: colors.primaryLight },
  trendText: { fontSize: 10, fontWeight: Typography.semibold },
  trendTextUp: { color: colors.danger },
  trendTextDown: { color: colors.primary },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    ...Shadow.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingHorizontal: Spacing.sm,
  },
  barGroup: { alignItems: 'center', gap: 4, flex: 1 },
  barLabel: { fontSize: 9, color: colors.textMuted, fontWeight: Typography.medium },
  bar: { width: 28, borderRadius: 6, minHeight: 4 },
  barCurrent: { backgroundColor: colors.primary },
  barPast: { backgroundColor: colors.inactive },
  barMonthLabel: { fontSize: Typography.xs, color: colors.textMuted, fontWeight: Typography.medium },
  barMonthLabelCurrent: { color: colors.primary, fontWeight: Typography.bold },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: Spacing.xs,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Typography.xs, color: colors.textMuted },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  goalInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  goalAmounts: { gap: 2 },
  goalSpent: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: colors.textPrimary },
  goalOf: { fontSize: Typography.sm, color: colors.textSecondary },
  editGoalBtn: {
    backgroundColor: colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editGoalText: { fontSize: Typography.xs, color: colors.textSecondary, fontWeight: Typography.semibold },
  progressTrack: { height: 14, backgroundColor: colors.background, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: BorderRadius.full },
  progressOk: { backgroundColor: colors.primary },
  progressExceeded: { backgroundColor: colors.danger },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalSavedText: { fontSize: Typography.xs, color: colors.primary, fontWeight: Typography.semibold },
  goalExceededText: { fontSize: Typography.xs, color: colors.danger, fontWeight: Typography.semibold },
  goalPct: { fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textSecondary },
  goalSetup: { alignItems: 'center', gap: Spacing.base },
  goalEmptyText: { fontSize: Typography.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  setGoalBtn: { backgroundColor: colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  setGoalBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.surface },
  goalInputLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary, alignSelf: 'flex-start' },
  goalInputRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  goalInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: colors.textPrimary,
  },
  goalSaveBtn: { backgroundColor: colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, minWidth: 70, alignItems: 'center' },
  goalSaveBtnText: { color: colors.surface, fontWeight: Typography.bold, fontSize: Typography.sm },
  goalCancelBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  goalCancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: Typography.bold },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  historyMonth: { width: 32, fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textSecondary },
  historyBarTrack: { flex: 1, height: 10, backgroundColor: colors.border, borderRadius: BorderRadius.full, overflow: 'hidden' },
  historyBarFill: { height: '100%', borderRadius: BorderRadius.full },
  historyBarCurrent: { backgroundColor: colors.primary },
  historyBarPast: { backgroundColor: colors.inactive },
  historyAmount: { width: 72, fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textPrimary, textAlign: 'right' },
});

export default DashboardScreen;
