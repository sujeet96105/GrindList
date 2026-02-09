import { create } from 'zustand';
import { Task } from '../types/task';
import { Subtask, SubtaskStatus } from '../types/subtask';
import { insertTask, softDeleteTask, updateTask } from '../data/tasksDao';
import { Category, Tag } from '../types/taxonomy';
import { insertCategory } from '../data/categoriesDao';
import { insertTag } from '../data/tagsDao';
import { enqueueSyncItem } from '../data/syncQueueDao';
import { useStatsStore } from './statsStore';
import { logEvent } from '../analytics';
import { getNextRecurringDate } from '../utils/date';

type SubtaskDraft = {
  id: string;
  title: string;
  status: SubtaskStatus;
  orderIndex: number;
};

function createTask(
  title: string,
  description?: string | null,
  dueDate?: string | null,
  priority: Task['priority'] = 'medium',
  categoryId?: string | null,
  tagIds?: string[],
  subtasks?: SubtaskDraft[],
  recurrenceRule: Task['recurrenceRule'] = 'none',
  recurrenceInterval?: number | null,
  recurrenceEndDate?: string | null,
  locationReminder?: Task['locationReminder'] | null
): Task {
  const now = new Date().toISOString();
  const taskId = `t_${Math.random().toString(36).slice(2, 10)}`;
  const mappedSubtasks: Subtask[] =
    subtasks?.map((subtask, index) => ({
      id: subtask.id,
      taskId,
      title: subtask.title,
      status: subtask.status,
      orderIndex: Number.isFinite(subtask.orderIndex) ? subtask.orderIndex : index,
      completionAt: subtask.status === 'completed' ? now : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })) ?? [];
  return {
    id: taskId,
    title,
    description: description ?? null,
    dueDate: dueDate ?? null,
    priority,
    status: 'active',
    categoryId: categoryId ?? null,
    tagIds: tagIds ?? [],
    subtasks: mappedSubtasks,
    recurrenceRule,
    recurrenceInterval: recurrenceRule === 'none' ? null : recurrenceInterval ?? 1,
    recurrenceEndDate: recurrenceEndDate ?? null,
    locationReminder: locationReminder ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function buildTaskAnalytics(task: Task) {
  return {
    priority: task.priority,
    has_due_date: task.dueDate ? 1 : 0,
    has_tags: (task.tagIds?.length ?? 0) > 0 ? 1 : 0,
    has_subtasks: (task.subtasks?.length ?? 0) > 0 ? 1 : 0,
  };
}

type TasksState = {
  tasks: Task[];
  tags: Tag[];
  categories: Category[];
  lastError?: string | null;
  clearError: () => void;
  addTask: (task: Task) => void;
  addTaskFromInput: (
    title: string,
    description?: string,
    dueDate?: string | null,
    priority?: Task['priority'],
    categoryId?: string | null,
    tagIds?: string[],
    subtasks?: SubtaskDraft[],
    recurrenceRule?: Task['recurrenceRule'],
    recurrenceInterval?: number | null,
    recurrenceEndDate?: string | null,
    locationReminder?: Task['locationReminder'] | null
  ) => Task | null;
  updateTask: (task: Task) => void;
  toggleComplete: (id: string) => void;
  removeTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  setTags: (tags: Tag[]) => void;
  setCategories: (categories: Category[]) => void;
  addTagByName: (name: string) => Tag | null;
  addCategoryByName: (name: string) => Category | null;
};

const ACTIVE_TASK_CAP = 2000;
const ACTIVE_TASK_WARNING = 1500;

function createTag(name: string): Tag {
  const now = new Date().toISOString();
  return {
    id: `tag_${Math.random().toString(36).slice(2, 10)}`,
    name,
    color: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function createCategory(name: string): Category {
  const now = new Date().toISOString();
  return {
    id: `cat_${Math.random().toString(36).slice(2, 10)}`,
    name,
    color: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  tags: [],
  categories: [],
  lastError: null,
  clearError: () => set({ lastError: null }),
  addTask: (task) => {
    const activeCount = get().tasks.filter((t) => t.status !== 'completed').length;
    if (activeCount >= ACTIVE_TASK_CAP) {
      set({ lastError: `Task limit reached (${ACTIVE_TASK_CAP}). Complete or delete tasks to add more.` });
      return;
    }
    set((state) => ({ tasks: [task, ...state.tasks] }));
    insertTask(task).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to save task' })
    );
    enqueueSyncItem('task', task.id, 'upsert', task).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
    );
    logEvent('task_created', buildTaskAnalytics(task));
  },
  addTaskFromInput: (
    title,
    description,
    dueDate,
    priority,
    categoryId,
    tagIds,
    subtasks,
    recurrenceRule,
    recurrenceInterval,
    recurrenceEndDate,
    locationReminder
  ) => {
    const activeCount = get().tasks.filter((t) => t.status !== 'completed').length;
    if (activeCount >= ACTIVE_TASK_CAP) {
      set({ lastError: `Task limit reached (${ACTIVE_TASK_CAP}). Complete or delete tasks to add more.` });
      return null;
    }
    const task = createTask(
      title,
      description,
      dueDate,
      priority,
      categoryId,
      tagIds,
      subtasks,
      recurrenceRule ?? 'none',
      recurrenceInterval ?? null,
      recurrenceEndDate ?? null,
      locationReminder ?? null
    );
    if (activeCount >= ACTIVE_TASK_WARNING) {
      set({ lastError: `Approaching task limit (${ACTIVE_TASK_CAP}). Consider completing tasks.` });
    }
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
    insertTask(task).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to save task' })
    );
    enqueueSyncItem('task', task.id, 'upsert', task).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
    );
    logEvent('task_created', buildTaskAnalytics(task));
    return task;
  },
  updateTask: (task) =>
    set((state) => {
      const updated = state.tasks.map((t) => (t.id === task.id ? task : t));
      updateTask(task).catch((err) =>
        set({ lastError: err instanceof Error ? err.message : 'Failed to update task' })
      );
      enqueueSyncItem('task', task.id, 'upsert', task).catch((err) =>
        set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
      );
      logEvent('task_updated', buildTaskAnalytics(task));
      return { tasks: updated };
    }),
  toggleComplete: (id) =>
    set((state) => {
      const previous = state.tasks.find((t) => t.id === id);
      const updated = state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'completed' ? 'active' : 'completed',
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      const changed = updated.find((t) => t.id === id);
      let recurring: Task | null = null;
      if (changed) {
        insertTask(changed).catch((err) =>
          set({ lastError: err instanceof Error ? err.message : 'Failed to save task' })
        );
        enqueueSyncItem('task', changed.id, 'upsert', changed).catch((err) =>
          set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
        );
        if (changed.status === 'completed' && previous?.status !== 'completed') {
          const completedCount = updated.filter((t) => t.status === 'completed').length;
          useStatsStore.getState().recordCompletion(completedCount).catch((err) =>
            set({ lastError: err instanceof Error ? err.message : 'Failed to update stats' })
          );
          logEvent('task_completed', buildTaskAnalytics(changed));

          if (changed.recurrenceRule && changed.recurrenceRule !== 'none') {
            const nextDate = getNextRecurringDate(
              changed.dueDate,
              changed.recurrenceRule,
              changed.recurrenceInterval ?? 1
            );
            const endDate = changed.recurrenceEndDate;
            if (nextDate && (!endDate || nextDate <= endDate)) {
              recurring = createTask(
                changed.title,
                changed.description ?? null,
                nextDate,
                changed.priority,
                changed.categoryId ?? null,
                changed.tagIds ?? [],
                undefined,
                changed.recurrenceRule,
                changed.recurrenceInterval ?? 1,
                changed.recurrenceEndDate ?? null
              );
            }
          }
        }
      }
      if (recurring) {
        insertTask(recurring).catch((err) =>
          set({ lastError: err instanceof Error ? err.message : 'Failed to save task' })
        );
        enqueueSyncItem('task', recurring.id, 'upsert', recurring).catch((err) =>
          set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
        );
        logEvent('task_created', buildTaskAnalytics(recurring));
        return { tasks: [recurring, ...updated] };
      }
      return { tasks: updated };
    }),
  removeTask: (id) =>
    set((state) => {
      softDeleteTask(id).catch((err) =>
        set({ lastError: err instanceof Error ? err.message : 'Failed to delete task' })
      );
      enqueueSyncItem('task', id, 'delete', { id }).catch((err) =>
        set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
      );
      const removed = state.tasks.find((task) => task.id === id);
      if (removed) {
        logEvent('task_deleted', { priority: removed.priority });
      }
      return { tasks: state.tasks.filter((t) => t.id !== id) };
    }),
  setTasks: (tasks) => set({ tasks }),
  setTags: (tags) => set({ tags }),
  setCategories: (categories) => set({ categories }),
  addTagByName: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = get().tags.find(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;
    const tag = createTag(trimmed);
    set((state) => ({ tags: [...state.tags, tag] }));
    insertTag(tag).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to save tag' })
    );
    enqueueSyncItem('tag', tag.id, 'upsert', tag).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
    );
    return tag;
  },
  addCategoryByName: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = get().categories.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;
    const category = createCategory(trimmed);
    set((state) => ({ categories: [...state.categories, category] }));
    insertCategory(category).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to save category' })
    );
    enqueueSyncItem('category', category.id, 'upsert', category).catch((err) =>
      set({ lastError: err instanceof Error ? err.message : 'Failed to queue sync' })
    );
    return category;
  },
}));
