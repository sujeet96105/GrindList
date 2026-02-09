import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

let channelId: string | null = null;

async function ensureChannel() {
  if (channelId) return channelId;
  channelId = await notifee.createChannel({
    id: 'reminders',
    name: 'Task reminders',
    importance: AndroidImportance.HIGH,
  });
  return channelId;
}

export async function scheduleTaskReminder(
  reminderId: string,
  title: string,
  remindAt: string
) {
  const date = new Date(remindAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return;
  }
  await notifee.requestPermission();
  const channel = await ensureChannel();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: reminderId,
      title: 'Task reminder',
      body: title,
      android: {
        channelId: channel,
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
}

export async function cancelTaskReminder(reminderId: string) {
  await notifee.cancelNotification(reminderId);
}
