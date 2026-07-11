import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'aph-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Welcome{{ auth.user()?.fullName ? ', ' + auth.user()?.fullName : '' }} 👋</h1>
    <p>Your notes, tasks, and AI tools all live here. Pick a module from the sidebar to begin.</p>
  `,
})
export class DashboardComponent {
  constructor(readonly auth: AuthService) {}
}
