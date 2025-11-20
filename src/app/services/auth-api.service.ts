import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SignupData, LoginCredentials, AuthResponse, UserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private apiUrl = `${environment.apiUrl}/api/User`;

  constructor(private http: HttpClient) {}

  /**
   * Register a new user account
   */
  signup(signupData: SignupData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Signup`, {
      username: signupData.username,
      email: signupData.email,
      password: signupData.password,
      confirmPassword: signupData.confirmPassword
    });
  }

  /**
   * Login with username or email
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Login`, {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password
    });
  }

  /**
   * Get current logged in user (requires JWT token in header)
   */
  getCurrentUser(): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/GetCurrentUser`, {});
  }

  /**
   * Logout user (optional - can be client-side only)
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/Logout`, {});
  }
}
