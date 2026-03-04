import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDb } from './src/data/schema';
import { getAllTasks } from './src/data/tasksDao';
import { getAllTags } from './src/data/tagsDao';
import { getAllCategories } from './src/data/categoriesDao';
import { getSettings } from './src/data/settingsDao';
import { useTasksStore } from './src/store/tasksStore';
import { useSettingsStore } from './src/store/settingsStore';

import {
  ensureDefaultAchievements,
  getAllAchievements,
  getUserAchievementIds,
} from './src/data/achievementsDao';
import { getUserStats } from './src/data/userStatsDao';
import { useStatsStore } from './src/store/statsStore';


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const setTasks = useTasksStore((state) => state.setTasks);
  const setTags = useTasksStore((state) => state.setTags);
  const setCategories = useTasksStore((state) => state.setCategories);
  const lastError = useTasksStore((state) => state.lastError);
  const clearError = useTasksStore((state) => state.clearError);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  const hydrateStats = useStatsStore((state) => state.hydrate);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        await initDb();
        await ensureDefaultAchievements();
        const [
          allTasks,
          tags,
          categories,
          settings,
          stats,
          achievements,
          unlockedIds,
        ] = await Promise.all([
          getAllTasks(),
          getAllTags(),
          getAllCategories(),
          getSettings(),
          getUserStats(),
          getAllAchievements(),
          getUserAchievementIds(),
        ]);
        if (mounted) {
          setTasks(allTasks);
          setTags(tags);
          setCategories(categories);
          hydrateSettings(settings);
          hydrateStats(stats, achievements, unlockedIds);
        }
      } catch (err) {
        console.error('DB init failed', err);
      } finally {
        if (mounted) setReady(true);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [setTasks, setTags, setCategories, hydrateSettings, hydrateStats]);

  useEffect(() => {
    if (!ready) return;
  }, [ready]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {ready ? <AppNavigator /> : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      {lastError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{lastError}</Text>
            <Pressable onPress={clearError} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#B00020',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: '#FFFFFF', flex: 1 },
  dismissButton: { paddingHorizontal: 8, paddingVertical: 4 },
  dismissText: { color: '#FFFFFF', fontWeight: '600' },
});

export default App;
