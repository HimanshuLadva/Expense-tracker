import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reminder, CreateReminderRequest, UpdateReminderRequest, GetRemindersRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReminderApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/Reminder`;

  constructor(private http: HttpClient) {}

  /**
   * Get all reminders
   * POST /api/Reminder/GetAll
   */
  getAll(request?: GetRemindersRequest): Observable<Reminder[]> {
    const body = request || {};
    return this.http.post<any[]>(`${this.apiUrl}/GetAll`, body).pipe(
      map(reminders => reminders.map(r => this.convertToReminder(r)))
    );
  }

  /**
   * Get active reminders
   * POST /api/Reminder/GetActive
   */
  getActive(request?: GetRemindersRequest): Observable<Reminder[]> {
    const body = request || {};
    return this.http.post<any[]>(`${this.apiUrl}/GetActive`, body).pipe(
      map(reminders => reminders.map(r => this.convertToReminder(r)))
    );
  }

  /**
   * Get reminder by ID
   * POST /api/Reminder/GetById
   */
  getById(id: number): Observable<Reminder> {
    return this.http.post<any>(`${this.apiUrl}/GetById`, { id }).pipe(
      map(r => this.convertToReminder(r))
    );
  }

  /**
   * Create new reminder
   * POST /api/Reminder/Create
   */
  create(request: CreateReminderRequest): Observable<Reminder> {
    const apiRequest = {
      title: request.title,
      date: request.date.toISOString(),
      beforeDays: request.beforeDays,
      afterDays: request.afterDays
    };

    return this.http.post<any>(`${this.apiUrl}/Create`, apiRequest).pipe(
      map(r => this.convertToReminder(r))
    );
  }

  /**
   * Update existing reminder
   * POST /api/Reminder/Update
   */
  update(request: UpdateReminderRequest): Observable<Reminder> {
    const apiRequest = {
      id: request.id,
      title: request.title,
      date: request.date.toISOString(),
      beforeDays: request.beforeDays,
      afterDays: request.afterDays,
      isActive: request.isActive
    };

    return this.http.post<any>(`${this.apiUrl}/Update`, apiRequest).pipe(
      map(r => this.convertToReminder(r))
    );
  }

  /**
   * Delete reminder
   * POST /api/Reminder/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }

  /**
   * Convert API response to Reminder with proper Date objects
   */
  private convertToReminder(data: any): Reminder {
    return {
      id: data.id,
      title: data.title,
      date: new Date(data.date),
      beforeDays: data.beforeDays,
      afterDays: data.afterDays,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}
