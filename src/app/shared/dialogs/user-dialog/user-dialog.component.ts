import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { User } from '../../../models';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit User' : 'Add User' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()">✕</button>
    </div>

    <div class="dialog-content">
      @if (isLoading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading user data...</p>
        </div>
      } @else {
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-dialog-form">
          <div class="form-fields">
            <div class="form-group">
              <label for="username" class="label">Username *</label>
              <input
                type="text"
                id="username"
                formControlName="username"
                class="form-input"
                placeholder="Enter username"
                [class.error]="userForm.get('username')?.invalid && userForm.get('username')?.touched"
              />
              @if (userForm.get('username')?.hasError('required') && userForm.get('username')?.touched) {
                <span class="error-message">Username is required</span>
              }
              @if (userForm.get('username')?.hasError('minlength') && userForm.get('username')?.touched) {
                <span class="error-message">Username must be at least 3 characters</span>
              }
              @if (userForm.get('username')?.hasError('usernameExists') && userForm.get('username')?.touched) {
                <span class="error-message">This username is already taken</span>
              }
              @if (checkingUsername) {
                <span class="help-text">Checking username availability...</span>
              }
            </div>

            <div class="form-group">
              <label for="email" class="label">Email *</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                placeholder="Enter email address"
                [class.error]="userForm.get('email')?.invalid && userForm.get('email')?.touched"
              />
              @if (userForm.get('email')?.hasError('required') && userForm.get('email')?.touched) {
                <span class="error-message">Email is required</span>
              }
              @if (userForm.get('email')?.hasError('email') && userForm.get('email')?.touched) {
                <span class="error-message">Please enter a valid email address</span>
              }
              @if (userForm.get('email')?.hasError('emailExists') && userForm.get('email')?.touched) {
                <span class="error-message">This email is already registered</span>
              }
              @if (checkingEmail) {
                <span class="help-text">Checking email availability...</span>
              }
            </div>

            <div class="form-group">
              <label for="password" class="label">Password {{ isEditMode ? '(Leave blank to keep current)' : '*' }}</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-input"
                placeholder="Enter password"
                [class.error]="userForm.get('password')?.invalid && userForm.get('password')?.touched"
              />
              @if (userForm.get('password')?.hasError('required') && userForm.get('password')?.touched) {
                <span class="error-message">Password is required</span>
              }
              @if (userForm.get('password')?.hasError('minlength') && userForm.get('password')?.touched) {
                <span class="error-message">Password must be longer than 6 characters</span>
              }
              @if (userForm.get('password')?.hasError('passwordStrength') && userForm.get('password')?.touched) {
                <span class="error-message">Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character</span>
              }
              <span class="help-text">Min 7 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character</span>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="label">Confirm Password {{ isEditMode ? '(Leave blank to keep current)' : '*' }}</label>
              <input
                type="password"
                id="confirmPassword"
                formControlName="confirmPassword"
                class="form-input"
                placeholder="Confirm password"
                [class.error]="userForm.get('confirmPassword')?.invalid && userForm.get('confirmPassword')?.touched"
              />
              @if (userForm.get('confirmPassword')?.hasError('required') && userForm.get('confirmPassword')?.touched) {
                <span class="error-message">Please confirm your password</span>
              }
              @if (userForm.get('confirmPassword')?.hasError('passwordMismatch') && userForm.get('confirmPassword')?.touched) {
                <span class="error-message">Passwords do not match</span>
              }
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="isAdmin"
                  class="checkbox-input"
                />
                <span class="checkbox-text">
                  <span class="checkbox-icon">🔑</span>
                  Administrator Access
                </span>
              </label>
              <span class="help-text">Grant this user administrative privileges</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || isSubmitting || checkingUsername || checkingEmail">
              @if (isSubmitting) {
                <span>Saving...</span>
              } @else {
                <span>{{ isEditMode ? 'Update' : 'Create' }} User</span>
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .user-dialog-form {
      display: flex;
      flex-direction: column;
      padding: 0;

      .form-fields {
        max-height: calc(90vh - 200px);
        overflow-y: auto;
        padding: 0.5rem 0;
        margin-bottom: 1rem;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        .form-group {
          margin-bottom: 1.5rem;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;

          &.btn-secondary {
            background-color: #f3f4f6;
            border-color: #d1d5db;
            color: #374151;

            &:hover {
              background-color: #e5e7eb;
            }
          }

          &.btn-primary {
            background-color: #3b82f6;
            border-color: #3b82f6;
            color: white;

            &:hover:not(:disabled) {
              background-color: #2563eb;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          background-color: #f9fafb;
        }

        .checkbox-input {
          margin-right: 0.75rem;
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;

          &:checked ~ .checkbox-text {
            color: #1e40af;
            font-weight: 600;
          }
        }

        .checkbox-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: #374151;

          .checkbox-icon {
            font-size: 1.25rem;
          }
        }
      }
    }

    .label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &.error {
        border-color: #ef4444;

        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .help-text {
      display: block;
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: #6b7280;

      .spinner {
        width: 3rem;
        height: 3rem;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 1rem;
      }

      p {
        margin: 0;
        font-size: 0.9375rem;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 480px) {
      .user-dialog-form {
        .form-actions {
          flex-direction: column;

          .btn {
            width: 100%;
          }
        }
      }
    }
  `]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  checkingUsername = false;
  checkingEmail = false;
  user?: User;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data?.user) {
      this.isEditMode = true;
      this.loadUser(this.data.user.id);
    }

    // Add async validators for username and email
    this.setupAsyncValidators();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
      confirmPassword: ['', []],
      isAdmin: [false]
    });
  }

  private setupAsyncValidators(): void {
    const usernameControl = this.userForm.get('username');
    const emailControl = this.userForm.get('email');
    const passwordControl = this.userForm.get('password');
    const confirmPasswordControl = this.userForm.get('confirmPassword');

    // Set password validators based on mode
    if (!this.isEditMode) {
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(7),
        this.passwordStrengthValidator
      ]);
      confirmPasswordControl?.setValidators([Validators.required]);
    } else {
      passwordControl?.setValidators([
        Validators.minLength(7),
        this.passwordStrengthValidator
      ]);
    }

    // Add password match validator
    confirmPasswordControl?.addValidators(this.passwordMatchValidator.bind(this));

    // Username availability check
    usernameControl?.valueChanges.subscribe(value => {
      if (value && value.length >= 3) {
        this.checkingUsername = true;
        const excludeUserId = this.isEditMode && this.user ? this.user.id : undefined;

        this.storageService.checkUsername(value, excludeUserId).subscribe({
          next: (result) => {
            this.checkingUsername = false;
            if (!result.isAvailable) {
              usernameControl.setErrors({ ...usernameControl.errors, usernameExists: true });
            } else {
              const errors = { ...usernameControl.errors };
              delete errors['usernameExists'];
              usernameControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          },
          error: () => {
            this.checkingUsername = false;
          }
        });
      }
    });

    // Email availability check
    emailControl?.valueChanges.subscribe(value => {
      if (value && emailControl.valid) {
        this.checkingEmail = true;
        const excludeUserId = this.isEditMode && this.user ? this.user.id : undefined;

        this.storageService.checkEmail(value, excludeUserId).subscribe({
          next: (result) => {
            this.checkingEmail = false;
            if (!result.isAvailable) {
              emailControl.setErrors({ ...emailControl.errors, emailExists: true });
            } else {
              const errors = { ...emailControl.errors };
              delete errors['emailExists'];
              emailControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          },
          error: () => {
            this.checkingEmail = false;
          }
        });
      }
    });

    // Revalidate confirm password when password changes
    passwordControl?.valueChanges.subscribe(() => {
      confirmPasswordControl?.updateValueAndValidity();
    });
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null; // Don't validate empty value (handled by required validator)
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const isValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return isValid ? null : { passwordStrength: true };
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = this.userForm?.get('password')?.value;
    const confirmPassword = control.value;

    if (!password && !confirmPassword) {
      return null; // Both empty is ok for edit mode
    }

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private loadUser(id: number): void {
    this.isLoading = true;
    this.storageService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        alert('Failed to load user data. Please try again.');
        this.dialogRef.close({ success: false } as DialogResult);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting && !this.checkingUsername && !this.checkingEmail) {
      this.isSubmitting = true;
      const formValue = this.userForm.value;

      if (this.isEditMode && this.user) {
        const updateData: any = {
          id: this.user.id,
          username: formValue.username,
          email: formValue.email,
          isAdmin: formValue.isAdmin
        };

        // Only include password if it was changed
        if (formValue.password) {
          updateData.password = formValue.password;
        }

        this.storageService.updateUser(updateData).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Please try again.');
            this.isSubmitting = false;
          }
        });
      } else {
        const createData = {
          username: formValue.username,
          email: formValue.email,
          password: formValue.password,
          isAdmin: formValue.isAdmin
        };

        this.storageService.createUser(createData).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Failed to create user:', error);
            alert('Failed to create user. Please try again.');
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false } as DialogResult);
  }
}
