import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { StorageService } from '../../services/storage.service';
import { Reminder } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';

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
        addRoute="/reminders/add"
        addButtonText="Reminder"
      />

      <div class="reminders-stats">
        <div class="stat-card">
          <div class="stat-icon">🔔</div>
          <div class="stat-content">
            <div class="stat-label">Total Reminders</div>
            <div class="stat-value">{{ reminders.length }}</div>
          </div>
        </div>
        <div class="stat-card">
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
    private router: Router
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

  editReminder(reminder: Reminder): void {
    this.router.navigate(['/reminders/edit', reminder.id]);
  }

  deleteReminder(reminder: Reminder): void {
    if (confirm(`Are you sure you want to delete the reminder "${reminder.title}"?`)) {
      this.storageService.deleteReminder(reminder.id);
    }
  }
}