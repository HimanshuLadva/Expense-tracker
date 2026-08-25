import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { PdfExportService, PdfExportTransaction } from '../../services/pdf-export.service';
import { Transaction, TransactionType, Account, Category } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { TransactionDialogComponent } from '../../shared/dialogs/transaction-dialog/transaction-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

interface EnrichedTransaction extends Transaction {
  accountName?: string;
  categoryName?: string;
  categoryIcon?: string;
  toAccountName?: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="transactions-page">
      <app-page-header
        title="Transactions"
        subtitle="Track all your income, expenses, and transfers"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Transaction"
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
        <button
          type="button"
          class="export-pdf-button"
          [disabled]="isExporting"
          (click)="exportToPdf()"
        >
          @if (isExporting) {
            <span class="spinner"></span>
            <span>Exporting...</span>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M4 19h16"/>
            </svg>
            <span>Export PDF</span>
          }
        </button>
      </app-page-header>

      <div class="transactions-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2.5" y="5.5" width="19" height="13.5" rx="2.2"/>
              <path d="M2.5 10h19"/>
              <path d="M6.5 14.7h4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">{{ transactions.length }}</div>
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
            <div class="stat-label">Total Income</div>
            <div class="stat-value">{{ formatCompactCurrency(totalIncome) }}</div>
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
            <div class="stat-label">Total Expenses</div>
            <div class="stat-value">{{ formatCompactCurrency(totalExpenses) }}</div>
          </div>
        </div>
      </div>

      <div class="transaction-filters">
        <div class="filter-tabs">
          <button
            class="tab-button"
            [class.active]="activeTab === 'all'"
            (click)="setActiveTab('all')"
          >
            All ({{ transactions.length }})
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'income'"
            (click)="setActiveTab('income')"
          >
            Income ({{ incomeTransactions.length }})
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'expense'"
            (click)="setActiveTab('expense')"
          >
            Expense ({{ expenseTransactions.length }})
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'transfer'"
            (click)="setActiveTab('transfer')"
          >
            Transfer ({{ transferTransactions.length }})
          </button>
        </div>
      </div>

      <app-data-table
        [data]="filteredTransactions"
        [columns]="tableColumns"
        [showActions]="true"
        [enableVirtualization]="filteredTransactions.length > 100"
        [itemHeight]="60"
        [pageSize]="50"
        emptyTitle="No Transactions Found"
        emptyMessage="Start by creating your first transaction to track your finances."
        (edit)="editTransaction($event)"
        (delete)="deleteTransaction($event)"
      />
    </div>
  `,
  styles: [`
    .transactions-page {
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
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
            }

