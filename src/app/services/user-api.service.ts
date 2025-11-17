import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserByIdRequest,
  CheckUsernameRequest,
  CheckEmailRequest,
  CheckAvailabilityResponse
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly apiUrl = `${environment.apiUrl}/api/User`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users
   * POST /api/User/GetAll
   */
  getAll(): Observable<User[]> {
    return this.http.post<User[]>(`${this.apiUrl}/GetAll`, {});
  }

  /**
   * Get user by ID
   * POST /api/User/GetById
   */
  getById(id: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/GetById`, { id });
  }

  /**
   * Create new user
   * POST /api/User/Create
   */
  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/Create`, request);
  }

  /**
   * Update existing user
   * POST /api/User/Update
   */
  update(request: UpdateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/Update`, request);
  }

  /**
   * Delete user
   * POST /api/User/Delete
   */
  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Delete`, { id });
  }

  /**
   * Check if username is available
   * POST /api/User/CheckUsername
   */
  checkUsername(request: CheckUsernameRequest): Observable<CheckAvailabilityResponse> {
    return this.http.post<CheckAvailabilityResponse>(`${this.apiUrl}/CheckUsername`, request);
  }

  /**
   * Check if email is available
   * POST /api/User/CheckEmail
   */
  checkEmail(request: CheckEmailRequest): Observable<CheckAvailabilityResponse> {
    return this.http.post<CheckAvailabilityResponse>(`${this.apiUrl}/CheckEmail`, request);
  }
}
