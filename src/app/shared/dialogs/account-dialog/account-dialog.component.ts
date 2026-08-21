import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../../../models';
import { IconSelectorComponent } from '../../icon-selector/icon-selector.component';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconSelectorComponent],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Account' : 'Add Account' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
    </div>

    <div class="dialog-content">
      <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="account-dialog-form">
        <div class="form-fields">
          <div class="form-group">
            <label for="name" class="label">Account Name *</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-input"
              placeholder="Enter account name"
              [class.error]="accountForm.get('name')?.invalid && accountForm.get('name')?.touched"
            />
            @if (accountForm.get('name')?.hasError('required') && accountForm.get('name')?.touched) {
              <span class="error-message" role="alert">Account name is required</span>
            }
          </div>

          <div class="form-group">
            <label for="initialAmount" class="label">Initial Amount *</label>
            <input
              type="number"
              id="initialAmount"
              formControlName="initialAmount"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              [class.error]="accountForm.get('initialAmount')?.invalid && accountForm.get('initialAmount')?.touched"
            />
            @if (accountForm.get('initialAmount')?.hasError('required') && accountForm.get('initialAmount')?.touched) {
              <span class="error-message" role="alert">Initial amount is required</span>
            }
            @if (accountForm.get('initialAmount')?.hasError('min') && accountForm.get('initialAmount')?.touched) {
              <span class="error-message" role="alert">Amount must be at least 0</span>
            }
          </div>

          <app-icon-selector
            formControlName="icon"
            label="Account Icon *"
            inputId="account-icon"
          />

          @if (accountForm.get('icon')?.hasError('required') && accountForm.get('icon')?.touched) {
            <span class="error-message" role="alert">Please select an icon</span>
          }
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="accountForm.invalid || isSubmitting"
          >
            @if (isSubmitting) {
              <span>Saving...</span>
            } @else {
              <span>{{ isEditMode ? 'Update' : 'Create' }} Account</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .account-dialog-form {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;

      .form-fields {
        flex: 1;
        overflow-y: auto;
        padding-right: 0.5rem;

        .form-group {
          margin-bottom: 1.5rem;

          .label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-secondary);
            font-size: 0.875rem;
          }

          .form-input {
            width: 100%;
            padding: 0.875rem;
            border: 1px solid var(--border-default);
            border-radius: var(--radius-sm);
            font-size: 1rem;
            color: var(--text-primary);
            background: var(--surface);
            transition: all 0.2s ease;
            box-sizing: border-box;

            &:focus {
              outline: none;
              border-color: var(--color-primary-light);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-light) 16%, transparent);
            }

            &.error {
              border-color: var(--color-destructive);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-destructive) 16%, transparent);
            }

            &::placeholder {
              color: var(--text-muted);
            }
          }

          .error-message {
            display: block;
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--color-destructive);
            font-weight: 500;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-subtle);
        flex-shrink: 0;

        .btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          &:focus-visible {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
          }

          &.btn-primary {
            background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            color: var(--text-on-primary);
            box-shadow: var(--shadow-sm);

            &:hover:not(:disabled) {
              filter: brightness(1.06);
              box-shadow: var(--shadow-md);
            }
          }

          &.btn-secondary {
            background-color: var(--surface);
            color: var(--text-secondary);
            border: 1px solid var(--border-default);
            box-shadow: var(--shadow-sm);

            &:hover {
              background-color: var(--surface-sunken);
              border-color: var(--border-default);
            }
          }
        }
      }
    }
  `]
})
export class AccountDialogComponent implements OnInit {
  accountForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  account?: Account;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data?.accountId) {
      this.isEditMode = true;
      this.loadAccount(this.data.accountId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      initialAmount: [0, [Validators.required, Validators.min(0)]],
      icon: ['', Validators.required]
    });
  }

  private loadAccount(id: number): void {
    const accounts = this.storageService.getAccounts();
    const account = accounts.find(a => a.id === id);

    if (account) {
      this.account = account;
      this.accountForm.patchValue({
        name: account.name,
        initialAmount: account.initialAmount,
        icon: account.icon
      });
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.accountForm.value;

      if (this.isEditMode && this.data?.accountId && this.account) {
        // Update existing account
        const balanceDifference = formValue.initialAmount - this.account.initialAmount;
        const updatedAccount: Account = {
          ...this.account,
          name: formValue.name,
          initialAmount: formValue.initialAmount,
          currentBalance: this.account.currentBalance + balanceDifference,
          icon: formValue.icon,
          updatedAt: new Date()
        };

        this.storageService.saveAccount(updatedAccount, true).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Error updating account:', error);
            this.isSubmitting = false;
            alert('Failed to update account. Please try again.');
          }
        });
      } else {
        // Create new account
        const newAccount: Account = {
          id: 0, // ID will be generated by the backend
          name: formValue.name,
          initialAmount: formValue.initialAmount,
          currentBalance: formValue.initialAmount,
          icon: formValue.icon
          // userId, createdAt, updatedAt will be set by the backend
        };

        this.storageService.saveAccount(newAccount, false).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Error creating account:', error);
            this.isSubmitting = false;
            alert('Failed to create account. Please try again.');
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}