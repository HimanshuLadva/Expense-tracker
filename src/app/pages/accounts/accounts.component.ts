import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Account } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { AccountDialogComponent } from '../../shared/dialogs/account-dialog/account-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="accounts-page">
      <app-page-header
        title="Accounts"
        subtitle="Manage your bank accounts, wallets, and cash"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Account"
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

      <div class="accounts-stats">
        <div class="stat-card">
          <div class="stat-icon">🏦</div>
          <div class="stat-content">
            <div class="stat-label">Total Accounts</div>
            <div class="stat-value">{{ accounts.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Total Balance</div>
            <div class="stat-value">{{ formatCompactCurrency(totalBalance) }}</div>
          </div>
        </div>
      </div>

      <app-data-table
        [data]="accounts"
        [columns]="tableColumns"
        [showActions]="true"
        [enableVirtualization]="accounts.length > 100"
        [itemHeight]="60"
        [pageSize]="50"
        emptyTitle="No Accounts Found"
        emptyMessage="Create your first account to start tracking your finances."
        (edit)="editAccount($event)"
        (delete)="deleteAccount($event)"
      />
    </div>
  `,
  styles: [`
    .accounts-page {
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

      .accounts-stats {
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
            }
          }
        }
      }
    }

    @media (max-width: 1024px) {
      .accounts-page {
        .accounts-stats {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;

          .stat-card {
            padding: 1rem;

            .stat-content .stat-value {
              font-size: 1.25rem;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .accounts-page {
        .accounts-stats {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;

          .stat-card {
            padding: 0.875rem;
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;

            .stat-icon {
              font-size: 2rem;
              padding: 0.625rem;
            }

            .stat-content {
              .stat-label {
                white-space: normal;
                text-overflow: unset;
                overflow: visible;
              }

              .stat-value {
                font-size: 1.125rem;
              }
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .accounts-page {
        .accounts-stats {
          grid-template-columns: 1fr;
          gap: 0.5rem;

          .stat-card {
            padding: 0.75rem;

            .stat-icon {
              font-size: 1.75rem;
              padding: 0.5rem;
            }

            .stat-content .stat-value {
              font-size: 1rem;
            }
          }
        }
      }
    }
  `]
})
export class AccountsComponent implements OnInit, OnDestroy {
  allAccounts: Account[] = [];
  accounts: Account[] = [];
  totalBalance = 0;
  dateRangeForm!: FormGroup;
  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    { key: 'icon', label: '', type: 'text' },
    { key: 'name', label: 'Account Name', type: 'text' },
    { key: 'initialAmount', label: 'Initial', type: 'currency' },
    { key: 'currentBalance', label: 'Current Balance', type: 'currency' },
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private dateRangeService: DateRangeService
  ) {}

  ngOnInit(): void {
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
        this.filterAccounts();
      })
    );

    // Listen to date range changes from other pages
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.filterAccounts();
      })
    );

    this.subscription.add(
      this.storageService.accounts$.subscribe(accounts => {
        this.allAccounts = accounts;
        this.filterAccounts();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((sum, account) => sum + account.currentBalance, 0);
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
    const dialogRef = this.dialogService.open(AccountDialogComponent, {
      title: 'Add Account',
      width: '500px'
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Account was successfully created/updated
      }
    });
  }

  editAccount(account: Account): void {
    const dialogRef = this.dialogService.open(AccountDialogComponent, {
      title: 'Edit Account',
      width: '500px',
      data: { accountId: account.id }
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Account was successfully updated
      }
    });
  }

  deleteAccount(account: Account): void {
    if (confirm(`Are you sure you want to delete the account "${account.name}"?`)) {
      this.storageService.deleteAccount(account.id);
    }
  }

  private filterAccounts(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    // Set end date to end of day for inclusive comparison
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    this.accounts = this.allAccounts.filter(account => {
      const accountDate = new Date(account.createdAt);
      const afterStart = !startDate || accountDate >= startDate;
      const beforeEnd = !endDate || accountDate <= endDate;
      return afterStart && beforeEnd;
    });

    this.calculateTotalBalance();
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}