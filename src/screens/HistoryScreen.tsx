import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getUserSessions, deleteSession, clearAllSessions } from '../services/shoppingListService';
import {
  getAllTrackedProducts,
  getProductHistory,
  removeRecordsForSession,
  clearAllHistory,
  StoredRecord,
} from '../services/priceHistoryService';
import { ShoppingSession } from '../types';
import { logout } from '../services/authService';

type Tab = 'sessions' | 'prices';

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [loading, setLoading] = useState(true);

  // Sessions Tab State
  const [sessions, setSessions] = useState<ShoppingSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Prices Tab State
  const [products, setProducts] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productHistory, setProductHistory] = useState<StoredRecord[]>([]);

  // Deletion state
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedSessions = await getUserSessions();
      setSessions(fetchedSessions.filter(s => s.status === 'completed'));

      const fetchedProducts = await getAllTrackedProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleProductPress = async (productName: string) => {
    if (expandedProduct === productName) {
      setExpandedProduct(null);
      return;
    }
    const history = await getProductHistory(productName);
    setProductHistory(history);
    setExpandedProduct(productName);
  };

  const handleShareSession = async (session: ShoppingSession) => {
    try {
      const text = `🛒 *Histórico de Compra*\nData: ${formatDate(session.createdAt)}\nTotal Gasto: ${formatCurrency(session.totalSpent)}\n\n*Itens Comprados:*\n${session.items.filter(i => i.addedToCart).map(i => `• ${i.name} (${i.actualQty}x) - ${formatCurrency(i.totalPrice ?? 0)}`).join('\n')}\n\n*MarketBudget App*`;
      await Share.share({ message: text });
    } catch (error) {
      console.warn('Erro ao compartilhar', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setLoading(true);
    await deleteSession(sessionToDelete);
    await removeRecordsForSession(sessionToDelete);
    setSessionToDelete(null);
    await loadData();
  };

  const confirmClearAll = async () => {
    setLoading(true);
    await clearAllSessions();
    await clearAllHistory();
    setClearAllConfirm(false);
    await loadData();
  };

  const renderSessionItem = ({ item }: { item: ShoppingSession }) => {
    const isExpanded = expandedSession === item.id;
    const isWithinBudget = item.totalSpent <= item.budget;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <TouchableOpacity
            style={[styles.cardHeader, { flex: 1 }]}
            onPress={() => setExpandedSession(isExpanded ? null : item.id)}
          >
            <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{formatDate(item.createdAt)}</Text>
            <View style={styles.cardBadges}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isWithinBudget ? Colors.primaryLight : '#FADBD8' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isWithinBudget ? Colors.primaryDark : Colors.danger },
                  ]}
                >
                  {isWithinBudget ? 'No orçamento' : 'Estourou'}
                </Text>
              </View>
              <Text style={styles.itemsCount}>{item.items.length} itens</Text>
            </View>
          </View>
          <View style={styles.cardTotalBox}>
            <Text style={styles.cardTotalLabel}>Gasto Total</Text>
            <Text style={styles.cardTotalValue}>{formatCurrency(item.totalSpent)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.sessionActions}>
          <TouchableOpacity onPress={() => handleShareSession(item)} style={styles.sessionShareBtn}>
            <Text style={styles.sessionShareIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDeleteSession(item.id)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.cardExpanded}>
          <Text style={styles.expandedTitle}>Detalhes da compra</Text>
          {item.items.map((cartItem) => (
            <View key={cartItem.id} style={styles.cartItemRow}>
              <Text style={styles.cartItemName} numberOfLines={1}>
                {cartItem.name}
              </Text>
              <Text style={styles.cartItemDetail}>
                {cartItem.actualQty}x {formatCurrency(cartItem.unitPrice ?? 0)} ={' '}
                <Text style={styles.cartItemTotal}>
                  {formatCurrency(cartItem.totalPrice ?? 0)}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
    );
  };

  const renderProductItem = ({ item: productName }: { item: string }) => {
    const isExpanded = expandedProduct === productName;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.productHeader}
          onPress={() => handleProductPress(productName)}
        >
          <Text style={styles.productTitle}>{productName}</Text>
          <Text style={styles.productArrow}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardExpanded}>
            {productHistory.length === 0 ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              (() => {
                const reversedHistory = [...productHistory].reverse();
                return reversedHistory.map((rec, i) => {
                  let diff = 0;
                  if (i < reversedHistory.length - 1) {
                    const prevRec = reversedHistory[i + 1];
                    diff = rec.unitPrice - prevRec.unitPrice;
                  }

                  return (
                    <View key={rec.date} style={styles.historyRow}>
                      <Text style={styles.historyDate}>{formatDate(new Date(rec.date))}</Text>
                      <View style={styles.historyPriceBox}>
                        {i < reversedHistory.length - 1 && diff !== 0 && (
                          <Text
                            style={[
                              styles.historyDiff,
                              { color: diff > 0 ? Colors.danger : Colors.success },
                            ]}
                          >
                            {diff > 0 ? '⬆' : '⬇'} {formatCurrency(Math.abs(diff))}
                          </Text>
                        )}
                        <Text style={styles.historyPrice}>
                          {formatCurrency(rec.unitPrice)}
                        </Text>
                      </View>
                    </View>
                  );
                });
              })()
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={() => setClearAllConfirm(true)} style={styles.clearAllBtn}>
            <Text style={styles.clearAllIcon}>🧹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
          onPress={() => setActiveTab('sessions')}
        >
          <Text
            style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}
          >
            Minhas Compras
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prices' && styles.tabActive]}
          onPress={() => setActiveTab('prices')}
        >
          <Text style={[styles.tabText, activeTab === 'prices' && styles.tabTextActive]}>
            Evolução de Preços
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {activeTab === 'sessions' ? (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={() => {
                if (sessions.length === 0) return null;
                // Agregação mensal
                const monthlyData = sessions.reduce((acc, s) => {
                  const dateStr = formatDate(s.createdAt);
                  const month = dateStr.substring(3); // "07/2026"
                  acc[month] = (acc[month] || 0) + s.totalSpent;
                  return acc;
                }, {} as Record<string, number>);
                const chartData = Object.entries(monthlyData).map(([month, total]) => ({ month, total })).reverse();
                const maxTotal = Math.max(...chartData.map(d => d.total));

                return (
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>📊 Gastos por Mês</Text>
                    <View style={styles.chartArea}>
                      {chartData.map((d) => (
                        <View key={d.month} style={styles.chartBarWrapper}>
                          <Text style={styles.chartBarTotal}>{formatCurrency(d.total)}</Text>
                          <View style={styles.chartBarBackground}>
                            <View style={[styles.chartBarFill, { height: `${(d.total / maxTotal) * 100}%` }]} />
                          </View>
                          <Text style={styles.chartBarLabel}>{d.month.substring(0, 5)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }}
              renderItem={renderSessionItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhuma compra finalizada ainda.</Text>
              }
            />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(p) => p}
              renderItem={renderProductItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum produto registrado no histórico.</Text>
              }
            />
          )}
        </View>
      )}

      {/* Modal de Confirmação */}
      <Modal visible={!!sessionToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excluir compra?</Text>
            <Text style={styles.modalText}>
              Deseja realmente excluir esta compra? Todos os preços registrados nela também serão removidos do histórico.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSessionToDelete(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmDeleteSession}>
                <Text style={styles.modalConfirmText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Limpar Tudo */}
      <Modal visible={clearAllConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Limpar Todo o Histórico?</Text>
            <Text style={styles.modalText}>
              Atenção: Isso vai apagar TODAS as compras e TODO o histórico de preços. É ideal se você quer apagar todos os testes e começar do zero.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setClearAllConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmClearAll}>
                <Text style={styles.modalConfirmText}>Sim, Limpar Tudo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.surface,
    fontWeight: Typography.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
    textAlign: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllBtn: {
    padding: Spacing.sm,
  },
  clearAllIcon: {
    fontSize: 20,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  logoutIcon: {
    fontSize: 20,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: Typography.bold,
  },
  tabTextActive: {
    color: Colors.surface,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    fontSize: Typography.base,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  chartTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: 60,
  },
  chartBarBackground: {
    width: 24,
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: Spacing.sm,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  chartBarLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  chartBarTotal: {
    fontSize: Typography.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.bold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: Spacing.base,
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
  },
  itemsCount: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  cardTotalBox: {
    alignItems: 'flex-end',
  },
  cardTotalLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  cardTotalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  sessionShareBtn: {
    padding: Spacing.xs,
  },
  sessionShareIcon: {
    fontSize: 18,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  deleteIcon: {
    fontSize: 18,
  },
  cardExpanded: {
    backgroundColor: Colors.background,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  expandedTitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cartItemName: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  cartItemDetail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  cartItemTotal: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  productHeader: {
    flexDirection: 'row',
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  productArrow: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyDate: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  historyPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyDiff: {
    fontSize: 11,
    fontWeight: Typography.bold,
  },
  historyPrice: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadow.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  modalConfirm: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: {
    color: Colors.surface,
    fontWeight: Typography.bold,
  },
});

export default HistoryScreen;
