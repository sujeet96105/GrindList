import analytics from '@react-native-firebase/analytics';
import { AnalyticsEvent, AnalyticsPayload } from './events';

export async function logEvent(name: AnalyticsEvent, params: AnalyticsPayload) {
  try {
    await analytics().logEvent(name, params);
  } catch (err) {
    console.warn('Analytics error', err);
  }
}
