import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Transaction, TransactionType, Account, Category, CategoryType, Reminder } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: any[];
}

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
    <div class="dashboard-page">
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
          <div class="stat-icon">🏦</div>
          <div class="stat-content">
            <div class="stat-label">Total Balance</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.totalBalance) }}</div>
          </div>
        </div>
        <div class="stat-card income">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">This Month Income</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.thisMonthIncome) }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">💸</div>
          <div class="stat-content">
            <div class="stat-label">This Month Expenses</div>
            <div class="stat-value">{{ formatCompactCurrency(stats.thisMonthExpenses) }}</div>
          </div>
        </div>
        <div class="stat-card net">
          <div class="stat-icon">📊</div>
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
            <canvas #expenseOverviewChart></canvas>
          </div>
        </div>

        <!-- Income Overview Doughnut -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Income Overview</h3>
            <span class="chart-subtitle">Current month breakdown</span>
          </div>
          <div class="chart-container">
            <canvas #incomeOverviewChart></canvas>
          </div>
        </div>

        <!-- Income Flow Line Chart -->
        <div class="chart-card wide">
          <div class="chart-header">
            <h3>Income Trend</h3>
            <span class="chart-subtitle">Last 6 months</span>
          </div>
          <div class="chart-container">
            <canvas #incomeFlowChart></canvas>
          </div>
        </div>

        <!-- Expense Flow Line Chart -->
        <div class="chart-card wide">
          <div class="chart-header">
            <h3>Expense Trend</h3>
            <span class="chart-subtitle">Last 6 months</span>
          </div>
          <div class="chart-container">
            <canvas #expenseFlowChart></canvas>
          </div>
        </div>

        <!-- Account-wise Bar Chart -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>Account-wise Activity</h3>
            <span class="chart-subtitle">Income vs Expenses by account</span>
          </div>
          <div class="chart-container">
            <canvas #accountBarChart></canvas>
          </div>
        </div>
      </div>

      <!-- Category Breakdown Table -->
      @if (categoryBreakdown.length > 0) {
        <div class="category-breakdown">
          <h3>Category Breakdown</h3>
          <div class="breakdown-table">
            @for (item of categoryBreakdown; track item.categoryId) {
              <div class="breakdown-row">
                <div class="category-info">
                  <span class="category-icon">{{ item.icon }}</span>
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
                <div class="reminder-icon">🔔</div>
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;

        .stat-card {
          background: white;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: transform 0.2s ease;

          &:hover {
            transform: translateY(-2px);
          }

          &.income {
            border-left: 4px solid #10b981;
          }

          &.expense {
            border-left: 4px solid #ef4444;
          }

          &.net {
            border-left: 4px solid #3b82f6;
          }

          .stat-icon {
            font-size: 2rem;
            background: #f3f4f6;
            padding: 0.75rem;
            border-radius: 0.5rem;
          }

          .stat-content {
            flex: 1;
            min-width: 0;

            .stat-label {
              color: #6b7280;
              font-size: 0.875rem;
              margin-bottom: 0.25rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .stat-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: #111827;
              white-space: nowrap;
              line-height: 1.2;

              &.negative {
                color: #ef4444;
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
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          padding: 1rem;

          &.wide {
            grid-column: span 2;
          }

          &.full-width {
            grid-column: span 2;
          }

          .chart-header {
            margin-bottom: 1rem;

            h3 {
              margin: 0 0 0.25rem 0;
              font-size: 1.125rem;
              font-weight: 600;
              color: #111827;
            }

            .chart-subtitle {
              color: #6b7280;
              font-size: 0.875rem;
            }
          }

          .chart-container {
            position: relative;
            height: 300px;

            canvas {
              max-height: 100%;
            }
          }
        }
      }

      .category-breakdown {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        padding: 1rem;
        margin-bottom: 2rem;

        h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .breakdown-table {
          .breakdown-row {
            display: grid;
            grid-template-columns: 2fr 1fr 80px 1fr;
            gap: 1rem;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f3f4f6;

            &:last-child {
              border-bottom: none;
            }

            .category-info {
              display: flex;
              align-items: center;
              gap: 0.75rem;

              .category-icon {
                font-size: 1.25rem;
              }

              .category-name {
                font-weight: 500;
                color: #111827;
              }

              .category-type {
                padding: 0.25rem 0.5rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: capitalize;

                &.income {
                  background-color: #d1fae5;
                  color: #065f46;
                }

                &.expense {
                  background-color: #fee2e2;
                  color: #991b1b;
                }
              }
            }

            .category-amount {
              font-weight: 600;
              color: #111827;
              text-align: right;
            }

            .category-percentage {
              color: #6b7280;
              text-align: right;
            }

            .category-bar {
              background-color: #f3f4f6;
              border-radius: 9999px;
              height: 8px;
              overflow: hidden;

              .bar-fill {
                height: 100%;
                border-radius: 9999px;
                transition: width 0.3s ease;

                &.income {
                  background-color: #10b981;
                }

                &.expense {
                  background-color: #ef4444;
                }
              }
            }
          }
        }
      }

      .upcoming-reminders {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        padding: 1rem;

        h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
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
            background: #f9fafb;
            border-radius: 0.5rem;
            border-left: 3px solid #3b82f6;
            transition: all 0.2s ease;

            &:hover {
              background: #f3f4f6;
              transform: translateX(4px);
            }

            .reminder-icon {
              font-size: 1.5rem;
              flex-shrink: 0;
            }

            .reminder-content {
              flex: 1;
              min-width: 0;

              .reminder-title {
                font-weight: 600;
                color: #111827;
                margin-bottom: 0.25rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .reminder-date {
                font-size: 0.875rem;
                color: #6b7280;
              }
            }

            .reminder-status {
              font-size: 0.875rem;
              font-weight: 600;
              padding: 0.375rem 0.75rem;
              border-radius: 9999px;
              background-color: #e0e7ff;
              color: #3730a3;
              white-space: nowrap;

              &.today {
                background-color: #fef3c7;
                color: #92400e;
              }

              &.overdue {
                background-color: #fee2e2;
                color: #991b1b;
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
              font-size: 2rem;
              padding: 0.75rem;
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
                font-size: 1.25rem;
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
              font-size: 1.75rem;
              padding: 0.625rem;
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
  @ViewChild('expenseOverviewChart') expenseOverviewChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeOverviewChart') incomeOverviewChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeFlowChart') incomeFlowChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expenseFlowChart') expenseFlowChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accountBarChart') accountBarChart!: ElementRef<HTMLCanvasElement>;

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
  dateRangeForm!: FormGroup;

  private charts: Chart[] = [];
  private subscription = new Subscription();

  constructor(
    private storageService: StorageService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
  ) {}

  ngOnInit(): void {
    // Load accounts and categories from API when dashboard is accessed
    this.storageService.loadAccounts();
    this.storageService.loadCategories();
    this.storageService.loadReminders();

    // Initialize date range form with values from service
    const currentRange = this.dateRangeService.getCurrentDateRange();

    this.dateRangeForm = this.fb.group({
      fromDate: [currentRange.fromDate],
      toDate: [currentRange.toDate]
    });

    // Listen to date range changes and update service
    this.subscription.add(
      this.dateRangeForm.valueChanges.subscribe((value) => {
        this.dateRangeService.updateDateRange(value);
        this.calculateStats();
        this.calculateCategoryBreakdown();
        setTimeout(() => this.createCharts(), 100);
      })
    );

    this.subscription.add(
      combineLatest([
        this.storageService.accounts$,
        this.storageService.categories$,
        this.storageService.transactions$,
        this.storageService.reminders$
      ]).subscribe(([accounts, categories, transactions, reminders]) => {
        this.accounts = accounts;
        this.categories = categories;
        this.transactions = transactions;
        this.calculateStats();
        this.calculateCategoryBreakdown();
        this.calculateUpcomingReminders(reminders);

        // Recreate charts with new data
        setTimeout(() => this.createCharts(), 100);
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.createCharts(), 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.charts.forEach(chart => chart.destroy());
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
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    this.createExpenseOverviewChart();
    this.createIncomeOverviewChart();
    this.createIncomeFlowChart();
    this.createExpenseFlowChart();
    this.createAccountBarChart();
  }

  private createExpenseOverviewChart(): void {
    const expenseCategories = this.categoryBreakdown.filter(c => c.type === CategoryType.EXPENSE);

    if (expenseCategories.length === 0) return;

    const ctx = this.expenseOverviewChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: expenseCategories.map(c => c.name),
        datasets: [{
          data: expenseCategories.map(c => c.amount),
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private createIncomeOverviewChart(): void {
    const incomeCategories = this.categoryBreakdown.filter(c => c.type === CategoryType.INCOME);

    if (incomeCategories.length === 0) return;

    const ctx = this.incomeOverviewChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: incomeCategories.map(c => c.name),
        datasets: [{
          data: incomeCategories.map(c => c.amount),
          backgroundColor: [
            '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
            '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private createIncomeFlowChart(): void {
    const monthlyIncome = this.getMonthlyData(TransactionType.INCOME);

    const ctx = this.incomeFlowChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyIncome.labels,
        datasets: [{
          label: 'Income',
          data: monthlyIncome.data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private createExpenseFlowChart(): void {
    const monthlyExpenses = this.getMonthlyData(TransactionType.EXPENSE);

    const ctx = this.expenseFlowChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyExpenses.labels,
        datasets: [{
          label: 'Expenses',
          data: monthlyExpenses.data,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            }
          }
        }
      }
    });

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

    const ctx = this.accountBarChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: accountData.map(a => a.name),
        datasets: [
          {
            label: 'Income',
            data: accountData.map(a => a.income),
            backgroundColor: '#10b981'
          },
          {
            label: 'Expenses',
            data: accountData.map(a => a.expenses),
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private getMonthlyData(type: TransactionType): { labels: string[]; data: number[] } {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const months = [];
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthlyTotal = this.transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          const afterStart = !startDate || transactionDate >= startDate;
          const beforeEnd = !endDate || transactionDate <= endDate;
          return t.type === type &&
                 transactionDate.getMonth() === date.getMonth() &&
                 transactionDate.getFullYear() === date.getFullYear() &&
                 afterStart && beforeEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      months.push(monthName);
      data.push(monthlyTotal);
    }

    return { labels: months, data };
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
}