import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { StorageService } from '../../../services/storage.service';
import { Reminder, CreateReminderRequest, UpdateReminderRequest } from '../../../models';
import { DialogResult } from '../../dialog/dialog-result.interface';

@Component({
  selector: 'app-reminder-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-header">
      <h3 class="dialog-title">{{ isEditMode ? 'Edit Reminder' : 'Add Reminder' }}</h3>
      <button type="button" class="dialog-close-btn" (click)="onCancel()">✕</button>
    </div>

    <div class="dialog-content">
      <form [formGroup]="reminderForm" (ngSubmit)="onSubmit()" class="reminder-dialog-form">
        <div class="form-fields">
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
              <label for="beforeDays" class="label">Remind Before (Days) *</label>
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
                <span class="error-message">Days must be 0 or more</span>
              }
            </div>

            <div class="form-group">
              <label for="afterDays" class="label">Remind After (Days) *</label>
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
                <span class="error-message">Days must be 0 or more</span>
              }
            </div>
          </div>

          @if (isEditMode) {
            <div class="form-group">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="checkbox-input"
                />
                <span class="checkbox-label">Active reminder</span>
                <span class="help-text">Uncheck to disable this reminder</span>
              </label>
            </div>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="reminderForm.invalid || isSubmitting">
            @if (isSubmitting) {
              <span>Saving...</span>
            } @else {
              <span>{{ isEditMode ? 'Update' : 'Create' }} Reminder</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .reminder-dialog-form {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;

      .form-fields {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;

        .form-group {
          margin-bottom: 1.5rem;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        margin-top: auto;

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;

          &.btn-secondary {
            background-color: #f3f4f6;
            border-color: #d1d5db;
            color: #374151;

            &:hover {
              background-color: #e5e7eb;
            }
          }

          &.btn-primary {
            background-color: #3b82f6;
            border-color: #3b82f6;
            color: white;

            &:hover:not(:disabled) {
              background-color: #2563eb;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      .label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &.error {
          border-color: #ef4444;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }

      .checkbox-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        cursor: pointer;

        .checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;

          &:checked + .checkbox-label::before {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }

          &:checked + .checkbox-label::after {
            display: block;
          }
        }

        .checkbox-label {
          position: relative;
          padding-left: 2rem;
          font-weight: 500;
          color: #374151;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid #d1d5db;
            border-radius: 0.25rem;
            background-color: white;
            transition: all 0.2s ease;
          }

          &::after {
            content: '✓';
            position: absolute;
            left: 0.25rem;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 0.75rem;
            font-weight: bold;
            display: none;
          }
        }

        .help-text {
          padding-left: 2rem;
          color: #6b7280;
          font-size: 0.75rem;
        }
      }

      .error-message {
        display: block;
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
    }

    @media (max-width: 768px) {
      .reminder-dialog-form {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class ReminderDialogComponent implements OnInit {
  reminderForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  reminder?: Reminder;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.reminderForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data?.reminderId) {
      this.isEditMode = true;
      this.loadReminder(this.data.reminderId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
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
      this.reminder = reminder;
      this.reminderForm.patchValue({
        title: reminder.title,
        date: new Date(reminder.date).toISOString().split('T')[0],
        beforeDays: reminder.beforeDays,
        afterDays: reminder.afterDays,
        isActive: reminder.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.reminderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.reminderForm.value;

      if (this.isEditMode && this.data?.reminderId && this.reminder) {
        const updatedReminder: Reminder = {
          ...this.reminder,
          title: formValue.title,
          date: new Date(formValue.date),
          beforeDays: formValue.beforeDays,
          afterDays: formValue.afterDays,
          isActive: formValue.isActive,
          updatedAt: new Date()
        };
        this.storageService.saveReminder(updatedReminder);
      } else {
        const newReminder: Reminder = {
          id: this.storageService.generateId(),
          title: formValue.title,
          date: new Date(formValue.date),
          beforeDays: formValue.beforeDays,
          afterDays: formValue.afterDays,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.storageService.saveReminder(newReminder);
      }

      this.dialogRef.close({ success: true } as DialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}