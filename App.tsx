import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : '100%' }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
