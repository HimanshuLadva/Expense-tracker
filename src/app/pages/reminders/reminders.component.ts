import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { Reminder } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { ReminderDialogComponent } from '../../shared/dialogs/reminder-dialog/reminder-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="reminders-page">
      <app-page-header
        title="Reminders"
        subtitle="Set up reminders for important financial events"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Reminder"
      />

      <div class="reminders-stats">
        <div class="stat-card total">
          <div class="stat-icon">🔔</div>
          <div class="stat-content">
            <div class="stat-label">Total Reminders</div>
            <div class="stat-value">{{ reminders.length }}</div>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">Active Reminders</div>
            <div class="stat-value">{{ activeReminders }}</div>
          </div>
        </div>
      </div>

      <app-data-table
        [data]="reminders"
        [columns]="tableColumns"
        [showActions]="true"
        emptyTitle="No Reminders Found"
        emptyMessage="Create your first reminder to stay on top of your finances."
        (edit)="editReminder($event)"
        (delete)="deleteReminder($event)"
      />
    </div>
  `,
  styles: [`
    .reminders-page {
      .reminders-stats {
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
            border-left: 4px solid #f59e0b;
          }

          &.active {
            border-left: 4px solid #10b981;
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
  `]
})
export class RemindersComponent implements OnInit, OnDestroy {
  reminders: Reminder[] = [];
  activeReminders = 0;
  private subscription = new Subscription();

  tableColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'beforeDays', label: 'Before Days', type: 'text' },
    { key: 'afterDays', label: 'After Days', type: 'text' },
    {
      key: 'isActive',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        'true': '#10b981',
        'false': '#6b7280'
      }
    },
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.storageService.reminders$.subscribe(reminders => {
        this.reminders = reminders.map(r => ({
          ...r,
          isActive: r.isActive.toString()
        })) as any[];
        this.activeReminders = reminders.filter(r => r.isActive).length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openAddDialog(): void {
    const dialogRef = this.dialogService.open(ReminderDialogComponent, {
      title: 'Add Reminder',
      width: '600px'
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Reminder was successfully created
      }
    });
  }

  editReminder(reminder: Reminder): void {
    const dialogRef = this.dialogService.open(ReminderDialogComponent, {
      title: 'Edit Reminder',
      width: '600px',
      data: { reminderId: reminder.id }
    });

    dialogRef.closed.subscribe((result) => {
      const dialogResult = result as DialogResult | undefined;
      if (dialogResult?.success) {
        // Reminder was successfully updated
      }
    });
  }

  deleteReminder(reminder: Reminder): void {
    if (confirm(`Are you sure you want to delete the reminder "${reminder.title}"?`)) {
      this.storageService.deleteReminder(reminder.id);
    }
  }
}