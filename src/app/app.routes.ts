import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./pages/auth/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'accounts', loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent) },
  { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent) },
  { path: 'budget', loadComponent: () => import('./pages/budget/budget.component').then(m => m.BudgetComponent) },
  { path: 'reminders', loadComponent: () => import('./pages/reminders/reminders.component').then(m => m.RemindersComponent) },
  { path: 'admin/usermanagement', loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
