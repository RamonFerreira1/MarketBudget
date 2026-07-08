import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { ShoppingItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import ProductCard from '../components/ProductCard';
import AddItemModal from '../components/AddItemModal';
import TemplatesModal from '../components/TemplatesModal';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getFavorites } from '../services/favoritesService';
import { getActivePromotions, Promotion } from '../services/promotionService';
import { getCategoryMeta } from '../constants/categories';
import { TemplateItem } from '../services/templateService';

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
  const [templatesVisible, setTemplatesVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Carrega favoritos e promoções ao focar
  useFocusEffect(
    useCallback(() => {
      setLoadingFavs(true);
      Promise.all([getFavorites(), getActivePromotions()]).then(([favs, promos]) => {
        setFavorites(favs);
        setPromotions(promos);
        setLoadingFavs(false);
      });
    }, [])
  );

  // Filtro de busca
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleAddOrEditItem = (name: string, category: string, plannedQty: number) => {
    if (editingItem) {
      editItem(editingItem.id, { name, category, plannedQty });
    } else {
      addItem({ name, category, plannedQty });
    }
    setEditingItem(null);
  };

  const handleLoadTemplate = (templateItems: TemplateItem[]) => {
    // Adiciona os itens do template que ainda não estão na lista
    const existing = new Set(items.map((i) => i.name.toLowerCase()));
    for (const ti of templateItems) {
      if (!existing.has(ti.name.toLowerCase())) {
        addItem({ name: ti.name, category: ti.category, plannedQty: ti.plannedQty });
      }
    }
  };

  const handleGoToMarket = () => {
    if (items.length === 0) {
      Alert.alert('Lista vazia', 'Adicione pelo menos um item antes de ir ao mercado.', [{ text: 'OK' }]);
      return;
    }
    setSessionStatus('in-market');
    navigation.navigate('MarketMode');
  };

  const handleItemPress = (item: ShoppingItem) => {
    setEditingItem(item);
    setAddModalVisible(true);
  };

  const handleAddFavorite = (favName: string) => {
    // Verifica se já existe na lista
    const exists = items.some((i) => i.name.toLowerCase() === favName.toLowerCase());
    if (!exists) {
      addItem({ name: favName, category: 'Outros', plannedQty: 1 });
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Nenhum item encontrado' : 'Lista vazia'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Nenhum item corresponde a "${searchQuery}"`
          : 'Adicione os produtos que você precisa comprar.\nO preço será registrado no mercado.'}
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lista de Compras</Text>
          <Text style={styles.headerSub}>Orçamento: {formatCurrency(budget)}</Text>
        </View>
        <TouchableOpacity
          style={styles.templateBtn}
          onPress={() => setTemplatesVisible(true)}
        >
          <Text style={styles.templateBtnText}>📋</Text>
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar item ou categoria..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chips de favoritos */}
      {favorites.length > 0 && !searchQuery && (
        <View style={styles.favSection}>
          <Text style={styles.favLabel}>⭐ Adicionar favorito</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favRow}
          >
            {loadingFavs ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              favorites.map((fav) => {
                const alreadyInList = items.some((i) => i.name.toLowerCase() === fav.toLowerCase());
                return (
                  <TouchableOpacity
                    key={fav}
                    style={[styles.favChip, alreadyInList && styles.favChipAdded]}
                    onPress={() => handleAddFavorite(fav)}
                    disabled={alreadyInList}
                  >
                    <Text style={[styles.favChipText, alreadyInList && styles.favChipTextAdded]}>
                      {alreadyInList ? '✓' : '+'} {fav}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* Banner de promoções ativas */}
      {promotions.length > 0 && !searchQuery && (
        <View style={styles.promoBanner}>
          <Text style={styles.promoBannerIcon}>🏷️</Text>
          <Text style={styles.promoBannerText}>
            {promotions.length} promoção(ões) ativa(s) disponível(is)
          </Text>
        </View>
      )}

      {/* Lista de itens */}
      <FlatList
        data={filteredItems}
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
          filteredItems.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Rodapé */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditingItem(null); setAddModalVisible(true); }}
        >
          <Text style={styles.addText}>+ Adicionar Item</Text>
        </TouchableOpacity>

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

      {/* Modal de templates */}
      <TemplatesModal
        visible={templatesVisible}
        onClose={() => setTemplatesVisible(false)}
        currentItems={items}
        onLoadTemplate={handleLoadTemplate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Colors.surface, fontWeight: Typography.bold },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.extrabold, color: Colors.surface },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  templateBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBtnText: { fontSize: 20 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  countText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.surface },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  searchClear: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: { fontSize: 11, color: Colors.textSecondary, fontWeight: Typography.bold },
  favSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  favLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.xs,
  },
  favRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  favChip: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  favChipAdded: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  favChipText: { fontSize: Typography.xs, color: '#92400E', fontWeight: Typography.semibold },
  favChipTextAdded: { color: Colors.primaryDark },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: Spacing.sm,
  },
  promoBannerIcon: { fontSize: 16 },
  promoBannerText: { flex: 1, fontSize: Typography.sm, color: '#92400E', fontWeight: Typography.medium },
  listContent: { paddingTop: Spacing.base, paddingBottom: 120 },
  listEmpty: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    marginTop: 60,
  },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.base },
  emptyTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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
  addText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
  marketBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.md,
  },
  marketText: { fontSize: Typography.md, fontWeight: Typography.extrabold, color: Colors.surface },
});

export default PreListScreen;
