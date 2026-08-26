import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
          <div class="date-range-pill">
            <div class="date-field-wrapper">
              <label for="fromDate" class="date-label">Fr:</label>
              <input
                type="date"
                id="fromDate"
                formControlName="fromDate"
                class="date-input"
              />
            </div>
            <span class="date-range-divider">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </span>
            <div class="date-field-wrapper">
              <label for="toDate" class="date-label">To:</label>
              <input
                type="date"
                id="toDate"
                formControlName="toDate"
                class="date-input"
              />
            </div>
          </div>
        </form>
      </app-page-header>

      <div class="reminders-stats">
        <div class="stat-card total">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18.5 8.5a6.5 6.5 0 1 0-13 0c0 3.8-1 5.4-2.2 7h17.4c-1.2-1.6-2.2-3.2-2.2-7z"/>
              <path d="M9.3 18.5a2.7 2.7 0 0 0 5.4 0"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Reminders</div>
            <div class="stat-value">{{ reminders.length }}</div>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6.5L9 17.5l-5-5"/>
            </svg>
          </div>
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
        flex-wrap: wrap;

        .date-range-pill {
          display: inline-flex;
          align-items: center;
          height: 36px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          background: var(--surface);
          padding: 0 0.2rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;

          &:focus-within {
            border-color: var(--color-primary-light);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
          }
        }

        .date-range-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          color: var(--text-muted);

          svg {
            width: 13px;
            height: 13px;
          }
        }

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
          }

          .date-input {
            height: 100%;
            padding: 0 0.5rem 0 2.7rem;
            border: none;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: var(--text-primary);
            background: transparent;
            width: 155px;
            outline: none;

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
          background: var(--surface);
          padding: 1.1rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 0.9rem;
          border-top: 3px solid var(--color-warning);
          transition: transform 0.2s ease, box-shadow 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          &.active {
            border-top-color: var(--color-accent);
          }

          .stat-icon {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-warning-tint);
            color: var(--color-warning);
            border-radius: var(--radius-md);

            svg {
              width: 20px;
              height: 20px;
            }
          }

          &.active .stat-icon {
            background: var(--color-accent-tint);
            color: var(--color-accent);
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
    // Debounce to avoid multiple API calls when user is still typing/selecting dates
    this.subscription.add(
      this.dateRangeForm.valueChanges
        .pipe(debounceTime(500))
        .subscribe((value) => {
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