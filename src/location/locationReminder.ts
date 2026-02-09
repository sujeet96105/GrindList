import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { Task } from '../types/task';
import { scheduleTaskReminder } from '../notifications/notifee';
import { upsertTaskReminder } from '../data/remindersDao';

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function checkLocationReminders(tasks: Task[]) {
  const locationTasks = tasks.filter((task) => task.locationReminder);
  if (locationTasks.length === 0) return;

  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  if (!hasPermission) {
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (status !== PermissionsAndroid.RESULTS.GRANTED) {
      return;
    }
  }

  return new Promise<void>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        for (const task of locationTasks) {
          const reminder = task.locationReminder!;
          const distance = distanceMeters(
            latitude,
            longitude,
            reminder.lat,
            reminder.lng
          );
          if (distance <= reminder.radiusMeters) {
            const remindAtIso = new Date().toISOString();
            const reminderId = await upsertTaskReminder(task.id, remindAtIso);
            await scheduleTaskReminder(reminderId, task.title, remindAtIso);
          }
        }
        resolve();
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  });
}
