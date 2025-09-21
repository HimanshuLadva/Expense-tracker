export interface Account {
  id: string;
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
  id: string;
  name: string;
  initialAmount: number;
  icon: string;
}