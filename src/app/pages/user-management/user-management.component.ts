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
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ users.length }}</div>
          </div>
        </div>
        <div class="stat-card admin">
          <div class="stat-icon">🔑</div>
          <div class="stat-content">
            <div class="stat-label">Administrators</div>
            <div class="stat-value">{{ adminUsers.length }}</div>
          </div>
        </div>
        <div class="stat-card regular">
          <div class="stat-icon">👤</div>
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
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;

          &.total {
            border-left: 4px solid #6366f1;
          }

          &.admin {
            border-left: 4px solid #f59e0b;
          }

          &.regular {
            border-left: 4px solid #3b82f6;
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
