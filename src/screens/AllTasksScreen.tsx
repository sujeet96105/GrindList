import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { TaskRow } from '../components/TaskRow';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useShallow } from 'zustand/shallow';
import { formatDueDate, isToday, isUpcoming } from '../utils/date';
import { Fab } from '../components/Fab';
import { useNavigation } from '@react-navigation/native';

export function AllTasksScreen() {
  const { spacing, colors } = useTheme();
  const navigation = useNavigation();
  const { tasks, tags, categories, toggleComplete, removeTask } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      tags: state.tags,
      categories: state.categories,
      toggleComplete: state.toggleComplete,
      removeTask: state.removeTask,
    }))
  );
  const [filter, setFilter] = useState<'Today' | 'Upcoming' | 'Completed' | 'All'>('All');
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const tagLookup = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name])),
    [tags]
  );

  const filtered = useMemo(() => {
    if (filter === 'Completed') {
      return tasks.filter((t) => t.status === 'completed');
    }
    if (filter === 'Today') {
      return tasks.filter((t) => isToday(t.dueDate));
    }
    if (filter === 'Upcoming') {
      return tasks.filter((t) => isUpcoming(t.dueDate));
    }
    return tasks;
  }, [tasks, filter]);

  const searched = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return filtered;
    return filtered.filter((task) => {
      const inTitle = task.title.toLowerCase().includes(trimmed);
      const inDesc = (task.description ?? '').toLowerCase().includes(trimmed);
      return inTitle || inDesc;
    });
  }, [filtered, query]);

  const narrowed = useMemo(() => {
    return searched.filter((task) => {
      if (activeCategoryId && task.categoryId !== activeCategoryId) return false;
      if (activeTagId && !(task.tagIds ?? []).includes(activeTagId)) return false;
      return true;
    });
  }, [searched, activeCategoryId, activeTagId]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleComplete(id);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="heading">All Tasks</Text>
          <Text variant="body" color={colors.textSecondary}>
            Browse and filter all tasks
          </Text>
        </View>

        <View style={styles.filters}>
          {(['Today', 'Upcoming', 'Completed', 'All'] as const).map((label) => {
            const active = filter === label;
            return (
              <Card
                key={label}
                onPress={() => setFilter(label)}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : styles.filterChipInactive,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : colors.surface,
                  },
                ]}
              >
                <Text variant="caption" color={active ? '#FFFFFF' : colors.textPrimary}>
                  {label}
                </Text>
              </Card>
            );
          })}
        </View>

        <Card style={[styles.searchCard, { borderColor: colors.border }]}>
          <Input
            placeholder="Search tasks"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </Card>

        <View style={styles.filterSection}>
          <Text variant="caption" color={colors.textSecondary}>
            Categories
          </Text>
          <View style={styles.chipRow}>
            <Card
              onPress={() => setActiveCategoryId(null)}
              style={[
                styles.filterChip,
                {
                  borderColor: activeCategoryId ? colors.border : colors.accent,
                  backgroundColor: activeCategoryId ? colors.surface : colors.accent,
                },
              ]}
            >
              <Text variant="caption" color={activeCategoryId ? colors.textPrimary : '#FFFFFF'}>
                All
              </Text>
            </Card>
            {categories.map((category) => {
              const active = activeCategoryId === category.id;
              return (
                <Card
                  key={category.id}
                  onPress={() => setActiveCategoryId(active ? null : category.id)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accent : colors.surface,
                    },
                  ]}
                >
                  <Text variant="caption" color={active ? '#FFFFFF' : colors.textPrimary}>
                    {category.name}
                  </Text>
                </Card>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text variant="caption" color={colors.textSecondary}>
            Tags
          </Text>
          <View style={styles.chipRow}>
            <Card
              onPress={() => setActiveTagId(null)}
              style={[
                styles.filterChip,
                {
                  borderColor: activeTagId ? colors.border : colors.accent,
                  backgroundColor: activeTagId ? colors.surface : colors.accent,
                },
              ]}
            >
              <Text variant="caption" color={activeTagId ? colors.textPrimary : '#FFFFFF'}>
                All
              </Text>
            </Card>
            {tags.map((tag) => {
              const active = activeTagId === tag.id;
              return (
                <Card
                  key={tag.id}
                  onPress={() => setActiveTagId(active ? null : tag.id)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accent : colors.surface,
                    },
                  ]}
                >
                  <Text variant="caption" color={active ? '#FFFFFF' : colors.textPrimary}>
                    {tag.name}
                  </Text>
                </Card>
              );
            })}
          </View>
        </View>

        {narrowed.length > 0 ? (
          <View style={styles.list}>
            {narrowed.map((task) => (
              <TaskRow
                key={task.id}
                title={task.title}
                priority={task.priority}
                dueLabel={formatDueDate(task.dueDate)}
                categoryLabel={task.categoryId ? categoryLookup.get(task.categoryId) : undefined}
                tagLabels={(task.tagIds ?? [])
                  .map((id) => tagLookup.get(id))
                  .filter(Boolean) as string[]}
                completed={task.status === 'completed'}
                onToggleComplete={() => handleToggle(task.id)}
                onDelete={() => removeTask(task.id)}
                onPress={() =>
                  navigation.navigate('TaskDetails' as never, { taskId: task.id } as never)
                }
              />
            ))}
          </View>
        ) : (
          <Card style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text variant="title" style={styles.emptyTitle}>
              No tasks match
            </Text>
            <Text variant="body" color={colors.textSecondary}>
              Try clearing filters or search.
            </Text>
          </Card>
        )}
      </ScrollView>
      <Fab onPress={() => navigation.navigate('CreateTask' as never)} />
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
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  filterChipActive: {},
  filterChipInactive: {},
  list: {
    gap: 8,
  },
  searchCard: {
    paddingVertical: 4,
  },
  searchInput: {
    paddingHorizontal: 0,
    borderBottomWidth: 0,
  },
  filterSection: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyCard: {
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
  },
});
