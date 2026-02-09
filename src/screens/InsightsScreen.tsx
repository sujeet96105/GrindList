import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useStatsStore } from '../store/statsStore';
import { useShallow } from 'zustand/shallow';

export function InsightsScreen() {
  const { spacing, colors } = useTheme();
  const { tasks } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
    }))
  );
  const { stats, achievements, unlockedIds } = useStatsStore(
    useShallow((state) => ({
      stats: state.stats,
      achievements: state.achievements,
      unlockedIds: state.unlockedIds,
    }))
  );

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="heading">Insights</Text>
          <Text variant="body" color={colors.textSecondary}>
            Productivity overview
          </Text>
        </View>

        <View style={styles.grid}>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Completion rate
            </Text>
            <Text variant="heading">{completionRate}%</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Tasks completed
            </Text>
            <Text variant="heading">{completed}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Active tasks
            </Text>
            <Text variant="heading">{total - completed}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Total tasks
            </Text>
            <Text variant="heading">{total}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Current streak
            </Text>
            <Text variant="heading">{stats?.currentStreak ?? 0}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Longest streak
            </Text>
            <Text variant="heading">{stats?.longestStreak ?? 0}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              XP total
            </Text>
            <Text variant="heading">{stats?.xpTotal ?? 0}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Level
            </Text>
            <Text variant="heading">{stats?.level ?? 1}</Text>
          </Card>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Achievements
            </Text>
            <Text variant="heading">
              {unlockedIds.length}/{achievements.length}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  grid: {
    gap: 12,
  },
  card: {
    gap: 6,
  },
});
