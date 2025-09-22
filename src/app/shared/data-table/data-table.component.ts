import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'badge';
  badgeColors?: { [key: string]: string };
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="data-table-container">
      @if (data.length > 0) {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                @for (column of columns; track column.key) {
                  <th>{{ column.label }}</th>
                }
                @if (showActions) {
                  <th class="actions-column">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (item of data; track trackByFn(item)) {
                <tr>
                  @for (column of columns; track column.key) {
                    <td [ngClass]="'column-' + column.type">
                      @switch (column.type) {
                        @case ('currency') {
                          <span class="currency-value">{{ formatCompactCurrency(getNestedValue(item, column.key)) }}</span>
                        }
                        @case ('date') {
                          <span class="date-value">{{ formatDate(getNestedValue(item, column.key)) }}</span>
                        }
                        @case ('badge') {
                          <span
                            class="badge"
                            [style.background-color]="getBadgeColor(column, getNestedValue(item, column.key))"
                          >
                            {{ getNestedValue(item, column.key) }}
                          </span>
                        }
                        @default {
                          <span>{{ getNestedValue(item, column.key) }}</span>
                        }
                      }
                    </td>
                  }
                  @if (showActions) {
                    <td class="actions-column">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="action-btn edit-btn"
                          (click)="onEdit(item)"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          class="action-btn delete-btn"
                          (click)="onDelete(item)"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>{{ emptyTitle }}</h3>
          <p>{{ emptyMessage }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-table-container {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      overflow: hidden;

      .table-wrapper {
        overflow-x: auto;

        .data-table {
          width: 100%;
          border-collapse: collapse;

          thead {
            background-color: #f9fafb;

            th {
              padding: 0.75rem 1rem;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
              font-size: 0.875rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              white-space: nowrap;

              &.actions-column {
                width: 120px;
                text-align: center;
              }

              &:first-child {
                width: 60px;
                text-align: center;
              }

              &:nth-child(2) {
                padding-right: 1rem;
                min-width: 120px;
              }

              &:nth-child(3) {
                padding-left: 1rem;
                min-width: 140px;
              }
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid #f3f4f6;
              transition: background-color 0.2s ease;

              &:hover {
                background-color: #f9fafb;
              }

              &:last-child {
                border-bottom: none;
              }

              td {
                padding: 1rem;
                color: #374151;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
                vertical-align: middle;

                &.column-badge {
                  padding-right: 1rem;
                  vertical-align: middle;
                  min-width: 120px;
                }

                &.column-currency {
                  padding-left: 1rem;
                  vertical-align: middle;
                  min-width: 140px;
                }

                &.actions-column {
                  text-align: center;
                  white-space: normal;
                  overflow: visible;
                }

                &:first-child {
                  text-align: center;
                  font-size: 1.5rem;
                  white-space: normal;
                  overflow: visible;
                  max-width: 60px;
                }

                &:nth-child(2) {
                  padding-right: 1rem;
                  vertical-align: middle;
                  min-width: 120px;
                }

                &:nth-child(3) {
                  padding-left: 1rem;
                  vertical-align: middle;
                  min-width: 140px;
                }

                .currency-value {
                  font-weight: 600;
                  color: #059669;
                }

                .date-value {
                  color: #6b7280;
                  font-size: 0.875rem;
                }

                .badge {
                  padding: 0.375rem 0.875rem;
                  border-radius: 9999px;
                  font-size: 0.75rem;
                  font-weight: 500;
                  text-transform: capitalize;
                  color: white;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 28px;
                  vertical-align: middle;
                }

                .action-buttons {
                  display: flex;
                  gap: 0.75rem;
                  justify-content: center;

                  .action-btn {
                    padding: 0.5rem 0.75rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 1rem;
                    min-width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

                    &.edit-btn {
                      background-color: #dbeafe;
                      border: 1px solid #93c5fd;

                      &:hover {
                        background-color: #bfdbfe;
                        box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
                        transform: translateY(-1px);
                      }
                    }

                    &.delete-btn {
                      background-color: #fee2e2;
                      border: 1px solid #fca5a5;

                      &:hover {
                        background-color: #fecaca;
                        box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
                        transform: translateY(-1px);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      .empty-state {
        padding: 3rem 2rem;
        text-align: center;

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          color: #6b7280;
        }
      }
    }

    @media (max-width: 768px) {
      .data-table-container {
        margin: 0 -0.5rem;
      }

      .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .data-table {
        font-size: 0.75rem;
        min-width: 600px;

        thead th {
          padding: 0.5rem 0.375rem;
          font-size: 0.75rem;
          white-space: nowrap;

          &.actions-column {
            width: 100px;
          }

          &:first-child {
            width: 40px;
            padding: 0.5rem 0.25rem;
          }
        }

        tbody td {
          padding: 0.75rem 0.375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          vertical-align: middle;

          &.column-badge {
            padding-right: 1rem;
          }

          &.column-currency {
            padding-left: 1rem;
          }

          &.actions-column {
            text-align: center;
            white-space: normal;
            overflow: visible;
          }

          &:first-child {
            padding: 0.75rem 0.25rem;
            font-size: 1.25rem;
            white-space: normal;
            overflow: visible;
            max-width: 40px;
          }
        }

        .currency-value {
          font-size: 0.75rem;
        }

        .date-value {
          font-size: 0.7rem;
        }

        .badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.65rem;
        }

        .action-buttons {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          justify-content: center;

          .action-btn {
            padding: 0.375rem 0.5rem;
            font-size: 0.875rem;
            min-width: 32px;
            height: 32px;
            border-radius: 0.375rem;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .data-table {
        min-width: 550px;
        font-size: 0.7rem;

        thead th {
          padding: 0.375rem 0.25rem;
          font-size: 0.7rem;
        }

        tbody td {
          padding: 0.5rem 0.25rem;
          max-width: 100px;
        }

        .action-buttons .action-btn {
          padding: 0.25rem 0.375rem;
          font-size: 0.75rem;
          min-width: 28px;
          height: 28px;
          border-radius: 0.25rem;
        }
      }
    }
  `]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showActions = true;
  @Input() emptyTitle = 'No Data';
  @Input() emptyMessage = 'No data available to display.';

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  trackByFn(item: any): any {
    return item.id || item;
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  formatCurrency(value: number): string {
    if (value == null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  }

  formatCompactCurrency(value: number): string {
    if (value == null) return '₹0';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1e9) {
      return `${sign}₹${(absValue / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}₹${(absValue / 1e6).toFixed(1)}M`;
    } else if (absValue >= 1e3) {
      return `${sign}₹${(absValue / 1e3).toFixed(1)}K`;
    } else {
      return `${sign}₹${absValue.toFixed(0)}`;
    }
  }

  formatDate(value: Date | string): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getBadgeColor(column: TableColumn, value: string): string {
    if (column.badgeColors && column.badgeColors[value]) {
      return column.badgeColors[value];
    }
    return '#6b7280';
  }

  onEdit(item: any): void {
    this.edit.emit(item);
  }

  onDelete(item: any): void {
    this.delete.emit(item);
  }
}