import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { Category, CategoryType } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { CategoryDialogComponent } from '../../shared/dialogs/category-dialog/category-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="categories-page">
      <app-page-header
        title="Categories"
        subtitle="Organize your income and expense categories"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Category"
      >
        <form [formGroup]="dateRangeForm" class="date-range-filter">
          <div class="date-field-wrapper">
            <label for="fromDate" class="date-label">Fr:</label>
            <input
              type="date"
              id="fromDate"
              formControlName="fromDate"
              class="date-input"
            />
          </div>
          <div class="date-field-wrapper">
            <label for="toDate" class="date-label">To:</label>
            <input
              type="date"
              id="toDate"
              formControlName="toDate"
              class="date-input"
            />
          </div>
        </form>
      </app-page-header>

      <div class="categories-stats">
        <div class="stat-card total">
          <div class="stat-icon">📁</div>
          <div class="stat-content">
            <div class="stat-label">Total Categories</div>
            <div class="stat-value">{{ categories.length }}</div>
          </div>
        </div>
        <div class="stat-card income">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Income Categories</div>
            <div class="stat-value">{{ incomeCategories.length }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">💸</div>
          <div class="stat-content">
            <div class="stat-label">Expense Categories</div>
            <div class="stat-value">{{ expenseCategories.length }}</div>
          </div>
        </div>
      </div>

      <div class="category-tabs">
        <button
          class="tab-button"
          [class.active]="activeTab === 'all'"
          (click)="setActiveTab('all')"
        >
          All ({{ categories.length }})
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'income'"
          (click)="setActiveTab('income')"
        >
          Income ({{ incomeCategories.length }})
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'expense'"
          (click)="setActiveTab('expense')"
        >
          Expense ({{ expenseCategories.length }})
        </button>
      </div>

      <app-data-table
        [data]="filteredCategories"
        [columns]="tableColumns"
        [showActions]="true"
        [enableVirtualization]="filteredCategories.length > 100"
        [itemHeight]="60"
        [pageSize]="50"
        emptyTitle="No Categories Found"
        emptyMessage="Create your first category to organize your transactions."
        (edit)="editCategory($event)"
        (delete)="deleteCategory($event)"
      />
    </div>
  `,
  styles: [`
    .categories-page {
      .date-range-filter {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;

        .date-field-wrapper {
          position: relative;
          display: inline-block;

          .date-label {
            position: absolute;
            left: 0.625rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.875rem;
            font-weight: 500;
            font-family: Verdana, sans-serif;
            color: #1a1a1a;
            pointer-events: none;
            background: white;
            padding: 0 0.25rem;
          }

          .date-input {
            padding: 0.5rem 0.5rem 0.5rem 2.7rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #111827;
            background: white;
            width: 170px;
            outline: none;
            transition: border-color 0.2s ease;

            &:focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            &::-webkit-calendar-picker-indicator {
              cursor: pointer;
            }
          }
        }
      }

      .categories-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;

        .stat-card {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;

          &.total {
            border-left: 4px solid #6366f1;
          }

          &.income {
            border-left: 4px solid #10b981;
          }

          &.expense {
            border-left: 4px solid #ef4444;
          }

          .stat-icon {
            font-size: 2rem;
            background: #f3f4f6;
            padding: 0.75rem;
            border-radius: 0.5rem;
          }

          .stat-content {
            .stat-label {
              color: #6b7280;
              font-size: 0.875rem;
              margin-bottom: 0.25rem;
            }

            .stat-value {
              font-size: 1.875rem;
              font-weight: 700;
              color: #111827;
            }
          }
        }
      }

      .category-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        background: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;

          &:hover {
            background: #f3f4f6;
            color: #374151;
          }

          &.active {
            background: #3b82f6;
            color: white;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .categories-page {
        .category-tabs {
          flex-wrap: wrap;
          gap: 0.375rem;

          .tab-button {
            flex: 1;
            min-width: calc(33.33% - 0.25rem);
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            text-align: center;
          }
        }
      }
    }
  `]
})
export class CategoriesComponent implements OnInit, OnDestroy {
  allCategories: Category[] = [];
  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  filteredCategories: Category[] = [];
  activeTab: 'all' | 'income' | 'expense' = 'all';
  dateRangeForm!: FormGroup;
  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'name', label: 'Category Name', type: 'text' },
    {
      key: 'type',
      label: 'Type',
      type: 'badge',
      badgeColors: {
        'income': '#10b981',
        'expense': '#ef4444'
      }
    },
    { key: 'budgetLimit', label: 'Budget Limit', type: 'currency' },
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialize date range form with default values (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm = this.fb.group({
      fromDate: [this.formatDateForInput(firstDay)],
      toDate: [this.formatDateForInput(lastDay)]
    });

    // Listen to date range changes
    this.subscription.add(
      this.dateRangeForm.valueChanges.subscribe(() => {
        this.filterCategories();
      })
    );

    this.subscription.add(
      this.storageService.categories$.subscribe(categories => {
        this.allCategories = categories;
        this.filterCategories();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateCategoryGroups(): void {
    this.incomeCategories = this.categories.filter(c => c.type === CategoryType.INCOME);
    this.expenseCategories = this.categories.filter(c => c.type === CategoryType.EXPENSE);
  }

  setActiveTab(tab: 'all' | 'income' | 'expense'): void {
    this.activeTab = tab;
    this.updateFilteredCategories();
  }

  private updateFilteredCategories(): void {
    switch (this.activeTab) {
      case 'income':
        this.filteredCategories = this.incomeCategories;
        break;
      case 'expense':
        this.filteredCategories = this.expenseCategories;
        break;
      default:
        this.filteredCategories = this.categories;
    }
  }

  openAddDialog(): void {
    this.dialogService.open(CategoryDialogComponent, {
      title: 'Add Category',
      width: '500px'
    });
  }

  editCategory(category: Category): void {
    this.dialogService.open(CategoryDialogComponent, {
      title: 'Edit Category',
      width: '500px',
      data: { categoryId: category.id }
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.storageService.deleteCategory(category.id);
    }
  }

  private filterCategories(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    this.categories = this.allCategories.filter(category => {
      const categoryDate = new Date(category.createdAt);
      const afterStart = !startDate || categoryDate >= startDate;
      const beforeEnd = !endDate || categoryDate <= endDate;
      return afterStart && beforeEnd;
    });

    this.updateCategoryGroups();
    this.updateFilteredCategories();
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}