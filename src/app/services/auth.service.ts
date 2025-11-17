import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { User, LoginCredentials, SignupData, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'expense_tracker_users';
  private readonly CURRENT_USER_KEY = 'expense_tracker_current_user';
  private readonly ENCRYPTION_KEY = 'expense_tracker_secret_key_2025';

  private currentUserSubject = new BehaviorSubject<Omit<User, 'password'> | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

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
   * Get all users from localStorage
   */
  private getUsers(): User[] {
    const usersJson = localStorage.getItem(this.STORAGE_KEY);
    if (usersJson) {
      return JSON.parse(usersJson);
    }
    return [];
  }

  /**
   * Save users to localStorage
   */
  private saveUsers(users: User[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Hash password using SHA256
   */
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.ENCRYPTION_KEY).toString();
  }

  /**
   * Check if username already exists
   */
  isUsernameExists(username: string): boolean {
    const users = this.getUsers();
    return users.some(user => user.username.toLowerCase() === username.toLowerCase());
  }

  /**
   * Check if email already exists
   */
  isEmailExists(email: string): boolean {
    const users = this.getUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Register new user
   */
  signup(signupData: SignupData): AuthResponse {
    const users = this.getUsers();

    // Check if username exists
    if (this.isUsernameExists(signupData.username)) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }

    // Check if email exists
    if (this.isEmailExists(signupData.email)) {
      return {
        success: false,
        message: 'Email already exists'
      };
    }

    // Create new user
    const newUser: User = {
      id: this.generateId(),
      username: signupData.username,
      email: signupData.email,
      password: this.hashPassword(signupData.password),
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user
    users.push(newUser);
    this.saveUsers(users);

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    return {
      success: true,
      message: 'Registration successful',
      user: userWithoutPassword
    };
  }

  /**
   * Login user
   */
  login(credentials: LoginCredentials): AuthResponse {
    const users = this.getUsers();
    const hashedPassword = this.hashPassword(credentials.password);

    // Find user by username or email
    const user = users.find(u =>
      (u.username.toLowerCase() === credentials.usernameOrEmail.toLowerCase() ||
       u.email.toLowerCase() === credentials.usernameOrEmail.toLowerCase()) &&
      u.password === hashedPassword
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid username/email or password'
      };
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // Store current user
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    this.currentUserSubject.next(userWithoutPassword);

    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    };
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get current user value
   */
  getCurrentUserValue(): Omit<User, 'password'> | null {
    return this.currentUserSubject.value;
  }

  /**
   * Generate unique ID
   */
  private generateId(): number {
    const users = this.getUsers();
    if (users.length === 0) {
      return 1;
    }
    const maxId = Math.max(...users.map(u => u.id));
    return maxId + 1;
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
