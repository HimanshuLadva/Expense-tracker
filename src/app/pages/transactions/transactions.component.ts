import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';

import { StorageService } from '../../services/storage.service';
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
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="transactions-page">
      <app-page-header
        title="Transactions"
        subtitle="Track all your income, expenses, and transfers"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Transaction"
      />

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
            <div class="stat-value">{{ formatCurrency(totalIncome) }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">💸</div>
          <div class="stat-content">
            <div class="stat-label">Total Expenses</div>
            <div class="stat-value">{{ formatCurrency(totalExpenses) }}</div>
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
        emptyTitle="No Transactions Found"
        emptyMessage="Start by creating your first transaction to track your finances."
        (edit)="editTransaction($event)"
        (delete)="deleteTransaction($event)"
      />
    </div>
  `,
  styles: [`
    .transactions-page {
      .transactions-stats {
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

          &.income {
            border-left: 4px solid #10b981;
          }

          &.expense {
            border-left: 4px solid #ef4444;
          }

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
    }

    @media (max-width: 768px) {
      .transactions-page {
        .filter-tabs {
          gap: 0.375rem;

          .tab-button {
            flex: 1;
            padding: 0.625rem 0.5rem;
            font-size: 0.8rem;
            text-align: center;
            white-space: nowrap;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .transactions-page {
        .filter-tabs {
          .tab-button {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
        }
      }
    }
  `]
})
export class TransactionsComponent implements OnInit, OnDestroy {
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
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      combineLatest([
        this.storageService.transactions$,
        this.storageService.accounts$,
        this.storageService.categories$
      ]).subscribe(([transactions, accounts, categories]) => {
        this.accounts = accounts;
        this.categories = categories;
        this.enrichTransactions(transactions);
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

  openAddDialog(): void {
    const dialogRef = this.dialogService.open(TransactionDialogComponent, {
      title: 'Add Transaction',
      width: '600px'
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
      width: '600px',
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
}