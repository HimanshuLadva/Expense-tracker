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
      >
      </app-page-header>

      <div class="accounts-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9.5l9-5.5 9 5.5"/>
              <path d="M5 9.5v9M10 9.5v9M14 9.5v9M19 9.5v9"/>
              <path d="M3 18.5h18"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Accounts</div>
            <div class="stat-value">{{ accounts.length }}</div>
          </div>
        </div>
        <div class="stat-card accent">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/>
              <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/>
              <circle cx="16.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Balance</div>
            <div class="stat-value">{{ formatCurrency(totalBalance) }}</div>
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
      .accounts-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
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

          &.accent .stat-icon {
            background: var(--color-accent-tint);
            color: var(--color-accent);
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
              font-size: 1.4rem;
              font-weight: 700;
              color: var(--text-primary);
              white-space: nowrap;
              line-height: 1.2;
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
            padding: 0.9rem;

            .stat-content .stat-value {
              font-size: 1.2rem;
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
    { key: 'icon', label: 'Icon', type: 'icon' },
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
    // Load accounts from API when page is accessed
    this.storageService.loadAccounts();

    // Subscribe to accounts stream for real-time updates
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
      this.storageService.deleteAccount(account.id).subscribe({
        next: () => {
          // Account deleted successfully
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          alert('Failed to delete account. Please try again.');
        }
      });
    }
  }
}