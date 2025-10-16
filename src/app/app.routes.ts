import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'accounts', loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent) },
  { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent) },
  { path: 'budget', loadComponent: () => import('./pages/budget/budget.component').then(m => m.BudgetComponent) },
  { path: 'reminders', loadComponent: () => import('./pages/reminders/reminders.component').then(m => m.RemindersComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
