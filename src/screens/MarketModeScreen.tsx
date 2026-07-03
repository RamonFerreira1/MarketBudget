import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { ShoppingItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import BudgetProgressBar from '../components/BudgetProgressBar';
import ProductCard from '../components/ProductCard';
import MarketItemModal from '../components/MarketItemModal';
import BudgetAlertModal from '../components/BudgetAlertModal';
import { getPriceVariation } from '../services/priceHistoryService';
import { RootStackParamList } from '../navigation/AppNavigator';

type MarketNavProp = StackNavigationProp<RootStackParamList, 'MarketMode'>;

export const MarketModeScreen: React.FC = () => {
  const navigation = useNavigation<MarketNavProp>();
  const items = useShoppingStore((s) => s.items);
  const updateItemInMarket = useShoppingStore((s) => s.updateItemInMarket);
  const updateItemPriceVariation = useShoppingStore((s) => s.updateItemPriceVariation);
  const setSessionStatus = useShoppingStore((s) => s.setSessionStatus);
  const clearSession = useShoppingStore((s) => s.clearSession);
  const resetItemsToPreList = useShoppingStore((s) => s.resetItemsToPreList);
  const session = useShoppingStore((s) => s.session);

  const totalSpent = useBudgetStore((s) => s.totalSpent);
  const budget = useBudgetStore((s) => s.budget);
  const status = useBudgetStore((s) => s.status());
  const alreadyAlerted = useBudgetStore((s) => s.alreadyAlerted);
  const setAlreadyAlerted = useBudgetStore((s) => s.setAlreadyAlerted);

  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [loadingVariation, setLoadingVariation] = useState(false);

  // Dispara alerta quando orçamento é estourado (apenas uma vez por sessão)
  useEffect(() => {
    if (status === 'exceeded' && !alreadyAlerted) {
      setAlertVisible(true);
      setAlreadyAlerted(true);
    }
  }, [status, alreadyAlerted]);

  // Intercepta botão de voltar do Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Menu de opções ao sair do Modo Mercado
  const handleBack = () => {
    Alert.alert(
      'Sair do Modo Mercado',
      'O que você deseja fazer?',
      [
        {
          text: 'Continuar comprando',
          style: 'cancel',
        },
        {
          text: '✏️ Editar lista',
          onPress: () => {
            // Limpa os preços/qtds do mercado e volta para a lista prévia
            resetItemsToPreList();
            setSessionStatus('pre-list');
            navigation.goBack();
          },
        },
        {
          text: '🗑️ Cancelar compra',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Cancelar compra?',
              'Todos os itens e preços registrados serão perdidos.',
              [
                { text: 'Não', style: 'cancel' },
                {
                  text: 'Sim, cancelar',
                  style: 'destructive',
                  onPress: () => {
                    clearSession();
                    navigation.navigate('Home');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleItemPress = useCallback((item: ShoppingItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const handleConfirmItem = useCallback(
    async (id: string, actualQty: number, unitPrice: number) => {
      // 1. Atualiza o item no store (recalcula total imediatamente)
      updateItemInMarket(id, actualQty, unitPrice);

      // 2. Busca histórico de preços em background
      const item = items.find((i) => i.id === id);
      if (item) {
        setLoadingVariation(true);
        try {
          const variation = await getPriceVariation(
            item.name,
            unitPrice
          );
          if (variation) {
            updateItemPriceVariation(id, variation);
          }
        } catch (err) {
          console.warn('Não foi possível carregar histórico de preços:', err);
        } finally {
          setLoadingVariation(false);
        }
      }
    },
    [items, updateItemInMarket, updateItemPriceVariation]
  );

  const handleFinalize = () => {
    if (items.filter((i) => i.addedToCart).length === 0) {
      Alert.alert('Carrinho vazio', 'Registre ao menos um item antes de finalizar.');
      return;
    }
    setSessionStatus('completed');
    navigation.navigate('Summary');
  };

  // Separa itens: pendentes no topo, já no carrinho embaixo
  const pendingItems = items.filter((i) => !i.addedToCart);
  const cartItems = items.filter((i) => i.addedToCart);

  const renderSectionHeader = (title: string, count: number, color: string) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );

  const overAmount = Math.abs(totalSpent - budget);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Modo Mercado</Text>
        <TouchableOpacity style={styles.finalizeHeaderBtn} onPress={handleFinalize}>
          <Text style={styles.finalizeHeaderText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de progresso do orçamento */}
      <BudgetProgressBar />

      {/* Lista combinada */}
      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* Pendentes */}
            {pendingItems.length > 0 && (
              <>
                {renderSectionHeader(
                  'A pegar na prateleira',
                  pendingItems.length,
                  Colors.warning
                )}
                {pendingItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    mode="in-market"
                    onPress={handleItemPress}
                  />
                ))}
              </>
            )}

            {/* No carrinho */}
            {cartItems.length > 0 && (
              <>
                {renderSectionHeader('No carrinho', cartItems.length, Colors.primary)}
                {cartItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    mode="in-market"
                    onPress={handleItemPress}
                  />
                ))}
              </>
            )}

            {/* Tudo adicionado */}
            {pendingItems.length === 0 && cartItems.length > 0 && (
              <View style={styles.allDoneCard}>
                <Text style={styles.allDoneEmoji}>🎉</Text>
                <Text style={styles.allDoneTitle}>Todos os itens registrados!</Text>
                <Text style={styles.allDoneSubtitle}>
                  Finalize a compra para salvar o histórico.
                </Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão de finalizar */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>Total no carrinho</Text>
          <Text style={[
            styles.footerTotal,
            status === 'exceeded' && { color: Colors.danger },
          ]}>
            {formatCurrency(totalSpent)}
          </Text>
        </View>
        <TouchableOpacity style={[
          styles.finalizeBtn,
          status === 'exceeded' && styles.finalizeBtnDanger,
        ]} onPress={handleFinalize}>
          <Text style={styles.finalizeText}>
            {status === 'exceeded' ? '⚠️ Finalizar' : '✓ Finalizar Compra'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de item no mercado */}
      <MarketItemModal
        visible={modalVisible}
        item={selectedItem}
        onClose={() => { setModalVisible(false); setSelectedItem(null); }}
        onConfirm={handleConfirmItem}
        loadingVariation={loadingVariation}
      />

      {/* Modal de alerta de estouro */}
      <BudgetAlertModal
        visible={alertVisible}
        overAmount={overAmount}
        onClose={() => setAlertVisible(false)}
        onRemoveItems={() => {
          setAlertVisible(false);
          // Scrolla para o topo da lista (v2: ref de scroll)
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  finalizeHeaderBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  finalizeHeaderText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.base,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCount: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingBottom: 120,
  },
  allDoneCard: {
    margin: Spacing.base,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  allDoneTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  allDoneSubtitle: {
    fontSize: Typography.sm,
    color: Colors.primary,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    ...Shadow.md,
  },
  footerSummary: {
    flex: 1,
  },
  footerLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerTotal: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  finalizeBtn: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  finalizeBtnDanger: {
    backgroundColor: Colors.danger,
  },
  finalizeText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
});

export default MarketModeScreen;
