export interface Budget {
  id: number;
  name: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'custom';
  categories: number[]; // Array of category IDs
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetBudgetsRequest {
  fromDate?: string;
  toDate?: string;
}

export interface CreateBudgetRequest {
  name: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'custom';
  categories: number[];
  startDate: string; // ISO string format
  endDate: string; // ISO string format
}

export interface UpdateBudgetRequest {
  id: number;
  name: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'custom';
  categories: number[];
  startDate: string; // ISO string format
  endDate: string; // ISO string format
  isActive: boolean;
}

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
}
