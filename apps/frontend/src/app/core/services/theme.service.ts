import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'aph-theme';

/**
 * Signal-based theme service. Persists preference and applies it via a
 * data-theme attribute on <html>, matched by the CSS custom properties
 * defined in assets/styles/theme.scss.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.getInitialMode());

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  toggle(): void {
    this.mode.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private getInitialMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
