import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Clock, ChartBar as BarChart2, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              tint={isDark ? 'dark' : 'light'} 
              intensity={isDark ? 70 : 95} 
              style={StyleSheet.absoluteFill} 
            />
          ) : (
            <View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: isDark 
                    ? 'rgba(30, 41, 59, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)' 
                }
              ]} 
            />
          )
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 0,
    height: 85,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  }
});