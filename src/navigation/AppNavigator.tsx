import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import PreListScreen from '../screens/PreListScreen';
import MarketModeScreen from '../screens/MarketModeScreen';
import SummaryScreen from '../screens/SummaryScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import MarketComparisonScreen from '../screens/MarketComparisonScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GlobalPricesScreen from '../screens/GlobalPricesScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { subscribeToAuthChanges } from '../services/authService';
import { useAppColors } from '../store/useThemeStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Typography, Shadow } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  PreList: undefined;
  MarketMode: undefined;
  Summary: undefined;
  History: undefined;
  MarketComparison: undefined;
  Dashboard: undefined;
  GlobalPrices: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  const colors = useAppColors();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyle: { backgroundColor: 'transparent' },
          }}
        >
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="PreList" component={PreListScreen} />
              <Stack.Screen name="MarketMode" component={MarketModeScreen} />
              <Stack.Screen name="Summary" component={SummaryScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="MarketComparison" component={MarketComparisonScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="GlobalPrices" component={GlobalPricesScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <NetworkBanner />
    </View>
  );
};

const NetworkBanner = () => {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  
  if (isConnected) return null;

  return (
    <View style={[
      styles.bannerContainer, 
      { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }
    ]}>
      <Text style={styles.bannerIcon}>⚠️</Text>
      <Text style={styles.bannerText}>Você está offline. Alterações salvas localmente.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FDE68A',
    borderColor: '#D97706',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadow.sm,
    zIndex: 9999,
  },
  bannerIcon: { fontSize: 16 },
  bannerText: {
    flex: 1,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: '#92400E',
  },
});

export default AppNavigator;
