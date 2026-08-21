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
      <button type="button" class="dialog-close-btn" (click)="onCancel()" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
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
              <span class="error-message" role="alert">Reminder title is required</span>
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
              <span class="error-message" role="alert">Date is required</span>
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
                <span class="error-message" role="alert">Before days is required</span>
              }
              @if (reminderForm.get('beforeDays')?.hasError('min') && reminderForm.get('beforeDays')?.touched) {
                <span class="error-message" role="alert">Days must be 0 or more</span>
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
                <span class="error-message" role="alert">After days is required</span>
              }
              @if (reminderForm.get('afterDays')?.hasError('min') && reminderForm.get('afterDays')?.touched) {
                <span class="error-message" role="alert">Days must be 0 or more</span>
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
        max-height: calc(90vh - 200px);
        overflow-y: auto;
        padding: 0.5rem 0;
        margin-bottom: 1rem;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: var(--surface-muted);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

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
        border-top: 1px solid var(--border-subtle);

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;

          &:focus-visible {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
          }

          &.btn-secondary {
            background-color: var(--surface);
            border-color: var(--border-default);
            color: var(--text-secondary);

            &:hover {
              background-color: var(--surface-sunken);
            }
          }

          &.btn-primary {
            background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            border-color: transparent;
            color: var(--text-on-primary);

            &:hover:not(:disabled) {
              filter: brightness(1.06);
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
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-primary);
        background: var(--surface);
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--color-primary-light);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-light) 16%, transparent);
        }

        &.error {
          border-color: var(--color-destructive);
        }

        &::placeholder {
          color: var(--text-muted);
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
            background-color: var(--color-primary);
            border-color: var(--color-primary);
          }

          &:checked + .checkbox-label::after {
              display: block;
          }

          &:focus-visible + .checkbox-label::before {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
          }
        }

        .checkbox-label {
          position: relative;
          padding-left: 2rem;
          font-weight: 500;
          color: var(--text-secondary);

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid var(--border-default);
          border-radius: 0.25rem;
          background-color: var(--surface);
          transition: all 0.2s ease;
          }

          &::after {
            content: '✓';
            position: absolute;
            left: 0.25rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-on-primary);
            font-size: 0.75rem;
            font-weight: bold;
            display: none;
          }
          }

          .help-text {
          padding-left: 2rem;
            color: var(--text-muted);
            font-size: 0.75rem;
        }
      }

      .error-message {
        display: block;
        color: var(--color-destructive);
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
    }

    @media (max-width: 768px) {
      .reminder-dialog-form {
        .form-fields .form-row {
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

  private loadReminder(id: number): void {
    this.storageService.getReminderById(id).subscribe({
      next: (reminder) => {
        this.reminder = reminder;

        // Use local timezone methods to extract date for display (avoid timezone shift)
        const d = new Date(reminder.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        this.reminderForm.patchValue({
          title: reminder.title,
          date: dateString,
          beforeDays: reminder.beforeDays,
          afterDays: reminder.afterDays,
          isActive: reminder.isActive
        });
      },
      error: (error) => {
        console.error('Error loading reminder:', error);
        alert('Failed to load reminder. Please try again.');
        this.dialogRef.close();
      }
    });
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
          isActive: formValue.isActive
        };

        this.storageService.saveReminder(updatedReminder, true).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Error updating reminder:', error);
            alert('Failed to update reminder. Please try again.');
            this.isSubmitting = false;
          }
        });
      } else {
        const newReminder: Reminder = {
          id: 0, // Backend will generate the actual ID
          userId: 0, // UserId will be set by the backend from JWT token
          title: formValue.title,
          date: new Date(formValue.date),
          beforeDays: formValue.beforeDays,
          afterDays: formValue.afterDays,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveReminder(newReminder, false).subscribe({
          next: () => {
            this.dialogRef.close({ success: true } as DialogResult);
          },
          error: (error) => {
            console.error('Error creating reminder:', error);
            alert('Failed to create reminder. Please try again.');
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}