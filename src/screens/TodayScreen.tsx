import React, { useEffect } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { TaskRow } from '../components/TaskRow';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useShallow } from 'zustand/shallow';
import { useNavigation } from '@react-navigation/native';
import { Fab } from '../components/Fab';
import { formatDueDate, isToday } from '../utils/date';

export function TodayScreen() {
  const { spacing, colors } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const { tasks, tags, categories, toggleComplete, removeTask } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      tags: state.tags,
      categories: state.categories,
      toggleComplete: state.toggleComplete,
      removeTask: state.removeTask,
    }))
  );
  const categoryLookup = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const tagLookup = React.useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name])),
    [tags]
  );

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleComplete(id);
  };

  const highPriority = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
  const dueToday = tasks.filter((t) => isToday(t.dueDate) && t.status !== 'completed');
  const completed = tasks.filter((t) => t.status === 'completed');
  const hasTasks = highPriority.length + dueToday.length + completed.length > 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="heading">Today</Text>
          <Text variant="body" color={colors.textSecondary}>
            High priority and due today
          </Text>
        </View>

        {hasTasks ? (
          <View style={styles.list}>
            {highPriority.length > 0 ? (
              <Section title="High Priority">
                {highPriority.map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    priority={task.priority}
                    dueLabel={formatDueDate(task.dueDate)}
                    categoryLabel={task.categoryId ? categoryLookup.get(task.categoryId) : undefined}
                    tagLabels={(task.tagIds ?? [])
                      .map((id) => tagLookup.get(id))
                      .filter(Boolean) as string[]}
                    completed={false}
                    onToggleComplete={() => handleToggle(task.id)}
                    onDelete={() => removeTask(task.id)}
                    onPress={() =>
                      navigation.navigate('TaskDetails' as never, { taskId: task.id } as never)
                    }
                  />
                ))}
              </Section>
            ) : null}

            {dueToday.length > 0 ? (
              <Section title="Due Today">
                {dueToday.map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    priority={task.priority}
                    dueLabel={formatDueDate(task.dueDate)}
                    categoryLabel={task.categoryId ? categoryLookup.get(task.categoryId) : undefined}
                    tagLabels={(task.tagIds ?? [])
                      .map((id) => tagLookup.get(id))
                      .filter(Boolean) as string[]}
                    completed={false}
                    onToggleComplete={() => handleToggle(task.id)}
                    onDelete={() => removeTask(task.id)}
                    onPress={() =>
                      navigation.navigate('TaskDetails' as never, { taskId: task.id } as never)
                    }
                  />
                ))}
              </Section>
            ) : null}

            {completed.length > 0 ? (
              <Section title="Completed">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    priority={task.priority}
                    dueLabel={formatDueDate(task.dueDate)}
                    categoryLabel={task.categoryId ? categoryLookup.get(task.categoryId) : undefined}
                    tagLabels={(task.tagIds ?? [])
                      .map((id) => tagLookup.get(id))
                      .filter(Boolean) as string[]}
                    completed
                    onToggleComplete={() => handleToggle(task.id)}
                    onDelete={() => removeTask(task.id)}
                    onPress={() =>
                      navigation.navigate('TaskDetails' as never, { taskId: task.id } as never)
                    }
                  />
                ))}
              </Section>
            ) : null}
          </View>
        ) : (
          <Card style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text variant="title" style={styles.emptyTitle}>
              You're all done!
            </Text>
            <Text variant="body" color={colors.textSecondary}>
              Tap + to add a task and keep your streak alive.
            </Text>
          </Card>
        )}
      </ScrollView>
      <Fab onPress={() => navigation.navigate('CreateTask' as never)} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  list: {
    gap: 8,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionList: {
    gap: 8,
  },
  emptyCard: {
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
  },
});
