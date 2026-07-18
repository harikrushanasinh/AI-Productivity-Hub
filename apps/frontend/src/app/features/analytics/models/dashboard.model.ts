export interface AnalyticsDashboard {
  tasks: { total: number; done: number; inProgress: number; todo: number; completionRate: number };
  expenses: { monthIncome: number; monthExpense: number; monthNet: number };
  habits: { activeCount: number; averageCurrentStreak: number };
  goals: { activeCount: number; completedCount: number; averageProgress: number };
  focus: { todayMinutes: number; last7DaysMinutes: number };
}
