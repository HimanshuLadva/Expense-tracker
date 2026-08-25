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
      <span class="label" [id]="inputId + '-label'">{{ label }}</span>
      <div class="icon-grid" role="group" [attr.aria-labelledby]="inputId + '-label'">
        @for (icon of availableIcons; track icon) {
          <button
            type="button"
            class="icon-option"
            [class.selected]="value === icon"
            [attr.aria-pressed]="value === icon"
            [attr.aria-label]="'Icon ' + icon"
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
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .icon-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.75rem;
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        padding: 1rem;
        background-color: var(--surface-muted);

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }

        .icon-option {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 2px solid var(--border-subtle);
          border-radius: 50%;
          background-color: var(--surface);
          font-size: 1.35rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);

          &:hover {
            border-color: var(--color-primary-light);
            background-color: var(--color-primary-tint);
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
          }

          &.selected {
            border-color: var(--color-primary);
            background-color: var(--color-primary-tint);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px 0 color-mix(in srgb, var(--color-primary) 20%, transparent);
          }

          &:focus-visible {
            outline: 2px solid var(--color-primary-light);
            outline-offset: 2px;
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