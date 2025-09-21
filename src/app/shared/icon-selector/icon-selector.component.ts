import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-selector',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IconSelectorComponent),
      multi: true
    }
  ],
  template: `
    <div class="icon-selector">
      <label [for]="inputId" class="label">{{ label }}</label>
      <div class="icon-grid">
        @for (icon of availableIcons; track icon) {
          <button
            type="button"
            class="icon-option"
            [class.selected]="value === icon"
            (click)="selectIcon(icon)"
          >
            {{ icon }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .icon-selector {
      margin-bottom: 1.5rem;

      .label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }

      .icon-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.75rem;
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 1rem;
        background-color: #fafafa;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        .icon-option {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #ffffff;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

          &:hover {
            border-color: #3b82f6;
            background-color: #f8fafc;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
          }

          &.selected {
            border-color: #3b82f6;
            background-color: #dbeafe;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px 0 rgb(59 130 246 / 0.2);
          }
        }
      }
    }

    @media (max-width: 640px) {
      .icon-selector .icon-grid {
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        padding: 0.75rem;

        .icon-option {
          width: 44px;
          height: 44px;
          font-size: 1.25rem;
        }
      }
    }
  `]
})
export class IconSelectorComponent implements ControlValueAccessor {
  @Input() label = 'Select Icon';
  @Input() inputId = 'icon-selector';

  value = '';
  onChange = (value: string) => {};
  onTouched = () => {};

  availableIcons = [
    '💰', '🏦', '💳', '🏧', '💎', '🎯', '🎨', '🎵', '🍔', '🍕',
    '🚗', '⛽', '🏠', '🔌', '📱', '💻', '🎮', '👕', '👟', '💊',
    '🏥', '🎓', '📚', '✈️', '🎬', '🎪', '🎸', '🏋️', '⚽', '🏀'
  ];

  selectIcon(icon: string): void {
    this.value = icon;
    this.onChange(icon);
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
  }
}