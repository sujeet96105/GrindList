export type UserStats = {
  id: string;
  currentStreak: number;
  longestStreak: number;
  xpTotal: number;
  level: number;
  updatedAt: string;
};

export type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type UserAchievement = {
  id: string;
  achievementId: string;
  unlockedAt: string;
};
