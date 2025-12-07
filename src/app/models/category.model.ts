export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: CategoryType;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export interface UpdateCategoryRequest {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}