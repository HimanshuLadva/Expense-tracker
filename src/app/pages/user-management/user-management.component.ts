import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { User } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';
import { UserDialogComponent } from '../../shared/dialogs/user-dialog/user-dialog.component';

interface UserDisplay extends User {
  role: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="user-management-page">
      <app-page-header
        title="User Management"
        subtitle="Manage system users and permissions"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="User"
      />

      <div class="user-stats">
        <div class="stat-card total">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="8" r="3.3"/>
              <path d="M2.3 19.2c0-3.4 3-5.7 6.7-5.7s6.7 2.3 6.7 5.7"/>
              <circle cx="17.3" cy="8.6" r="2.5"/>
              <path d="M15.6 13.8c2.6.5 4.6 2.4 4.6 5.4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ users.length }}</div>
          </div>
        </div>
        <div class="stat-card admin">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="15.5" r="3.5"/>
              <path d="M10.5 13l8-8"/>
              <path d="M15.5 8.5l2 2"/>
              <path d="M18 6l2 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Administrators</div>
            <div class="stat-value">{{ adminUsers.length }}</div>
          </div>
        </div>
        <div class="stat-card regular">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="3.5"/>
              <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Regular Users</div>
            <div class="stat-value">{{ regularUsers.length }}</div>
          </div>
        </div>
      </div>

      <app-data-table
        [data]="users"
        [columns]="tableColumns"
        [showActions]="true"
        [enableVirtualization]="users.length > 100"
        [itemHeight]="60"
        [pageSize]="50"
        emptyTitle="No Users Found"
        emptyMessage="Create your first user to get started."
        (edit)="editUser($event)"
        (delete)="deleteUser($event)"
      />
    </div>
  `,
  styles: [`
    .user-management-page {
      .user-stats {
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

          &.admin {
            border-top-color: var(--color-warning);
          }

          &.regular {
            border-top-color: var(--color-primary-light);
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

          &.admin .stat-icon {
            background: var(--color-warning-tint);
            color: var(--color-warning);
          }

          &.regular .stat-icon {
            background: color-mix(in srgb, var(--color-primary-light) 14%, white);
            color: var(--color-primary-light);
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
    }

    @media (max-width: 768px) {
      .user-management-page {
        .user-stats {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: UserDisplay[] = [];
  adminUsers: User[] = [];
  regularUsers: User[] = [];
  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Role', type: 'badge', badgeColors: { 'Admin': '#f59e0b', 'User': '#3b82f6' } },
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    // Load users from API
    this.storageService.loadUsers();

    this.subscription.add(
      this.storageService.users$.subscribe(users => {
        this.users = users.map(user => ({
          ...user,
          role: user.isAdmin ? 'Admin' : 'User'
        }));
        this.updateUserGroups();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateUserGroups(): void {
    this.adminUsers = this.users.filter(u => u.isAdmin);
    this.regularUsers = this.users.filter(u => !u.isAdmin);
  }

  openAddDialog(): void {
    const dialogRef = this.dialogService.open(UserDialogComponent, {
      data: { user: null }
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Data will be reloaded automatically by StorageService
      }
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialogService.open(UserDialogComponent, {
      data: { user }
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Data will be reloaded automatically by StorageService
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      this.storageService.deleteUser(user.id).subscribe({
        next: () => {
          // Success - data will be reloaded automatically
        },
        error: (error) => {
          alert('Failed to delete user. Please try again.');
          console.error('Delete user error:', error);
        }
      });
    }
  }
}
