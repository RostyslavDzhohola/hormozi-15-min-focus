import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/components/ThemeProvider';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SystemUI from 'expo-system-ui';
import { SessionCompletionModalProvider } from '@/components/SessionCompletionModalProvider';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme ?? 'light');

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  // Apply theme system-wide
  useEffect(() => {
    const backgroundColor =
      systemColorScheme === 'dark' ? '#1E293B' : '#F9FAFB';
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [theme]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider initialTheme={systemColorScheme ?? 'light'}>
      <SessionCompletionModalProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor:
                  systemColorScheme === 'dark' ? '#1E293B' : '#F9FAFB',
              },
              animation:
                Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </GestureHandlerRootView>
      </SessionCompletionModalProvider>
    </ThemeProvider>
  );
}
