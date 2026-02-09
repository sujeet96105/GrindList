import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Priority = 'high' | 'medium' | 'low';

type Props = {
  title: string;
  dueLabel?: string;
  priority?: Priority;
  completed?: boolean;
  categoryLabel?: string;
  tagLabels?: string[];
  onPress?: () => void;
  onToggleComplete?: () => void;
  onDelete?: () => void;
};

const priorityColorKey: Record<Priority, 'priorityHigh' | 'priorityMedium' | 'priorityLow'> = {
  high: 'priorityHigh',
  medium: 'priorityMedium',
  low: 'priorityLow',
};

export function TaskRow({
  title,
  dueLabel,
  priority = 'medium',
  completed = false,
  categoryLabel,
  tagLabels,
  onPress,
  onToggleComplete,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const dotColor = colors[priorityColorKey[priority]];
  const tagText = tagLabels && tagLabels.length > 0
    ? tagLabels.map((tag) => `#${tag}`).join(' ')
    : undefined;
  const metaLine = [categoryLabel, tagText].filter(Boolean).join(' • ');

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open task ${title}`}
      accessibilityHint="Opens task details"
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.content}>
        <Text variant="title" style={completed ? styles.completed : undefined}>
          {title}
        </Text>
        {dueLabel ? (
          <Text variant="caption" color={colors.textSecondary}>
            {dueLabel}
          </Text>
        ) : null}
        {metaLine ? (
          <Text variant="caption" color={colors.textSecondary}>
            {metaLine}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={completed ? `Mark ${title} active` : `Mark ${title} complete`}
          hitSlop={8}
          onPress={onToggleComplete}
          style={[
            styles.checkbox,
            completed
              ? { backgroundColor: colors.completed, borderColor: colors.completed }
              : { borderColor: colors.border },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${title}`}
          accessibilityHint="Deletes the task from your list"
          hitSlop={8}
          onPress={() => {
            if (!onDelete) return;
            Alert.alert('Delete task?', 'This will remove the task from your list.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]);
          }}
          style={[styles.delete, { borderColor: colors.border }]}
        >
          <Text variant="caption" color={colors.textSecondary}>
            Delete
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  actions: {
    alignItems: 'center',
    gap: 8,
  },
  delete: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
