import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, GetBudgetsRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/Budget`;

  constructor(private http: HttpClient) {}

  /**
   * Get all budgets
   * POST /api/Budget/GetAll
   */
  getAll(request?: GetBudgetsRequest): Observable<Budget[]> {
    const body = request || {};
    return this.http.post<any[]>(`${this.apiUrl}/GetAll`, body).pipe(
      map(budgets => budgets.map(b => this.convertToBudget(b)))
    );
  }

  /**
   * Get active budgets
   * POST /api/Budget/GetActive
   */
  getActive(request?: GetBudgetsRequest): Observable<Budget[]> {
    const body = request || {};
    return this.http.post<any[]>(`${this.apiUrl}/GetActive`, body).pipe(
      map(budgets => budgets.map(b => this.convertToBudget(b)))
    );
  }

  /**
   * Get budget by ID
   * POST /api/Budget/GetById
   */
  getById(id: number): Observable<Budget> {
    return this.http.post<any>(`${this.apiUrl}/GetById`, { id }).pipe(
      map(b => this.convertToBudget(b))
    );
  }

  /**
   * Create new budget
   * POST /api/Budget/Create
   */
  create(request: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<any>(`${this.apiUrl}/Create`, request).pipe(
      map(b => this.convertToBudget(b))
    );
  }

  /**
   * Update existing budget
   * POST /api/Budget/Update
   */
  update(request: UpdateBudgetRequest): Observable<Budget> {
    return this.http.post<any>(`${this.apiUrl}/Update`, request).pipe(
      map(b => this.convertToBudget(b))
    );
  }

  /**
   * Delete budget
   * POST /api/Budget/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }

  /**
   * Convert API response to Budget with proper Date objects
   */
  private convertToBudget(data: any): Budget {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      amount: data.amount,
      period: data.period,
      categories: data.categories || [],
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}
