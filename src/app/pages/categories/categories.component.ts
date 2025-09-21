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
        <div class="stat-card">
          <div class="stat-icon">📁</div>
          <div class="stat-content">
            <div class="stat-label">Total Categories</div>
            <div class="stat-value">{{ categories.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Income Categories</div>
            <div class="stat-value">{{ incomeCategories.length }}</div>
          </div>
        </div>
        <div class="stat-card">
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
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;

          .stat-icon {
            font-size: 2.5rem;
            background: #f3f4f6;
            padding: 1rem;
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
  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  filteredCategories: Category[] = [];
  activeTab: 'all' | 'income' | 'expense' = 'all';
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
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
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
      this.storageService.deleteCategory(category.id);
    }
  }
}