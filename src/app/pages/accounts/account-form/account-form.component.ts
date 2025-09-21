import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { StorageService } from '../../../services/storage.service';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { IconSelectorComponent } from '../../../shared/icon-selector/icon-selector.component';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, IconSelectorComponent],
  template: `
    <div class="account-form-page">
      <app-page-header
        [title]="isEditMode ? 'Edit Account' : 'Add Account'"
        [subtitle]="isEditMode ? 'Update account details' : 'Create a new account to track your finances'"
      />

      <div class="form-container">
        <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="account-form">
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
              <span class="error-message">Account name is required</span>
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
              <span class="error-message">Initial amount is required</span>
            }
            @if (accountForm.get('initialAmount')?.hasError('min') && accountForm.get('initialAmount')?.touched) {
              <span class="error-message">Amount must be at least 0</span>
            }
          </div>

          <app-icon-selector
            formControlName="icon"
            label="Account Icon *"
            inputId="account-icon"
          />

          @if (accountForm.get('icon')?.hasError('required') && accountForm.get('icon')?.touched) {
            <span class="error-message">Please select an icon</span>
          }

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
    </div>
  `,
  styles: [`
    .account-form-page {
      .form-container {
        max-width: 600px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        padding: 2rem;

        .account-form {
          .form-group {
            margin-bottom: 1.5rem;

            .label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: #374151;
            }

            .form-input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 1rem;
              transition: border-color 0.2s ease;

              &:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
              }

              &.error {
                border-color: #ef4444;
              }

              &::placeholder {
                color: #9ca3af;
              }
            }

            .error-message {
              display: block;
              margin-top: 0.25rem;
              font-size: 0.875rem;
              color: #ef4444;
            }
          }

          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;

            .btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.375rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }

              &.btn-primary {
                background-color: #3b82f6;
                color: white;

                &:hover:not(:disabled) {
                  background-color: #2563eb;
                }
              }

              &.btn-secondary {
                background-color: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;

                &:hover {
                  background-color: #e5e7eb;
                }
              }
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .account-form-page {
        .form-container {
          margin: 0;
          border-radius: 0;
          box-shadow: none;
          padding: 1rem;
        }

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
export class AccountFormComponent implements OnInit {
  accountForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  accountId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.accountId;

    if (this.isEditMode && this.accountId) {
      this.loadAccount(this.accountId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      initialAmount: [0, [Validators.required, Validators.min(0)]],
      icon: ['', Validators.required]
    });
  }

  private loadAccount(id: string): void {
    const accounts = this.storageService.getAccounts();
    const account = accounts.find(a => a.id === id);

    if (account) {
      this.accountForm.patchValue({
        name: account.name,
        initialAmount: account.initialAmount,
        icon: account.icon
      });
    } else {
      this.router.navigate(['/accounts']);
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.accountForm.value;

      if (this.isEditMode && this.accountId) {
        const updateRequest: UpdateAccountRequest = {
          id: this.accountId,
          name: formValue.name,
          initialAmount: formValue.initialAmount,
          icon: formValue.icon
        };

        const accounts = this.storageService.getAccounts();
        const existingAccount = accounts.find(a => a.id === this.accountId);

        if (existingAccount) {
          const balanceDifference = formValue.initialAmount - existingAccount.initialAmount;
          const updatedAccount: Account = {
            ...existingAccount,
            name: updateRequest.name,
            initialAmount: updateRequest.initialAmount,
            currentBalance: existingAccount.currentBalance + balanceDifference,
            icon: updateRequest.icon,
            updatedAt: new Date()
          };

          this.storageService.saveAccount(updatedAccount);
        }
      } else {
        const createRequest: CreateAccountRequest = {
          name: formValue.name,
          initialAmount: formValue.initialAmount,
          icon: formValue.icon
        };

        const newAccount: Account = {
          id: this.storageService.generateId(),
          name: createRequest.name,
          initialAmount: createRequest.initialAmount,
          currentBalance: createRequest.initialAmount,
          icon: createRequest.icon,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveAccount(newAccount);
      }

      this.router.navigate(['/accounts']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/accounts']);
  }
}