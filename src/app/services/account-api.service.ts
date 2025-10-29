import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/Account`;

  constructor(private http: HttpClient) {}

  /**
   * Get all accounts
   * POST /api/Account/GetAll
   */
  getAll(): Observable<Account[]> {
    return this.http.post<Account[]>(`${this.apiUrl}/GetAll`, {});
  }

  /**
   * Get account by ID
   * POST /api/Account/GetById
   */
  getById(id: number): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/GetById`, { id });
  }

  /**
   * Create new account
   * POST /api/Account/Create
   */
  create(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/Create`, request);
  }

  /**
   * Update existing account
   * POST /api/Account/Update
   */
  update(request: UpdateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/Update`, request);
  }

  /**
   * Delete account
   * POST /api/Account/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }
}
