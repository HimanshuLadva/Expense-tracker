import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Category, CategoryType, Budget, BudgetWithUsage } from '../../models';
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
        subtitle="Track your spending against monthly budgets"
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

      <!-- Budgeted Categories Section -->
      <div class="budget-section">
        <h3 class="section-title">Budgeted Categories {{ getDisplayMonthYear() }}</h3>
        @if (budgetedCategories.length > 0) {
          <div class="budgeted-grid">
            @for (budget of budgetedCategories; track budget.id) {
              <div class="budget-card">
                <div class="budget-card-header">
                  <div class="category-info">
                    <span class="category-icon">{{ budget.categoryIcon }}</span>
                    <span class="category-name">{{ budget.categoryName }}</span>
                  </div>
                  <button
                    class="edit-btn"
                    (click)="editBudget(budget)"
                    title="Edit Budget"
                  >
                    ✏️
                  </button>
                </div>

                <div class="budget-stats">
                  <div class="stat-row">
                    <span class="stat-label">Limit:</span>
                    <span class="stat-value limit">{{ formatCurrency(budget.limit) }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">Spent:</span>
                    <span class="stat-value spent" [class.over-budget]="budget.spent > budget.limit">
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
            <p class="empty-message">No budgets set for this month</p>
          </div>
        }
      </div>

      <!-- Not Budgeted Section -->
      <div class="budget-section">
        <h3 class="section-title">Not Budgeted This Month</h3>
        @if (notBudgetedCategories.length > 0) {
          <div class="not-budgeted-grid">
            @for (category of notBudgetedCategories; track category.id) {
              <div class="category-card">
                <div class="category-info">
                  <span class="category-icon">{{ category.icon }}</span>
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-type" [class.income]="category.type === 'income'" [class.expense]="category.type === 'expense'">
                    {{ category.type }}
                  </span>
                </div>
                <button class="set-budget-btn" (click)="setBudget(category)">
                  Set Budget
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p class="empty-message">All categories have budgets set</p>
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
            margin: 0;
          }
        }
      }

      .budgeted-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
            align-items: center;
            margin-bottom: 1rem;

            .category-info {
              display: flex;
              align-items: center;
              gap: 0.75rem;

              .category-icon {
                font-size: 2rem;
              }

              .category-name {
                font-size: 1.125rem;
                font-weight: 600;
                color: #111827;
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

      .not-budgeted-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;

        .category-card {
          background: white;
          padding: 0.75rem 1rem 1rem 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: 0.75rem;
          align-items: start;
          transition: all 0.2s ease;
          min-height: 80px;

          &:hover {
            box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.15);
          }

          .category-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            grid-column: 1 / -1;
            min-width: 0;

            .category-icon {
              font-size: 2rem;
              flex-shrink: 0;
            }

            .category-name {
              font-weight: 600;
              color: #111827;
              font-size: 1rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
              min-width: 0;
            }

            .category-type {
              padding: 0.25rem 0.625rem;
              border-radius: 0.25rem;
              font-size: 0.75rem;
              font-weight: 500;
              text-transform: uppercase;
              white-space: nowrap;
              flex-shrink: 0;

              &.income {
                background: #d1fae5;
                color: #065f46;
              }

              &.expense {
                background: #fee2e2;
                color: #991b1b;
              }
            }
          }

          .set-budget-btn {
            grid-column: 1 / -1;
            padding: 0.625rem 1.25rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            width: 100%;

            &:hover {
              background: #2563eb;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .budget-page {
        .budgeted-grid,
        .not-budgeted-grid {
          grid-template-columns: 1fr;
        }

        .not-budgeted-grid .category-card {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;

          .set-budget-btn {
            width: 100%;
          }
        }
      }
    }
  `]
})
export class BudgetComponent implements OnInit, OnDestroy {
  currentMonth: number;
  currentYear: number;
  currentMonthName: string;
  budgetedCategories: BudgetWithUsage[] = [];
  notBudgetedCategories: Category[] = [];
  dateRangeForm!: FormGroup;
  Math = Math;

  private subscription = new Subscription();

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.currentMonthName = this.getMonthName(this.currentMonth);
  }

  ngOnInit(): void {
    // Initialize date range form with values from service
    const currentRange = this.dateRangeService.getCurrentDateRange();

    this.dateRangeForm = this.fb.group({
      fromDate: [currentRange.fromDate],
      toDate: [currentRange.toDate]
    });

    // Update current month/year based on date range
    this.updateCurrentPeriod();

    // Listen to date range changes and update service
    this.subscription.add(
      this.dateRangeForm.valueChanges.subscribe((value) => {
        this.dateRangeService.updateDateRange(value);
        this.updateCurrentPeriod();
        this.loadBudgetData();
      })
    );

    // Listen to date range changes from other pages
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.updateCurrentPeriod();
        this.loadBudgetData();
      })
    );

    this.loadBudgetData();

    // Subscribe to changes
    this.subscription.add(
      this.storageService.budgets$.subscribe(() => {
        this.loadBudgetData();
      })
    );

    this.subscription.add(
      this.storageService.categories$.subscribe(() => {
        this.loadBudgetData();
      })
    );

    this.subscription.add(
      this.storageService.transactions$.subscribe(() => {
        this.loadBudgetData();
      })
    );
  }

  private updateCurrentPeriod(): void {
    const { fromDate } = this.dateRangeForm.value;
    if (fromDate) {
      const date = new Date(fromDate);
      this.currentMonth = date.getMonth() + 1;
      this.currentYear = date.getFullYear();
      this.currentMonthName = this.getMonthName(this.currentMonth);
    }
  }

  getDisplayMonthYear(): string {
    const { fromDate, toDate } = this.dateRangeForm.value;
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // If same month and year, show "OCT 2025"
      if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
        return `${this.getMonthName(from.getMonth() + 1)} ${from.getFullYear()}`;
      }

      // If different months/years, show range like "OCT 2025 - NOV 2025"
      return `${this.getMonthName(from.getMonth() + 1)} ${from.getFullYear()} - ${this.getMonthName(to.getMonth() + 1)} ${to.getFullYear()}`;
    }

    return `${this.currentMonthName} ${this.currentYear}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadBudgetData(): void {
    const budgets = this.storageService.getBudgets();
    const categories = this.storageService.getCategories();
    const transactions = this.storageService.getTransactions();

    // Get date range from form
    const { fromDate, toDate } = this.dateRangeForm.value;
    if (!fromDate || !toDate) return;

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    // Filter budgets that fall within the date range
    const currentBudgets = budgets.filter(b => {
      // Create a date for the budget's month (first day of that month)
      const budgetDate = new Date(b.year, b.month - 1, 1);
      // Create end of month for the budget
      const budgetEndDate = new Date(b.year, b.month, 0, 23, 59, 59, 999);

      // Check if budget month overlaps with selected date range
      return budgetDate <= endDate && budgetEndDate >= startDate;
    });

    // Get categories with budgets
    this.budgetedCategories = currentBudgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);

      // Calculate spent amount for this category within the selected date range
      const spent = this.calculateSpent(budget.categoryId, transactions, startDate, endDate);
      const remaining = budget.limit - spent;
      const percentageUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      return {
        ...budget,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📁',
        spent,
        remaining,
        percentageUsed
      };
    });

    // Get categories without budgets in the selected range
    const budgetedCategoryIds = new Set(currentBudgets.map(b => b.categoryId));
    this.notBudgetedCategories = categories.filter(
      c => !budgetedCategoryIds.has(c.id)
    );
  }

  private calculateSpent(categoryId: number, transactions: any[], startDate: Date, endDate: Date): number {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.categoryId === categoryId &&
          t.type === 'expense' &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getMonthName(month: number): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[month - 1] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  setBudget(category: Category): void {
    this.dialogService.open(SetBudgetDialogComponent, {
      title: 'Set Budget',
      width: '500px',
      data: {
        category,
        month: this.currentMonth,
        year: this.currentYear
      }
    });
  }

  editBudget(budget: BudgetWithUsage): void {
    const category = this.storageService.getCategories().find(c => c.id === budget.categoryId);

    this.dialogService.open(SetBudgetDialogComponent, {
      title: 'Edit Budget',
      width: '500px',
      data: {
        category,
        month: this.currentMonth,
        year: this.currentYear,
        budgetId: budget.id,
        currentLimit: budget.limit
      }
    });
  }

  deleteBudget(budget: BudgetWithUsage): void {
    if (confirm(`Are you sure you want to remove the budget for "${budget.categoryName}"?`)) {
      this.storageService.deleteBudget(budget.id);
    }
  }
}
