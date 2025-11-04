import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Budget, Category, CreateBudgetRequest, UpdateBudgetRequest } from '../../../models';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-set-budget-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Budget' : 'Create Budget' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()">✕</button>
    </div>

    <div class="dialog-content">
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
              <span class="error-message">Budget name is required</span>
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
              <span class="error-message">Budget amount is required</span>
            }
            @if (budgetForm.get('amount')?.hasError('min') && budgetForm.get('amount')?.touched) {
              <span class="error-message">Budget amount must be greater than 0</span>
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
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
            @if (budgetForm.get('period')?.hasError('required') && budgetForm.get('period')?.touched) {
              <span class="error-message">Period is required</span>
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
                <span class="error-message">Start date is required</span>
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
                <span class="error-message">End date is required</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="label">Categories * (Select at least one)</label>
            <div class="categories-grid">
              @for (category of categories; track category.id) {
                <label class="category-checkbox">
                  <input
                    type="checkbox"
                    [value]="category.id"
                    [checked]="isCategorySelected(category.id)"
                    (change)="toggleCategory(category.id)"
                  />
                  <span class="category-label">
                    <span class="category-icon">{{ category.icon }}</span>
                    <span class="category-name">{{ category.name }}</span>
                  </span>
                </label>
              }
            </div>
            @if (selectedCategories.length === 0 && budgetForm.touched) {
              <span class="error-message">Please select at least one category</span>
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
    </div>
  `,
  styles: [`
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
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #f9fafb;

          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 2px;
          }

          &::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 2px;
          }

          .category-checkbox {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 0.5rem;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            transition: all 0.2s ease;

            &:hover {
              background: #f3f4f6;
              border-color: #3b82f6;
            }

            input[type="checkbox"] {
              margin-right: 0.5rem;
              cursor: pointer;
            }

            .category-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              flex: 1;

              .category-icon {
                font-size: 1.25rem;
              }

              .category-name {
                font-size: 0.875rem;
                font-weight: 500;
                color: #111827;
              }
            }

            input[type="checkbox"]:checked + .category-label {
              color: #3b82f6;
            }
          }
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #374151;

          input[type="checkbox"] {
            cursor: pointer;
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

      .label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &.error {
          border-color: #ef4444;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }

      select.form-input {
        cursor: pointer;
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
    }

    @media (max-width: 640px) {
      .budget-dialog-form {
        .form-row {
          grid-template-columns: 1fr;
        }

        .categories-grid {
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
    if (this.data) {
      this.categories = this.data.categories || [];

      if (this.data.budget) {
        // Edit mode
        this.isEditMode = true;
        this.budget = this.data.budget;
        this.selectedCategories = [...this.budget.categories];

        this.budgetForm.patchValue({
          name: this.budget.name,
          amount: this.budget.amount,
          period: this.budget.period,
          startDate: this.formatDateForInput(this.budget.startDate),
          endDate: this.formatDateForInput(this.budget.endDate),
          isActive: this.budget.isActive
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

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategories.includes(categoryId);
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
