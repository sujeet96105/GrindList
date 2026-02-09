import { create } from 'zustand';
import { Settings } from '../types/settings';
import { updateSetting } from '../data/settingsDao';

type SettingsState = Settings & {
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  hydrate: (settings: Settings) => void;
};

const defaults: Settings = {
  notificationsEnabled: true,
  privacyMode: false,
  aiEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaults,
  hydrate: (settings) => set({ ...settings }),
  setSetting: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    updateSetting(key, value).catch((err) => {
      console.warn('Failed to persist setting', err);
    });
  },
}));
