import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { StorageService } from '../../../services/storage.service';
import { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { IconSelectorComponent } from '../../../shared/icon-selector/icon-selector.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, IconSelectorComponent],
  template: `
    <div class="category-form-page">
      <app-page-header
        [title]="isEditMode ? 'Edit Category' : 'Add Category'"
        [subtitle]="isEditMode ? 'Update category details' : 'Create a new category to organize your transactions'"
      />

      <div class="form-container">
        <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="category-form">
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

          @if (categoryForm.get('type')?.value === CategoryType.EXPENSE) {
            <div class="form-group">
              <label for="budgetLimit" class="label">Budget Limit (Optional)</label>
              <input
                type="number"
                id="budgetLimit"
                formControlName="budgetLimit"
                class="form-input"
                placeholder="0.00"
                step="0.01"
                [class.error]="categoryForm.get('budgetLimit')?.invalid && categoryForm.get('budgetLimit')?.touched"
              />
              @if (categoryForm.get('budgetLimit')?.hasError('min') && categoryForm.get('budgetLimit')?.touched) {
                <span class="error-message">Budget limit must be at least 0</span>
              }
              <small class="help-text">Set a monthly spending limit for this category</small>
            </div>
          }

          <app-icon-selector
            formControlName="icon"
            label="Category Icon *"
            inputId="category-icon"
          />

          @if (categoryForm.get('icon')?.hasError('required') && categoryForm.get('icon')?.touched) {
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
              [disabled]="categoryForm.invalid || isSubmitting"
            >
              @if (isSubmitting) {
                <span>Saving...</span>
              } @else {
                <span>{{ isEditMode ? 'Update' : 'Create' }} Category</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .category-form-page {
      .form-container {
        max-width: 600px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        padding: 2rem;

        .category-form {
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

            .radio-group {
              display: grid;
              grid-template-columns: 1fr 1fr;
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
                  align-items: center;
                  gap: 0.75rem;
                  padding: 1rem;
                  border: 2px solid #e5e7eb;
                  border-radius: 0.5rem;
                  transition: all 0.2s ease;
                  width: 100%;
                  background-color: #ffffff;

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

            .help-text {
              display: block;
              margin-top: 0.25rem;
              font-size: 0.875rem;
              color: #6b7280;
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
      .category-form-page {
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
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  categoryId: string | null = null;
  CategoryType = CategoryType;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;

    if (this.isEditMode && this.categoryId) {
      this.loadCategory(this.categoryId);
    }

    this.categoryForm.get('type')?.valueChanges.subscribe(type => {
      if (type === CategoryType.INCOME) {
        this.categoryForm.get('budgetLimit')?.setValue(null);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      budgetLimit: [null, [Validators.min(0)]],
      icon: ['', Validators.required]
    });
  }

  private loadCategory(id: string): void {
    const categories = this.storageService.getCategories();
    const category = categories.find(c => c.id === id);

    if (category) {
      this.categoryForm.patchValue({
        type: category.type,
        name: category.name,
        budgetLimit: category.budgetLimit,
        icon: category.icon
      });
    } else {
      this.router.navigate(['/categories']);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.categoryForm.value;

      if (this.isEditMode && this.categoryId) {
        const updateRequest: UpdateCategoryRequest = {
          id: this.categoryId,
          type: formValue.type,
          name: formValue.name,
          budgetLimit: formValue.type === CategoryType.EXPENSE ? formValue.budgetLimit : undefined,
          icon: formValue.icon
        };

        const categories = this.storageService.getCategories();
        const existingCategory = categories.find(c => c.id === this.categoryId);

        if (existingCategory) {
          const updatedCategory: Category = {
            ...existingCategory,
            type: updateRequest.type,
            name: updateRequest.name,
            budgetLimit: updateRequest.budgetLimit,
            icon: updateRequest.icon,
            updatedAt: new Date()
          };

          this.storageService.saveCategory(updatedCategory);
        }
      } else {
        const createRequest: CreateCategoryRequest = {
          type: formValue.type,
          name: formValue.name,
          budgetLimit: formValue.type === CategoryType.EXPENSE ? formValue.budgetLimit : undefined,
          icon: formValue.icon
        };

        const newCategory: Category = {
          id: this.storageService.generateId(),
          type: createRequest.type,
          name: createRequest.name,
          budgetLimit: createRequest.budgetLimit,
          icon: createRequest.icon,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveCategory(newCategory);
      }

      this.router.navigate(['/categories']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/categories']);
  }
}