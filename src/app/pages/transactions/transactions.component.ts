import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Transaction, TransactionType, Account, Category } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { TransactionDialogComponent } from '../../shared/dialogs/transaction-dialog/transaction-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

interface EnrichedTransaction extends Transaction {
  accountName?: string;
  categoryName?: string;
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
      </app-page-header>

      <div class="transactions-stats">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">{{ transactions.length }}</div>
          </div>
        </div>
        <div class="stat-card income">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Total Income</div>
            <div class="stat-value">{{ formatCompactCurrency(totalIncome) }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">💸</div>
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

      .transactions-stats {
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

      .transaction-filters {
        margin-bottom: 1.5rem;

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

          .tab-button {
            padding: 0.625rem 1.25rem;
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
    }

    @media (max-width: 768px) {
      .transactions-page {
        .transaction-filters {
          margin-bottom: 1.5rem;

          .filter-tabs {
            gap: 0.25rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 0.5rem;

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

  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
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
    { key: 'categoryName', label: 'Category', type: 'text' },
    { key: 'toAccountName', label: 'To Account', type: 'text' },
    { key: 'narration', label: 'Narration', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
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

    // Listen to date range changes and update service
    // Debounce to avoid multiple filter operations when user is still typing/selecting dates
    this.subscription.add(
      this.dateRangeForm.valueChanges
        .pipe(debounceTime(500))
        .subscribe((value) => {
          this.dateRangeService.updateDateRange(value);
          this.filterTransactions();
        })
    );

    // Listen to date range changes from other pages
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.filterTransactions();
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
        this.filterTransactions();
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
        // Transaction was successfully created
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
        // Transaction was successfully updated
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.storageService.deleteTransaction(transaction.id);
    }
  }

  private filterTransactions(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const afterStart = !startDate || transactionDate >= startDate;
      const beforeEnd = !endDate || transactionDate <= endDate;
      return afterStart && beforeEnd;
    });

    this.enrichTransactions(filtered);
    this.updateTransactionGroups();
    this.calculateTotals();
    this.updateFilteredTransactions();
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}