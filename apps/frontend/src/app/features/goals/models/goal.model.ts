export type GoalStatus = 'active' | 'completed' | 'abandoned';
export type GoalCategory = 'career' | 'health' | 'finance' | 'personal' | 'learning' | 'other';

export interface Milestone {
  id: string;
  title: string;
  isDone: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  targetDate: string | null;
  status: GoalStatus;
  progressPercent: number;
  computedProgress: number;
  milestones: Milestone[];
}
