import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Budget, Category, CreateBudgetRequest, UpdateBudgetRequest } from '../../../models';
import { DialogResult } from '../../dialog/dialog-result.interface';
import { getIconBadgeColor } from '../../icon-badge-color.util';

@Component({
  selector: 'app-set-budget-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Budget' : 'Create Budget' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
    </div>

    <div class="dialog-content">
      @if (isLoading) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading budget data...</p>
        </div>
      } @else {
        <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="budget-dialog-form">
          <div class="form-fields">
          <div class="form-group">
            <label for="name" class="label">Budget Name *</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-input"
              placeholder="e.g., Monthly Grocery Budget"
              [class.error]="budgetForm.get('name')?.invalid && budgetForm.get('name')?.touched"
            />
            @if (budgetForm.get('name')?.hasError('required') && budgetForm.get('name')?.touched) {
              <span class="error-message" role="alert">Budget name is required</span>
            }
          </div>

          <div class="form-group">
            <label for="amount" class="label">Budget Amount *</label>
            <input
              type="number"
              id="amount"
              formControlName="amount"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              [class.error]="budgetForm.get('amount')?.invalid && budgetForm.get('amount')?.touched"
            />
            @if (budgetForm.get('amount')?.hasError('required') && budgetForm.get('amount')?.touched) {
              <span class="error-message" role="alert">Budget amount is required</span>
            }
            @if (budgetForm.get('amount')?.hasError('min') && budgetForm.get('amount')?.touched) {
              <span class="error-message" role="alert">Budget amount must be greater than 0</span>
            }
          </div>

          <div class="form-group">
            <label for="period" class="label">Period *</label>
            <select
              id="period"
              formControlName="period"
              class="form-input"
              [class.error]="budgetForm.get('period')?.invalid && budgetForm.get('period')?.touched"
            >
              <option value="">Select period</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
            @if (budgetForm.get('period')?.hasError('required') && budgetForm.get('period')?.touched) {
              <span class="error-message" role="alert">Period is required</span>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startDate" class="label">Start Date *</label>
              <input
                type="date"
                id="startDate"
                formControlName="startDate"
                class="form-input"
                [class.error]="budgetForm.get('startDate')?.invalid && budgetForm.get('startDate')?.touched"
              />
              @if (budgetForm.get('startDate')?.hasError('required') && budgetForm.get('startDate')?.touched) {
                <span class="error-message" role="alert">Start date is required</span>
              }
            </div>

            <div class="form-group">
              <label for="endDate" class="label">End Date *</label>
              <input
                type="date"
                id="endDate"
                formControlName="endDate"
                class="form-input"
                [class.error]="budgetForm.get('endDate')?.invalid && budgetForm.get('endDate')?.touched"
              />
              @if (budgetForm.get('endDate')?.hasError('required') && budgetForm.get('endDate')?.touched) {
                <span class="error-message" role="alert">End date is required</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="label">Categories * (Select at least one)</label>
            <div class="categories-grid">
              @for (category of categories; track category.id; let i = $index) {
                <label class="category-checkbox">
                  <input
                    type="checkbox"
                    [value]="category.id"
                    [checked]="isCategorySelected(category.id)"
                    (change)="toggleCategory(category.id)"
                  />
                  <span class="category-label">
                    <span class="category-icon" [style.background-color]="iconBadgeColor(i)">{{ category.icon }}</span>
                    <span class="category-name">{{ category.name }}</span>
                  </span>
                </label>
              }
            </div>
            @if (selectedCategories.length === 0 && budgetForm.touched) {
              <span class="error-message" role="alert">Please select at least one category</span>
            }
          </div>

          @if (isEditMode) {
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="isActive"
                />
                <span>Active Budget</span>
              </label>
              <small class="help-text">Inactive budgets won't be displayed in the budget tracking</small>
            </div>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="budgetForm.invalid || selectedCategories.length === 0 || isSubmitting">
            @if (isSubmitting) {
              <span>Saving...</span>
            } @else {
              <span>{{ isEditMode ? 'Update' : 'Create' }} Budget</span>
            }
          </button>
        </div>
      </form>
      }
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      min-height: 200px;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--surface-muted);
        border-top: 4px solid var(--color-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin: 0;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .budget-dialog-form {
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
          background: var(--surface-muted);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        .form-group {
          margin-bottom: 1.5rem;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
          padding: 0.5rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          background: var(--surface-muted);

          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-track {
            background: var(--surface-muted);
            border-radius: 2px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--border-default);
            border-radius: 2px;
          }

          .category-checkbox {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 0.5rem;
            background: var(--surface);
            border: 1px solid var(--border-subtle);
            border-radius: 0.375rem;
            transition: all 0.2s ease;

            &:hover {
              background: var(--color-primary-tint);
              border-color: var(--color-primary-light);
            }

            input[type="checkbox"] {
              margin-right: 0.5rem;
              cursor: pointer;
              accent-color: var(--color-primary);
            }

            .category-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              flex: 1;

              .category-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                flex-shrink: 0;
                border-radius: 50%;
                font-size: 1rem;
              }

              .category-name {
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--text-primary);
              }
            }

            input[type="checkbox"]:checked + .category-label {
              color: var(--color-primary-dark);
            }
          }
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: var(--text-secondary);

          input[type="checkbox"] {
            cursor: pointer;
            accent-color: var(--color-primary);
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-subtle);

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;

          &:focus-visible {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
          }

          &.btn-secondary {
            background-color: var(--surface);
            border-color: var(--border-default);
            color: var(--text-secondary);

            &:hover {
              background-color: var(--surface-sunken);
            }
          }

          &.btn-primary {
            background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            border-color: transparent;
            color: var(--text-on-primary);

            &:hover:not(:disabled) {
              filter: brightness(1.06);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      .label {
        display: block;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-primary);
        background: var(--surface);
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--color-primary-light);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-light) 16%, transparent);
        }

        &.error {
          border-color: var(--color-destructive);
        }

        &::placeholder {
          color: var(--text-muted);
        }
      }

      select.form-input {
        cursor: pointer;
      }

      .error-message {
        display: block;
        color: var(--color-destructive);
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }

      .help-text {
        display: block;
        color: var(--text-muted);
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
    }

    @media (max-width: 640px) {
      .budget-dialog-form {
        .form-fields .form-row {
          grid-template-columns: 1fr;
        }

        .form-fields .categories-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class SetBudgetDialogComponent implements OnInit {
  budgetForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  categories: Category[] = [];
  selectedCategories: number[] = [];
  budget?: Budget;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.budgetForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to period changes to auto-populate dates
    this.budgetForm.get('period')?.valueChanges.subscribe((period) => {
      this.updateDatesBasedOnPeriod(period);
    });

    if (this.data) {
      this.categories = this.data.categories || [];

      if (this.data.budget && this.data.budget.id) {
        // Edit mode - fetch fresh data from API
        this.isEditMode = true;
        this.isLoading = true;

        this.storageService.getBudgetById(this.data.budget.id).subscribe({
          next: (budget) => {
            this.budget = budget;
            this.selectedCategories = [...budget.categories];

            this.budgetForm.patchValue({
              name: budget.name,
              amount: budget.amount,
              period: budget.period,
              startDate: this.formatDateForInput(budget.startDate),
              endDate: this.formatDateForInput(budget.endDate),
              isActive: budget.isActive
            });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading budget:', error);
            alert('Failed to load budget data. Please try again.');
            this.isLoading = false;
            this.dialogRef.close();
          }
        });
      } else {
        // Create mode - set default dates to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.budgetForm.patchValue({
          startDate: this.formatDateForInput(firstDay),
          endDate: this.formatDateForInput(lastDay),
          period: 'monthly'
        });
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      period: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      isActive: [true]
    });
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateDatesBasedOnPeriod(period: string): void {
    if (!period) return;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'weekly':
        // Start Date: current date, End Date: current date + 7 days
        startDate = new Date(now);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
        break;

      case 'monthly':
        // Start Date: current month start, End Date: current month end
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case 'quarterly':
        // Start Date: current month start, End Date: start date + 3 months
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(endDate.getDate() - 1); // Last day of the 3rd month
        break;

      case 'yearly':
        // Start Date: current month start, End Date: start date + 12 months
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12);
        endDate.setDate(endDate.getDate() - 1); // Last day of the 12th month
        break;

      case 'custom':
        // Don't auto-update dates for custom period
        return;

      default:
        return;
    }

    // Update form with calculated dates
    this.budgetForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate)
    }, { emitEvent: false });
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  iconBadgeColor(index: number): string {
    return getIconBadgeColor(index);
  }

  toggleCategory(categoryId: number): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index >= 0) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryId);
    }
  }

  onSubmit(): void {
    if (this.budgetForm.valid && this.selectedCategories.length > 0 && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.budgetForm.value;

      if (this.isEditMode && this.budget) {
        // Update existing budget
        const updateRequest: UpdateBudgetRequest = {
          id: this.budget.id,
          name: formValue.name,
          amount: parseFloat(formValue.amount),
          period: formValue.period,
          categories: this.selectedCategories,
          startDate: `${formValue.startDate}T00:00:00.000Z`,
          endDate: `${formValue.endDate}T23:59:59.999Z`,
          isActive: formValue.isActive
        };

        this.storageService.updateBudget(updateRequest).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            this.isSubmitting = false;
            alert('Failed to update budget. Please try again.');
            console.error('Update error:', error);
          }
        });
      } else {
        // Create new budget
        const createRequest: CreateBudgetRequest = {
          name: formValue.name,
          amount: parseFloat(formValue.amount),
          period: formValue.period,
          categories: this.selectedCategories,
          startDate: `${formValue.startDate}T00:00:00.000Z`,
          endDate: `${formValue.endDate}T23:59:59.999Z`
        };

        this.storageService.createBudget(createRequest).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            this.isSubmitting = false;
            alert('Failed to create budget. Please try again.');
            console.error('Create error:', error);
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