            &::-webkit-calendar-picker-indicator {
              cursor: pointer;
            }
          }
        }
      }

      .export-pdf-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        background: var(--surface);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;

        svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        &:hover:not(:disabled) {
          background: var(--surface-sunken);
          color: var(--text-primary);
          border-color: var(--color-primary-light);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &:focus-visible {
          outline: 2px solid var(--color-primary-light);
          outline-offset: 2px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--surface-sunken);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: transactions-export-spin 1s linear infinite;
          flex-shrink: 0;
        }
      }

      @keyframes transactions-export-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .transactions-stats {
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

      .transaction-filters {
        margin-bottom: 1.5rem;

        .filter-tabs {
          display: flex;
          gap: 0.25rem;
          background: var(--surface-sunken);
          padding: 0.35rem;
          border-radius: var(--radius-md);
          width: fit-content;

          .tab-button {
            padding: 0.6rem 1.15rem;
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
    }

    @media (max-width: 768px) {
      .transactions-page {
        .export-pdf-button {
          width: 100%;
          justify-content: center;
        }

        .transaction-filters {
          margin-bottom: 1.5rem;

          .filter-tabs {
            gap: 0.25rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 0.35rem;
            width: 100%;

            .tab-button {
              flex: 1;
              min-width: 80px;
              padding: 0.625rem 0.5rem;
              font-size: 0.75rem;
              text-align: center;
              white-space: nowrap;
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .transactions-page {
        .transaction-filters {
          .filter-tabs {
            gap: 0.125rem;
            padding: 0.375rem;

            .tab-button {
              min-width: 70px;
              padding: 0.5rem 0.25rem;
              font-size: 0.7rem;
            }
          }
        }
      }
    }
  `]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  allTransactions: Transaction[] = [];
  transactions: EnrichedTransaction[] = [];
  incomeTransactions: EnrichedTransaction[] = [];
  expenseTransactions: EnrichedTransaction[] = [];
  transferTransactions: EnrichedTransaction[] = [];
  filteredTransactions: EnrichedTransaction[] = [];
  activeTab: 'all' | 'income' | 'expense' | 'transfer' = 'all';

  accounts: Account[] = [];
  categories: Category[] = [];

  totalIncome = 0;
  totalExpenses = 0;
  dateRangeForm!: FormGroup;
  isExporting = false;

  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    {
      key: 'categoryName',
      label: 'Category',
      type: 'icon-text',
      iconKey: 'categoryIcon',
      colorSeedKey: 'categoryId'
    },
    {
      key: 'type',
      label: 'Type',
      type: 'badge',
      badgeColors: {
        'income': '#10b981',
        'expense': '#ef4444',
        'transfer': '#3b82f6'
      }
    },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'accountName', label: 'Account', type: 'text' },
    { key: 'toAccountName', label: 'To Account', type: 'text' },
    { key: 'narration', label: 'Narration', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    // Load accounts and categories from API when transactions page is accessed
    this.storageService.loadAccounts();
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
    // Debounce to avoid multiple API calls when user is still typing/selecting dates
    this.subscription.add(
      this.dateRangeForm.valueChanges
        .pipe(debounceTime(500))
        .subscribe((value) => {
          this.dateRangeService.updateDateRange(value);
          this.loadTransactionsWithDateRange();
        })
    );

    // Listen to date range changes from other pages
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.loadTransactionsWithDateRange();
      })
    );

    this.subscription.add(
      combineLatest([
        this.storageService.transactions$,
        this.storageService.accounts$,
        this.storageService.categories$
      ]).subscribe(([transactions, accounts, categories]) => {
        this.accounts = accounts;
        this.categories = categories;
        this.allTransactions = transactions;
        this.enrichTransactions(this.allTransactions);
        this.updateTransactionGroups();
        this.calculateTotals();
        this.updateFilteredTransactions();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private enrichTransactions(transactions: Transaction[]): void {
    this.transactions = transactions.map(transaction => {
      const account = this.accounts.find(a => a.id === transaction.accountId);
      const category = this.categories.find(c => c.id === transaction.categoryId);
      const toAccount = transaction.toAccountId ?
        this.accounts.find(a => a.id === transaction.toAccountId) : undefined;

      return {
        ...transaction,
        accountName: account?.name || 'Unknown Account',
        categoryName: transaction.type === TransactionType.TRANSFER ? 'Transfer' : (category?.name || 'Unknown Category'),
        categoryIcon: transaction.type === TransactionType.TRANSFER ? '🔄' : (category?.icon || '❓'),
        toAccountName: toAccount?.name || ''
      };
    });
  }

  private updateTransactionGroups(): void {
    this.incomeTransactions = this.transactions.filter(t => t.type === TransactionType.INCOME);
    this.expenseTransactions = this.transactions.filter(t => t.type === TransactionType.EXPENSE);
    this.transferTransactions = this.transactions.filter(t => t.type === TransactionType.TRANSFER);
  }

  private calculateTotals(): void {
    this.totalIncome = this.incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    this.totalExpenses = this.expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  setActiveTab(tab: 'all' | 'income' | 'expense' | 'transfer'): void {
    this.activeTab = tab;
    this.updateFilteredTransactions();
  }

  private updateFilteredTransactions(): void {
    switch (this.activeTab) {
      case 'income':
        this.filteredTransactions = this.incomeTransactions;
        break;
      case 'expense':
        this.filteredTransactions = this.expenseTransactions;
        break;
      case 'transfer':
        this.filteredTransactions = this.transferTransactions;
        break;
      default:
        this.filteredTransactions = this.transactions;
    }
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

  openAddDialog(): void {
    const dialogRef = this.dialogService.open(TransactionDialogComponent, {
      title: 'Add Transaction',
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Reload transactions from API to get the latest data
        this.loadTransactionsWithDateRange();
      }
    });
  }

  editTransaction(transaction: Transaction): void {
    const dialogRef = this.dialogService.open(TransactionDialogComponent, {
      title: 'Edit Transaction',
      width: '650px',
      maxHeight: '85vh',
      data: { transactionId: transaction.id }
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Reload transactions from API to get the latest data
        this.loadTransactionsWithDateRange();
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.storageService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.loadTransactionsWithDateRange();
        },
        error: (error) => {
          console.error('Failed to delete transaction:', error);
          alert('Failed to delete transaction. Please try again.');
        }
      });
    }
  }

  async exportToPdf(): Promise<void> {
    if (this.filteredTransactions.length === 0) {
      alert('There are no transactions to export for the current filter and date range.');
      return;
    }

    this.isExporting = true;
    try {
      const { fromDate, toDate } = this.dateRangeForm.value;
      const rows: PdfExportTransaction[] = this.filteredTransactions.map(t => ({
        date: t.date,
        categoryName: t.categoryName,
        type: t.type,
        accountName: t.accountName,
        toAccountName: t.toAccountName,
        narration: t.narration,
        amount: t.amount
      }));

      await this.pdfExportService.exportTransactions(rows, {
        fromDate: fromDate || '',
        toDate: toDate || '',
        filterLabel: this.getActiveTabLabel(),
        totalIncome: this.totalIncome,
        totalExpenses: this.totalExpenses,
        transactionCount: this.filteredTransactions.length
      });
    } catch (error) {
      console.error('Failed to export transactions to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      this.isExporting = false;
    }
  }

  private getActiveTabLabel(): string {
    const labels: Record<'all' | 'income' | 'expense' | 'transfer', string> = {
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      transfer: 'Transfer'
    };
    return labels[this.activeTab];
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

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}