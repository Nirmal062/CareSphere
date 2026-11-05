import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LanguageProvider } from './src/context/LanguageContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SetupModal } from './src/components/SetupModal';
import { initDatabase, getProtocolsCount } from './src/offline/database';

export default function App() {
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    async function checkFirstTimeLaunch() {
      try {
        await initDatabase();
        const count = await getProtocolsCount();
        if (count < 107) {
          setShowSetupModal(true);
        }
      } catch (err) {
        console.warn('First-time offline initialization:', err);
      }
    }
    checkFirstTimeLaunch();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
          <SetupModal
            visible={showSetupModal}
            onClose={() => setShowSetupModal(false)}
          />
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
