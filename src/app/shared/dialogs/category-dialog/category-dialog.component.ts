import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../../../models';
import { IconSelectorComponent } from '../../icon-selector/icon-selector.component';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconSelectorComponent],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Category' : 'Add Category' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()">✕</button>
    </div>

    <div class="dialog-content">
      <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="category-dialog-form">
        <div class="form-fields">
          <div class="form-group">
            <label class="label">Category Type *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="type"
                  [value]="CategoryType.INCOME"
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
                  [value]="CategoryType.EXPENSE"
                  class="radio-input"
                />
                <span class="radio-label">
                  <span class="radio-icon">💸</span>
                  Expense
                </span>
              </label>
            </div>
            @if (categoryForm.get('type')?.hasError('required') && categoryForm.get('type')?.touched) {
              <span class="error-message">Please select a category type</span>
            }
          </div>

          <div class="form-group">
            <label for="name" class="label">Category Name *</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-input"
              placeholder="Enter category name"
              [class.error]="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched"
            />
            @if (categoryForm.get('name')?.hasError('required') && categoryForm.get('name')?.touched) {
              <span class="error-message">Category name is required</span>
            }
          </div>

          <app-icon-selector
            formControlName="icon"
            label="Category Icon *"
            inputId="category-icon"
          />

          @if (categoryForm.get('icon')?.hasError('required') && categoryForm.get('icon')?.touched) {
            <span class="error-message">Please select an icon</span>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="categoryForm.invalid || isSubmitting">
            @if (isSubmitting) {
              <span>Saving...</span>
            } @else {
              <span>{{ isEditMode ? 'Update' : 'Create' }} Category</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .category-dialog-form {
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

      .radio-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;

        .radio-option {
          display: flex;
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
            align-items: center;
            gap: 0.5rem;
            padding: 0.875rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            width: 100%;
            font-weight: 500;

            &:hover {
              border-color: #3b82f6;
              background-color: #f8fafc;
            }

            .radio-icon {
              font-size: 1.25rem;
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
export class CategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  category?: Category;
  CategoryType = CategoryType;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data?.categoryId) {
      this.isEditMode = true;
      this.loadCategory(this.data.categoryId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      icon: ['', Validators.required]
    });
  }

  private loadCategory(id: string): void {
    const categories = this.storageService.getCategories();
    const category = categories.find(c => c.id === id);

    if (category) {
      this.category = category;
      this.categoryForm.patchValue({
        type: category.type,
        name: category.name,
        icon: category.icon
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.categoryForm.value;

      if (this.isEditMode && this.data?.categoryId && this.category) {
        const updatedCategory: Category = {
          ...this.category,
          type: formValue.type,
          name: formValue.name,
          icon: formValue.icon,
          updatedAt: new Date()
        };
        this.storageService.saveCategory(updatedCategory);
      } else {
        const newCategory: Category = {
          id: this.storageService.generateId(),
          type: formValue.type,
          name: formValue.name,
          icon: formValue.icon,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.storageService.saveCategory(newCategory);
      }

      this.dialogRef.close({ success: true } as DialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}