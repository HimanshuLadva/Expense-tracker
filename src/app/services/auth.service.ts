import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { User, LoginCredentials, SignupData, AuthResponse } from '../models';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly ENCRYPTION_KEY = 'expense_tracker_secret_key_2025';

  private currentUserSubject = new BehaviorSubject<Omit<User, 'password'> | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private authApiService: AuthApiService) {}

  /**
   * Get current logged-in user from localStorage
   */
  private getCurrentUser(): Omit<User, 'password'> | null {
    const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  /**
   * Store JWT token in localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Clear JWT token from localStorage
   */
  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Store user data in localStorage
   */
  private setCurrentUser(user: Omit<User, 'password'>): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Clear user data from localStorage
   */
  private clearCurrentUser(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Hash password using SHA256
   */
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.ENCRYPTION_KEY).toString();
  }

  /**
   * Register new user via API
   */
  signup(signupData: SignupData): Observable<AuthResponse> {
    // Hash password before sending to API
    const hashedPassword = this.hashPassword(signupData.password);
    const hashedSignupData = {
      ...signupData,
      password: hashedPassword,
      confirmPassword: hashedPassword  // Use same hash for both fields
    };

    console.log('🔐 SIGNUP - Sending hashed password:', hashedPassword);
    console.log('🔐 SIGNUP - Full data being sent:', hashedSignupData);

    return this.authApiService.signup(hashedSignupData).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.user && response.token) {
          // Store token and user data
          this.setToken(response.token);
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  /**
   * Login user via API
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Hash password before sending to API
    const hashedPassword = this.hashPassword(credentials.password);
    const hashedCredentials = {
      usernameOrEmail: credentials.usernameOrEmail,
      password: hashedPassword
    };

    console.log('🔑 LOGIN - Sending hashed password:', hashedPassword);
    console.log('🔑 LOGIN - Full credentials being sent:', hashedCredentials);

    return this.authApiService.login(hashedCredentials).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.user && response.token) {
          // Store token and user data
          this.setToken(response.token);
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    // Call API logout endpoint first, then clear local data
    return this.authApiService.logout().pipe(
      tap(() => {
        // Clear token and user data regardless of API response
        this.clearToken();
        this.clearCurrentUser();
      })
    );
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    // Check if token exists
    return this.getToken() !== null;
  }

  /**
   * Get current user value
   */
  getCurrentUserValue(): Omit<User, 'password'> | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user is an administrator
   */
  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.isAdmin ?? false;
  }

  /**
   * Validate password strength
   * Must contain: 1 uppercase, 1 lowercase, 1 digit, 1 special char, min 7 chars
   */
  validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 7) {
      return { valid: false, message: 'Password must be at least 7 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true, message: 'Password is strong' };
  }
}
