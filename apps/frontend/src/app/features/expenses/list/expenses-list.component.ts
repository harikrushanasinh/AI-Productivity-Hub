import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpensesApiService } from '../services/expenses-api.service';
import { Expense, ExpenseSummary } from '../models/expense.model';

@Component({
  selector: 'aph-expenses-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses-list.component.html',
  styleUrl: './expenses-list.component.scss',
})
export class ExpensesListComponent implements OnInit {
  readonly expenses = signal<Expense[]>([]);
  readonly summary = signal<ExpenseSummary | null>(null);
  readonly loading = signal(true);

  readonly newTitle = signal('');
  readonly newAmount = signal<number | null>(null);
  readonly newDate = signal(new Date().toISOString().slice(0, 10));
  readonly newType = signal<'expense' | 'income'>('expense');

  constructor(private readonly expensesApi: ExpensesApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.expensesApi.list().subscribe({
      next: (res) => {
        this.expenses.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.expensesApi.summary().subscribe((s) => this.summary.set(s));
  }

  createExpense(): void {
    const title = this.newTitle().trim();
    const amount = this.newAmount();
    if (!title || !amount || amount <= 0) return;

    this.expensesApi
      .create({
        title,
        amountMinor: Math.round(amount * 100),
        spentOn: this.newDate(),
        type: this.newType(),
      })
      .subscribe(() => {
        this.newTitle.set('');
        this.newAmount.set(null);
        this.refresh();
      });
  }

  deleteExpense(id: string): void {
    this.expensesApi.remove(id).subscribe(() => this.refresh());
  }

  formatAmount(minor: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
  }

  trackByExpenseId(_index: number, expense: Expense): string {
    return expense.id;
  }
}
