import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { getIconBadgeColor } from '../icon-badge-color.util';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'badge' | 'icon' | 'icon-text';
  badgeColors?: { [key: string]: string };
  /** For 'icon-text' columns: field holding the icon glyph (defaults to `key` if omitted) */
  iconKey?: string;
  /** For 'icon' / 'icon-text' columns: field whose value seeds a consistent badge color (falls back to row index) */
  colorSeedKey?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollingModule],
  template: `
    <div class="data-table-container">
      @if (data.length > 0) {
        <div class="table-wrapper">
          @if (enableVirtualization) {
            <!-- Virtual Scroll Viewport for large datasets -->
            <cdk-virtual-scroll-viewport
              [itemSize]="itemHeight"
              class="virtual-viewport"
              (scrolledIndexChange)="onScrollIndexChange($event)">
              <table class="data-table">
                <thead>
                  <tr>
                    @for (column of columns; track column.key) {
                      <th [ngClass]="'column-' + column.type">{{ column.label }}</th>
                    }
                    @if (showActions) {
                      <th class="actions-column">Actions</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (item of displayedData; track trackByFn(item); let i = $index) {
                    <tr>
                      @for (column of columns; track column.key) {
                        <td [ngClass]="'column-' + column.type">
                          @switch (column.type) {
                            @case ('currency') {
                              <span class="currency-value">{{ formatCurrency(getNestedValue(item, column.key)) }}</span>
                            }
                            @case ('date') {
                              <span class="date-value">{{ formatDate(getNestedValue(item, column.key)) }}</span>
                            }
                            @case ('badge') {
                              <span
                                class="badge"
                                [style.--badge-color]="getBadgeColor(column, getNestedValue(item, column.key))"
                              >
                                {{ getNestedValue(item, column.key) }}
                              </span>
                            }
                            @case ('icon') {
                              <span
                                class="icon-badge"
                                [style.background-color]="iconBadgeColor(i)"
                              >
                                {{ getNestedValue(item, column.key) }}
                              </span>
                            }
                            @case ('icon-text') {
                              <span class="icon-text-cell">
                                <span
                                  class="icon-badge"
                                  [style.background-color]="iconBadgeColor(iconColorSeed(column, item, i))"
                                >
                                  {{ getNestedValue(item, column.iconKey || column.key) }}
                                </span>
                                <span class="icon-text-label">{{ getNestedValue(item, column.key) }}</span>
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
                              aria-label="Edit"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12.5 5.5l4 4L7 19H3v-4z"/>
                                <path d="M15 3.5l4.5 4.5"/>
                              </svg>
                            </button>
                            <button
                              type="button"
                              class="action-btn delete-btn"
                              (click)="onDelete(item)"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 7h16"/>
                                <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>
                                <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </cdk-virtual-scroll-viewport>
          } @else {
            <!-- Original Table Design -->
            <table class="data-table">
              <thead>
                <tr>
                  @for (column of columns; track column.key) {
                    <th [ngClass]="'column-' + column.type">{{ column.label }}</th>
                  }
                  @if (showActions) {
                    <th class="actions-column">Actions</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (item of displayedData; track trackByFn(item); let i = $index) {
                  <tr>
                    @for (column of columns; track column.key) {
                      <td [ngClass]="'column-' + column.type">
                        @switch (column.type) {
                          @case ('currency') {
                            <span class="currency-value">{{ formatCurrency(getNestedValue(item, column.key)) }}</span>
                          }
                          @case ('date') {
                            <span class="date-value">{{ formatDate(getNestedValue(item, column.key)) }}</span>
                          }
                          @case ('badge') {
                            <span
                              class="badge"
                              [style.--badge-color]="getBadgeColor(column, getNestedValue(item, column.key))"
                            >
                              {{ getNestedValue(item, column.key) }}
                            </span>
                          }
                          @case ('icon') {
                            <span
                              class="icon-badge"
                              [style.background-color]="iconBadgeColor(i)"
                            >
                              {{ getNestedValue(item, column.key) }}
                            </span>
                          }
                          @case ('icon-text') {
                            <span class="icon-text-cell">
                              <span
                                class="icon-badge"
                                [style.background-color]="iconBadgeColor(iconColorSeed(column, item, i))"
                              >
                                {{ getNestedValue(item, column.iconKey || column.key) }}
                              </span>
                              <span class="icon-text-label">{{ getNestedValue(item, column.key) }}</span>
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
                            aria-label="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12.5 5.5l4 4L7 19H3v-4z"/>
                              <path d="M15 3.5l4.5 4.5"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="action-btn delete-btn"
                            (click)="onDelete(item)"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M4 7h16"/>
                              <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>
                              <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
        <div class="table-footer">
          <span class="record-count">{{ data.length }} {{ data.length === 1 ? 'record' : 'records' }}</span>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8.5L6 4h12l3 4.5"/>
              <path d="M3 8.5v10A1.5 1.5 0 0 0 4.5 20h15a1.5 1.5 0 0 0 1.5-1.5v-10"/>
              <path d="M3 8.5h18"/>
              <path d="M9.5 12.5a2.5 2.5 0 0 0 5 0"/>
            </svg>
          </div>
          <h3>{{ emptyTitle }}</h3>
          <p>{{ emptyMessage }}</p>
        </div>
      }

      <!-- Loading Overlay -->
      @if (isLoading) {
        <div class="loading-overlay">
          <div class="loading-popup">
            <span class="spinner"></span>
            Loading
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-table-container {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      position: relative;

      .table-wrapper {
        overflow-x: auto;

        .data-table {
          width: 100%;
          border-collapse: collapse;

          thead {
            th {
              position: sticky;
              top: 0;
              z-index: 2;
              background-color: var(--surface-muted);
              padding: 0.8rem 1.1rem;
              text-align: left;
              font-family: var(--font-heading);
              font-weight: 600;
              color: var(--text-secondary);
              border-bottom: 1px solid var(--border-default);
              font-size: 0.72rem;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              white-space: nowrap;

              &.actions-column {
                width: 110px;
                text-align: center;
              }

              &.column-currency {
                text-align: right;
              }

              &.column-icon {
                width: 64px;
                text-align: center;
              }

              &:first-child {
                min-width: 130px;
                text-align: left;

                &.column-icon {
                  min-width: 64px;
                }
              }
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid var(--border-subtle);
              transition: background-color 0.15s ease;

              &:hover {
                background-color: var(--surface-muted);
              }

              &:last-child {
                border-bottom: none;
              }

              td {
                padding: 0.9rem 1.1rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
                vertical-align: middle;
                font-size: 0.9rem;

                &.column-badge {
                  min-width: 120px;
                }

                &.column-currency {
                  text-align: right;
                  min-width: 140px;
                  font-variant-numeric: tabular-nums;
                }

                &.actions-column {
                  text-align: center;
                  white-space: normal;
                  overflow: visible;
                }

                &.column-icon {
                  width: 64px;
                  text-align: center;
                }

                &.column-icon-text {
                  min-width: 180px;
                }

                &:first-child {
                  text-align: left;
                  font-weight: 600;
                  color: var(--text-primary);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 200px;
                  min-width: 130px;

                  &.column-icon {
                    min-width: 64px;
                    max-width: 64px;
                    font-weight: 400;
                  }

                  &.column-icon-text {
                    min-width: 180px;
                    max-width: 240px;
                  }
                }

                .icon-badge {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 34px;
                  height: 34px;
                  border-radius: 50%;
                  font-size: 1.05rem;
                  box-shadow: var(--shadow-sm);
                  flex-shrink: 0;
                }

                .icon-text-cell {
                  display: flex;
                  align-items: center;
                  gap: 0.65rem;
                  min-width: 0;

                  .icon-text-label {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    min-width: 0;
                  }
                }

                .currency-value {
                  font-weight: 600;
                  color: var(--color-accent);
                }

                .date-value {
                  color: var(--text-muted);
                  font-size: 0.85rem;
                }

                .badge {
                  padding: 0.3rem 0.75rem;
                  border-radius: var(--radius-pill);
                  font-size: 0.72rem;
                  font-weight: 600;
                  text-transform: capitalize;
                  color: var(--badge-color, #6b7280);
                  background: color-mix(in srgb, var(--badge-color, #6b7280) 14%, white);
                  border: 1px solid color-mix(in srgb, var(--badge-color, #6b7280) 28%, white);
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 26px;
                  vertical-align: middle;
                }

                .action-buttons {
                  display: flex;
                  gap: 0.5rem;
                  justify-content: center;

                  .action-btn {
                    padding: 0;
                    border: 1px solid transparent;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    min-width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    svg {
                      width: 16px;
                      height: 16px;
                    }

                    &.edit-btn {
                      background-color: var(--color-primary-tint);
                      border-color: color-mix(in srgb, var(--color-primary-light) 35%, white);
                      color: var(--color-primary);

                      &:hover {
                        background-color: color-mix(in srgb, var(--color-primary-light) 22%, white);
                        transform: translateY(-1px);
                      }
                    }

                    &.delete-btn {
                      background-color: var(--color-destructive-tint);
                      border-color: color-mix(in srgb, var(--color-destructive) 35%, white);
                      color: var(--color-destructive);

                      &:hover {
                        background-color: color-mix(in srgb, var(--color-destructive) 18%, white);
                        transform: translateY(-1px);
                      }
                    }

                    &:focus-visible {
                      outline: 2px solid var(--color-primary-light);
                      outline-offset: 1px;
                    }
                  }
                }
              }
            }
          }
        }
      }

      .table-footer {
        padding: 0.65rem 1.1rem;
        background-color: var(--surface-muted);
        border-top: 1px solid var(--border-subtle);

        .record-count {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      }

      /* Virtual Scroll specific styles - only when enabled */
      .virtual-viewport {
        height: 400px;
        overflow-y: auto;
      }

      /* Loading overlay */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;

        .loading-popup {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-primary);
          color: white;
          padding: 0.7rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.85rem;
          box-shadow: var(--shadow-md);

          .spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-top-color: #fff;
            animation: table-spin 0.7s linear infinite;
          }
        }
      }

      .empty-state {
        padding: 3.5rem 2rem;
        text-align: center;

        .empty-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          color: var(--text-muted);

          svg {
            width: 100%;
            height: 100%;
          }
        }

        h3 {
          margin: 0 0 0.375rem 0;
          color: var(--text-primary);
          font-size: 1.15rem;
        }

        p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      }
    }

    @keyframes table-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none !important;
      }
    }

    @media (max-width: 768px) {
      .data-table-container {
        margin: 0;
      }

      .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .data-table {
        font-size: 0.75rem;
        min-width: 600px;

        thead th {
          padding: 0.6rem 0.5rem;
          font-size: 0.68rem;
          white-space: nowrap;

          &.actions-column {
            width: 90px;
          }

          &:first-child {
            min-width: 90px;
            padding: 0.6rem 0.5rem;
            text-align: left;
          }
        }

        tbody td {
          padding: 0.7rem 0.5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          vertical-align: middle;

          &.actions-column {
            text-align: center;
            white-space: normal;
            overflow: visible;
          }

          &:first-child {
            padding: 0.7rem 0.5rem;
            font-size: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
            min-width: 90px;
            text-align: left;
          }
        }

        .currency-value {
          font-size: 0.78rem;
        }

        .date-value {
          font-size: 0.7rem;
        }

        .badge {
          padding: 0.2rem 0.55rem;
          font-size: 0.65rem;
        }

        .action-buttons {
          display: flex;
          flex-direction: row;
          gap: 0.375rem;
          justify-content: center;

          .action-btn {
            min-width: 30px;
            height: 30px;
            border-radius: 6px;

            svg {
              width: 14px;
              height: 14px;
            }
          }
        }
      }
    }

    @media (max-width: 480px) {
      .data-table {
        min-width: 550px;
        font-size: 0.7rem;

        thead th {
          padding: 0.5rem 0.375rem;
          font-size: 0.65rem;
        }

        tbody td {
          padding: 0.5rem 0.375rem;
          max-width: 100px;
        }
      }
    }
  `]
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showActions = true;
  @Input() emptyTitle = 'No Data';
  @Input() emptyMessage = 'No data available to display.';
  @Input() enableVirtualization = false;
  @Input() itemHeight = 60;
  @Input() pageSize = 50;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  displayedData: any[] = [];
  allData: any[] = [];
  currentPage = 0;
  isLoading = false;

  ngOnInit(): void {
    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.initializeData();
    }
  }

  private initializeData(): void {
    this.allData = [...this.data];
    this.currentPage = 0;

    if (this.enableVirtualization) {
      this.displayedData = this.allData.slice(0, this.pageSize);
    } else {
      this.displayedData = this.allData;
    }
  }

  onScrollIndexChange(index: number): void {
    if (!this.enableVirtualization || this.isLoading) return;

    const endIndex = index + this.getViewportSize();
    const threshold = Math.max(10, Math.floor(this.pageSize * 0.8));

    if (endIndex >= this.displayedData.length - threshold && this.shouldLoadMore()) {
      this.loadMoreData();
    }
  }

  private getViewportSize(): number {
    return Math.ceil(400 / this.itemHeight); // Assuming 400px viewport height
  }

  private shouldLoadMore(): boolean {
    return this.displayedData.length < this.allData.length;
  }

  private loadMoreData(): void {
    if (this.isLoading || !this.shouldLoadMore()) return;

    this.isLoading = true;

    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextPage = this.currentPage + 1;
      const startIndex = nextPage * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, this.allData.length);
      const newData = this.allData.slice(startIndex, endIndex);

      this.displayedData = [...this.displayedData, ...newData];
      this.currentPage = nextPage;
      this.isLoading = false;
    }, 300);
  }

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

  iconBadgeColor(index: number): string {
    return getIconBadgeColor(index);
  }

  iconColorSeed(column: TableColumn, item: any, fallbackIndex: number): number {
    if (column.colorSeedKey) {
      const seed = this.getNestedValue(item, column.colorSeedKey);
      if (typeof seed === 'number') {
        return seed;
      }
    }
    return fallbackIndex;
  }

  onEdit(item: any): void {
    this.edit.emit(item);
  }

  onDelete(item: any): void {
    this.delete.emit(item);
  }
}
