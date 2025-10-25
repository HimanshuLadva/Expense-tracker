export interface Reminder {
  id: number;
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderRequest {
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
}

export interface UpdateReminderRequest {
  id: number;
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
  isActive: boolean;
}