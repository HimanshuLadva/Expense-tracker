import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="categories-page">
      <app-page-header
        title="Categories"
        subtitle="Organize your income and expense categories"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Category"
      />

      <div class="categories-stats">
        <div class="stat-card total">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h4.4a1.5 1.5 0 0 1 1.2.6l1.1 1.4a1.5 1.5 0 0 0 1.2.6h7.1a1.5 1.5 0 0 1 1.5 1.5v8.4a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Categories</div>
            <div class="stat-value">{{ categories.length }}</div>
          </div>
        </div>
        <div class="stat-card income">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5"/>
              <path d="M6 11l6-6 6 6"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Income Categories</div>
            <div class="stat-value">{{ incomeCategories.length }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M18 13l-6 6-6-6"/>
            </svg>
          </div>
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
      .categories-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;

        .stat-card {
          background: var(--surface);
          padding: 1.1rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 0.9rem;
          border-top: 3px solid var(--color-primary);
          transition: transform 0.2s ease, box-shadow 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          &.income {
            border-top-color: var(--color-accent);
          }

          &.expense {
            border-top-color: var(--color-destructive);
          }

          .stat-icon {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-primary-tint);
            color: var(--color-primary);
            border-radius: var(--radius-md);

            svg {
              width: 20px;
              height: 20px;
            }
          }

          &.income .stat-icon {
            background: var(--color-accent-tint);
            color: var(--color-accent);
          }

          &.expense .stat-icon {
            background: var(--color-destructive-tint);
            color: var(--color-destructive);
          }

          .stat-content {
            .stat-label {
              color: var(--text-muted);
              font-size: 0.8rem;
              font-weight: 500;
              margin-bottom: 0.25rem;
            }

            .stat-value {
              font-family: var(--font-heading);
              font-size: 1.6rem;
              font-weight: 700;
              color: var(--text-primary);
            }
          }
        }
      }

      .category-tabs {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        background: var(--surface-sunken);
        padding: 0.35rem;
        border-radius: var(--radius-md);
        width: fit-content;

        .tab-button {
          padding: 0.6rem 1.25rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 500;
          font-size: 0.875rem;

          &:hover {
            color: var(--text-primary);
          }

          &.active {
            background: var(--surface);
            color: var(--color-primary);
            font-weight: 600;
            box-shadow: var(--shadow-sm);
          }

          &:focus-visible {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .categories-page {
        .category-tabs {
          flex-wrap: wrap;
          gap: 0.25rem;
          width: 100%;

          .tab-button {
            flex: 1;
            min-width: calc(33.33% - 0.25rem);
            padding: 0.625rem 0.75rem;
            font-size: 0.85rem;
            text-align: center;
          }
        }
      }
    }
  `]
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  filteredCategories: Category[] = [];
  activeTab: 'all' | 'income' | 'expense' = 'all';
  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    { key: 'icon', label: 'Icon', type: 'icon' },
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
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    // Load categories from API
    this.storageService.loadCategories();

    this.subscription.add(
      this.storageService.categories$.subscribe(categories => {
        this.categories = categories;
        this.updateCategoryGroups();
        this.updateFilteredCategories();
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
      this.storageService.deleteCategory(category.id).subscribe({
        next: () => {
          // Category deleted successfully
        },
        error: (error) => {
          console.error('Failed to delete category:', error);
          alert('Failed to delete category. Please try again.');
        }
      });
    }
  }
}