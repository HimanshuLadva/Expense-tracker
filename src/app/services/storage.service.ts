import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account, Category, Transaction, Reminder, Budget, GetRemindersRequest } from '../models';
import { AccountApiService } from './account-api.service';
import { CategoryApiService } from './category-api.service';
import { ReminderApiService } from './reminder-api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEYS = {
    ACCOUNTS: 'expense_tracker_accounts',
    CATEGORIES: 'expense_tracker_categories',
    TRANSACTIONS: 'expense_tracker_transactions',
    // REMINDERS: 'expense_tracker_reminders', // Now using API instead of localStorage
    BUDGETS: 'expense_tracker_budgets'
  };

  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getTransactions());
  private remindersSubject = new BehaviorSubject<Reminder[]>([]);
  private budgetsSubject = new BehaviorSubject<Budget[]>(this.getBudgets());

  public accounts$ = this.accountsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public transactions$ = this.transactionsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public budgets$ = this.budgetsSubject.asObservable();

  constructor(
    private accountApiService: AccountApiService,
    private categoryApiService: CategoryApiService,
    private reminderApiService: ReminderApiService
  ) {}

  /**
   * Load accounts from API - call this from AccountsComponent
   */
  loadAccounts(): void {
    this.accountApiService.getAll().subscribe({
      next: (accounts) => {
        this.accountsSubject.next(accounts);
      },
      error: (error) => {
        console.error('Error loading accounts from API:', error);
        this.accountsSubject.next([]);
      }
    });
  }

  /**
   * Load categories from API - call this from CategoriesComponent
   */
  loadCategories(): void {
    this.categoryApiService.getAll().subscribe({
      next: (categories) => {
        this.categoriesSubject.next(categories);
      },
      error: (error) => {
        console.error('Error loading categories from API:', error);
        this.categoriesSubject.next([]);
      }
    });
  }

  /**
   * Load all reminders from API - call this from RemindersComponent
   */
  loadReminders(request?: GetRemindersRequest): void {
    this.reminderApiService.getAll(request).subscribe({
      next: (reminders) => {
        this.remindersSubject.next(reminders);
      },
      error: (error) => {
        console.error('Error loading reminders from API:', error);
        this.remindersSubject.next([]);
      }
    });
  }

  /**
   * Load active reminders from API - call this from DashboardComponent
   */
  loadActiveReminders(request?: GetRemindersRequest): void {
    this.reminderApiService.getActive(request).subscribe({
      next: (reminders) => {
        this.remindersSubject.next(reminders);
      },
      error: (error) => {
        console.error('Error loading active reminders from API:', error);
        this.remindersSubject.next([]);
      }
    });
  }

  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data, (key, value) => {
        if (key.endsWith('At') || key === 'date') {
          return new Date(value);
        }
        return value;
      }) : [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  generateId(): number {
    return Date.now();
  }

  /**
   * Get current accounts value (synchronous)
   */
  getAccounts(): Account[] {
    return this.accountsSubject.value;
  }

  /**
   * Save account (create or update) via API
   */
  saveAccount(account: Account, isUpdate: boolean = false): Observable<Account> {
    return new Observable(observer => {
      if (isUpdate) {
        const updateRequest = {
          id: account.id,
          name: account.name,
          initialAmount: account.initialAmount,
          currentBalance: account.currentBalance,
          icon: account.icon
        };

        this.accountApiService.update(updateRequest).subscribe({
          next: (updatedAccount) => {
            this.loadAccounts(); // Refresh accounts list
            observer.next(updatedAccount);
            observer.complete();
          },
          error: (error) => {
            console.error('Error updating account:', error);
            observer.error(error);
          }
        });
      } else {
        const createRequest = {
          name: account.name,
          initialAmount: account.initialAmount,
          icon: account.icon
        };

        this.accountApiService.create(createRequest).subscribe({
          next: (newAccount) => {
            this.loadAccounts(); // Refresh accounts list
            observer.next(newAccount);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating account:', error);
            observer.error(error);
          }
        });
      }
    });
  }

  /**
   * Delete account via API
   */
  deleteAccount(id: number): Observable<void> {
    return new Observable(observer => {
      this.accountApiService.delete(id).subscribe({
        next: () => {
          this.loadAccounts(); // Refresh accounts list
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Update account balance (for transactions)
   */
  updateAccountBalance(accountId: number, amount: number): void {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      const updatedBalance = account.currentBalance + amount;
      const updateRequest = {
        id: account.id,
        name: account.name,
        initialAmount: account.initialAmount,
        currentBalance: updatedBalance,
        icon: account.icon
      };

      this.accountApiService.update(updateRequest).subscribe({
        next: () => {
          this.loadAccounts(); // Refresh accounts list
        },
        error: (error) => {
          console.error('Error updating account balance:', error);
        }
      });
    }
  }

  /**
   * Get current categories value (synchronous)
   */
  getCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  /**
   * Save category (create or update) via API
   */
  saveCategory(category: Category, isUpdate: boolean = false): Observable<Category> {
    return new Observable(observer => {
      if (isUpdate) {
        const updateRequest = {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase() as 'income' | 'expense', // Ensure lowercase string
          icon: category.icon
        };

        this.categoryApiService.update(updateRequest).subscribe({
          next: (updatedCategory) => {
            this.loadCategories(); // Refresh categories list
            observer.next(updatedCategory);
            observer.complete();
          },
          error: (error) => {
            console.error('Error updating category:', error);
            observer.error(error);
          }
        });
      } else {
        const createRequest = {
          name: category.name,
          type: category.type.toLowerCase() as 'income' | 'expense', // Ensure lowercase string
          icon: category.icon
        };

        this.categoryApiService.create(createRequest).subscribe({
          next: (newCategory) => {
            this.loadCategories(); // Refresh categories list
            observer.next(newCategory);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating category:', error);
            observer.error(error);
          }
        });
      }
    });
  }

  /**
   * Delete category via API
   */
  deleteCategory(id: number): Observable<void> {
    return new Observable(observer => {
      this.categoryApiService.delete(id).subscribe({
        next: () => {
          this.loadCategories(); // Refresh categories list
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          observer.error(error);
        }
      });
    });
  }

  getTransactions(): Transaction[] {
    return this.getFromStorage<Transaction>(this.STORAGE_KEYS.TRANSACTIONS);
  }

  saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);

    if (existingIndex >= 0) {
      const oldTransaction = transactions[existingIndex];
      this.revertTransactionEffect(oldTransaction);
      transactions[existingIndex] = { ...transaction, updatedAt: new Date() };
    } else {
      transactions.push({ ...transaction, createdAt: new Date(), updatedAt: new Date() });
    }

    this.applyTransactionEffect(transaction);
    this.saveToStorage(this.STORAGE_KEYS.TRANSACTIONS, transactions);
    this.transactionsSubject.next(transactions);
  }

  deleteTransaction(id: number): void {
    const transactions = this.getTransactions();
    const transaction = transactions.find(t => t.id === id);

    if (transaction) {
      this.revertTransactionEffect(transaction);
      const updatedTransactions = transactions.filter(t => t.id !== id);
      this.saveToStorage(this.STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
      this.transactionsSubject.next(updatedTransactions);
    }
  }

  private applyTransactionEffect(transaction: Transaction): void {
    const accounts = this.getAccounts();

    switch (transaction.type) {
      case 'income':
        this.updateAccountBalance(transaction.accountId, transaction.amount);
        break;
      case 'expense':
        this.updateAccountBalance(transaction.accountId, -transaction.amount);
        break;
      case 'transfer':
        if (transaction.toAccountId) {
          this.updateAccountBalance(transaction.accountId, -transaction.amount);
          this.updateAccountBalance(transaction.toAccountId, transaction.amount);
        }
        break;
    }
  }

  private revertTransactionEffect(transaction: Transaction): void {
    switch (transaction.type) {
      case 'income':
        this.updateAccountBalance(transaction.accountId, -transaction.amount);
        break;
      case 'expense':
        this.updateAccountBalance(transaction.accountId, transaction.amount);
        break;
      case 'transfer':
        if (transaction.toAccountId) {
          this.updateAccountBalance(transaction.accountId, transaction.amount);
          this.updateAccountBalance(transaction.toAccountId, -transaction.amount);
        }
        break;
    }
  }

  /**
   * Get current reminders value (synchronous)
   */
  getReminders(): Reminder[] {
    return this.remindersSubject.value;
  }

  /**
   * Save reminder (create or update) via API
   */
  saveReminder(reminder: Reminder, isUpdate: boolean = false): Observable<Reminder> {
    return new Observable(observer => {
      if (isUpdate) {
        const updateRequest = {
          id: reminder.id,
          title: reminder.title,
          date: reminder.date,
          beforeDays: reminder.beforeDays,
          afterDays: reminder.afterDays,
          isActive: reminder.isActive
        };

        this.reminderApiService.update(updateRequest).subscribe({
          next: (updatedReminder) => {
            // Component will handle reload with date range parameters
            observer.next(updatedReminder);
            observer.complete();
          },
          error: (error) => {
            console.error('Error updating reminder:', error);
            observer.error(error);
          }
        });
      } else {
        const createRequest = {
          title: reminder.title,
          date: reminder.date,
          beforeDays: reminder.beforeDays,
          afterDays: reminder.afterDays
        };

        this.reminderApiService.create(createRequest).subscribe({
          next: (newReminder) => {
            // Component will handle reload with date range parameters
            observer.next(newReminder);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating reminder:', error);
            observer.error(error);
          }
        });
      }
    });
  }

  /**
   * Delete reminder via API
   */
  deleteReminder(id: number): Observable<void> {
    return new Observable(observer => {
      this.reminderApiService.delete(id).subscribe({
        next: () => {
          // Component will handle reload with date range parameters
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error deleting reminder:', error);
          observer.error(error);
        }
      });
    });
  }

  getBudgets(): Budget[] {
    return this.getFromStorage<Budget>(this.STORAGE_KEYS.BUDGETS);
  }

  saveBudget(budget: Budget): void {
    const budgets = this.getBudgets();
    const existingIndex = budgets.findIndex(b => b.id === budget.id);

    if (existingIndex >= 0) {
      budgets[existingIndex] = { ...budget, updatedAt: new Date() };
    } else {
      budgets.push({ ...budget, createdAt: new Date(), updatedAt: new Date() });
    }

    this.saveToStorage(this.STORAGE_KEYS.BUDGETS, budgets);
    this.budgetsSubject.next(budgets);
  }

  deleteBudget(id: number): void {
    const budgets = this.getBudgets().filter(b => b.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.BUDGETS, budgets);
    this.budgetsSubject.next(budgets);
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    this.accountsSubject.next([]);
    this.categoriesSubject.next([]);
    this.transactionsSubject.next([]);
    this.remindersSubject.next([]);
    this.budgetsSubject.next([]);
  }
}