import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        @if (title) {
          <h1 class="page-title">{{ title }}</h1>
        }
        @if (subtitle) {
          <p class="page-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
        @if (showAddButton) {
          <button type="button" class="add-button" (click)="onAddClick()">
            <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add {{ addButtonText }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);

      .header-content {
        .page-title {
          margin: 0 0 0.25rem 0;
          font-family: var(--font-heading);
          font-size: 1.625rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .page-subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .add-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.1rem;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: var(--text-on-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;

        &:hover {
          filter: brightness(1.06);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }

        &:focus-visible {
          outline: 2px solid var(--color-primary-light);
          outline-offset: 2px;
        }

        .plus-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;

        .header-actions {
          flex-direction: column;
        }

        .add-button {
          justify-content: center;
        }
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showAddButton = false;
  @Input() addRoute = '';
  @Input() addButtonText = 'New';
  @Output() addClick = new EventEmitter<void>();

  onAddClick(): void {
    this.addClick.emit();
  }
}
