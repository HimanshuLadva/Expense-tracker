import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DateRange {
  fromDate: string;
  toDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class DateRangeService {
  private dateRangeSubject: BehaviorSubject<DateRange>;
  public dateRange$: Observable<DateRange>;

  constructor() {
    // Initialize with the current month's first and last date
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const initialRange: DateRange = {
      fromDate: this.formatDateForInput(firstDay),
      toDate: this.formatDateForInput(lastDay)
    };

    this.dateRangeSubject = new BehaviorSubject<DateRange>(initialRange);
    this.dateRange$ = this.dateRangeSubject.asObservable();
  }

  updateDateRange(dateRange: DateRange): void {
    this.dateRangeSubject.next(dateRange);
  }

  getCurrentDateRange(): DateRange {
    return this.dateRangeSubject.value;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
