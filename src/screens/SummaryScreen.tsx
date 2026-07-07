import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import PriceTagBadge from '../components/PriceTagBadge';
import { finalizeSession } from '../services/shoppingListService';
import { savePriceRecord } from '../services/priceHistoryService';
import { RootStackParamList } from '../navigation/AppNavigator';

type SummaryNavProp = StackNavigationProp<RootStackParamList, 'Summary'>;

export const SummaryScreen: React.FC = () => {
  const navigation = useNavigation<SummaryNavProp>();
  const items = useShoppingStore((s) => s.items);
  const session = useShoppingStore((s) => s.session);
  const clearSession = useShoppingStore((s) => s.clearSession);
  const totalSpent = useBudgetStore((s) => s.totalSpent);
  const budget = useBudgetStore((s) => s.budget);
  const status = useBudgetStore((s) => s.status());

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const cartItems = items.filter((i) => i.addedToCart);
  const skippedItems = items.filter((i) => !i.addedToCart);
  const savedAmount = budget - totalSpent;
  const isWithinBudget = totalSpent <= budget;

  const handleSaveAndFinish = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const sessionId = session?.id || `local_${Date.now()}`;

      // Garante que createdAt é sempre um Date válido
      const rawDate = session?.createdAt;
      const createdAt =
        rawDate instanceof Date
          ? rawDate
          : rawDate
          ? new Date(rawDate as any)
          : new Date();

      const finalSession = session
        ? { ...session, items, totalSpent, id: sessionId, createdAt }
        : {
            id: sessionId,
            createdAt,
            budget,
            totalSpent,
            status: 'pre-list' as const,
            userId: 'local',
            items,
          };

      await finalizeSession(finalSession);

      // Salva histórico de preços para cada item comprado
      const pricePromises = cartItems
        .filter((i) => i.unitPrice !== null)
        .map((item) =>
          savePriceRecord(item.name, {
            unitPrice: item.unitPrice!,
            sessionId,
            supermarketId: session?.supermarketId,
            supermarketName: session?.supermarketName,
          })
        );
      await Promise.allSettled(pricePromises);

      setSaved(true);
    } catch (error: any) {
      console.error('Erro ao salvar sessão:', error);
      const msg = error?.message || 'Erro desconhecido';
      if (msg.includes('autenticado') || msg.includes('permission')) {
        setSaveError('Você precisa estar logado para salvar. Faça login e tente novamente.');
      } else {
        setSaveError(`Não foi possível salvar a compra. (${msg})`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const text = `🛒 *Resumo da Compra*\nData: ${formatDate(session?.createdAt ?? new Date())}\nTotal Gasto: ${formatCurrency(totalSpent)}\nOrçamento: ${formatCurrency(budget)}\n\n*Itens Comprados:*\n${cartItems.map(i => `• ${i.name} (${i.actualQty}x) - ${formatCurrency(i.totalPrice ?? 0)}`).join('\n')}\n\n*MarketBudget App*`;

      await Share.share({
        message: text,
      });
    } catch (error) {
      console.warn('Erro ao compartilhar', error);
    }
  };

  const handleNewShopping = () => {
    clearSession();
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isWithinBudget ? Colors.primaryDark : '#C0392B' },
      ]}>
        <Text style={styles.headerEmoji}>{isWithinBudget ? '✅' : '⚠️'}</Text>
        <Text style={styles.headerTitle}>
          {isWithinBudget ? 'Compra concluída!' : 'Orçamento estourado'}
        </Text>
        <Text style={styles.headerDate}>
          {formatDate(session?.createdAt ?? new Date())}
        </Text>
        {session?.supermarketName ? (
          <View style={styles.marketBadge}>
            <Text style={styles.marketBadgeText}>🏪 {session.supermarketName}</Text>
          </View>
        ) : null}

        {/* Bloco de valores */}
        <View style={styles.valuesRow}>
          <View style={styles.valueBlock}>
            <Text style={styles.valueLabel}>Gasto Total</Text>
            <Text style={styles.valueFigure}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.valueDivider} />
          <View style={styles.valueBlock}>
            <Text style={styles.valueLabel}>
              {isWithinBudget ? 'Economizado' : 'Acima do limite'}
            </Text>
            <Text style={styles.valueFigure}>
              {formatCurrency(Math.abs(savedAmount))}
            </Text>
          </View>
          <View style={styles.valueDivider} />
          <View style={styles.valueBlock}>
            <Text style={styles.valueLabel}>Orçamento</Text>
            <Text style={styles.valueFigure}>{formatCurrency(budget)}</Text>
          </View>
        </View>
      </View>

      {/* Lista de itens comprados */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            Itens Comprados ({cartItems.length})
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.summaryDetail}>
                {item.actualQty} un × {formatCurrency(item.unitPrice ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              {item.priceVariation && (
                <PriceTagBadge variation={item.priceVariation} size="sm" />
              )}
              <Text style={styles.summaryTotal}>
                {formatCurrency(item.totalPrice ?? 0)}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            {skippedItems.length > 0 && (
              <View style={styles.skippedSection}>
                <Text style={styles.skippedTitle}>
                  Não comprados ({skippedItems.length})
                </Text>
                {skippedItems.map((item) => (
                  <Text key={item.id} style={styles.skippedItem}>
                    • {item.name}
                  </Text>
                ))}
              </View>
            )}
            <View style={{ height: 120 }} />
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Rodapé */}
      <View style={styles.footer}>
        {saveError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {saveError}</Text>
          </View>
        ) : null}

        {!saved ? (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnLoading]}
            onPress={handleSaveAndFinish}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveText}>💾 Salvar e Finalizar</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Text style={styles.shareText}>📤 Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newBtn} onPress={handleNewShopping}>
                <Text style={styles.newText}>🛒 Nova Compra</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={() => navigation.navigate('MarketComparison')}
            >
              <Text style={styles.compareText}>🏪 Ver Comparação de Mercados</Text>
            </TouchableOpacity>
          </>
        )}
        {saved && (
          <Text style={styles.savedConfirmation}>
            ✓ Histórico salvo com sucesso!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxxl + Spacing.base,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  headerDate: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.lg,
  },
  valuesRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
    width: '100%',
  },
  valueBlock: {
    flex: 1,
    alignItems: 'center',
  },
  valueDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  valueLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  valueFigure: {
    fontSize: Typography.base,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  listContent: {
    paddingTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  summaryLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  summaryName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  summaryDetail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  summaryTotal: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  skippedSection: {
    margin: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skippedTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  skippedItem: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: 2,
    textDecorationLine: 'line-through',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
    alignItems: 'center',
    ...Shadow.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  saveBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.md,
  },
  saveBtnLoading: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  shareText: {
    color: Colors.primaryDark,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  newBtn: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
  },
  newText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
  savedConfirmation: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  errorBox: {
    width: '100%',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sm,
    color: '#B91C1C',
    fontWeight: Typography.medium,
    lineHeight: 20,
    textAlign: 'center',
  },
  marketBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  marketBadgeText: {
    color: Colors.surface,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  compareBtn: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  compareText: {
    color: Colors.primaryDark,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});

export default SummaryScreen;
