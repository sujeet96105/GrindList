import { create } from 'zustand';
import { Achievement, UserStats } from '../types/gamification';
import { getUserStats, recordTaskCompletion } from '../data/userStatsDao';
import { unlockAchievement } from '../data/achievementsDao';

type StatsState = {
  stats: UserStats | null;
  achievements: Achievement[];
  unlockedIds: string[];
  hydrate: (stats: UserStats, achievements: Achievement[], unlockedIds: string[]) => void;
  recordCompletion: (totalCompleted: number) => Promise<void>;
};

const ACHIEVEMENT_RULES: Array<{
  code: string;
  isUnlocked: (stats: UserStats, totalCompleted: number) => boolean;
}> = [
  { code: 'first_task', isUnlocked: (_, totalCompleted) => totalCompleted >= 1 },
  { code: 'five_tasks', isUnlocked: (_, totalCompleted) => totalCompleted >= 5 },
  { code: 'ten_tasks', isUnlocked: (_, totalCompleted) => totalCompleted >= 10 },
  { code: 'streak_3', isUnlocked: (stats) => stats.currentStreak >= 3 },
  { code: 'streak_7', isUnlocked: (stats) => stats.currentStreak >= 7 },
];

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  achievements: [],
  unlockedIds: [],
  hydrate: (stats, achievements, unlockedIds) =>
    set({ stats, achievements, unlockedIds }),
  recordCompletion: async (totalCompleted) => {
    const updatedStats = await recordTaskCompletion();
    const { achievements, unlockedIds } = get();
    const newlyUnlocked: string[] = [];
    for (const rule of ACHIEVEMENT_RULES) {
      const achievement = achievements.find((item) => item.code === rule.code);
      if (!achievement) continue;
      if (unlockedIds.includes(achievement.id)) continue;
      if (rule.isUnlocked(updatedStats, totalCompleted)) {
        await unlockAchievement(achievement.id);
        newlyUnlocked.push(achievement.id);
      }
    }
    set({
      stats: updatedStats,
      unlockedIds: [...unlockedIds, ...newlyUnlocked],
    });
  },
}));
