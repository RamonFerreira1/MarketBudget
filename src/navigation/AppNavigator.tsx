import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PreListScreen from '../screens/PreListScreen';
import MarketModeScreen from '../screens/MarketModeScreen';
import SummaryScreen from '../screens/SummaryScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

export type RootStackParamList = {
  Home: undefined;
  PreList: undefined;
  MarketMode: undefined;
  Summary: undefined;
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Todos os headers são customizados nas telas
          gestureEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PreList" component={PreListScreen} />
        <Stack.Screen name="MarketMode" component={MarketModeScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
