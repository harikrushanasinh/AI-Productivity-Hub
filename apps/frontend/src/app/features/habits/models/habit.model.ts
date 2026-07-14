export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  targetPerPeriod: number;
  color: string;
  isArchived: boolean;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}
