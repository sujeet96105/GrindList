jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
jest.mock('@react-native-firebase/analytics', () => () => ({
  logEvent: jest.fn(),
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('./src/data/schema', () => ({
  initDb: jest.fn().mockResolvedValue(null),
}));
jest.mock('./src/data/tasksDao', () => ({
  getAllTasks: jest.fn().mockResolvedValue([]),
  insertTask: jest.fn().mockResolvedValue(null),
  updateTask: jest.fn().mockResolvedValue(null),
  softDeleteTask: jest.fn().mockResolvedValue(null),
  getTaskById: jest.fn().mockResolvedValue(null),
}));
jest.mock('./src/data/tagsDao', () => ({
  getAllTags: jest.fn().mockResolvedValue([]),
}));
jest.mock('./src/data/categoriesDao', () => ({
  getAllCategories: jest.fn().mockResolvedValue([]),
}));
jest.mock('./src/data/settingsDao', () => ({
  getSettings: jest.fn().mockResolvedValue({
    notificationsEnabled: true,
    privacyMode: false,
    aiEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  }),
}));
jest.mock('./src/data/achievementsDao', () => ({
  ensureDefaultAchievements: jest.fn().mockResolvedValue(undefined),
  getAllAchievements: jest.fn().mockResolvedValue([]),
  getUserAchievementIds: jest.fn().mockResolvedValue([]),
  unlockAchievement: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./src/data/userStatsDao', () => ({
  getUserStats: jest.fn().mockResolvedValue({
    id: 'stats_1',
    currentStreak: 0,
    longestStreak: 0,
    xpTotal: 0,
    level: 1,
    updatedAt: new Date().toISOString(),
  }),
  recordTaskCompletion: jest.fn().mockResolvedValue({
    id: 'stats_1',
    currentStreak: 0,
    longestStreak: 0,
    xpTotal: 0,
    level: 1,
    updatedAt: new Date().toISOString(),
  }),
}));
jest.mock('./src/sync/syncWorker', () => ({
  startSyncWorker: jest.fn().mockReturnValue({ stop: jest.fn() }),
  runSyncOnce: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./src/data/syncQueueDao', () => ({
  getSyncCounts: jest.fn().mockResolvedValue({
    pendingCount: 0,
    processingCount: 0,
    doneCount: 0,
  }),
}));
