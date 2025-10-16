export interface Budget {
  id: string;
  categoryId: string;
  month: number; // 1-12
  year: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetRequest {
  categoryId: string;
  month: number;
  year: number;
  limit: number;
}

export interface UpdateBudgetRequest {
  id: string;
  limit: number;
}

export interface BudgetWithUsage extends Budget {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  remaining: number;
  percentageUsed: number;
}
