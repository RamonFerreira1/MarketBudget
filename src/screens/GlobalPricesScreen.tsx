import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getGlobalPrices, GlobalPriceRecord } from '../services/globalPriceService';
import { useAppColors, AppColors } from '../store/useThemeStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Typography, Spacing, BorderRadius, Shadow } from '../theme';

export const GlobalPricesScreen: React.FC = () => {
  const navigation = useNavigation();
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalPriceRecord[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    const data = await getGlobalPrices(search);
    
    // Organiza do mais barato para o mais caro
    const sorted = [...data].sort((a, b) => a.unitPrice - b.unitPrice);
    setResults(sorted);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waze de Preços</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Text style={styles.searchSubtitle}>Pesquise o preço de um produto registrado pela comunidade na sua região:</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ex: Arroz Tio João 5kg"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            <Text style={styles.searchBtnText}>🔍 Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Procurando no banco global...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyEmoji}>😞</Text>
          <Text style={styles.emptyText}>Ninguém registrou o preço deste produto ainda.</Text>
          <Text style={styles.emptySub}>Seja o primeiro na sua próxima compra!</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.productName}-${index}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.resultCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.marketName}>🏪 {item.supermarketName}</Text>
                <Text style={styles.dateText}>Registrado em: {formatDate(new Date(item.date))}</Text>
              </View>
              <Text style={[styles.priceText, index === 0 && styles.cheapestPrice]}>
                {formatCurrency(item.unitPrice)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: colors.surface, fontWeight: Typography.bold },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.extrabold, color: colors.surface },
  searchSection: { backgroundColor: colors.surface, padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchSubtitle: { fontSize: Typography.sm, color: colors.textSecondary, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  searchInput: { flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: Spacing.md, fontSize: Typography.base, color: colors.textPrimary },
  searchBtn: { backgroundColor: colors.primary, paddingHorizontal: Spacing.md, justifyContent: 'center', borderRadius: BorderRadius.md },
  searchBtnText: { color: colors.surface, fontWeight: Typography.bold },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, color: colors.textSecondary },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: Typography.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  listContent: { padding: Spacing.base },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: Spacing.base, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, ...Shadow.sm },
  rankBadge: { backgroundColor: colors.background, borderRadius: BorderRadius.md, paddingHorizontal: 8, paddingVertical: 4, marginRight: Spacing.md },
  rankText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textSecondary },
  resultInfo: { flex: 1 },
  marketName: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },
  dateText: { fontSize: Typography.xs, color: colors.textSecondary, marginTop: 2 },
  priceText: { fontSize: Typography.lg, fontWeight: Typography.extrabold, color: colors.textPrimary },
  cheapestPrice: { color: colors.primary },
});

export default GlobalPricesScreen;
