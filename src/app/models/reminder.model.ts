export interface Reminder {
  id: string;
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
  id: string;
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
  isActive: boolean;
}