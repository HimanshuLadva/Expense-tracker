import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account, Category, Transaction, Reminder, Budget } from '../models';
import { AccountApiService } from './account-api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEYS = {
    ACCOUNTS: 'expense_tracker_accounts',
    CATEGORIES: 'expense_tracker_categories',
    TRANSACTIONS: 'expense_tracker_transactions',
    REMINDERS: 'expense_tracker_reminders',
    BUDGETS: 'expense_tracker_budgets'
  };

  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>(this.getCategories());
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getTransactions());
  private remindersSubject = new BehaviorSubject<Reminder[]>(this.getReminders());
  private budgetsSubject = new BehaviorSubject<Budget[]>(this.getBudgets());

  public accounts$ = this.accountsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public transactions$ = this.transactionsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public budgets$ = this.budgetsSubject.asObservable();

  constructor(private accountApiService: AccountApiService) {}

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

  getCategories(): Category[] {
    return this.getFromStorage<Category>(this.STORAGE_KEYS.CATEGORIES);
  }

  saveCategory(category: Category): void {
    const categories = this.getCategories();
    const existingIndex = categories.findIndex(c => c.id === category.id);

    if (existingIndex >= 0) {
      categories[existingIndex] = { ...category, updatedAt: new Date() };
    } else {
      categories.push({ ...category, createdAt: new Date(), updatedAt: new Date() });
    }

    this.saveToStorage(this.STORAGE_KEYS.CATEGORIES, categories);
    this.categoriesSubject.next(categories);
  }

  deleteCategory(id: number): void {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.CATEGORIES, categories);
    this.categoriesSubject.next(categories);
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

  getReminders(): Reminder[] {
    return this.getFromStorage<Reminder>(this.STORAGE_KEYS.REMINDERS);
  }

  saveReminder(reminder: Reminder): void {
    const reminders = this.getReminders();
    const existingIndex = reminders.findIndex(r => r.id === reminder.id);

    if (existingIndex >= 0) {
      reminders[existingIndex] = { ...reminder, updatedAt: new Date() };
    } else {
      reminders.push({ ...reminder, createdAt: new Date(), updatedAt: new Date() });
    }

    this.saveToStorage(this.STORAGE_KEYS.REMINDERS, reminders);
    this.remindersSubject.next(reminders);
  }

  deleteReminder(id: number): void {
    const reminders = this.getReminders().filter(r => r.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.REMINDERS, reminders);
    this.remindersSubject.next(reminders);
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