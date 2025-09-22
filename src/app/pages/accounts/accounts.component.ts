import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { Account } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { AccountDialogComponent } from '../../shared/dialogs/account-dialog/account-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="accounts-page">
      <app-page-header
        title="Accounts"
        subtitle="Manage your bank accounts, wallets, and cash"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Account"
      />

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
        emptyTitle="No Accounts Found"
        emptyMessage="Create your first account to start tracking your finances."
        (edit)="editAccount($event)"
        (delete)="deleteAccount($event)"
      />
    </div>
  `,
  styles: [`
    .accounts-page {
      .accounts-stats {
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
            padding: 1.25rem;

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
      }
    }
  `]
})
export class AccountsComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  totalBalance = 0;
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
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.storageService.accounts$.subscribe(accounts => {
        this.accounts = accounts;
        this.calculateTotalBalance();
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
}