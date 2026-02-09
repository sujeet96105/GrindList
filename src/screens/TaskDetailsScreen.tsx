import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useShallow } from 'zustand/shallow';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDueDate } from '../utils/date';
import { getTaskById } from '../data/tasksDao';
import { Task } from '../types/task';
import { getReminderByTaskId } from '../data/remindersDao';

type RouteParams = {
  taskId: string;
};

export function TaskDetailsScreen() {
  const { spacing, colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as RouteParams;
  const { tasks, categories, tags } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      categories: state.categories,
      tags: state.tags,
    }))
  );
  const taskFromStore = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const [task, setTask] = useState<Task | null>(taskFromStore ?? null);
  const [reminderLabel, setReminderLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getTaskById(taskId), getReminderByTaskId(taskId)])
      .then(([fetched, reminder]) => {
        if (!mounted) return;
        setTask(fetched ?? taskFromStore ?? null);
        setReminderLabel(reminder ? new Date(reminder.remindAt).toLocaleString() : null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [taskId, taskFromStore]);
  const categoryName = useMemo(
    () => categories.find((category) => category.id === task?.categoryId)?.name,
    [categories, task?.categoryId]
  );
  const tagLabels = useMemo(
    () =>
      (task?.tagIds ?? [])
        .map((id) => tags.find((tag) => tag.id === id)?.name)
        .filter(Boolean) as string[],
    [tags, task?.tagIds]
  );

  if (loading) {
    return (
      <Screen>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Text variant="body" color={colors.textSecondary}>
            Loading...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Text variant="heading">Task not found</Text>
          <Text variant="body" color={colors.textSecondary}>
            It may have been deleted.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <Text variant="heading">{task.title}</Text>
        {task.description ? (
          <Text variant="body" color={colors.textSecondary}>
            {task.description}
          </Text>
        ) : null}

        <Card style={[styles.metaCard, { borderColor: colors.border }]}>
          <Text variant="caption" color={colors.textSecondary}>
            Due date
          </Text>
          <Text variant="body">{formatDueDate(task.dueDate) ?? 'No due date'}</Text>

          <Text variant="caption" color={colors.textSecondary} style={styles.metaLabel}>
            Priority
          </Text>
          <Text variant="body">{task.priority}</Text>

          <Text variant="caption" color={colors.textSecondary} style={styles.metaLabel}>
            Recurrence
          </Text>
          <Text variant="body">{task.recurrenceRule ?? 'none'}</Text>

          <Text variant="caption" color={colors.textSecondary} style={styles.metaLabel}>
            Reminder
          </Text>
          <Text variant="body">{reminderLabel ?? 'None'}</Text>

          <Text variant="caption" color={colors.textSecondary} style={styles.metaLabel}>
            Category
          </Text>
          <Text variant="body">{categoryName ?? 'None'}</Text>

          <Text variant="caption" color={colors.textSecondary} style={styles.metaLabel}>
            Tags
          </Text>
          <Text variant="body">{tagLabels.length > 0 ? tagLabels.join(', ') : 'None'}</Text>
        </Card>

        <View style={styles.actions}>
          <Card
            style={[styles.actionCard, { borderColor: colors.border }]}
            onPress={() =>
              navigation.navigate('EditTask' as never, { taskId: task.id } as never)
            }
          >
            <Text variant="body">Edit Task</Text>
          </Card>
        </View>

        <Card style={[styles.metaCard, { borderColor: colors.border }]}>
          <Text variant="caption" color={colors.textSecondary}>
            Subtasks
          </Text>
          {task.subtasks && task.subtasks.length > 0 ? (
            <View style={styles.subtaskList}>
              {task.subtasks.map((subtask) => (
                <View key={subtask.id} style={styles.subtaskRow}>
                  <View
                    style={[
                      styles.subtaskDot,
                      {
                        backgroundColor:
                          subtask.status === 'completed' ? colors.completed : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <Text
                    variant="body"
                    style={subtask.status === 'completed' ? styles.subtaskDone : undefined}
                  >
                    {subtask.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="body" color={colors.textSecondary}>
              No subtasks yet.
            </Text>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
  },
  metaCard: {
    gap: 8,
  },
  metaLabel: {
    marginTop: 8,
  },
  actions: {
    gap: 8,
  },
  actionCard: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  subtaskList: {
    gap: 8,
    marginTop: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
