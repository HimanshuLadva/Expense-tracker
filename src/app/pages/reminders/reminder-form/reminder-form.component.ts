import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { StorageService } from '../../../services/storage.service';
import { Reminder, CreateReminderRequest, UpdateReminderRequest } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-reminder-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <div class="reminder-form-page">
      <app-page-header
        [title]="isEditMode ? 'Edit Reminder' : 'Add Reminder'"
        [subtitle]="isEditMode ? 'Update reminder details' : 'Create a new reminder for important events'"
      />

      <div class="form-container">
        <form [formGroup]="reminderForm" (ngSubmit)="onSubmit()" class="reminder-form">
          <div class="form-group">
            <label for="title" class="label">Reminder Title *</label>
            <input
              type="text"
              id="title"
              formControlName="title"
              class="form-input"
              placeholder="Enter reminder title"
              [class.error]="reminderForm.get('title')?.invalid && reminderForm.get('title')?.touched"
            />
            @if (reminderForm.get('title')?.hasError('required') && reminderForm.get('title')?.touched) {
              <span class="error-message">Reminder title is required</span>
            }
          </div>

          <div class="form-group">
            <label for="date" class="label">Date *</label>
            <input
              type="date"
              id="date"
              formControlName="date"
              class="form-input"
              [class.error]="reminderForm.get('date')?.invalid && reminderForm.get('date')?.touched"
            />
            @if (reminderForm.get('date')?.hasError('required') && reminderForm.get('date')?.touched) {
              <span class="error-message">Date is required</span>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="beforeDays" class="label">Before Days *</label>
              <input
                type="number"
                id="beforeDays"
                formControlName="beforeDays"
                class="form-input"
                placeholder="0"
                min="0"
                [class.error]="reminderForm.get('beforeDays')?.invalid && reminderForm.get('beforeDays')?.touched"
              />
              @if (reminderForm.get('beforeDays')?.hasError('required') && reminderForm.get('beforeDays')?.touched) {
                <span class="error-message">Before days is required</span>
              }
              @if (reminderForm.get('beforeDays')?.hasError('min') && reminderForm.get('beforeDays')?.touched) {
                <span class="error-message">Must be 0 or greater</span>
              }
            </div>

            <div class="form-group">
              <label for="afterDays" class="label">After Days *</label>
              <input
                type="number"
                id="afterDays"
                formControlName="afterDays"
                class="form-input"
                placeholder="0"
                min="0"
                [class.error]="reminderForm.get('afterDays')?.invalid && reminderForm.get('afterDays')?.touched"
              />
              @if (reminderForm.get('afterDays')?.hasError('required') && reminderForm.get('afterDays')?.touched) {
                <span class="error-message">After days is required</span>
              }
              @if (reminderForm.get('afterDays')?.hasError('min') && reminderForm.get('afterDays')?.touched) {
                <span class="error-message">Must be 0 or greater</span>
              }
            </div>
          </div>

          @if (isEditMode) {
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="checkbox-input"
                />
                <span class="checkbox-text">Active reminder</span>
              </label>
            </div>
          }

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="reminderForm.invalid || isSubmitting"
            >
              @if (isSubmitting) {
                <span>Saving...</span>
              } @else {
                <span>{{ isEditMode ? 'Update' : 'Create' }} Reminder</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .reminder-form-page {
      .form-container {
        max-width: 600px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        padding: 2rem;

        .reminder-form {
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;

            @media (max-width: 768px) {
              grid-template-columns: 1fr;
            }
          }

          .form-group {
            margin-bottom: 1.5rem;

            .label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: #374151;
            }

            .form-input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 1rem;
              transition: border-color 0.2s ease;

              &:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
              }

              &.error {
                border-color: #ef4444;
              }

              &::placeholder {
                color: #9ca3af;
              }
            }

            .checkbox-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;

              .checkbox-input {
                width: 1rem;
                height: 1rem;
                accent-color: #3b82f6;
              }

              .checkbox-text {
                color: #374151;
                font-weight: 500;
              }
            }

            .error-message {
              display: block;
              margin-top: 0.25rem;
              font-size: 0.875rem;
              color: #ef4444;
            }
          }

          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;

            .btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.375rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }

              &.btn-primary {
                background-color: #3b82f6;
                color: white;

                &:hover:not(:disabled) {
                  background-color: #2563eb;
                }
              }

              &.btn-secondary {
                background-color: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;

                &:hover {
                  background-color: #e5e7eb;
                }
              }
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .reminder-form-page {
        .form-container {
          margin: 0;
          border-radius: 0;
          box-shadow: none;
          padding: 1rem;
        }

        .form-actions {
          flex-direction: column;

          .btn {
            width: 100%;
          }
        }
      }
    }
  `]
})
export class ReminderFormComponent implements OnInit {
  reminderForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  reminderId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService
  ) {
    this.reminderForm = this.createForm();
  }

  ngOnInit(): void {
    this.reminderId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.reminderId;

    if (this.isEditMode && this.reminderId) {
      this.loadReminder(this.reminderId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', Validators.required],
      beforeDays: [0, [Validators.required, Validators.min(0)]],
      afterDays: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  private loadReminder(id: string): void {
    const reminders = this.storageService.getReminders();
    const reminder = reminders.find(r => r.id === id);

    if (reminder) {
      this.reminderForm.patchValue({
        title: reminder.title,
        date: new Date(reminder.date).toISOString().split('T')[0],
        beforeDays: reminder.beforeDays,
        afterDays: reminder.afterDays,
        isActive: reminder.isActive
      });
    } else {
      this.router.navigate(['/reminders']);
    }
  }

  onSubmit(): void {
    if (this.reminderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.reminderForm.value;

      if (this.isEditMode && this.reminderId) {
        const updateRequest: UpdateReminderRequest = {
          id: this.reminderId,
          title: formValue.title,
          date: new Date(formValue.date),
          beforeDays: formValue.beforeDays,
          afterDays: formValue.afterDays,
          isActive: formValue.isActive
        };

        const reminders = this.storageService.getReminders();
        const existingReminder = reminders.find(r => r.id === this.reminderId);

        if (existingReminder) {
          const updatedReminder: Reminder = {
            ...existingReminder,
            title: updateRequest.title,
            date: updateRequest.date,
            beforeDays: updateRequest.beforeDays,
            afterDays: updateRequest.afterDays,
            isActive: updateRequest.isActive,
            updatedAt: new Date()
          };

          this.storageService.saveReminder(updatedReminder);
        }
      } else {
        const createRequest: CreateReminderRequest = {
          title: formValue.title,
          date: new Date(formValue.date),
          beforeDays: formValue.beforeDays,
          afterDays: formValue.afterDays
        };

        const newReminder: Reminder = {
          id: this.storageService.generateId(),
          title: createRequest.title,
          date: createRequest.date,
          beforeDays: createRequest.beforeDays,
          afterDays: createRequest.afterDays,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveReminder(newReminder);
      }

      this.router.navigate(['/reminders']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/reminders']);
  }
}