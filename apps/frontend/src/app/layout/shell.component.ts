import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'aph-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/notes', icon: '📝', label: 'Notes' },
    { path: '/tasks', icon: '✅', label: 'Tasks' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/journal', icon: '📔', label: 'Journal' },
    { path: '/expenses', icon: '💰', label: 'Expenses' },
  ];

  constructor(
    readonly theme: ThemeService,
    readonly auth: AuthService,
  ) {}
}
