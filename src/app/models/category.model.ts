export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  icon: string;
}

export interface UpdateCategoryRequest {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
}