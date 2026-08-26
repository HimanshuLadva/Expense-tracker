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
          <div class="date-range-pill">
            <div class="date-field-wrapper">
              <label for="fromDate" class="date-label">Fr:</label>
              <input
                type="date"
                id="fromDate"
                formControlName="fromDate"
                class="date-input"
              />
            </div>
            <span class="date-range-divider">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </span>
            <div class="date-field-wrapper">
              <label for="toDate" class="date-label">To:</label>
              <input
                type="date"
                id="toDate"
                formControlName="toDate"
                class="date-input"
              />
            </div>
          </div>
        </form>
        <button class="add-budget-btn" (click)="createBudget()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Budget
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
                    aria-label="Edit Budget"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12.5 5.5l4 4L7 19H3v-4z"/>
                      <path d="M15 3.5l4.5 4.5"/>
                    </svg>
                  </button>
                </div>

                <div class="budget-date-range">
                  <span class="date-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4.5" width="18" height="16" rx="2"/>
                      <path d="M3 9.5h18"/>
                      <path d="M8 3v3M16 3v3"/>
                    </svg>
                  </span>
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
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9"/>
                <path d="M21 12H12V3"/>
              </svg>
            </div>
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
        flex-wrap: wrap;

        .date-range-pill {
          display: inline-flex;
          align-items: center;
          height: 36px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          background: var(--surface);
          padding: 0 0.2rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;

          &:focus-within {
            border-color: var(--color-primary-light);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
          }
        }

        .date-range-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          color: var(--text-muted);

          svg {
            width: 13px;
            height: 13px;
          }
        }

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
            color: var(--text-primary);
            pointer-events: none;
          }

          .date-input {
            height: 100%;
            padding: 0 0.5rem 0 2.7rem;
            border: none;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: var(--text-primary);
            background: transparent;
            width: 155px;
            outline: none;

            &::-webkit-calendar-picker-indicator {
              cursor: pointer;
            }
          }
        }
      }

      .add-budget-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.1rem;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: var(--text-on-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;

        svg {
          width: 16px;
          height: 16px;
        }

        &:hover {
          filter: brightness(1.06);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        &:focus-visible {
          outline: 2px solid var(--color-primary-light);
          outline-offset: 2px;
        }
      }

      .budget-section {
        margin-bottom: 3rem;

        .section-title {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;

          &::before {
            content: '';
            width: 4px;
            height: 1.3rem;
            background: var(--color-primary);
            border-radius: 2px;
          }
        }

        .empty-state {
          background: var(--surface);
          padding: 3rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          text-align: center;
          box-shadow: var(--shadow-sm);

          .empty-icon {
            width: 52px;
            height: 52px;
            margin: 0 auto 1rem;
            color: var(--text-muted);

            svg {
              width: 100%;
              height: 100%;
            }
          }

          .empty-message {
            color: var(--text-muted);
            font-size: 1rem;
            margin: 0 0 1.5rem 0;
          }

          .create-first-btn {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            color: var(--text-on-primary);
            border: none;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: var(--shadow-sm);
            transition: transform 0.15s ease, box-shadow 0.15s ease;

            &:hover {
              box-shadow: var(--shadow-md);
              transform: translateY(-1px);
            }
          }
        }
      }

      .budgeted-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;

        .budget-card {
          background: var(--surface);
          padding: 1.1rem 1.4rem 1.4rem 1.4rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          border-top: 3px solid var(--color-primary);
          transition: all 0.2s ease;

          &:hover {
            box-shadow: var(--shadow-md);
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
                font-family: var(--font-heading);
                font-size: 1.15rem;
                font-weight: 600;
                color: var(--text-primary);
              }

              .budget-period {
                font-size: 0.72rem;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.04em;
                font-weight: 600;
              }
            }

            .edit-btn {
              background: var(--color-primary-tint);
              border: 1px solid color-mix(in srgb, var(--color-primary-light) 35%, var(--tint-mix-base));
              color: var(--color-primary);
              border-radius: var(--radius-sm);
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.15s ease;

              svg {
                width: 15px;
                height: 15px;
              }

              &:hover {
                background: color-mix(in srgb, var(--color-primary-light) 22%, var(--tint-mix-base));
                transform: translateY(-1px);
              }
            }
          }

          .budget-date-range {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.65rem;
            background: var(--surface-muted);
            border-radius: var(--radius-sm);
            margin-bottom: 1rem;
            font-size: 0.85rem;
            color: var(--text-secondary);

            .date-label {
              width: 16px;
              height: 16px;
              flex-shrink: 0;
              display: flex;
              color: var(--text-muted);

              svg {
                width: 100%;
                height: 100%;
              }
            }

            .date-text {
              font-weight: 500;
            }
          }

          .budget-categories {
            margin-bottom: 1rem;

            .categories-label {
              display: block;
              font-size: 0.7rem;
              color: var(--text-muted);
              font-weight: 600;
              margin-bottom: 0.5rem;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .categories-list {
              display: flex;
              flex-wrap: wrap;
              gap: 0.4rem;

              .category-chip {
                padding: 0.25rem 0.625rem;
                background: var(--color-primary-tint);
                color: var(--color-primary);
                border-radius: var(--radius-sm);
                font-size: 0.72rem;
                font-weight: 600;
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
              border-bottom: 1px solid var(--border-subtle);

              &:last-child {
                border-bottom: none;
              }

              .stat-label {
                color: var(--text-muted);
                font-size: 0.85rem;
                font-weight: 500;
              }

              .stat-value {
                font-size: 1rem;
                font-weight: 600;
                font-variant-numeric: tabular-nums;

                &.limit {
                  color: var(--color-primary);
                }

                &.spent {
                  color: var(--color-warning);

                  &.over-budget {
                    color: var(--color-destructive);
                  }
                }

                &.remaining {
                  color: var(--color-accent);

                  &.negative {
                    color: var(--color-destructive);
                  }
                }
              }
            }
          }

          .progress-bar-container {
            height: 8px;
            background: var(--surface-sunken);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;

            .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary-light) 100%);
              border-radius: 4px;
              transition: width 0.3s ease;

              &.over-budget {
                background: linear-gradient(90deg, var(--color-warning) 0%, var(--color-destructive) 100%);
              }
            }
          }

          .progress-label {
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 500;
            margin-bottom: 1rem;
          }

          .delete-budget-btn {
            width: 100%;
            padding: 0.625rem;
            background: var(--color-destructive-tint);
            color: var(--color-destructive);
            border: 1px solid color-mix(in srgb, var(--color-destructive) 30%, var(--tint-mix-base));
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              background: color-mix(in srgb, var(--color-destructive) 18%, var(--tint-mix-base));
            }

            &:focus-visible {
              outline: 2px solid var(--color-destructive);
              outline-offset: 2px;
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
