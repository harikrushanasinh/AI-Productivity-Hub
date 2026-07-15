export type FocusSessionType = 'work' | 'short_break' | 'long_break';
export type FocusSessionStatus = 'completed' | 'interrupted' | 'running';

export interface FocusSession {
  id: string;
  type: FocusSessionType;
  plannedMinutes: number;
  actualSeconds: number;
  startedAt: string;
  endedAt: string | null;
  status: FocusSessionStatus;
}

export interface TodayStats {
  totalFocusedSeconds: number;
  totalFocusedMinutes: number;
}
