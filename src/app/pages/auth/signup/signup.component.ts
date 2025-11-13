import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {
  passwordStrengthValidator,
  passwordMatchValidator,
  usernameExistsValidator,
  emailExistsValidator
} from '../../../services/auth.validators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join us to start tracking your expenses</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Email Field -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                [class.input-error]="email?.invalid && email?.touched"
                [class.input-success]="email?.valid && email?.touched"
                placeholder="Email"
              />
            </div>
            <div class="validation-messages" *ngIf="email?.invalid && email?.touched">
              <p class="error-message" *ngIf="email?.hasError('required')">Email is required</p>
              <p class="error-message" *ngIf="email?.hasError('email')">Please enter a valid email address</p>
              <p class="error-message" *ngIf="email?.hasError('emailExists')">This email is already registered</p>
            </div>
            <div class="validation-messages" *ngIf="email?.valid && email?.touched">
              <p class="success-message">Email is available ✓</p>
            </div>
          </div>

          <!-- Username Field -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                type="text"
                id="username"
                formControlName="username"
                class="form-input"
                [class.input-error]="username?.invalid && username?.touched"
                [class.input-success]="username?.valid && username?.touched"
                placeholder="Username"
              />
            </div>
            <div class="validation-messages" *ngIf="username?.invalid && username?.touched">
              <p class="error-message" *ngIf="username?.hasError('required')">Username is required</p>
              <p class="error-message" *ngIf="username?.hasError('minlength')">Username must be at least 3 characters</p>
              <p class="error-message" *ngIf="username?.hasError('usernameExists')">This username is already taken</p>
            </div>
            <div class="validation-messages" *ngIf="username?.valid && username?.touched">
              <p class="success-message">Username is available ✓</p>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                class="form-input"
                [class.input-error]="password?.invalid && password?.touched"
                [class.input-success]="password?.valid && password?.touched"
                placeholder="Password"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                tabindex="-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <div class="password-strength" *ngIf="password?.value">
              <div class="strength-bar" [class]="getPasswordStrengthClass()"></div>
            </div>
            <div class="validation-messages" *ngIf="password?.invalid && password?.touched">
              <p class="error-message" *ngIf="password?.hasError('required')">Password is required</p>
              <p class="error-message" *ngIf="password?.hasError('minLength')">At least 7 characters required</p>
              <p class="error-message" *ngIf="password?.hasError('uppercase')">At least 1 uppercase letter required</p>
              <p class="error-message" *ngIf="password?.hasError('lowercase')">At least 1 lowercase letter required</p>
              <p class="error-message" *ngIf="password?.hasError('digit')">At least 1 number required</p>
              <p class="error-message" *ngIf="password?.hasError('specialChar')">At least 1 special character required (!&#64;#$%^&*)</p>
            </div>
            <div class="validation-messages" *ngIf="password?.valid && password?.touched">
              <p class="success-message">Strong password ✓</p>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                formControlName="confirmPassword"
                class="form-input"
                [class.input-error]="confirmPassword?.invalid && confirmPassword?.touched"
                [class.input-success]="confirmPassword?.valid && confirmPassword?.touched"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="toggleConfirmPasswordVisibility()"
                tabindex="-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <div class="validation-messages" *ngIf="confirmPassword?.invalid && confirmPassword?.touched">
              <p class="error-message" *ngIf="confirmPassword?.hasError('required')">Please confirm your password</p>
              <p class="error-message" *ngIf="confirmPassword?.hasError('passwordMismatch')">Passwords do not match</p>
            </div>
            <div class="validation-messages" *ngIf="confirmPassword?.valid && confirmPassword?.touched">
              <p class="success-message">Passwords match ✓</p>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-button"
            [disabled]="signupForm.invalid || isSubmitting"
            [class.button-loading]="isSubmitting"
          >
            <span *ngIf="!isSubmitting">Create Account</span>
            <span *ngIf="isSubmitting">Creating Account...</span>
          </button>

          <!-- Error Message -->
          <div class="alert alert-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div class="alert alert-success" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <!-- Login Link -->
          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login" class="auth-link">Sign In</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }

    .auth-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: moveBackground 20s linear infinite;
    }

    @keyframes moveBackground {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }

    .auth-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 3rem;
      width: 100%;
      max-width: 500px;
      position: relative;
      z-index: 1;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .auth-title {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .auth-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
      margin: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin-top: 0.5rem;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: #7c3aed;
      display: flex;
      align-items: center;
      pointer-events: none;
      z-index: 1;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 3rem 0.875rem 3rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #ffffff;
    }

    .form-input::placeholder {
      color: #9ca3af;
      font-weight: 400;
      opacity: 1;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input.input-error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .form-input.input-error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .form-input.input-success {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .form-input.input-success:focus {
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .password-toggle {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      transition: transform 0.2s ease;
      color: #7c3aed;
      display: flex;
      align-items: center;
    }

    .password-toggle:hover {
      transform: scale(1.1);
    }

    .password-strength {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 0.25rem;
    }

    .strength-bar {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 2px;
    }

    .strength-weak {
      width: 33%;
      background: #ef4444;
    }

    .strength-medium {
      width: 66%;
      background: #f59e0b;
    }

    .strength-strong {
      width: 100%;
      background: #10b981;
    }

    .validation-messages {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    .error-message {
      color: #ef4444;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .error-message::before {
      content: '⚠';
      font-size: 0.875rem;
    }

    .success-message {
      color: #10b981;
      margin: 0;
      font-weight: 500;
    }

    .submit-button {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 0.5rem;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .submit-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .submit-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit-button.button-loading {
      position: relative;
    }

    .submit-button.button-loading::after {
      content: '';
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: translateY(-50%) rotate(360deg); }
    }

    .alert {
      padding: 0.875rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .alert-error {
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: #10b981;
      border: 1px solid #bbf7d0;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .auth-footer p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .auth-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .auth-link:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .auth-container {
        padding: 1rem;
      }

      .auth-card {
        padding: 2rem 1.5rem;
      }

      .auth-title {
        font-size: 1.75rem;
      }

      .auth-subtitle {
        font-size: 0.875rem;
      }

      .form-input {
        padding: 0.75rem 3rem 0.75rem 0.875rem;
      }
    }
  `]
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        emailExistsValidator(this.authService)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        usernameExistsValidator(this.authService)
      ]],
      password: ['', [
        Validators.required,
        passwordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator('password', 'confirmPassword')
    });
  }

  get email() { return this.signupForm.get('email'); }
  get username() { return this.signupForm.get('username'); }
  get password() { return this.signupForm.get('password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrengthClass(): string {
    const passwordControl = this.password;
    if (!passwordControl || !passwordControl.value) {
      return '';
    }

    const errors = passwordControl.errors;
    if (!errors) {
      return 'strength-strong';
    }

    const errorCount = Object.keys(errors).length;
    if (errorCount >= 3) {
      return 'strength-weak';
    } else if (errorCount > 0) {
      return 'strength-medium';
    }

    return 'strength-strong';
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const signupData = {
      email: this.signupForm.value.email,
      username: this.signupForm.value.username,
      password: this.signupForm.value.password,
      confirmPassword: this.signupForm.value.confirmPassword
    };

    const response = this.authService.signup(signupData);

    if (response.success) {
      this.successMessage = response.message + '. Redirecting to login...';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.errorMessage = response.message;
      this.isSubmitting = false;
    }
  }
}
