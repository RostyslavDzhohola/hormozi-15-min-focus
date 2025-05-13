import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Info, Moon, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient, LinearGradientPoint } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const { colors } = useTheme();

  const { settings, resetAllData } = useSettings();

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetAllData(),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={colors.gradient.secondary as any}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 } as LinearGradientPoint}
        end={{ x: 1, y: 1 } as LinearGradientPoint}
      />
      <View style={[styles.headerContainer]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Settings
        </Text>
      </View>

      <ScrollView style={[styles.content]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Preferences
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View
            style={[styles.settingItem, { borderColor: colors.border.subtle }]}
          >
            <View style={styles.settingInfo}>
              <Moon size={20} color={colors.primary.main} />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Dark Mode
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Information
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.linkItem, { borderColor: colors.border.subtle }]}
          >
            <View style={styles.settingInfo}>
              <Info size={20} color={colors.primary.main} />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                About Time Tracker
              </Text>
            </View>
            <ArrowRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Data Management
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.settingItem, { borderColor: colors.border.subtle }]}
            onPress={handleResetAllData}
          >
            <Text style={[styles.resetText, { color: colors.error.main }]}>
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.text.tertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  resetText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 24,
  },
});
