import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Category, Budget, BudgetWithUsage } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { SetBudgetDialogComponent } from '../../shared/dialogs/set-budget-dialog/set-budget-dialog.component';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <div class="budget-page">
      <app-page-header
        title="Budget Management"
        subtitle="Track your spending against budgets"
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
        <button class="add-budget-btn" (click)="createBudget()">
          + New Budget
        </button>
      </app-page-header>

      <!-- Active Budgets Section -->
      <div class="budget-section">
        <h3 class="section-title">Active Budgets</h3>
        @if (budgetsWithUsage.length > 0) {
          <div class="budgeted-grid">
            @for (budget of budgetsWithUsage; track budget.id) {
              <div class="budget-card">
                <div class="budget-card-header">
                  <div class="budget-info">
                    <span class="budget-name">{{ budget.name }}</span>
                    <span class="budget-period">{{ formatPeriod(budget.period) }}</span>
                  </div>
                  <button
                    class="edit-btn"
                    (click)="editBudget(budget)"
                    title="Edit Budget"
                  >
                    ✏️
                  </button>
                </div>

                <div class="budget-date-range">
                  <span class="date-label">📅</span>
                  <span class="date-text">{{ formatDate(budget.startDate) }} - {{ formatDate(budget.endDate) }}</span>
                </div>

                <div class="budget-categories">
                  <span class="categories-label">Categories:</span>
                  <div class="categories-list">
                    @for (categoryId of budget.categories; track categoryId) {
                      <span class="category-chip">
                        {{ getCategoryName(categoryId) }}
                      </span>
                    }
                  </div>
                </div>

                <div class="budget-stats">
                  <div class="stat-row">
                    <span class="stat-label">Budget:</span>
                    <span class="stat-value limit">{{ formatCurrency(budget.amount) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">Spent:</span>
                    <span class="stat-value spent" [class.over-budget]="budget.spent > budget.amount">
                      {{ formatCurrency(budget.spent) }}
                    </span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">Remaining:</span>
                    <span class="stat-value remaining" [class.negative]="budget.remaining < 0">
                      {{ formatCurrency(budget.remaining) }}
                    </span>
                  </div>
                </div>

                <div class="progress-bar-container">
                  <div
                    class="progress-bar"
                    [class.over-budget]="budget.percentageUsed > 100"
                    [style.width.%]="Math.min(budget.percentageUsed, 100)"
                  ></div>
                </div>
                <div class="progress-label">
                  {{ budget.percentageUsed.toFixed(1) }}% used
                </div>

                <button
                  class="delete-budget-btn"
                  (click)="deleteBudget(budget)"
                  title="Remove Budget"
                >
                  Remove Budget
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p class="empty-message">No active budgets for the selected date range</p>
            <button class="create-first-btn" (click)="createBudget()">
              Create Your First Budget
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .budget-page {
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

      .add-budget-btn {
        padding: 0.625rem 1.25rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #2563eb;
        }
      }

      .budget-section {
        margin-bottom: 3rem;

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &::before {
            content: '';
            width: 4px;
            height: 1.5rem;
            background: #3b82f6;
            border-radius: 2px;
          }
        }

        .empty-state {
          background: white;
          padding: 3rem;
          border-radius: 0.75rem;
          text-align: center;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-message {
            color: #6b7280;
            font-size: 1rem;
            margin: 0 0 1.5rem 0;
          }

          .create-first-btn {
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: #2563eb;
            }
          }
        }
      }

      .budgeted-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;

        .budget-card {
          background: white;
          padding: 1rem 1.5rem 1.5rem 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          border-left: 4px solid #3b82f6;
          transition: all 0.2s ease;

          &:hover {
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transform: translateY(-2px);
          }

          .budget-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;

            .budget-info {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;

              .budget-name {
                font-size: 1.25rem;
                font-weight: 600;
                color: #111827;
              }

              .budget-period {
                font-size: 0.75rem;
                color: #6b7280;
                text-transform: uppercase;
                font-weight: 500;
              }
            }

            .edit-btn {
              background: #f3f4f6;
              border: none;
              border-radius: 0.375rem;
              padding: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              transition: all 0.2s ease;

              &:hover {
                background: #e5e7eb;
                transform: scale(1.1);
              }
            }
          }

          .budget-date-range {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 0.375rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: #4b5563;

            .date-label {
              font-size: 1rem;
            }

            .date-text {
              font-weight: 500;
            }
          }

          .budget-categories {
            margin-bottom: 1rem;

            .categories-label {
              display: block;
              font-size: 0.75rem;
              color: #6b7280;
              font-weight: 500;
              margin-bottom: 0.5rem;
              text-transform: uppercase;
            }

            .categories-list {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;

              .category-chip {
                padding: 0.25rem 0.625rem;
                background: #e0e7ff;
                color: #3730a3;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 500;
              }
            }
          }

          .budget-stats {
            margin-bottom: 1rem;

            .stat-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.5rem 0;
              border-bottom: 1px solid #f3f4f6;

              &:last-child {
                border-bottom: none;
              }

              .stat-label {
                color: #6b7280;
                font-size: 0.875rem;
                font-weight: 500;
              }

              .stat-value {
                font-size: 1rem;
                font-weight: 600;

                &.limit {
                  color: #3b82f6;
                }

                &.spent {
                  color: #f59e0b;

                  &.over-budget {
                    color: #ef4444;
                  }
                }

                &.remaining {
                  color: #10b981;

                  &.negative {
                    color: #ef4444;
                  }
                }
              }
            }
          }

          .progress-bar-container {
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;

            .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
              border-radius: 4px;
              transition: width 0.3s ease;

              &.over-budget {
                background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);
              }
            }
          }

          .progress-label {
            text-align: center;
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 1rem;
          }

          .delete-budget-btn {
            width: 100%;
            padding: 0.625rem;
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: #fecaca;
              border-color: #fca5a5;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .budget-page {
        .budgeted-grid {
          grid-template-columns: 1fr;
        }

        .add-budget-btn {
          width: 100%;
          margin-top: 0.5rem;
        }
      }
    }
  `]
})
export class BudgetComponent implements OnInit, OnDestroy {
  budgetsWithUsage: BudgetWithUsage[] = [];
  categories: Category[] = [];
  dateRangeForm!: FormGroup;
  Math = Math;

  private subscription = new Subscription();

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
  ) {}

  ngOnInit(): void {
    // Load categories from API when budget page is accessed
    this.storageService.loadCategories();

    // Initialize date range form with values from service
    const currentRange = this.dateRangeService.getCurrentDateRange();

    this.dateRangeForm = this.fb.group({
      fromDate: [currentRange.fromDate],
      toDate: [currentRange.toDate]
    });

    // Load transactions with initial date range
    this.loadTransactionsWithDateRange();

    // Listen to date range changes and update service
    this.subscription.add(
      this.dateRangeForm.valueChanges.subscribe((value) => {
        this.dateRangeService.updateDateRange(value);
        this.loadTransactionsWithDateRange();
        this.loadBudgetData();
      })
    );

    // Listen to date range changes from other pages
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.loadTransactionsWithDateRange();
        this.loadBudgetData();
      })
    );

    // Load initial data
    this.loadBudgetData();

    // Subscribe to changes
    this.subscription.add(
      this.storageService.budgets$.subscribe(() => {
        this.calculateBudgetUsage();
      })
    );

    this.subscription.add(
      this.storageService.categories$.subscribe((categories) => {
        this.categories = categories;
        this.calculateBudgetUsage();
      })
    );

    this.subscription.add(
      this.storageService.transactions$.subscribe(() => {
        this.calculateBudgetUsage();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadTransactionsWithDateRange(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    if (!fromDate || !toDate) return;

    // Load transactions with date range filter for server-side filtering
    const request = {
      fromDate: `${fromDate}T00:00:00.000Z`,
      toDate: `${toDate}T23:59:59.999Z`
    };

    this.storageService.loadTransactions(request);
  }

  private loadBudgetData(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    if (!fromDate || !toDate) return;

    // Load budgets with date range filter
    this.storageService.loadBudgets({
      fromDate: `${fromDate}T00:00:00.000Z`,
      toDate: `${toDate}T23:59:59.999Z`
    });
  }

  private calculateBudgetUsage(): void {
    const budgets = this.storageService.getBudgets();
    const transactions = this.storageService.getTransactions();
    const { fromDate, toDate } = this.dateRangeForm.value;

    if (!fromDate || !toDate) {
      this.budgetsWithUsage = [];
      return;
    }

    this.budgetsWithUsage = budgets
      .filter(b => b.isActive)
      .map(budget => {
        // Use budget's own start and end dates for calculating spent amount
        const budgetStartDate = new Date(budget.startDate);
        const budgetEndDate = new Date(budget.endDate);
        budgetEndDate.setHours(23, 59, 59, 999);

        // Calculate spent amount for all categories in this budget within the budget's date range
        const spent = this.calculateSpent(budget.categories, transactions, budgetStartDate, budgetEndDate);
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentageUsed
        };
      });
  }

  private calculateSpent(categoryIds: number[], transactions: any[], startDate: Date, endDate: Date): number {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          categoryIds.includes(t.categoryId) &&
          t.type === 'expense' &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatPeriod(period: string): string {
    return period.charAt(0).toUpperCase() + period.slice(1);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  createBudget(): void {
    this.dialogService.open(SetBudgetDialogComponent, {
      title: 'Create Budget',
      width: '600px',
      data: {
        categories: this.categories
      }
    }).closed.subscribe((result: any) => {
      if (result?.success) {
        this.loadBudgetData();
      }
    });
  }

  editBudget(budget: Budget): void {
    this.dialogService.open(SetBudgetDialogComponent, {
      title: 'Edit Budget',
      width: '600px',
      data: {
        budget,
        categories: this.categories
      }
    }).closed.subscribe((result: any) => {
      if (result?.success) {
        this.loadBudgetData();
      }
    });
  }

  deleteBudget(budget: Budget): void {
    if (confirm(`Are you sure you want to remove the budget "${budget.name}"?`)) {
      this.storageService.deleteBudget(budget.id).subscribe({
        next: () => {
          this.loadBudgetData();
        },
        error: (error) => {
          alert('Failed to delete budget. Please try again.');
          console.error('Delete error:', error);
        }
      });
    }
  }
}
