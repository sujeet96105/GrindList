import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
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
import { startSyncWorker } from './src/sync/syncWorker';
import { useSyncStore } from './src/store/syncStore';
import {
  ensureDefaultAchievements,
  getAllAchievements,
  getUserAchievementIds,
} from './src/data/achievementsDao';
import { getUserStats } from './src/data/userStatsDao';
import { useStatsStore } from './src/store/statsStore';
import { checkLocationReminders } from './src/location/locationReminder';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const setTasks = useTasksStore((state) => state.setTasks);
  const setTags = useTasksStore((state) => state.setTags);
  const setCategories = useTasksStore((state) => state.setCategories);
  const lastError = useTasksStore((state) => state.lastError);
  const clearError = useTasksStore((state) => state.clearError);
  const tasks = useTasksStore((state) => state.tasks);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const refreshSyncCounts = useSyncStore((state) => state.refreshCounts);
  const hydrateStats = useStatsStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        await initDb();
        await ensureDefaultAchievements();
        const [tasks, tags, categories, settings, stats, achievements, unlockedIds] =
          await Promise.all([
          getAllTasks(),
          getAllTags(),
          getAllCategories(),
          getSettings(),
          getUserStats(),
          getAllAchievements(),
          getUserAchievementIds(),
        ]);
        if (mounted) {
          setTasks(tasks);
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
  }, [setTasks, setTags, setCategories, hydrateSettings]);

  useEffect(() => {
    if (!ready) return;
    refreshSyncCounts().catch((err) => console.warn('Failed to load sync counts', err));
    const handle = startSyncWorker(30000, () => {
      refreshSyncCounts().catch((err) => console.warn('Failed to refresh sync counts', err));
    });
    return () => handle.stop();
  }, [ready, refreshSyncCounts]);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      checkLocationReminders(tasks).catch((err) =>
        console.warn('Location reminder check failed', err)
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [ready, tasks]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {ready ? <AppNavigator /> : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      )}
      {lastError ? (
        <View
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            padding: 12,
            borderRadius: 10,
            backgroundColor: '#B00020',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: '#FFFFFF', flex: 1 }}>{lastError}</Text>
            <Pressable onPress={clearError} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

export default App;
