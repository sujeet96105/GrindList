import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { Input } from '../components/Input';
import { insertFocusSession, getRecentFocusSessions } from '../data/focusSessionsDao';
import { FocusSession } from '../types/focus';
import { Card } from '../components/Card';

export function FocusScreen() {
  const { spacing, colors } = useTheme();
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<FocusSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (startedAt) {
            const now = new Date().toISOString();
            const session: FocusSession = {
              id: `fs_${Math.random().toString(36).slice(2, 10)}`,
              taskId: null,
              durationMinutes,
              startedAt,
              endedAt: now,
              status: 'completed',
              createdAt: now,
              updatedAt: now,
            };
            insertFocusSession(session)
              .then(() => getRecentFocusSessions(5))
              .then(setHistory)
              .catch((err) => console.warn('Failed to save focus session', err));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  useEffect(() => {
    getRecentFocusSessions(5).then(setHistory).catch(() => setHistory([]));
  }, []);

  const applyDuration = (mins: number) => {
    setDurationMinutes(mins);
    setCustomMinutes(String(mins));
    setRemainingSeconds(mins * 60);
    setIsRunning(false);
    setStartedAt(null);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="heading">Focus</Text>
          <Text variant="body" color={colors.textSecondary}>
            Start a Pomodoro session
          </Text>
        </View>

        <View style={[styles.timerWrap, { borderColor: colors.border }]}>
          <Text variant="heading" style={styles.timerText}>
            {timeLabel}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Focus session
          </Text>
        </View>

        <Card style={[styles.durationCard, { borderColor: colors.border }]}>
          <Text variant="body">Duration</Text>
          <View style={styles.durationRow}>
            {[25, 50].map((mins) => (
              <Button
                key={mins}
                label={`${mins} min`}
                size="sm"
                variant={durationMinutes === mins ? 'primary' : 'secondary'}
                onPress={() => applyDuration(mins)}
              />
            ))}
            <Input
              placeholder="Custom"
              value={customMinutes}
              onChangeText={(value) => setCustomMinutes(value.replace(/[^0-9]/g, ''))}
              style={styles.customInput}
              keyboardType="number-pad"
              accessibilityLabel="Custom focus minutes"
            />
            <Button
              label="Set"
              size="sm"
              variant="secondary"
              onPress={() => {
                const parsed = Number(customMinutes);
                if (!Number.isFinite(parsed) || parsed < 5 || parsed > 120) return;
                applyDuration(parsed);
              }}
            />
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            Custom range: 5-120 minutes
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            label={remainingSeconds === 0 ? 'Restart' : isRunning ? 'Running' : 'Start'}
            fullWidth
            disabled={isRunning}
            onPress={() => {
              if (remainingSeconds === 0) {
                setRemainingSeconds(durationMinutes * 60);
              }
              if (!startedAt) {
                setStartedAt(new Date().toISOString());
              }
              setIsRunning(true);
            }}
          />
          <Button
            label={isRunning ? 'Pause' : 'Reset'}
            variant="secondary"
            fullWidth
            onPress={() => {
              if (isRunning) {
                setIsRunning(false);
              } else {
                setRemainingSeconds(durationMinutes * 60);
                setStartedAt(null);
              }
            }}
          />
        </View>

        <Card style={[styles.historyCard, { borderColor: colors.border }]}>
          <Text variant="body">Recent sessions</Text>
          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.map((session) => (
                <View key={session.id} style={styles.historyRow}>
                  <Text variant="caption" color={colors.textSecondary}>
                    {new Date(session.startedAt).toLocaleString()}
                  </Text>
                  <Text variant="caption">{session.durationMinutes} min</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="caption" color={colors.textSecondary}>
              No sessions yet
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
    gap: 24,
  },
  header: {
    gap: 6,
  },
  timerWrap: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 32,
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  durationCard: {
    gap: 10,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
  },
  historyCard: {
    gap: 8,
  },
  historyList: {
    gap: 6,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
