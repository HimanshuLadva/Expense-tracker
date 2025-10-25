export interface Account {
  id: number;
  name: string;
  initialAmount: number;
  currentBalance: number;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountRequest {
  name: string;
  initialAmount: number;
  icon: string;
}

export interface UpdateAccountRequest {
  id: number;
  name: string;
  initialAmount: number;
  icon: string;
}