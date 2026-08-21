import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as echarts from 'echarts';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Transaction, TransactionType, Account, Category, CategoryType, Reminder, Budget, BudgetWithUsage } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { getIconBadgeColor } from '../../shared/icon-badge-color.util';

const CHART_PALETTE = ['#C1622D', '#3B7A8C', '#4B7B4E', '#C58A2E', '#A8432E', '#8C6E4E', '#B5647A', '#6E8B6B'];

const TOOLTIP_CSS = 'box-shadow: 0 8px 24px rgba(43,36,32,0.16); border-radius: 10px; padding: 10px 12px;';
const AXIS_LABEL_STYLE = { color: '#9c9284', fontFamily: 'Inter', fontSize: 11 };
const AXIS_LINE_STYLE = { lineStyle: { color: '#e6dfd2' } };
const SPLIT_LINE_STYLE = { lineStyle: { color: 'rgba(43, 36, 32, 0.07)' } };

interface DashboardStats {
  totalAccounts: number;
  totalCategories: number;
  totalTransactions: number;
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  netIncome: number;
}

interface UpcomingReminder extends Reminder {
  reminderDate: Date;
  startDate: Date;
  endDate: Date;
  daysUntil: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <div class="dashboard-page" #dashboardRoot>
      <app-page-header
        title="Dashboard"
        subtitle="Overview of your financial activity and analytics"
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

      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9.5l9-5.5 9 5.5"/>
              <path d="M5 9.5v9M10 9.5v9M14 9.5v9M19 9.5v9"/>
              <path d="M3 18.5h18"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Balance</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.totalBalance) }}</div>
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
            <div class="stat-label">This Month Income</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.thisMonthIncome) }}</div>
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
            <div class="stat-label">This Month Expenses</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.thisMonthExpenses) }}</div>
          </div>
        </div>
        <div class="stat-card net">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 17l5-5 4 4 7-8"/>
              <path d="M14 8h5v5"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Net Income</div>
            <div class="stat-value" [class.negative]="stats.netIncome < 0">
              {{ formatCompactCurrency(stats.netIncome) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Expense Overview Doughnut -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Expense Overview</h3>
            <span class="chart-subtitle">Current month breakdown</span>
          </div>
          <div class="chart-container">
            @if (!hasExpenseOverviewData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No expense data for this period' }"></ng-container>
            }
            <div #expenseOverviewChart class="echart-el" [class.hidden]="!hasExpenseOverviewData"></div>
          </div>
        </div>

        <!-- Income Overview Doughnut -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Income Overview</h3>
            <span class="chart-subtitle">Current month breakdown</span>
          </div>
          <div class="chart-container">
            @if (!hasIncomeOverviewData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No income data for this period' }"></ng-container>
            }
            <div #incomeOverviewChart class="echart-el" [class.hidden]="!hasIncomeOverviewData"></div>
          </div>
        </div>

        <!-- Income Flow Area Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Income Trend</h3>
            <span class="chart-subtitle">{{ trendPeriodLabel }}</span>
          </div>
          <div class="chart-container">
            @if (!hasIncomeFlowData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No income recorded in this period' }"></ng-container>
            }
            <div #incomeFlowChart class="echart-el" [class.hidden]="!hasIncomeFlowData"></div>
          </div>
        </div>

        <!-- Expense Flow Area Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Expense Trend</h3>
            <span class="chart-subtitle">{{ trendPeriodLabel }}</span>
          </div>
          <div class="chart-container">
            @if (!hasExpenseFlowData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No expenses recorded in this period' }"></ng-container>
            }
            <div #expenseFlowChart class="echart-el" [class.hidden]="!hasExpenseFlowData"></div>
          </div>
        </div>

        <!-- Account-wise Bar Chart -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <div>
              <h3>Account-wise Activity</h3>
              <span class="chart-subtitle">Income vs Expenses by account</span>
            </div>
            <div class="chart-legend">
              <span class="legend-item income"><span class="legend-dot"></span>Income</span>
              <span class="legend-item expense"><span class="legend-dot"></span>Expenses</span>
            </div>
          </div>
          <div class="chart-container">
            @if (!hasAccountBarData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No account activity for this period' }"></ng-container>
            }
            <div #accountBarChart class="echart-el" [class.hidden]="!hasAccountBarData"></div>
          </div>
        </div>

        <!-- Income vs Expense Comparison -->
        <div class="chart-card wide">
          <div class="chart-header">
            <div>
              <h3>Income vs Expense</h3>
              <span class="chart-subtitle">{{ trendPeriodLabel }}</span>
            </div>
            <div class="chart-legend">
              <span class="legend-item income"><span class="legend-dot"></span>Income</span>
              <span class="legend-item expense"><span class="legend-dot"></span>Expenses</span>
            </div>
          </div>
          <div class="chart-container">
            @if (!hasComparisonData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No transactions in this period' }"></ng-container>
            }
            <div #incomeExpenseComparisonChart class="echart-el" [class.hidden]="!hasComparisonData"></div>
          </div>
        </div>

        <!-- Transaction Type Breakdown -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Transaction Types</h3>
            <span class="chart-subtitle">{{ trendPeriodLabel }}</span>
          </div>
          <div class="chart-container">
            @if (!hasTransactionTypeData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No transactions in this period' }"></ng-container>
            }
            <div #transactionTypeChart class="echart-el" [class.hidden]="!hasTransactionTypeData"></div>
          </div>
        </div>

        <!-- Account Balance Distribution -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Account Balances</h3>
            <span class="chart-subtitle">Current distribution</span>
          </div>
          <div class="chart-container">
            @if (!hasAccountBalanceData) {
              <ng-container *ngTemplateOutlet="chartEmptyState; context: { message: 'No positive account balances' }"></ng-container>
            }
            <div #accountBalanceChart class="echart-el" [class.hidden]="!hasAccountBalanceData"></div>
          </div>
        </div>

        <!-- Budget Utilization -->
        @if (budgetsWithUsage.length > 0) {
          <div class="chart-card full-width">
            <div class="chart-header">
              <h3>Budget Utilization</h3>
              <span class="chart-subtitle">Spent vs limit for active budgets</span>
            </div>
            <div class="chart-container" [style.height.px]="Math.max(220, budgetsWithUsage.length * 44)">
              <div #budgetUtilizationChart class="echart-el"></div>
            </div>
          </div>
        }
      </div>

      <ng-template #chartEmptyState let-message="message">
        <div class="chart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="3 3"/>
            <path d="M8 16v-4M12 16V8M16 16v-6"/>
          </svg>
          <p>{{ message }}</p>
        </div>
      </ng-template>

      <!-- Category Breakdown Table -->
      @if (categoryBreakdown.length > 0) {
        <div class="category-breakdown">
          <h3>Category Breakdown</h3>
          <div class="breakdown-table">
            @for (item of categoryBreakdown; track item.categoryId; let i = $index) {
              <div class="breakdown-row">
                <div class="category-info">
                  <span class="category-icon" [style.background-color]="iconBadgeColor(i)">{{ item.icon }}</span>
                  <span class="category-name">{{ item.name }}</span>
                  <span class="category-type" [class]="item.type">{{ item.type }}</span>
                </div>
                <div class="category-amount">
                  {{ formatCurrency(item.amount) }}
                </div>
                <div class="category-percentage">
                  {{ item.percentage.toFixed(1) }}%
                </div>
                <div class="category-bar">
                  <div class="bar-fill" [style.width.%]="item.percentage" [class]="item.type"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Upcoming Reminders Section -->
      @if (upcomingReminders.length > 0) {
        <div class="upcoming-reminders">
          <h3>Upcoming Reminders</h3>
          <div class="reminders-list">
            @for (reminder of upcomingReminders; track reminder.id) {
              <div class="reminder-item">
                <div class="reminder-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18.5 8.5a6.5 6.5 0 1 0-13 0c0 3.8-1 5.4-2.2 7h17.4c-1.2-1.6-2.2-3.2-2.2-7z"/>
                    <path d="M9.3 18.5a2.7 2.7 0 0 0 5.4 0"/>
                  </svg>
                </div>
                <div class="reminder-content">
                  <div class="reminder-title">{{ reminder.title }}</div>
                  <div class="reminder-date">{{ formatDate(reminder.date) }}</div>
                </div>
                <div class="reminder-status" [class.today]="reminder.daysUntil === 0" [class.overdue]="reminder.daysUntil < 0">
                  {{ getReminderStatus(reminder) }}
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
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
            color: var(--text-primary);
            pointer-events: none;
            background: var(--surface);
            padding: 0 0.25rem;
          }

          .date-input {
            padding: 0.5rem 0.5rem 0.5rem 2.7rem;
            border: 1px solid var(--border-default);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            color: var(--text-primary);
            background: var(--surface);
            width: 170px;
            outline: none;
            transition: border-color 0.2s ease;

            &:focus {
              border-color: var(--color-primary-light);
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
            }

            &::-webkit-calendar-picker-indicator {
              cursor: pointer;
            }
          }
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;

        .stat-card {
          background: var(--surface);
          padding: 1.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          border-top: 3px solid var(--color-info);

          &.income {
            border-top-color: var(--color-accent);
          }

          &.expense {
            border-top-color: var(--color-destructive);
          }

          &.net {
            border-top-color: var(--color-primary);
          }

          .stat-icon {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-info-tint);
            color: var(--color-info);
            border-radius: var(--radius-md);

            svg {
              width: 22px;
              height: 22px;
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

          &.net .stat-icon {
            background: var(--color-primary-tint);
            color: var(--color-primary);
          }

          .stat-content {
            flex: 1;
            min-width: 0;

            .stat-label {
              color: var(--text-muted);
              font-size: 0.8rem;
              font-weight: 500;
              margin-bottom: 0.25rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .stat-value {
              font-family: var(--font-heading);
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--text-primary);
              white-space: nowrap;
              line-height: 1.2;

              &.negative {
                color: var(--color-destructive);
              }
            }
          }
        }
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;

        .chart-card {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: 1.25rem;

          &.wide {
            grid-column: span 2;
          }

          &.full-width {
            grid-column: span 2;
          }

          .chart-header {
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;

            h3 {
              margin: 0 0 0.25rem 0;
              font-family: var(--font-heading);
              font-size: 1.05rem;
              font-weight: 600;
              color: var(--text-primary);
            }

            .chart-subtitle {
              color: var(--text-muted);
              font-size: 0.85rem;
            }

            .chart-legend {
              display: flex;
              align-items: center;
              gap: 1rem;
              flex-shrink: 0;

              .legend-item {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                font-size: 0.8rem;
                font-weight: 500;
                color: var(--text-secondary);

                .legend-dot {
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: var(--color-accent);
                }

                &.expense .legend-dot {
                  background: var(--color-destructive);
                }
              }
            }
          }

          .chart-container {
            position: relative;
            height: 300px;

            .echart-el {
              width: 100%;
              height: 100%;

              &.hidden {
                display: none;
              }
            }

            .chart-empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.75rem;
              width: 100%;
              height: 100%;
              color: var(--text-muted);
              text-align: center;

              svg {
                width: 44px;
                height: 44px;
                color: var(--border-default);
              }

              p {
                margin: 0;
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--text-muted);
              }
            }
          }
        }
      }

      .category-breakdown {
        background: var(--surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1.25rem;
        margin-bottom: 2rem;

        h3 {
          margin: 0 0 1rem 0;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .breakdown-table {
          .breakdown-row {
            display: grid;
            grid-template-columns: 2fr 1fr 80px 1fr;
            gap: 1rem;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border-subtle);

            &:last-child {
              border-bottom: none;
            }

            .category-info {
              display: flex;
              align-items: center;
              gap: 0.75rem;

              .category-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                flex-shrink: 0;
                border-radius: 50%;
                font-size: 1.1rem;
                box-shadow: var(--shadow-sm);
              }

              .category-name {
                font-weight: 500;
                color: var(--text-primary);
              }

              .category-type {
                padding: 0.25rem 0.625rem;
                border-radius: var(--radius-pill);
                font-size: 0.72rem;
                font-weight: 600;
                text-transform: capitalize;

                &.income {
                  background-color: var(--color-accent-tint);
                  color: var(--color-accent);
                }

                &.expense {
                  background-color: var(--color-destructive-tint);
                  color: var(--color-destructive);
                }
              }
            }

            .category-amount {
              font-weight: 600;
              color: var(--text-primary);
              text-align: right;
              font-variant-numeric: tabular-nums;
            }

            .category-percentage {
              color: var(--text-muted);
              text-align: right;
              font-size: 0.85rem;
            }

            .category-bar {
              background-color: var(--surface-sunken);
              border-radius: var(--radius-pill);
              height: 8px;
              overflow: hidden;

              .bar-fill {
                height: 100%;
                border-radius: var(--radius-pill);
                transition: width 0.3s ease;

                &.income {
                  background-color: var(--color-accent);
                }

                &.expense {
                  background-color: var(--color-destructive);
                }
              }
            }
          }
        }
      }

      .upcoming-reminders {
        background: var(--surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1.25rem;

        h3 {
          margin: 0 0 1rem 0;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .reminder-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.875rem;
            background: var(--surface-muted);
            border-radius: var(--radius-md);
            border-left: 3px solid var(--color-primary-light);
            transition: all 0.2s ease;

            &:hover {
              background: var(--surface-sunken);
              transform: translateX(4px);
            }

            .reminder-icon {
              width: 36px;
              height: 36px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: color-mix(in srgb, var(--color-primary-light) 14%, white);
              color: var(--color-primary-light);
              border-radius: var(--radius-md);

              svg {
                width: 18px;
                height: 18px;
              }
            }

            .reminder-content {
              flex: 1;
              min-width: 0;

              .reminder-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .reminder-date {
                font-size: 0.875rem;
                color: var(--text-muted);
              }
            }

            .reminder-status {
              font-size: 0.8rem;
              font-weight: 600;
              padding: 0.375rem 0.75rem;
              border-radius: var(--radius-pill);
              background-color: color-mix(in srgb, var(--color-primary) 12%, white);
              color: var(--color-primary);
              white-space: nowrap;

              &.today {
                background-color: var(--color-warning-tint);
                color: var(--color-warning);
              }

              &.overdue {
                background-color: var(--color-destructive-tint);
                color: var(--color-destructive);
              }
            }
          }
        }
      }
    }

    @media (max-width: 1024px) {
      .dashboard-page {
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;

          .stat-card {
            padding: 1.25rem;

            .stat-content .stat-value {
              font-size: 1.25rem;
            }
          }
        }

        .charts-grid {
          grid-template-columns: 1fr;

          .chart-card {
            &.wide,
            &.full-width {
              grid-column: span 1;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .dashboard-page {
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;

          .stat-card {
            padding: 1rem;
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;

            .stat-icon {
              width: 40px;
              height: 40px;

              svg {
                width: 20px;
                height: 20px;
              }
            }

            .stat-content {
              .stat-label {
                white-space: normal;
                text-overflow: unset;
                overflow: visible;
              }

              .stat-value {
                font-size: 1.125rem;
                white-space: nowrap;
              }
            }
          }
        }

        .breakdown-row {
          grid-template-columns: 1fr !important;
          gap: 0.5rem !important;
          text-align: left !important;

          .category-amount,
          .category-percentage {
            text-align: left !important;
          }
        }

        .upcoming-reminders {
          .reminders-list {
            .reminder-item {
              flex-direction: row;
              gap: 0.75rem;
              padding: 0.75rem;

              .reminder-icon {
                width: 30px;
                height: 30px;

                svg {
                  width: 15px;
                  height: 15px;
                }
              }

              .reminder-status {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
              }
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .dashboard-page {
        .stats-grid {
          grid-template-columns: 1fr;
          gap: 0.5rem;

          .stat-card {
            padding: 0.875rem;

            .stat-icon {
              width: 36px;
              height: 36px;

              svg {
                width: 18px;
                height: 18px;
              }
            }

            .stat-content .stat-value {
              font-size: 1rem;
            }
          }
        }

        .upcoming-reminders {
          .reminders-list {
            .reminder-item {
              flex-wrap: wrap;
              gap: 0.5rem;

              .reminder-content {
                flex: 1 1 100%;

                .reminder-title {
                  white-space: normal;
                }
              }

              .reminder-status {
                margin-left: auto;
              }
            }
          }
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dashboardRoot') dashboardRoot!: ElementRef<HTMLDivElement>;
  @ViewChild('expenseOverviewChart') expenseOverviewChart!: ElementRef<HTMLDivElement>;
  @ViewChild('incomeOverviewChart') incomeOverviewChart!: ElementRef<HTMLDivElement>;
  @ViewChild('incomeFlowChart') incomeFlowChart!: ElementRef<HTMLDivElement>;
  @ViewChild('expenseFlowChart') expenseFlowChart!: ElementRef<HTMLDivElement>;
  @ViewChild('accountBarChart') accountBarChart!: ElementRef<HTMLDivElement>;
  @ViewChild('incomeExpenseComparisonChart') incomeExpenseComparisonChart!: ElementRef<HTMLDivElement>;
  @ViewChild('transactionTypeChart') transactionTypeChart!: ElementRef<HTMLDivElement>;
  @ViewChild('accountBalanceChart') accountBalanceChart!: ElementRef<HTMLDivElement>;
  @ViewChild('budgetUtilizationChart') budgetUtilizationChart!: ElementRef<HTMLDivElement>;

  accounts: Account[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];
  upcomingReminders: UpcomingReminder[] = [];

  stats: DashboardStats = {
    totalAccounts: 0,
    totalCategories: 0,
    totalTransactions: 0,
    totalBalance: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    netIncome: 0
  };

  categoryBreakdown: any[] = [];
  budgetsWithUsage: BudgetWithUsage[] = [];
  Math = Math;
  dateRangeForm!: FormGroup;
  trendPeriodLabel = 'Last 6 months';

  hasExpenseOverviewData = false;
  hasIncomeOverviewData = false;
  hasIncomeFlowData = false;
  hasExpenseFlowData = false;
  hasAccountBarData = false;
  hasComparisonData = false;
  hasTransactionTypeData = false;
  hasAccountBalanceData = false;

  private charts: echarts.ECharts[] = [];
  private subscription = new Subscription();
  private resizeObserver?: ResizeObserver;

  constructor(
    private storageService: StorageService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
  ) {}

  ngOnInit(): void {
    // Load accounts, categories, and reminders from API when dashboard is accessed
    this.storageService.loadAccounts();
    this.storageService.loadCategories();
    this.storageService.loadReminders();

    // Initialize date range form with values from service
    const currentRange = this.dateRangeService.getCurrentDateRange();

    this.dateRangeForm = this.fb.group({
      fromDate: [currentRange.fromDate],
      toDate: [currentRange.toDate]
    });

    // Load transactions and budgets with initial date range
    this.loadTransactionsWithDateRange();
    this.loadBudgetsWithDateRange();

    // Listen to date range changes and update service
    // Debounce to avoid multiple API calls when user is still typing/selecting dates
    this.subscription.add(
      this.dateRangeForm.valueChanges
        .pipe(debounceTime(500))
        .subscribe((value) => {
          this.dateRangeService.updateDateRange(value);
          this.loadTransactionsWithDateRange();
          this.loadBudgetsWithDateRange();
        })
    );

    this.subscription.add(
      combineLatest([
        this.storageService.accounts$,
        this.storageService.categories$,
        this.storageService.transactions$,
        this.storageService.reminders$,
        this.storageService.budgets$
      ]).subscribe(([accounts, categories, transactions, reminders, budgets]) => {
        this.accounts = accounts;
        this.categories = categories;
        this.transactions = transactions;
        this.calculateStats();
        this.calculateCategoryBreakdown();
        this.calculateUpcomingReminders(reminders);
        this.calculateBudgetUsage(budgets);

        // Recreate charts with new data
        setTimeout(() => this.createCharts(), 100);
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.createCharts(), 100);

    // Resize charts whenever the dashboard's layout width changes - this
    // covers both browser window resizes and the sidebar collapse/expand
    // toggle, neither of which fires a native window "resize" event.
    this.resizeObserver = new ResizeObserver(() => {
      this.charts.forEach(chart => chart.resize());
    });
    this.resizeObserver.observe(this.dashboardRoot.nativeElement);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.resizeObserver?.disconnect();
    this.charts.forEach(chart => chart.dispose());
  }

  private calculateStats(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const filteredTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const afterStart = !startDate || transactionDate >= startDate;
      const beforeEnd = !endDate || transactionDate <= endDate;
      return afterStart && beforeEnd;
    });

    this.stats = {
      totalAccounts: this.accounts.length,
      totalCategories: this.categories.length,
      totalTransactions: this.transactions.length,
      totalBalance: this.accounts.reduce((sum, account) => sum + account.currentBalance, 0),
      thisMonthIncome: filteredTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0),
      thisMonthExpenses: filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0),
      netIncome: 0
    };

    this.updateTrendPeriodLabel(startDate, endDate);

    this.stats.netIncome = this.stats.thisMonthIncome - this.stats.thisMonthExpenses;
  }

  private calculateCategoryBreakdown(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const filteredTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const afterStart = !startDate || transactionDate >= startDate;
      const beforeEnd = !endDate || transactionDate <= endDate;
      return afterStart && beforeEnd && t.type !== TransactionType.TRANSFER;
    });

    const categoryTotals = new Map();

    filteredTransactions.forEach(transaction => {
      const category = this.categories.find(c => c.id === transaction.categoryId);
      if (category) {
        const current = categoryTotals.get(category.id) || 0;
        categoryTotals.set(category.id, current + transaction.amount);
      }
    });

    const totalAmount = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);

    this.categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = this.categories.find(c => c.id === categoryId)!;
        return {
          categoryId,
          name: category.name,
          icon: category.icon,
          type: category.type,
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private calculateUpcomingReminders(reminders: Reminder[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter active reminders with future dates and calculate their effective dates
    const upcomingRemindersWithDates = reminders
      .filter(r => r.isActive)
      .map(reminder => {
        const reminderDate = new Date(reminder.date);
        reminderDate.setHours(0, 0, 0, 0);

        // Calculate the start date (beforeDays) and end date (afterDays)
        const startDate = new Date(reminderDate);
        startDate.setDate(startDate.getDate() - reminder.beforeDays);

        const endDate = new Date(reminderDate);
        endDate.setDate(endDate.getDate() + reminder.afterDays);

        return {
          ...reminder,
          reminderDate,
          startDate,
          endDate,
          daysUntil: Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .filter(r => {
        // Show reminders with future dates (today or later)
        return r.reminderDate >= today;
      })
      .sort((a, b) => {
        // Sort by reminder date (closest first)
        return a.reminderDate.getTime() - b.reminderDate.getTime();
      })
      .slice(0, 10); // Take top 10

    this.upcomingReminders = upcomingRemindersWithDates;
  }

  private createCharts(): void {
    this.charts.forEach(chart => chart.dispose());
    this.charts = [];

    this.createExpenseOverviewChart();
    this.createIncomeOverviewChart();
    this.createIncomeFlowChart();
    this.createExpenseFlowChart();
    this.createAccountBarChart();
    this.createIncomeExpenseComparisonChart();
    this.createTransactionTypeChart();
    this.createAccountBalanceChart();
    this.createBudgetUtilizationChart();
  }

  private groupedBarTooltip(): echarts.EChartsOption['tooltip'] {
    return {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#ffffff',
      borderColor: '#e6dfd2',
      borderWidth: 1,
      extraCssText: TOOLTIP_CSS,
      textStyle: { color: '#2b2420', fontFamily: 'Inter', fontSize: 12 },
      formatter: (params: any) => {
        let html = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">` +
            `<span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block;"></span>` +
            `<span>${p.seriesName}: ${this.formatCurrency(p.value)}</span></div>`;
        });
        return html;
      }
    };
  }

  private buildDonutOption(
    categories: { name: string; amount: number }[],
    totalLabel: string,
    colors: string[] = CHART_PALETTE
  ): echarts.EChartsOption {
    return {
      color: colors,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e6dfd2',
        borderWidth: 1,
        extraCssText: TOOLTIP_CSS,
        textStyle: { color: '#2b2420', fontFamily: 'Inter', fontSize: 12 },
        formatter: (params: any) =>
          `<div style="display:flex;align-items:center;gap:6px;font-weight:600;">` +
          `<span style="width:8px;height:8px;border-radius:50%;background:${params.color};display:inline-block;"></span>${params.name}</div>` +
          `<div style="margin-top:4px;color:#6b6259;">${this.formatCurrency(params.value)} (${params.percent}%)</div>`
      },
      legend: {
        bottom: 4,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 18,
        textStyle: { color: '#6b6259', fontFamily: 'Inter', fontSize: 12 }
      },
      title: {
        text: 'Total',
        subtext: totalLabel,
        left: 'center',
        top: '40%',
        itemGap: 6,
        textStyle: { fontSize: 11, fontWeight: 500, color: '#9997b3', fontFamily: 'Inter' },
        subtextStyle: { fontSize: 19, fontWeight: 700, color: '#2b2420', fontFamily: 'Lexend' }
      },
      series: [{
        type: 'pie',
        radius: ['62%', '85%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 3,
          borderRadius: 6
        },
        emphasis: {
          scaleSize: 6,
          itemStyle: { shadowBlur: 16, shadowColor: 'rgba(76, 64, 149, 0.25)' }
        },
        data: categories.map(c => ({ name: c.name, value: c.amount }))
      }]
    };
  }

  private buildLineOption(labels: string[], data: number[], color: string): echarts.EChartsOption {
    return {
      color: [color],
      grid: { left: 46, right: 12, top: 24, bottom: 30, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e6dfd2',
        borderWidth: 1,
        extraCssText: TOOLTIP_CSS,
        textStyle: { color: '#2b2420', fontFamily: 'Inter', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:600;margin-bottom:2px;">${p.axisValue}</div>` +
            `<div style="color:${color};font-weight:600;">${this.formatCurrency(p.value)}</div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLine: AXIS_LINE_STYLE,
        axisTick: { show: false },
        axisLabel: AXIS_LABEL_STYLE
      },
      yAxis: {
        type: 'value',
        splitLine: SPLIT_LINE_STYLE,
        axisLabel: { ...AXIS_LABEL_STYLE, formatter: (v: number) => this.formatCompactCurrency(v) }
      },
      series: [{
        type: 'line',
        data,
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        itemStyle: { color, borderColor: '#ffffff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}66` },
            { offset: 0.65, color: `${color}1f` },
            { offset: 1, color: `${color}03` }
          ])
        }
      }]
    };
  }

  private createExpenseOverviewChart(): void {
    const expenseCategories = this.categoryBreakdown.filter(c => c.type === CategoryType.EXPENSE);
    this.hasExpenseOverviewData = expenseCategories.length > 0;
    if (!this.hasExpenseOverviewData) return;

    const chart = echarts.init(this.expenseOverviewChart.nativeElement);
    chart.setOption(this.buildDonutOption(expenseCategories, this.formatCompactCurrency(this.stats.thisMonthExpenses)));
    this.charts.push(chart);
  }

  private createIncomeOverviewChart(): void {
    const incomeCategories = this.categoryBreakdown.filter(c => c.type === CategoryType.INCOME);
    this.hasIncomeOverviewData = incomeCategories.length > 0;
    if (!this.hasIncomeOverviewData) return;

    const chart = echarts.init(this.incomeOverviewChart.nativeElement);
    chart.setOption(this.buildDonutOption(incomeCategories, this.formatCompactCurrency(this.stats.thisMonthIncome)));
    this.charts.push(chart);
  }

  private createIncomeFlowChart(): void {
    const monthlyIncome = this.getMonthlyData(TransactionType.INCOME);
    this.hasIncomeFlowData = monthlyIncome.data.some(v => v > 0);
    if (!this.hasIncomeFlowData) return;

    const chart = echarts.init(this.incomeFlowChart.nativeElement);
    chart.setOption(this.buildLineOption(monthlyIncome.labels, monthlyIncome.data, '#4b7b4e'));
    this.charts.push(chart);
  }

  private createExpenseFlowChart(): void {
    const monthlyExpenses = this.getMonthlyData(TransactionType.EXPENSE);
    this.hasExpenseFlowData = monthlyExpenses.data.some(v => v > 0);
    if (!this.hasExpenseFlowData) return;

    const chart = echarts.init(this.expenseFlowChart.nativeElement);
    chart.setOption(this.buildLineOption(monthlyExpenses.labels, monthlyExpenses.data, '#c1462e'));
    this.charts.push(chart);
  }

  private createAccountBarChart(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const accountData = this.accounts.map(account => {
      const income = this.transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const afterStart = !startDate || transactionDate >= startDate;
          const beforeEnd = !endDate || transactionDate <= endDate;
          return t.type === TransactionType.INCOME && t.accountId === account.id && afterStart && beforeEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = this.transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const afterStart = !startDate || transactionDate >= startDate;
          const beforeEnd = !endDate || transactionDate <= endDate;
          return t.type === TransactionType.EXPENSE && t.accountId === account.id && afterStart && beforeEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { name: account.name, income, expenses };
    });

    this.hasAccountBarData = accountData.some(a => a.income > 0 || a.expenses > 0);
    if (!this.hasAccountBarData) return;

    const chart = echarts.init(this.accountBarChart.nativeElement);
    chart.setOption({
      color: ['#4b7b4e', '#c1462e'],
      grid: { left: 46, right: 12, top: 16, bottom: 30, containLabel: false },
      tooltip: this.groupedBarTooltip(),
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: accountData.map(a => a.name),
        axisLine: AXIS_LINE_STYLE,
        axisTick: { show: false },
        axisLabel: AXIS_LABEL_STYLE
      },
      yAxis: {
        type: 'value',
        splitLine: SPLIT_LINE_STYLE,
        axisLabel: { ...AXIS_LABEL_STYLE, formatter: (v: number) => this.formatCompactCurrency(v) }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: accountData.map(a => a.income),
          barMaxWidth: 22,
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: accountData.map(a => a.expenses),
          barMaxWidth: 22,
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        }
      ]
    });
    this.charts.push(chart);
  }

  private createIncomeExpenseComparisonChart(): void {
    const income = this.getMonthlyData(TransactionType.INCOME);
    const expense = this.getMonthlyData(TransactionType.EXPENSE);

    this.hasComparisonData = income.data.some(v => v > 0) || expense.data.some(v => v > 0);
    if (!this.hasComparisonData) return;

    const chart = echarts.init(this.incomeExpenseComparisonChart.nativeElement);
    chart.setOption({
      color: ['#4b7b4e', '#c1462e'],
      grid: { left: 46, right: 12, top: 16, bottom: 30, containLabel: false },
      tooltip: this.groupedBarTooltip(),
      legend: { show: false },
      xAxis: {
        type: 'category',
        data: income.labels,
        axisLine: AXIS_LINE_STYLE,
        axisTick: { show: false },
        axisLabel: AXIS_LABEL_STYLE
      },
      yAxis: {
        type: 'value',
        splitLine: SPLIT_LINE_STYLE,
        axisLabel: { ...AXIS_LABEL_STYLE, formatter: (v: number) => this.formatCompactCurrency(v) }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: income.data,
          barMaxWidth: 22,
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: expense.data,
          barMaxWidth: 22,
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        }
      ]
    });
    this.charts.push(chart);
  }

  private createTransactionTypeChart(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const afterStart = !startDate || transactionDate >= startDate;
      const beforeEnd = !endDate || transactionDate <= endDate;
      return afterStart && beforeEnd;
    });

    const totals = { Income: 0, Expense: 0, Transfer: 0 };
    filtered.forEach(t => {
      if (t.type === TransactionType.INCOME) totals.Income += t.amount;
      else if (t.type === TransactionType.EXPENSE) totals.Expense += t.amount;
      else if (t.type === TransactionType.TRANSFER) totals.Transfer += t.amount;
    });

    const colorMap: Record<string, string> = { Income: '#4b7b4e', Expense: '#c1462e', Transfer: '#c1622d' };
    const entries = Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount }));

    this.hasTransactionTypeData = entries.length > 0;
    if (!this.hasTransactionTypeData) return;

    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    const colors = entries.map(e => colorMap[e.name]);

    const chart = echarts.init(this.transactionTypeChart.nativeElement);
    chart.setOption(this.buildDonutOption(entries, this.formatCompactCurrency(total), colors));
    this.charts.push(chart);
  }

  private createAccountBalanceChart(): void {
    const positiveAccounts = this.accounts.filter(a => a.currentBalance > 0);
    this.hasAccountBalanceData = positiveAccounts.length > 0;
    if (!this.hasAccountBalanceData) return;

    const data = positiveAccounts.map(a => ({ name: a.name, amount: a.currentBalance }));
    const total = positiveAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

    const chart = echarts.init(this.accountBalanceChart.nativeElement);
    chart.setOption(this.buildDonutOption(data, this.formatCompactCurrency(total)));
    this.charts.push(chart);
  }

  private createBudgetUtilizationChart(): void {
    if (this.budgetsWithUsage.length === 0) return;

    const top = this.budgetsWithUsage.slice(0, 8);
    const colors = top.map(b => {
      if (b.percentageUsed >= 100) return '#c1462e';
      if (b.percentageUsed >= 80) return '#c58a2e';
      return '#4b7b4e';
    });

    const chart = echarts.init(this.budgetUtilizationChart.nativeElement);
    chart.setOption({
      grid: { left: 110, right: 60, top: 10, bottom: 10, containLabel: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e6dfd2',
        borderWidth: 1,
        extraCssText: TOOLTIP_CSS,
        textStyle: { color: '#2b2420', fontFamily: 'Inter', fontSize: 12 },
        formatter: (params: any) => {
          const budget = top[params[0].dataIndex];
          return `<div style="font-weight:600;margin-bottom:4px;">${budget.name}</div>` +
            `<div>Spent: ${this.formatCurrency(budget.spent)}</div>` +
            `<div>Limit: ${this.formatCurrency(budget.amount)}</div>` +
            `<div style="color:${budget.percentageUsed >= 100 ? '#c1462e' : '#6b6259'};margin-top:2px;">${budget.percentageUsed.toFixed(0)}% used</div>`;
        }
      },
      xAxis: {
        type: 'value',
        splitLine: SPLIT_LINE_STYLE,
        axisLabel: { ...AXIS_LABEL_STYLE, formatter: (v: number) => this.formatCompactCurrency(v) }
      },
      yAxis: {
        type: 'category',
        data: top.map(b => b.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6b6259', fontFamily: 'Inter', fontSize: 12 }
      },
      series: [
        {
          name: 'Limit',
          type: 'bar',
          data: top.map(b => b.amount),
          barWidth: 14,
          itemStyle: { color: '#e6dfd2', borderRadius: 7 },
          silent: true,
          z: 1
        },
        {
          name: 'Spent',
          type: 'bar',
          data: top.map((b, i) => ({ value: b.spent, itemStyle: { color: colors[i], borderRadius: 7 } })),
          barWidth: 14,
          barGap: '-100%',
          z: 2
        }
      ]
    });
    this.charts.push(chart);
  }

  private updateTrendPeriodLabel(startDate: Date | null, endDate: Date | null): void {
    if (!startDate || !endDate) {
      this.trendPeriodLabel = 'Last 6 months';
      return;
    }

    const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    this.trendPeriodLabel = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  }

  private getMonthlyData(type: TransactionType): { labels: string[]; data: number[] } {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Plot the months covered by the selected date range; fall back to the
    // trailing 6 months (ending this month) when no range is selected.
    const now = new Date();
    const rangeStart = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const rangeEnd = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const months: string[] = [];
    const data: number[] = [];

    const cursor = new Date(rangeStart);
    let guard = 0;
    while (cursor <= rangeEnd && guard < 36) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthlyTotal = this.transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const afterStart = !startDate || transactionDate >= startDate;
          const beforeEnd = !endDate || transactionDate <= endDate;
          return t.type === type &&
                 transactionDate >= monthStart &&
                 transactionDate <= monthEnd &&
                 afterStart && beforeEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      months.push(monthName);
      data.push(monthlyTotal);

      cursor.setMonth(cursor.getMonth() + 1);
      guard++;
    }

    return { labels: months, data };
  }

  iconBadgeColor(index: number): string {
    return getIconBadgeColor(index);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  }

  formatCompactCurrency(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1e9) {
      return `${sign}₹${(absValue / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}₹${(absValue / 1e6).toFixed(1)}M`;
    } else if (absValue >= 1e3) {
      return `${sign}₹${(absValue / 1e3).toFixed(1)}K`;
    } else {
      return `${sign}₹${absValue.toFixed(0)}`;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getReminderStatus(reminder: UpcomingReminder): string {
    if (reminder.daysUntil === 0) {
      return 'Today';
    } else if (reminder.daysUntil === 1) {
      return 'Tomorrow';
    } else if (reminder.daysUntil === -1) {
      return 'Yesterday';
    } else if (reminder.daysUntil > 0) {
      return `In ${reminder.daysUntil} days`;
    } else {
      return `${Math.abs(reminder.daysUntil)} days ago`;
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Load transactions from API with current date range filter
   */
  private loadTransactionsWithDateRange(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;

    // Use timezone-safe string concatenation for date parameters
    const request = {
      fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
      toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined
    };

    this.storageService.loadTransactions(request);
  }

  private loadBudgetsWithDateRange(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    if (!fromDate || !toDate) return;

    this.storageService.loadBudgets({
      fromDate: `${fromDate}T00:00:00.000Z`,
      toDate: `${toDate}T23:59:59.999Z`
    });
  }

  /**
   * Mirrors the Budget page's usage calculation: each budget's spend is
   * computed against its own startDate/endDate, not the dashboard's filter.
   */
  private calculateBudgetUsage(budgets: Budget[]): void {
    this.budgetsWithUsage = budgets
      .filter(b => b.isActive)
      .map(budget => {
        const budgetStartDate = new Date(budget.startDate);
        const budgetEndDate = new Date(budget.endDate);
        budgetEndDate.setHours(23, 59, 59, 999);

        const spent = this.transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return (
              t.categoryId != null &&
              budget.categories.includes(t.categoryId) &&
              t.type === TransactionType.EXPENSE &&
              transactionDate >= budgetStartDate &&
              transactionDate <= budgetEndDate
            );
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return { ...budget, spent, remaining, percentageUsed };
      })
      .sort((a, b) => b.percentageUsed - a.percentageUsed);
  }
}