import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShoppingStore } from '../store/useShoppingStore';
import { Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getCurrentUserId } from '../services/authService';
import SupermarketPicker from '../components/SupermarketPicker';
import PromotionsModal from '../components/PromotionsModal';
import { Supermarket } from '../types';
import { checkPriceAlerts, checkShoppingReminder, PriceAlert } from '../services/alertsService';
import { getFavorites } from '../services/favoritesService';
import { getActivePromotions } from '../services/promotionService';
import { useThemeStore, AppColors } from '../store/useThemeStore';
import { startGeofencing } from '../services/locationService';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

const QUICK_AMOUNTS = [100, 150, 200, 300, 500];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const createSession = useShoppingStore((s) => s.createSession);
  const userId = getCurrentUserId();

  const { isDark, toggle: toggleTheme, colors } = useThemeStore();

  const [rawValue, setRawValue] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [promotionsVisible, setPromotionsVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Alertas e notificações
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [activePromosCount, setActivePromosCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Carrega alertas ao focar na tela
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadAlerts = async () => {
        setAlertsLoading(true);
        try {
          const [favs, promos, reminder] = await Promise.all([
            getFavorites(),
            getActivePromotions(),
            checkShoppingReminder(),
          ]);
          const alerts = await checkPriceAlerts(favs);
          if (active) {
            setPriceAlerts(alerts);
            setShowReminder(reminder);
            setActivePromosCount(promos.length);
          }
        } catch { /* silencioso */ }
        if (active) setAlertsLoading(false);

        // Inicia geofencing (exemplo com uma coordenada genérica, pode ser expandido depois)
        startGeofencing([
          {
            identifier: 'mercado-exemplo',
            latitude: -23.5505, // São Paulo, SP
            longitude: -46.6333,
            radius: 500, // 500 metros
            notifyOnEnter: true,
            notifyOnExit: false,
          }
        ]);
      };
      loadAlerts();
      return () => { active = false; };
    }, [])
  );

  const handleChangeText = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setRawValue(numeric);
  };

  const displayValue = rawValue ? formatCurrency(parseFloat(rawValue) / 100) : '';
  const budget = parseFloat(rawValue) / 100;
  const isValid = budget >= 1;

  const handleStart = () => {
    if (!isValid) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      setPickerVisible(true);
    });
  };

  const handleMarketSelected = (supermarket: Supermarket | null) => {
    setPickerVisible(false);
    createSession(budget, userId || '', supermarket?.id, supermarket?.name);
    navigation.navigate('PreList');
  };

  const handleQuickAmount = (amount: number) => {
    setRawValue(String(amount * 100));
  };

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primaryDark}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>🛒 MarketBudget</Text>
          <Text style={styles.tagline}>Compras inteligentes, bolso no controle</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Text style={styles.themeBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner: Lembrete de compra */}
        {showReminder && (
          <View style={[styles.alertBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
            <Text style={styles.alertBannerIcon}>📅</Text>
            <Text style={[styles.alertBannerText, { color: '#92400E' }]}>
              Está na hora das compras! Você não faz compras há mais de 7 dias.
            </Text>
            <TouchableOpacity onPress={() => setShowReminder(false)}>
              <Text style={styles.alertDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Banner: Alertas de preço em oferta */}
        {priceAlerts.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={styles.alertBannerIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertBannerText, { color: colors.primaryDark }]}>
                {priceAlerts.length === 1
                  ? `"${priceAlerts[0].productName}" está ${priceAlerts[0].savingPercent}% mais barato!`
                  : `${priceAlerts.length} produtos favoritos com preço em baixa!`}
              </Text>
            </View>
          </View>
        )}

        {/* Banner: Promoções ativas */}
        {activePromosCount > 0 && (
          <TouchableOpacity
            style={[styles.alertBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
            onPress={() => setPromotionsVisible(true)}
          >
            <Text style={styles.alertBannerIcon}>🏷️</Text>
            <Text style={[styles.alertBannerText, { color: '#92400E', flex: 1 }]}>
              {activePromosCount} promoção(ões) ativa(s) — toque para ver
            </Text>
            <Text style={{ color: '#92400E' }}>→</Text>
          </TouchableOpacity>
        )}

        {/* Card principal */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Qual é o orçamento de hoje?
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Defina o limite máximo que você quer gastar nesta compra.
          </Text>

          {/* Input de valor */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>R$</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              value={rawValue ? displayValue.replace('R$', '').trim() : ''}
              onChangeText={handleChangeText}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          {/* Valores rápidos */}
          <Text style={[styles.quickLabel, { color: colors.textMuted }]}>Valores rápidos</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  budget === amount && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => handleQuickAmount(amount)}
              >
                <Text
                  style={[
                    styles.quickText,
                    { color: colors.textSecondary },
                    budget === amount && { color: colors.primaryDark },
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
              style={[
                styles.startBtn,
                { backgroundColor: colors.primary },
                !isValid && styles.startBtnDisabled,
              ]}
              onPress={handleStart}
              disabled={!isValid}
              activeOpacity={0.85}
            >
              <Text style={styles.startText}>Começar Lista  →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Botões de navegação */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.navBtnIcon}>📅</Text>
            <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.navBtnIcon}>📊</Text>
            <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setPromotionsVisible(true)}
          >
            <Text style={styles.navBtnIcon}>🏷️</Text>
            <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Promoções</Text>
            {activePromosCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{activePromosCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Feature Actions */}
        <View style={styles.featureRow}>
          <TouchableOpacity
            style={[styles.featureBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('GlobalPrices')}
          >
            <Text style={styles.featureBtnIcon}>🌍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureBtnTitle, { color: colors.primaryDark }]}>Waze de Preços</Text>
              <Text style={[styles.featureBtnSub, { color: colors.primary }]}>Preços da comunidade</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Dicas */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>💡 Como funciona</Text>
          {[
            { icon: '📋', text: 'Monte sua lista antes de ir ao mercado' },
            { icon: '🏪', text: 'No mercado, registre os preços reais' },
            { icon: '📊', text: 'Acompanhe se os preços subiram ou baixaram' },
            { icon: '🎯', text: 'Receba alertas antes de estourar o orçamento' },
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <SupermarketPicker
        visible={pickerVisible}
        onSelect={handleMarketSelected}
        onClose={() => setPickerVisible(false)}
      />

      <PromotionsModal
        visible={promotionsVisible}
        onClose={() => setPromotionsVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    ...Platform.select({
      web: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
      default: { flex: 1 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: colors.surface,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
    fontWeight: Typography.medium,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnIcon: { fontSize: 20 },
  body: {
    flexGrow: 1,
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 100,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  alertBannerIcon: { fontSize: 18 },
  alertBannerText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    lineHeight: 18,
  },
  alertDismiss: { fontSize: 14, color: '#92400E', fontWeight: Typography.bold, padding: 4 },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 64,
  },
  currencyPrefix: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
  },
  quickLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
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
    borderWidth: 1.5,
  },
  quickText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  startBtn: {
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
  startText: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: colors.surface,
    letterSpacing: 0.3,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  navBtnIcon: { fontSize: 22 },
  navBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  navBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: colors.surface },
  featureRow: { flexDirection: 'row', gap: Spacing.sm },
  featureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  featureBtnIcon: { fontSize: 28 },
  featureBtnTitle: { fontSize: Typography.sm, fontWeight: Typography.extrabold },
  featureBtnSub: { fontSize: 10, fontWeight: Typography.semibold, marginTop: 2 },
  tipsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  tipsTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginBottom: Spacing.base,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  tipText: {
    flex: 1,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
});

export default HomeScreen;
