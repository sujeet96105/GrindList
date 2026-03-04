import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useSettingsStore } from '../store/settingsStore';

import { useShallow } from 'zustand/shallow';

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  const { colors } = useTheme();
  return (
    <Card style={[styles.row, { borderColor: colors.border }] as any}>
      <View style={styles.rowText}>
        <Text variant="body" style={styles.rowTitle}>
          {title}
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={title}
        accessibilityHint={description}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={value ? colors.surface : colors.textSecondary}
      />
    </Card>
  );
}

export function SettingsScreen() {
  const { spacing, colors } = useTheme();
  const {
    notificationsEnabled,


    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    setSetting,
  } = useSettingsStore(
    useShallow((state) => ({
      notificationsEnabled: state.notificationsEnabled,

      quietHoursEnabled: state.quietHoursEnabled,
      quietHoursStart: state.quietHoursStart,
      quietHoursEnd: state.quietHoursEnd,
      setSetting: state.setSetting,
    }))
  );


  const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
  const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);

  const quietStartDate = useMemo(() => {
    const [h, m] = quietHoursStart.split(':').map(Number);
    const date = new Date();
    date.setHours(h || 0, m || 0, 0, 0);
    return date;
  }, [quietHoursStart]);

  const quietEndDate = useMemo(() => {
    const [h, m] = quietHoursEnd.split(':').map(Number);
    const date = new Date();
    date.setHours(h || 0, m || 0, 0, 0);
    return date;
  }, [quietHoursEnd]);

  const openQuietStartPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: quietStartDate,
        mode: 'time',
        onChange: (_, date) => {
          if (!date) return;
          const hh = String(date.getHours()).padStart(2, '0');
          const mm = String(date.getMinutes()).padStart(2, '0');
          setSetting('quietHoursStart', `${hh}:${mm}`);
        },
      });
      return;
    }
    setShowQuietStartPicker(true);
  };

  const openQuietEndPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: quietEndDate,
        mode: 'time',
        onChange: (_, date) => {
          if (!date) return;
          const hh = String(date.getHours()).padStart(2, '0');
          const mm = String(date.getMinutes()).padStart(2, '0');
          setSetting('quietHoursEnd', `${hh}:${mm}`);
        },
      });
      return;
    }
    setShowQuietEndPicker(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="heading">Settings</Text>
          <Text variant="body" color={colors.textSecondary}>
            Notifications and reminder controls
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary}>
            Notifications
          </Text>
          <ToggleRow
            title="Enable reminders"
            description="Allow time-based task reminders."
            value={notificationsEnabled}
            onValueChange={(value) => setSetting('notificationsEnabled', value)}
          />
          <ToggleRow
            title="Quiet hours"
            description="Suppress reminders during a daily window."
            value={quietHoursEnabled}
            onValueChange={(value) => setSetting('quietHoursEnabled', value)}
          />
          {quietHoursEnabled ? (
            <Card style={[styles.row, { borderColor: colors.border }] as any}>
              <View style={styles.rowText}>
                <Text variant="body" style={styles.rowTitle}>
                  Quiet hours window
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {quietHoursStart} - {quietHoursEnd}
                </Text>
              </View>
              <View style={styles.inlineActions}>
                <Button
                  label="Start"
                  size="sm"
                  variant="secondary"
                  onPress={openQuietStartPicker}
                />
                <Button
                  label="End"
                  size="sm"
                  variant="secondary"
                  onPress={openQuietEndPicker}
                />
              </View>
            </Card>
          ) : null}
        </View>






        {showQuietStartPicker && Platform.OS === 'ios' ? (
          <DateTimePicker
            value={quietStartDate}
            mode="time"
            onChange={(_, date) => {
              setShowQuietStartPicker(false);
              if (!date) return;
              const hh = String(date.getHours()).padStart(2, '0');
              const mm = String(date.getMinutes()).padStart(2, '0');
              setSetting('quietHoursStart', `${hh}:${mm}`);
            }}
          />
        ) : null}
        {showQuietEndPicker && Platform.OS === 'ios' ? (
          <DateTimePicker
            value={quietEndDate}
            mode="time"
            onChange={(_, date) => {
              setShowQuietEndPicker(false);
              if (!date) return;
              const hh = String(date.getHours()).padStart(2, '0');
              const mm = String(date.getMinutes()).padStart(2, '0');
              setSetting('quietHoursEnd', `${hh}:${mm}`);
            }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rowTitle: {
    fontWeight: '600',
  },
});
