import { View, StyleSheet, Platform } from 'react-native';
import { Clock, ChartBar as BarChart2, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();
// Wrap the Navigator with layout context for expo-router compatibility
const MaterialTopTabs = withLayoutContext(Navigator);

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarStyle: {
          ...styles.tabBar,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true,
        tabBarIndicator: () => null,
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <Clock size={size || 24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <BarChart2 size={size || 24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <Settings size={size || 24} color={color} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    elevation: 0,
    height: 85,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: 'transparent',
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
});
