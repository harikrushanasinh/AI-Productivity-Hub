import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/auth/auth.service';
import { NotificationBellComponent } from '../features/notifications/bell/notification-bell.component';

@Component({
  selector: 'aph-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NotificationBellComponent],
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
    { path: '/habits', icon: '🔥', label: 'Habits' },
    { path: '/goals', icon: '🎯', label: 'Goals' },
    { path: '/focus', icon: '⏱️', label: 'Focus Timer' },
    { path: '/bookmarks', icon: '🔖', label: 'Bookmarks' },
    { path: '/files', icon: '📁', label: 'File Manager' },
    { path: '/vault', icon: '🔐', label: 'Password Vault' },
  ];

  constructor(
    readonly theme: ThemeService,
    readonly auth: AuthService,
  ) {}
}
