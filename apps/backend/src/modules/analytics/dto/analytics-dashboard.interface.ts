// Plain response shape — no request DTO needed since this endpoint takes no
// query params. Documented here as the contract the frontend relies on.
export interface AnalyticsDashboard {
  tasks: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    completionRate: number; // 0-100
  };
  expenses: {
    monthIncome: number; // minor units
    monthExpense: number; // minor units
    monthNet: number; // minor units
  };
  habits: {
    activeCount: number;
    averageCurrentStreak: number;
  };
  goals: {
    activeCount: number;
    completedCount: number;
    averageProgress: number; // 0-100
  };
  focus: {
    todayMinutes: number;
    last7DaysMinutes: number;
  };
}
