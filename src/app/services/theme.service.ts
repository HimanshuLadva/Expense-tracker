import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme_preference';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private preferenceSubject: BehaviorSubject<ThemePreference>;
  public preference$: Observable<ThemePreference>;

  private effectiveThemeSubject: BehaviorSubject<EffectiveTheme>;
  public effectiveTheme$: Observable<EffectiveTheme>;

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    const storedPreference = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const initialPreference: ThemePreference = storedPreference ?? 'system';

    this.preferenceSubject = new BehaviorSubject<ThemePreference>(initialPreference);
    this.preference$ = this.preferenceSubject.asObservable();

    this.effectiveThemeSubject = new BehaviorSubject<EffectiveTheme>(this.resolveEffectiveTheme(initialPreference));
    this.effectiveTheme$ = this.effectiveThemeSubject.asObservable();

    this.applyTheme(this.effectiveThemeSubject.value);

    this.mediaQuery.addEventListener('change', () => {
      if (this.preferenceSubject.value === 'system') {
        this.applyTheme(this.resolveEffectiveTheme('system'));
      }
    });
  }

  getPreference(): ThemePreference {
    return this.preferenceSubject.value;
  }

  getEffectiveTheme(): EffectiveTheme {
    return this.effectiveThemeSubject.value;
  }

  setTheme(preference: ThemePreference): void {
    localStorage.setItem(STORAGE_KEY, preference);
    this.preferenceSubject.next(preference);
    this.applyTheme(this.resolveEffectiveTheme(preference));
  }

  cycleTheme(): void {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const nextIndex = (order.indexOf(this.preferenceSubject.value) + 1) % order.length;
    this.setTheme(order[nextIndex]);
  }

  private resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
    if (preference === 'system') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return preference;
  }

  private applyTheme(effectiveTheme: EffectiveTheme): void {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    this.effectiveThemeSubject.next(effectiveTheme);
  }
}
