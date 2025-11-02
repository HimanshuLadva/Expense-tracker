import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest, GetTransactionsRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/Transaction`;

  constructor(private http: HttpClient) {}

  /**
   * Get all transactions with optional date range filtering
   * POST /api/Transaction/GetAll
   */
  getAll(request?: GetTransactionsRequest): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(`${this.apiUrl}/GetAll`, request || {});
  }

  /**
   * Get transaction by ID
   * POST /api/Transaction/GetById
   */
  getById(id: number): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/GetById`, { id });
  }

  /**
   * Create new transaction (income, expense, or transfer)
   * POST /api/Transaction/Create
   */
  create(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/Create`, request);
  }

  /**
   * Update existing transaction
   * POST /api/Transaction/Update
   */
  update(request: UpdateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/Update`, request);
  }

  /**
   * Delete transaction
   * POST /api/Transaction/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }
}
