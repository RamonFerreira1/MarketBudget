import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { ShoppingItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import ProductCard from '../components/ProductCard';
import AddItemModal from '../components/AddItemModal';
import { RootStackParamList } from '../navigation/AppNavigator';

type PreListNavProp = StackNavigationProp<RootStackParamList, 'PreList'>;

export const PreListScreen: React.FC = () => {
  const navigation = useNavigation<PreListNavProp>();
  const items = useShoppingStore((s) => s.items);
  const addItem = useShoppingStore((s) => s.addItem);
  const editItem = useShoppingStore((s) => s.editItem);
  const removeItem = useShoppingStore((s) => s.removeItem);
  const setSessionStatus = useShoppingStore((s) => s.setSessionStatus);
  const budget = useBudgetStore((s) => s.budget);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const handleAddOrEditItem = (name: string, category: string, plannedQty: number) => {
    if (editingItem) {
      editItem(editingItem.id, { name, category, plannedQty });
    } else {
      addItem({ name, category, plannedQty });
    }
    setEditingItem(null);
  };

  const handleGoToMarket = () => {
    if (items.length === 0) {
      Alert.alert(
        'Lista vazia',
        'Adicione pelo menos um item antes de ir ao mercado.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSessionStatus('in-market');
    navigation.navigate('MarketMode');
  };

  const handleItemPress = (item: ShoppingItem) => {
    setEditingItem(item);
    setAddModalVisible(true);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>Lista vazia</Text>
      <Text style={styles.emptySubtitle}>
        Adicione os produtos que você precisa comprar.{'\n'}
        O preço será registrado no mercado.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lista de Compras</Text>
          <Text style={styles.headerSub}>Orçamento: {formatCurrency(budget)}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {/* Lista de itens */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            mode="pre-list"
            onPress={handleItemPress}
            onRemove={removeItem}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Rodapé com botões */}
      <View style={styles.footer}>
        {/* FAB adicionar */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addText}>+ Adicionar Item</Text>
        </TouchableOpacity>

        {/* Botão ir ao mercado */}
        {items.length > 0 && (
          <TouchableOpacity style={styles.marketBtn} onPress={handleGoToMarket}>
            <Text style={styles.marketText}>🏪 Ir ao Mercado</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de adicionar/editar item */}
      <AddItemModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setEditingItem(null);
        }}
        onAdd={handleAddOrEditItem}
        initialItem={editingItem}
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
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
  headerSub: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  countBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  countText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  listContent: {
    paddingTop: Spacing.base,
    paddingBottom: 120,
  },
  listEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    ...Shadow.md,
  },
  addBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  addText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  marketBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.md,
  },
  marketText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.surface,
  },
});

export default PreListScreen;
