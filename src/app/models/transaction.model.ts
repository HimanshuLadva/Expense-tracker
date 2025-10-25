export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
}

export interface UpdateTransactionRequest {
  id: number;
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
}