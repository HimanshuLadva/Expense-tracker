import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Budget, Category } from '../../../models';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-set-budget-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Budget' : 'Set Budget' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()">✕</button>
    </div>

    <div class="dialog-content">
      <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="budget-dialog-form">
        <div class="form-fields">
          <div class="category-display">
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </div>

          <div class="form-group">
            <label for="limit" class="label">Budget Limit *</label>
            <input
              type="number"
              id="limit"
              formControlName="limit"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              [class.error]="budgetForm.get('limit')?.invalid && budgetForm.get('limit')?.touched"
            />
            @if (budgetForm.get('limit')?.hasError('required') && budgetForm.get('limit')?.touched) {
              <span class="error-message">Budget limit is required</span>
            }
            @if (budgetForm.get('limit')?.hasError('min') && budgetForm.get('limit')?.touched) {
              <span class="error-message">Budget limit must be greater than 0</span>
            }
            <small class="help-text">
              Set a spending limit for {{ category.name }} in {{ monthName }} {{ year }}
            </small>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="budgetForm.invalid || isSubmitting">
            @if (isSubmitting) {
              <span>Saving...</span>
            } @else {
              <span>{{ isEditMode ? 'Update' : 'Save' }} Budget</span>
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

        .category-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          border: 2px solid #e5e7eb;

          .category-icon {
            font-size: 2rem;
          }

          .category-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
          }
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
  `]
})
export class SetBudgetDialogComponent implements OnInit {
  budgetForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  category!: Category;
  month!: number;
  year!: number;
  monthName!: string;
  budgetId?: number;

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
      this.category = this.data.category;
      this.month = this.data.month;
      this.year = this.data.year;
      this.monthName = this.getMonthName(this.month);

      if (this.data.budgetId) {
        this.isEditMode = true;
        this.budgetId = this.data.budgetId;
        this.budgetForm.patchValue({
          limit: this.data.currentLimit
        });
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      limit: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  private getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }

  onSubmit(): void {
    if (this.budgetForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.budgetForm.value;

      if (this.isEditMode && this.budgetId) {
        // Update existing budget
        const existingBudget = this.storageService.getBudgets().find(b => b.id === this.budgetId);
        if (existingBudget) {
          const updatedBudget: Budget = {
            ...existingBudget,
            limit: parseFloat(formValue.limit),
            updatedAt: new Date()
          };
          this.storageService.saveBudget(updatedBudget);
        }
      } else {
        // Create new budget
        const newBudget: Budget = {
          id: this.storageService.generateId(),
          categoryId: this.category.id,
          month: this.month,
          year: this.year,
          limit: parseFloat(formValue.limit),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.storageService.saveBudget(newBudget);
      }

      this.dialogRef.close({ success: true } as DialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
