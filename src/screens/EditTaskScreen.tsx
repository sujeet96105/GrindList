import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Priority, Task } from '../types/task';
import { Subtask } from '../types/subtask';
import { getTaskById } from '../data/tasksDao';
import { getReminderByTaskId, deleteReminderById, upsertTaskReminder } from '../data/remindersDao';
import { cancelTaskReminder, scheduleTaskReminder } from '../notifications/notifee';
import { useSettingsStore } from '../store/settingsStore';
import { useShallow } from 'zustand/shallow';
import { adjustReminderForQuietHours } from '../utils/quietHours';

type RouteParams = {
  taskId: string;
};

export function EditTaskScreen() {
  const { spacing, colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as RouteParams;
  const { tasks, updateTask, tags, categories, addTagByName, addCategoryByName } =
    useTasksStore(
      useShallow((state) => ({
        tasks: state.tasks,
        updateTask: state.updateTask,
        tags: state.tags,
        categories: state.categories,
        addTagByName: state.addTagByName,
        addCategoryByName: state.addCategoryByName,
      }))
    );
  const quietHours = useSettingsStore(
    useShallow((state) => ({
      notificationsEnabled: state.notificationsEnabled,
      quietHoursEnabled: state.quietHoursEnabled,
      quietHoursStart: state.quietHoursStart,
      quietHoursEnd: state.quietHoursEnd,
    }))
  );

  const taskFromStore = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const [task, setTask] = useState<Task | null>(taskFromStore ?? null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState<Date | null>(
    task?.dueDate ? new Date(task.dueDate) : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId ?? null);
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(
    task?.recurrenceRule ?? 'none'
  );
  const [locationLat, setLocationLat] = useState<string>(
    task?.locationReminder?.lat?.toString() ?? ''
  );
  const [locationLng, setLocationLng] = useState<string>(
    task?.locationReminder?.lng?.toString() ?? ''
  );
  const [locationRadius, setLocationRadius] = useState<string>(
    task?.locationReminder?.radiusMeters?.toString() ?? '250'
  );

  const titleTrimmed = title.trim();
  const isValid = titleTrimmed.length > 0;
  const showTitleError = !isValid && title.length > 0;

  useEffect(() => {
    let mounted = true;
    Promise.all([getTaskById(taskId), getReminderByTaskId(taskId)])
      .then(([fetched, reminder]) => {
        if (!mounted) return;
        const source = fetched ?? taskFromStore ?? null;
        setTask(source);
        if (source) {
          setTitle(source.title);
          setDescription(source.description ?? '');
          setPriority(source.priority);
          setDueDate(source.dueDate ? new Date(source.dueDate) : null);
          setCategoryId(source.categoryId ?? null);
          setTagIds(source.tagIds ?? []);
          setSubtasks(source.subtasks ?? []);
          setRecurrenceRule(source.recurrenceRule ?? 'none');
          setLocationLat(source.locationReminder?.lat?.toString() ?? '');
          setLocationLng(source.locationReminder?.lng?.toString() ?? '');
          setLocationRadius(source.locationReminder?.radiusMeters?.toString() ?? '250');
        }
        if (reminder) {
          setReminderId(reminder.id);
          setRemindAt(new Date(reminder.remindAt));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [taskFromStore, taskId]);

  if (loading) {
    return (
      <Screen>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <View style={[styles.container, { padding: spacing.lg }]}>
          <Text variant="heading">Task not found</Text>
          <Button label="Go back" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const handleSave = () => {
    if (!isValid) return;
    const updated: Task = {
      ...task,
      title: titleTrimmed,
      description: description.trim() || null,
      priority,
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
      categoryId,
      tagIds,
      subtasks,
      recurrenceRule,
      recurrenceInterval: recurrenceRule === 'none' ? null : 1,
      recurrenceEndDate: null,
      locationReminder:
        locationLat && locationLng
          ? {
              lat: Number(locationLat),
              lng: Number(locationLng),
              radiusMeters: Number(locationRadius) || 250,
            }
          : null,
      updatedAt: new Date().toISOString(),
    };
    updateTask(updated);
    if (remindAt && quietHours.notificationsEnabled) {
      const adjustment = adjustReminderForQuietHours(remindAt, quietHours);
      const remindAtIso = adjustment.adjustedAt.toISOString();
      const previousId = reminderId;
      if (previousId) {
        cancelTaskReminder(previousId).catch((err) =>
          console.warn('Failed to cancel reminder', err)
        );
        deleteReminderById(previousId).catch((err) =>
          console.warn('Failed to remove reminder', err)
        );
      }
      upsertTaskReminder(updated.id, remindAtIso)
        .then((id) => {
          setReminderId(id);
          return scheduleTaskReminder(id, updated.title, remindAtIso);
        })
        .catch((err) => console.warn('Failed to schedule reminder', err));
    } else if (reminderId) {
      const toRemove = reminderId;
      setReminderId(null);
      cancelTaskReminder(toRemove).catch((err) =>
        console.warn('Failed to cancel reminder', err)
      );
      deleteReminderById(toRemove).catch((err) =>
        console.warn('Failed to remove reminder', err)
      );
    }
    navigation.goBack();
  };

  const openDuePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dueDate ?? new Date(),
        mode: 'date',
        onChange: (_, date) => {
          if (date) setDueDate(date);
        },
      });
      return;
    }
    setShowPicker(true);
  };

  const openReminderPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: remindAt ?? new Date(),
        mode: 'datetime',
        onChange: (_, date) => {
          if (date) setRemindAt(date);
        },
      });
      return;
    }
    setShowReminderPicker(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <Text variant="heading">Edit Task</Text>

        <View style={styles.form}>
          <Input
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            accessibilityLabel="Task title"
          />
          <View style={styles.titleMeta}>
            {showTitleError ? (
              <Text variant="caption" color={colors.priorityHigh}>
                Title is required
              </Text>
            ) : null}
          </View>
          <Input
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            maxLength={500}
            accessibilityLabel="Task description"
          />

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Priority</Text>
            <View style={styles.priorityRow}>
              <Button
                label="High"
                variant={priority === 'high' ? 'primary' : 'secondary'}
                onPress={() => setPriority('high')}
                accessibilityLabel="Set priority high"
              />
              <Button
                label="Medium"
                variant={priority === 'medium' ? 'primary' : 'secondary'}
                onPress={() => setPriority('medium')}
                accessibilityLabel="Set priority medium"
              />
              <Button
                label="Low"
                variant={priority === 'low' ? 'primary' : 'secondary'}
                onPress={() => setPriority('low')}
                accessibilityLabel="Set priority low"
              />
            </View>
          </Card>

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Due date</Text>
            <View style={styles.dueRow}>
              <Text variant="caption" color={colors.textSecondary}>
                {dueDate ? dueDate.toDateString() : 'No due date'}
              </Text>
              <Button label="Pick date" variant="secondary" onPress={openDuePicker} />
            </View>
          </Card>
          {showPicker && Platform.OS === 'ios' ? (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) setDueDate(date);
              }}
            />
          ) : null}

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Recurrence</Text>
            <View style={styles.chipRow}>
              {(['none', 'daily', 'weekly', 'monthly'] as const).map((rule) => {
                const active = recurrenceRule === rule;
                return (
                  <Button
                    key={rule}
                    label={rule === 'none' ? 'None' : rule}
                    size="sm"
                    variant={active ? 'primary' : 'secondary'}
                    onPress={() => setRecurrenceRule(rule)}
                    accessibilityLabel={`Set recurrence ${rule}`}
                  />
                );
              })}
            </View>
          </Card>

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Location reminder (foreground only)</Text>
            <View style={styles.inlineRow}>
              <Input
                placeholder="Latitude"
                value={locationLat}
                onChangeText={setLocationLat}
                style={styles.inlineInput}
                accessibilityLabel="Location latitude"
              />
              <Input
                placeholder="Longitude"
                value={locationLng}
                onChangeText={setLocationLng}
                style={styles.inlineInput}
                accessibilityLabel="Location longitude"
              />
            </View>
            <View style={styles.inlineRow}>
              <Input
                placeholder="Radius (m)"
                value={locationRadius}
                onChangeText={setLocationRadius}
                style={styles.inlineInput}
                accessibilityLabel="Location radius meters"
              />
            </View>
          </Card>

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Reminder</Text>
            <View style={styles.dueRow}>
              <Text variant="caption" color={colors.textSecondary}>
                {quietHours.notificationsEnabled
                  ? remindAt
                    ? remindAt.toLocaleString()
                    : 'No reminder'
                  : 'Notifications disabled'}
              </Text>
              <View style={styles.reminderActions}>
                {remindAt ? (
                <Button
                  label="Clear"
                  size="sm"
                  variant="secondary"
                  onPress={() => setRemindAt(null)}
                  disabled={!quietHours.notificationsEnabled}
                  accessibilityLabel="Clear reminder"
                />
                ) : null}
                <Button
                  label="Pick time"
                  variant="secondary"
                  onPress={openReminderPicker}
                  disabled={!quietHours.notificationsEnabled}
                  accessibilityLabel="Pick reminder time"
                />
              </View>
            </View>
          </Card>
          {showReminderPicker && Platform.OS === 'ios' ? (
            <DateTimePicker
              value={remindAt ?? new Date()}
              mode="datetime"
              onChange={(_, date) => {
                setShowReminderPicker(false);
                if (date) setRemindAt(date);
              }}
            />
          ) : null}

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Category</Text>
            <View style={styles.chipRow}>
              {categories.length > 0 ? (
                categories.map((category) => {
                  const selected = categoryId === category.id;
                  return (
                    <Button
                      key={category.id}
                      label={category.name}
                      size="sm"
                      variant={selected ? 'primary' : 'secondary'}
                      onPress={() => setCategoryId(selected ? null : category.id)}
                    />
                  );
                })
              ) : (
                <Text variant="caption" color={colors.textSecondary}>
                  No categories yet
                </Text>
              )}
            </View>
            <View style={styles.inlineRow}>
              <Input
                placeholder="New category"
                value={newCategory}
                onChangeText={setNewCategory}
                style={styles.inlineInput}
                accessibilityLabel="New category"
              />
              <Button
                label="Add"
                size="sm"
                variant="secondary"
                onPress={() => {
                  const created = addCategoryByName(newCategory);
                  if (created) {
                    setCategoryId(created.id);
                    setNewCategory('');
                  }
                }}
              />
            </View>
          </Card>

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Tags</Text>
            <View style={styles.chipRow}>
              {tags.length > 0 ? (
                tags.map((tag) => {
                  const selected = tagIds.includes(tag.id);
                  return (
                    <Button
                      key={tag.id}
                      label={tag.name}
                      size="sm"
                      variant={selected ? 'primary' : 'secondary'}
                      onPress={() =>
                        setTagIds((current) =>
                          selected
                            ? current.filter((id) => id !== tag.id)
                            : [...current, tag.id]
                        )
                      }
                    />
                  );
                })
              ) : (
                <Text variant="caption" color={colors.textSecondary}>
                  No tags yet
                </Text>
              )}
            </View>
            <View style={styles.inlineRow}>
              <Input
                placeholder="New tag"
                value={newTag}
                onChangeText={setNewTag}
                style={styles.inlineInput}
                accessibilityLabel="New tag"
              />
              <Button
                label="Add"
                size="sm"
                variant="secondary"
                onPress={() => {
                  const created = addTagByName(newTag);
                  if (created) {
                    setTagIds((current) =>
                      current.includes(created.id) ? current : [...current, created.id]
                    );
                    setNewTag('');
                  }
                }}
              />
            </View>
          </Card>

          <Card style={[styles.priorityCard, { borderColor: colors.border }]}>
            <Text variant="body">Subtasks</Text>
            <View style={styles.subtaskList}>
              {subtasks.length > 0 ? (
                subtasks.map((subtask) => (
                  <View key={subtask.id} style={styles.subtaskRow}>
                    <Button
                      label={subtask.status === 'completed' ? 'Done' : 'Todo'}
                      size="sm"
                      variant={subtask.status === 'completed' ? 'primary' : 'secondary'}
                      onPress={() =>
                        setSubtasks((current) =>
                          current.map((item) =>
                            item.id === subtask.id
                              ? {
                                  ...item,
                                  status: item.status === 'completed' ? 'active' : 'completed',
                                  completionAt:
                                    item.status === 'completed' ? null : new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      value={subtask.title}
                      onChangeText={(text) =>
                        setSubtasks((current) =>
                          current.map((item) =>
                            item.id === subtask.id
                              ? { ...item, title: text, updatedAt: new Date().toISOString() }
                              : item
                          )
                        )
                      }
                      placeholder="Subtask title"
                      style={styles.subtaskInput}
                      accessibilityLabel="Subtask title"
                    />
                    <Button
                      label="Remove"
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        setSubtasks((current) =>
                          current
                            .filter((item) => item.id !== subtask.id)
                            .map((item, index) => ({
                              ...item,
                              orderIndex: index,
                              updatedAt: new Date().toISOString(),
                            }))
                        )
                      }
                    />
                  </View>
                ))
              ) : (
                <Text variant="caption" color={colors.textSecondary}>
                  No subtasks yet
                </Text>
              )}
            </View>
            <View style={styles.inlineRow}>
              <Input
                placeholder="New subtask"
                value={newSubtask}
                onChangeText={setNewSubtask}
                style={styles.inlineInput}
                accessibilityLabel="New subtask"
              />
              <Button
                label="Add"
                size="sm"
                variant="secondary"
                onPress={() => {
                  const trimmed = newSubtask.trim();
                  if (!trimmed || !task || subtasks.length >= 20) return;
                  const now = new Date().toISOString();
                  setSubtasks((current) => [
                    ...current,
                    {
                      id: `st_${Math.random().toString(36).slice(2, 10)}`,
                      taskId: task.id,
                      title: trimmed,
                      status: 'active',
                      orderIndex: current.length,
                      completionAt: null,
                      createdAt: now,
                      updatedAt: now,
                      deletedAt: null,
                    },
                  ]);
                  setNewSubtask('');
                }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button label="Save" onPress={handleSave} fullWidth disabled={!isValid} />
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
  form: {
    gap: 16,
  },
  priorityCard: {
    gap: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineInput: {
    flex: 1,
  },
  subtaskList: {
    gap: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
  },
  titleMeta: {
    minHeight: 18,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 'auto',
  },
});
