export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  narration?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  narration?: string;
}

export interface UpdateTransactionRequest {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  narration?: string;
}