import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';

import { StorageService } from '../../../services/storage.service';
import { Transaction, TransactionType, Account, Category, CategoryType, CreateTransactionRequest, UpdateTransactionRequest } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <div class="transaction-form-page">
      <app-page-header
        [title]="isEditMode ? 'Edit Transaction' : 'Add Transaction'"
        [subtitle]="isEditMode ? 'Update transaction details' : 'Record a new financial transaction'"
      />

      <div class="form-container">
        <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()" class="transaction-form">
          <div class="form-group">
            <label class="label">Transaction Type *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="type"
                  [value]="TransactionType.INCOME"
                  class="radio-input"
                />
                <span class="radio-label">
                  <span class="radio-icon">💰</span>
                  Income
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="type"
                  [value]="TransactionType.EXPENSE"
                  class="radio-input"
                />
                <span class="radio-label">
                  <span class="radio-icon">💸</span>
                  Expense
                </span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="type"
                  [value]="TransactionType.TRANSFER"
                  class="radio-input"
                />
                <span class="radio-label">
                  <span class="radio-icon">🔄</span>
                  Transfer
                </span>
              </label>
            </div>
            @if (transactionForm.get('type')?.hasError('required') && transactionForm.get('type')?.touched) {
              <span class="error-message">Please select a transaction type</span>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="amount" class="label">Amount *</label>
              <input
                type="number"
                id="amount"
                formControlName="amount"
                class="form-input"
                placeholder="0.00"
                step="0.01"
                [class.error]="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched"
              />
              @if (transactionForm.get('amount')?.hasError('required') && transactionForm.get('amount')?.touched) {
                <span class="error-message">Amount is required</span>
              }
              @if (transactionForm.get('amount')?.hasError('min') && transactionForm.get('amount')?.touched) {
                <span class="error-message">Amount must be greater than 0</span>
              }
            </div>

            <div class="form-group">
              <label for="date" class="label">Date & Time *</label>
              <input
                type="datetime-local"
                id="date"
                formControlName="date"
                class="form-input"
                [class.error]="transactionForm.get('date')?.invalid && transactionForm.get('date')?.touched"
              />
              @if (transactionForm.get('date')?.hasError('required') && transactionForm.get('date')?.touched) {
                <span class="error-message">Date is required</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="accountId" class="label">{{ selectedType === TransactionType.TRANSFER ? 'From Account' : 'Account' }} *</label>
            <select
              id="accountId"
              formControlName="accountId"
              class="form-select"
              [class.error]="transactionForm.get('accountId')?.invalid && transactionForm.get('accountId')?.touched"
            >
              <option value="">Select an account</option>
              @for (account of accounts; track account.id) {
                <option [value]="account.id">{{ account.icon }} {{ account.name }} ({{ formatCurrency(account.currentBalance) }})</option>
              }
            </select>
            @if (transactionForm.get('accountId')?.hasError('required') && transactionForm.get('accountId')?.touched) {
              <span class="error-message">Please select an account</span>
            }
          </div>

          @if (selectedType === TransactionType.TRANSFER) {
            <div class="form-group">
              <label for="toAccountId" class="label">To Account *</label>
              <select
                id="toAccountId"
                formControlName="toAccountId"
                class="form-select"
                [class.error]="transactionForm.get('toAccountId')?.invalid && transactionForm.get('toAccountId')?.touched"
              >
                <option value="">Select destination account</option>
                @for (account of accounts; track account.id) {
                  @if (account.id !== selectedAccountId) {
                    <option [value]="account.id">{{ account.icon }} {{ account.name }} ({{ formatCurrency(account.currentBalance) }})</option>
                  }
                }
              </select>
              @if (transactionForm.get('toAccountId')?.hasError('required') && transactionForm.get('toAccountId')?.touched) {
                <span class="error-message">Please select a destination account</span>
              }
            </div>
          }

          @if (selectedType !== TransactionType.TRANSFER) {
            <div class="form-group">
              <label for="categoryId" class="label">Category *</label>
              <select
                id="categoryId"
                formControlName="categoryId"
                class="form-select"
                [class.error]="transactionForm.get('categoryId')?.invalid && transactionForm.get('categoryId')?.touched"
              >
                <option value="">Select a category</option>
                @for (category of availableCategories; track category.id) {
                  <option [value]="category.id">{{ category.icon }} {{ category.name }}</option>
                }
              </select>
              @if (transactionForm.get('categoryId')?.hasError('required') && transactionForm.get('categoryId')?.touched) {
                <span class="error-message">Please select a category</span>
              }
            </div>
          }

          <div class="form-group">
            <label for="narration" class="label">Narration (Optional)</label>
            <textarea
              id="narration"
              formControlName="narration"
              class="form-textarea"
              placeholder="Add a note about this transaction..."
              rows="3"
            ></textarea>
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
              [disabled]="transactionForm.invalid || isSubmitting"
            >
              @if (isSubmitting) {
                <span>Saving...</span>
              } @else {
                <span>{{ isEditMode ? 'Update' : 'Create' }} Transaction</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .transaction-form-page {
      .form-container {
        max-width: 800px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        padding: 2rem;

        .transaction-form {
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;

            @media (max-width: 768px) {
              grid-template-columns: 1fr;
            }
          }

          .form-group {
            margin-bottom: 1.5rem;

            .label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: #374151;
            }

            .form-input,
            .form-select,
            .form-textarea {
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

            .form-textarea {
              resize: vertical;
              min-height: 80px;
            }

            .radio-group {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 1rem;

              .radio-option {
                display: flex;
                align-items: center;
                cursor: pointer;

                .radio-input {
                  display: none;

                  &:checked + .radio-label {
                    background-color: #dbeafe;
                    border-color: #3b82f6;
                    color: #1e40af;
                  }
                }

                .radio-label {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 0.5rem;
                  padding: 1rem;
                  border: 2px solid #e5e7eb;
                  border-radius: 0.5rem;
                  transition: all 0.2s ease;
                  width: 100%;
                  background-color: #ffffff;
                  text-align: center;

                  &:hover {
                    border-color: #3b82f6;
                    background-color: #f8fafc;
                  }

                  .radio-icon {
                    font-size: 1.5rem;
                  }
                }
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
      .transaction-form-page {
        .form-container {
          margin: 0;
          border-radius: 0;
          box-shadow: none;
          padding: 1rem;
        }

        .radio-group {
          grid-template-columns: 1fr !important;
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
export class TransactionFormComponent implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  transactionId: string | null = null;

  accounts: Account[] = [];
  categories: Category[] = [];
  availableCategories: Category[] = [];

  TransactionType = TransactionType;
  selectedType: TransactionType | null = null;
  selectedAccountId: string | null = null;

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService
  ) {
    this.transactionForm = this.createForm();
  }

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.transactionId;

    this.subscription.add(
      combineLatest([
        this.storageService.accounts$,
        this.storageService.categories$
      ]).subscribe(([accounts, categories]) => {
        this.accounts = accounts;
        this.categories = categories;
        this.updateAvailableCategories();
      })
    );

    this.setupFormSubscriptions();

    if (this.isEditMode && this.transactionId) {
      this.loadTransaction(this.transactionId);
    } else {
      this.transactionForm.patchValue({
        date: new Date().toISOString().slice(0, 16)
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      accountId: ['', Validators.required],
      toAccountId: [''],
      categoryId: [''],
      narration: ['']
    });
  }

  private setupFormSubscriptions(): void {
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      this.selectedType = type;
      this.updateValidators();
      this.updateAvailableCategories();
    });

    this.transactionForm.get('accountId')?.valueChanges.subscribe(accountId => {
      this.selectedAccountId = accountId;
    });
  }

  private updateValidators(): void {
    const toAccountControl = this.transactionForm.get('toAccountId');
    const categoryControl = this.transactionForm.get('categoryId');

    if (this.selectedType === TransactionType.TRANSFER) {
      toAccountControl?.setValidators([Validators.required]);
      categoryControl?.clearValidators();
      categoryControl?.setValue('');
    } else {
      toAccountControl?.clearValidators();
      toAccountControl?.setValue('');
      categoryControl?.setValidators([Validators.required]);
    }

    toAccountControl?.updateValueAndValidity();
    categoryControl?.updateValueAndValidity();
  }

  private updateAvailableCategories(): void {
    if (this.selectedType === TransactionType.INCOME) {
      this.availableCategories = this.categories.filter(c => c.type === CategoryType.INCOME);
    } else if (this.selectedType === TransactionType.EXPENSE) {
      this.availableCategories = this.categories.filter(c => c.type === CategoryType.EXPENSE);
    } else {
      this.availableCategories = [];
    }
  }

  private loadTransaction(id: string): void {
    const transactions = this.storageService.getTransactions();
    const transaction = transactions.find(t => t.id === id);

    if (transaction) {
      this.transactionForm.patchValue({
        type: transaction.type,
        amount: transaction.amount,
        date: new Date(transaction.date).toISOString().slice(0, 16),
        accountId: transaction.accountId,
        toAccountId: transaction.toAccountId || '',
        categoryId: transaction.categoryId || '',
        narration: transaction.narration || ''
      });
    } else {
      this.router.navigate(['/transactions']);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  }

  onSubmit(): void {
    if (this.transactionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.transactionForm.value;

      if (this.isEditMode && this.transactionId) {
        const updateRequest: UpdateTransactionRequest = {
          id: this.transactionId,
          type: formValue.type,
          amount: formValue.amount,
          date: new Date(formValue.date),
          accountId: formValue.accountId,
          toAccountId: formValue.toAccountId || undefined,
          categoryId: formValue.categoryId || undefined,
          narration: formValue.narration || undefined
        };

        const transactions = this.storageService.getTransactions();
        const existingTransaction = transactions.find(t => t.id === this.transactionId);

        if (existingTransaction) {
          const updatedTransaction: Transaction = {
            ...existingTransaction,
            type: updateRequest.type,
            amount: updateRequest.amount,
            date: updateRequest.date,
            accountId: updateRequest.accountId,
            toAccountId: updateRequest.toAccountId,
            categoryId: updateRequest.categoryId,
            narration: updateRequest.narration,
            updatedAt: new Date()
          };

          this.storageService.saveTransaction(updatedTransaction);
        }
      } else {
        const createRequest: CreateTransactionRequest = {
          type: formValue.type,
          amount: formValue.amount,
          date: new Date(formValue.date),
          accountId: formValue.accountId,
          toAccountId: formValue.toAccountId || undefined,
          categoryId: formValue.categoryId || undefined,
          narration: formValue.narration || undefined
        };

        const newTransaction: Transaction = {
          id: this.storageService.generateId(),
          type: createRequest.type,
          amount: createRequest.amount,
          date: createRequest.date,
          accountId: createRequest.accountId,
          toAccountId: createRequest.toAccountId,
          categoryId: createRequest.categoryId,
          narration: createRequest.narration,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveTransaction(newTransaction);
      }

      this.router.navigate(['/transactions']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/transactions']);
  }
}