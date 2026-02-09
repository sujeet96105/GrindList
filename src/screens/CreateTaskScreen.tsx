import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../theme';
import { useTasksStore } from '../store/tasksStore';
import { useNavigation } from '@react-navigation/native';
import { Priority } from '../types/task';
import { SubtaskStatus } from '../types/subtask';
import { upsertTaskReminder } from '../data/remindersDao';
import { scheduleTaskReminder } from '../notifications/notifee';
import { useSettingsStore } from '../store/settingsStore';
import { useShallow } from 'zustand/shallow';
import { adjustReminderForQuietHours } from '../utils/quietHours';

export function CreateTaskScreen() {
  const { spacing, colors } = useTheme();
  const navigation = useNavigation();
  const {
    addTaskFromInput,
    activeCount,
    tags,
    categories,
    addTagByName,
    addCategoryByName,
  } = useTasksStore(
    useShallow((state) => ({
      addTaskFromInput: state.addTaskFromInput,
      activeCount: state.tasks.reduce(
        (count, task) => count + (task.status !== 'completed' ? 1 : 0),
        0
      ),
      tags: state.tags,
      categories: state.categories,
      addTagByName: state.addTagByName,
      addCategoryByName: state.addCategoryByName,
    }))
  );
  const settings = useSettingsStore(
    useShallow((state) => ({
      notificationsEnabled: state.notificationsEnabled,
      quietHoursEnabled: state.quietHoursEnabled,
      quietHoursStart: state.quietHoursStart,
      quietHoursEnd: state.quietHoursEnd,
    }))
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{
    id: string;
    title: string;
    status: SubtaskStatus;
    orderIndex: number;
  }>>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(
    'none'
  );
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationRadius, setLocationRadius] = useState('250');
  const titleTrimmed = title.trim();
  const isValid = titleTrimmed.length > 0;
  const titleCount = title.length;
  const descCount = description.length;
  const showTitleError = !isValid && title.length > 0;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(null);
    setShowPicker(false);
    setShowReminderPicker(false);
    setCategoryId(null);
    setTagIds([]);
    setNewCategory('');
    setNewTag('');
    setSubtasks([]);
    setNewSubtask('');
    setRemindAt(null);
    setRecurrenceRule('none');
    setLocationLat('');
    setLocationLng('');
    setLocationRadius('250');
  };

  const handleCreate = () => {
    if (!isValid) return;
    const task = addTaskFromInput(
      title.trim(),
      description.trim() || undefined,
      dueDate ? dueDate.toISOString().split('T')[0] : null,
      priority,
      categoryId,
      tagIds,
      subtasks,
      recurrenceRule,
      1,
      null,
      locationLat && locationLng
        ? {
            lat: Number(locationLat),
            lng: Number(locationLng),
            radiusMeters: Number(locationRadius) || 250,
          }
        : null
    );
    if (remindAt && task && settings.notificationsEnabled) {
      const adjustment = adjustReminderForQuietHours(remindAt, settings);
      const remindAtIso = adjustment.adjustedAt.toISOString();
      upsertTaskReminder(task.id, remindAtIso)
        .then((reminderId) => scheduleTaskReminder(reminderId, task.title, remindAtIso))
        .catch((err) => console.warn('Failed to schedule reminder', err));
    }
    if (task) {
      resetForm();
      navigation.goBack();
    }
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

  const dueLabel = useMemo(() => {
    if (!dueDate) return 'No due date';
    return dueDate.toDateString();
  }, [dueDate]);

  const reminderLabel = useMemo(() => {
    if (!remindAt) return 'No reminder';
    return remindAt.toLocaleString();
  }, [remindAt]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <Text variant="heading">Create Task</Text>

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
            ) : (
              <Text variant="caption" color={colors.textSecondary}>
                {titleCount}/200
              </Text>
            )}
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
          <Text variant="caption" color={colors.textSecondary}>
            {descCount}/500
          </Text>

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
                {dueLabel}
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
                {settings.notificationsEnabled ? reminderLabel : 'Notifications disabled'}
              </Text>
              <View style={styles.reminderActions}>
                {remindAt ? (
                <Button
                  label="Clear"
                  size="sm"
                  variant="secondary"
                  onPress={() => setRemindAt(null)}
                  disabled={!settings.notificationsEnabled}
                  accessibilityLabel="Clear reminder"
                />
                ) : null}
                <Button
                  label="Pick time"
                  variant="secondary"
                  onPress={openReminderPicker}
                  disabled={!settings.notificationsEnabled}
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
                    setTagIds((current) => (current.includes(created.id) ? current : [...current, created.id]));
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
                            item.id === subtask.id ? { ...item, title: text } : item
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
                            .map((item, index) => ({ ...item, orderIndex: index }))
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
                  if (!trimmed || subtasks.length >= 20) return;
                  setSubtasks((current) => [
                    ...current,
                    {
                      id: `st_${Math.random().toString(36).slice(2, 10)}`,
                      title: trimmed,
                      status: 'active',
                      orderIndex: current.length,
                    },
                  ]);
                  setNewSubtask('');
                }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.actions}>
          {activeCount >= 2000 ? (
            <Text variant="caption" color={colors.priorityHigh}>
              Task limit reached. Complete or delete tasks to add more.
            </Text>
          ) : activeCount >= 1500 ? (
            <Text variant="caption" color={colors.textSecondary}>
              Approaching task limit. Consider completing tasks.
            </Text>
          ) : null}
          <Button
            label="Create"
            onPress={handleCreate}
            fullWidth
            disabled={!isValid || activeCount >= 2000}
          />
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
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
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
  actions: {
    marginTop: 'auto',
  },
});
