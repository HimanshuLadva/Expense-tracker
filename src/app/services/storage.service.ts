import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account, Category, Transaction, Reminder, Budget, User, GetRemindersRequest, GetTransactionsRequest, GetBudgetsRequest } from '../models';
import { AccountApiService } from './account-api.service';
import { CategoryApiService } from './category-api.service';
import { ReminderApiService } from './reminder-api.service';
import { TransactionApiService } from './transaction-api.service';
import { BudgetApiService } from './budget-api.service';
import { UserApiService } from './user-api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEYS = {
    ACCOUNTS: 'expense_tracker_accounts',
    CATEGORIES: 'expense_tracker_categories'
    // TRANSACTIONS: Now using API instead of localStorage
    // REMINDERS: Now using API instead of localStorage
    // BUDGETS: Now using API instead of localStorage
  };

  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private remindersSubject = new BehaviorSubject<Reminder[]>([]);
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  private usersSubject = new BehaviorSubject<User[]>([]);

  public accounts$ = this.accountsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public transactions$ = this.transactionsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public budgets$ = this.budgetsSubject.asObservable();
  public users$ = this.usersSubject.asObservable();

  constructor(
    private accountApiService: AccountApiService,
    private categoryApiService: CategoryApiService,
    private reminderApiService: ReminderApiService,
    private transactionApiService: TransactionApiService,
    private budgetApiService: BudgetApiService,
    private userApiService: UserApiService
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

  /**
   * Load transactions from API with optional date range filtering
   * Call this from TransactionsComponent, DashboardComponent, BudgetComponent
   */
  loadTransactions(request?: GetTransactionsRequest): void {
    this.transactionApiService.getAll(request).subscribe({
      next: (transactions) => {
        this.transactionsSubject.next(transactions);
      },
      error: (error) => {
        console.error('Error loading transactions from API:', error);
        this.transactionsSubject.next([]);
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

  /**
   * Get current transactions value (synchronous)
   */
  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  /**
   * Save transaction (create or update) via API
   */
  saveTransaction(transaction: Transaction, isUpdate: boolean = false): Observable<Transaction> {
    return new Observable(observer => {
      if (isUpdate) {
        // For updates, first revert the old transaction effect
        const transactions = this.getTransactions();
        const oldTransaction = transactions.find(t => t.id === transaction.id);
        if (oldTransaction) {
          this.revertTransactionEffect(oldTransaction);
        }

        const updateRequest = {
          id: transaction.id,
          type: transaction.type.toLowerCase() as 'income' | 'expense' | 'transfer',
          amount: transaction.amount,
          date: transaction.date.toISOString(),
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          toAccountId: transaction.toAccountId,
          narration: transaction.narration
        };

        this.transactionApiService.update(updateRequest).subscribe({
          next: (updatedTransaction) => {
            this.applyTransactionEffect(transaction);
            // Component will handle reload with date range parameters
            observer.next(updatedTransaction);
            observer.complete();
          },
          error: (error) => {
            // Reapply old transaction effect if update fails
            if (oldTransaction) {
              this.applyTransactionEffect(oldTransaction);
            }
            console.error('Error updating transaction:', error);
            observer.error(error);
          }
        });
      } else {
        const createRequest = {
          type: transaction.type.toLowerCase() as 'income' | 'expense' | 'transfer',
          amount: transaction.amount,
          date: transaction.date.toISOString(),
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          toAccountId: transaction.toAccountId,
          narration: transaction.narration
        };

        this.transactionApiService.create(createRequest).subscribe({
          next: (newTransaction) => {
            this.applyTransactionEffect(transaction);
            // Component will handle reload with date range parameters
            observer.next(newTransaction);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating transaction:', error);
            observer.error(error);
          }
        });
      }
    });
  }

  /**
   * Delete transaction via API
   */
  deleteTransaction(id: number): Observable<void> {
    return new Observable(observer => {
      // First revert the transaction effect
      const transactions = this.getTransactions();
      const transaction = transactions.find(t => t.id === id);

      if (transaction) {
        this.revertTransactionEffect(transaction);
      }

      this.transactionApiService.delete(id).subscribe({
        next: () => {
          // Component will handle reload with date range parameters
          observer.next();
          observer.complete();
        },
        error: (error) => {
          // Reapply transaction effect if delete fails
          if (transaction) {
            this.applyTransactionEffect(transaction);
          }
          console.error('Error deleting transaction:', error);
          observer.error(error);
        }
      });
    });
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
   * Get reminder by ID via API
   */
  getReminderById(id: number): Observable<Reminder> {
    return this.reminderApiService.getById(id);
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

  /**
   * Load all budgets from API - call this from BudgetComponent
   */
  loadBudgets(request?: GetBudgetsRequest): void {
    this.budgetApiService.getAll(request).subscribe({
      next: (budgets) => {
        this.budgetsSubject.next(budgets);
      },
      error: (error) => {
        console.error('Error loading budgets from API:', error);
        this.budgetsSubject.next([]);
      }
    });
  }

  /**
   * Load active budgets from API
   */
  loadActiveBudgets(request?: GetBudgetsRequest): void {
    this.budgetApiService.getActive(request).subscribe({
      next: (budgets) => {
        this.budgetsSubject.next(budgets);
      },
      error: (error) => {
        console.error('Error loading active budgets from API:', error);
        this.budgetsSubject.next([]);
      }
    });
  }

  /**
   * Get budgets synchronously from current state
   */
  getBudgets(): Budget[] {
    return this.budgetsSubject.value;
  }

  /**
   * Get budget by ID via API
   */
  getBudgetById(id: number): Observable<Budget> {
    return this.budgetApiService.getById(id);
  }

  /**
   * Create new budget via API
   */
  createBudget(request: any): Observable<Budget> {
    return new Observable(observer => {
      this.budgetApiService.create(request).subscribe({
        next: (budget) => {
          // Component will handle reload with date range parameters
          observer.next(budget);
          observer.complete();
        },
        error: (error) => {
          console.error('Error creating budget:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Update budget via API
   */
  updateBudget(request: any): Observable<Budget> {
    return new Observable(observer => {
      this.budgetApiService.update(request).subscribe({
        next: (budget) => {
          // Component will handle reload with date range parameters
          observer.next(budget);
          observer.complete();
        },
        error: (error) => {
          console.error('Error updating budget:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Delete budget via API
   */
  deleteBudget(id: number): Observable<void> {
    return new Observable(observer => {
      this.budgetApiService.delete(id).subscribe({
        next: () => {
          // Component will handle reload with date range parameters
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error deleting budget:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Load users from API - call this from UserManagementComponent
   */
  loadUsers(): void {
    this.userApiService.getAll().subscribe({
      next: (users) => {
        this.usersSubject.next(users);
      },
      error: (error) => {
        console.error('Error loading users from API:', error);
        this.usersSubject.next([]);
      }
    });
  }

  /**
   * Get current users value (synchronous)
   */
  getUsers(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Get user by ID via API
   */
  getUserById(id: number): Observable<User> {
    return this.userApiService.getById(id);
  }

  /**
   * Create new user via API
   */
  createUser(user: { username: string; email: string; password: string; isAdmin: boolean }): Observable<User> {
    return new Observable(observer => {
      const createRequest = {
        username: user.username,
        email: user.email,
        password: user.password,
        isAdmin: user.isAdmin
      };

      this.userApiService.create(createRequest).subscribe({
        next: (newUser) => {
          this.loadUsers(); // Refresh users list
          observer.next(newUser);
          observer.complete();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Update existing user via API
   */
  updateUser(user: { id: number; username: string; email: string; password?: string; isAdmin: boolean }): Observable<User> {
    return new Observable(observer => {
      const updateRequest = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        isAdmin: user.isAdmin
      };

      this.userApiService.update(updateRequest).subscribe({
        next: (updatedUser) => {
          this.loadUsers(); // Refresh users list
          observer.next(updatedUser);
          observer.complete();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Delete user via API
   */
  deleteUser(id: number): Observable<void> {
    return new Observable(observer => {
      this.userApiService.delete(id).subscribe({
        next: () => {
          this.loadUsers(); // Refresh users list
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Check if username is available
   */
  checkUsername(username: string, excludeUserId?: number): Observable<{ isAvailable: boolean; message?: string }> {
    return this.userApiService.checkUsername({ username, excludeUserId });
  }

  /**
   * Check if email is available
   */
  checkEmail(email: string, excludeUserId?: number): Observable<{ isAvailable: boolean; message?: string }> {
    return this.userApiService.checkEmail({ email, excludeUserId });
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
    this.usersSubject.next([]);
  }
}