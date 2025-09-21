import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account, Category, Transaction, Reminder } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEYS = {
    ACCOUNTS: 'expense_tracker_accounts',
    CATEGORIES: 'expense_tracker_categories',
    TRANSACTIONS: 'expense_tracker_transactions',
    REMINDERS: 'expense_tracker_reminders'
  };

  private accountsSubject = new BehaviorSubject<Account[]>(this.getAccounts());
  private categoriesSubject = new BehaviorSubject<Category[]>(this.getCategories());
  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.getTransactions());
  private remindersSubject = new BehaviorSubject<Reminder[]>(this.getReminders());

  public accounts$ = this.accountsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public transactions$ = this.transactionsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();

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

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getAccounts(): Account[] {
    return this.getFromStorage<Account>(this.STORAGE_KEYS.ACCOUNTS);
  }

  saveAccount(account: Account): void {
    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);

    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...account, updatedAt: new Date() };
    } else {
      accounts.push({ ...account, createdAt: new Date(), updatedAt: new Date() });
    }

    this.saveToStorage(this.STORAGE_KEYS.ACCOUNTS, accounts);
    this.accountsSubject.next(accounts);
  }

  deleteAccount(id: string): void {
    const accounts = this.getAccounts().filter(a => a.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.ACCOUNTS, accounts);
    this.accountsSubject.next(accounts);
  }

  updateAccountBalance(accountId: string, amount: number): void {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      account.currentBalance += amount;
      account.updatedAt = new Date();
      this.saveToStorage(this.STORAGE_KEYS.ACCOUNTS, accounts);
      this.accountsSubject.next(accounts);
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

  deleteCategory(id: string): void {
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

  deleteTransaction(id: string): void {
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

  deleteReminder(id: string): void {
    const reminders = this.getReminders().filter(r => r.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.REMINDERS, reminders);
    this.remindersSubject.next(reminders);
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    this.accountsSubject.next([]);
    this.categoriesSubject.next([]);
    this.transactionsSubject.next([]);
    this.remindersSubject.next([]);
  }
}