export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface Transaction {
  id: number;
  userId: number;
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
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string; // ISO 8601 format for API
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
}

export interface UpdateTransactionRequest {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string; // ISO 8601 format for API
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
}

export interface GetTransactionsRequest {
  fromDate?: string;
  toDate?: string;
}