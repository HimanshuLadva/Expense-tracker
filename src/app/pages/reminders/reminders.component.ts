import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { DateRangeService } from '../../services/date-range.service';
import { Reminder } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { DialogService } from '../../shared/dialog/dialog.service';
import { ReminderDialogComponent } from '../../shared/dialogs/reminder-dialog/reminder-dialog.component';
import { DialogResult } from '../../shared/dialog/dialog-result.interface';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="reminders-page">
      <app-page-header
        title="Reminders"
        subtitle="Set up reminders for important financial events"
        [showAddButton]="true"
        (addClick)="openAddDialog()"
        addButtonText="Reminder"
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
        [enableVirtualization]="reminders.length > 100"
        [itemHeight]="60"
        [pageSize]="50"
        emptyTitle="No Reminders Found"
        emptyMessage="Create your first reminder to stay on top of your finances."
        (edit)="editReminder($event)"
        (delete)="deleteReminder($event)"
      />
    </div>
  `,
  styles: [`
    .reminders-page {
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
  dateRangeForm!: FormGroup;
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
        this.loadRemindersWithDateRange();
      })
    );

    // Listen to date range changes from other pages
    // This will fire immediately on subscribe, loading initial data
    this.subscription.add(
      this.dateRangeService.dateRange$.subscribe((dateRange) => {
        this.dateRangeForm.patchValue(dateRange, { emitEvent: false });
        this.loadRemindersWithDateRange();
      })
    );

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
        // Reload reminders with current date range after successful creation
        this.loadRemindersWithDateRange();
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
        // Reload reminders with current date range after successful update
        this.loadRemindersWithDateRange();
      }
    });
  }

  deleteReminder(reminder: Reminder): void {
    if (confirm(`Are you sure you want to delete the reminder "${reminder.title}"?`)) {
      this.storageService.deleteReminder(reminder.id).subscribe({
        next: () => {
          // Reload reminders with current date range after successful deletion
          this.loadRemindersWithDateRange();
        },
        error: (error) => {
          console.error('Error deleting reminder:', error);
          alert('Failed to delete reminder. Please try again.');
        }
      });
    }
  }

  private loadRemindersWithDateRange(): void {
    const { fromDate, toDate } = this.dateRangeForm.value;

    // Create date range request with ISO date strings
    const request: any = {};

    if (fromDate) {
      // Send date as YYYY-MM-DDT00:00:00.000Z format without timezone conversion
      request.fromDate = `${fromDate}T00:00:00.000Z`;
    }

    if (toDate) {
      // Send date as YYYY-MM-DDT23:59:59.999Z format without timezone conversion
      request.toDate = `${toDate}T23:59:59.999Z`;
    }

    // Load reminders from API with date range
    this.storageService.loadReminders(request);
  }
}