import { Injectable } from '@angular/core';
import { Transaction, TransactionType, Account, Category, CategoryType, Reminder } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TestDataGeneratorService {

  generateTestTransactions(count: number): Transaction[] {
    const transactions: Transaction[] = [];
    const types: TransactionType[] = [TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER];
    const narrations = [
      'Salary payment', 'Grocery shopping', 'Electricity bill', 'Restaurant dinner',
      'Fuel expense', 'Investment dividend', 'Online purchase', 'Medical checkup',
      'Movie tickets', 'Phone bill', 'Insurance premium', 'ATM withdrawal'
    ];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 50000) + 100;
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));

      transactions.push({
        id: `test-transaction-${i + 1}`,
        type,
        amount,
        date,
        accountId: `account-${Math.floor(Math.random() * 5) + 1}`,
        categoryId: type !== TransactionType.TRANSFER ? `category-${Math.floor(Math.random() * 10) + 1}` : undefined,
        toAccountId: type === TransactionType.TRANSFER ? `account-${Math.floor(Math.random() * 5) + 1}` : undefined,
        narration: narrations[Math.floor(Math.random() * narrations.length)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return transactions;
  }

  generateTestAccounts(count: number): Account[] {
    const accounts: Account[] = [];
    const accountNames = [
      'Primary Savings', 'Checking Account', 'Investment Account', 'Emergency Fund',
      'Business Account', 'Joint Account', 'Credit Card', 'Cash Wallet'
    ];
    const icons = ['🏦', '💳', '💰', '🪙', '💼', '👑', '🎯', '📱'];

    for (let i = 0; i < count; i++) {
      const initialAmount = Math.floor(Math.random() * 100000) + 1000;

      accounts.push({
        id: `test-account-${i + 1}`,
        name: `${accountNames[i % accountNames.length]} ${i + 1}`,
        initialAmount,
        currentBalance: initialAmount + Math.floor(Math.random() * 50000) - 25000,
        icon: icons[i % icons.length],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return accounts;
  }

  generateTestCategories(count: number): Category[] {
    const categories: Category[] = [];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Bonus', 'Gift'];
    const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Healthcare', 'Shopping', 'Education', 'Travel'];
    const icons = ['💼', '🎯', '📈', '🏪', '🎁', '🍽️', '🚗', '🎬', '⚡', '🏥', '🛍️', '📚', '✈️'];

    for (let i = 0; i < count; i++) {
      const isIncome = i % 3 === 0; // 1/3 income, 2/3 expense
      const categoryType = isIncome ? CategoryType.INCOME : CategoryType.EXPENSE;
      const categoryNames = isIncome ? incomeCategories : expenseCategories;

      categories.push({
        id: `test-category-${i + 1}`,
        name: `${categoryNames[i % categoryNames.length]} ${Math.floor(i / categoryNames.length) + 1}`,
        type: categoryType,
        budgetLimit: !isIncome ? Math.floor(Math.random() * 20000) + 5000 : undefined,
        icon: icons[i % icons.length],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return categories;
  }

  generateTestReminders(count: number): Reminder[] {
    const reminders: Reminder[] = [];
    const titles = [
      'Pay electricity bill', 'Insurance premium due', 'Credit card payment',
      'Rent payment', 'Tax filing deadline', 'Investment review',
      'Budget review', 'Salary negotiation', 'Medical checkup', 'Car service'
    ];

    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * 90));

      reminders.push({
        id: `test-reminder-${i + 1}`,
        title: `${titles[i % titles.length]} ${Math.floor(i / titles.length) + 1}`,
        date,
        beforeDays: Math.floor(Math.random() * 7) + 1,
        afterDays: Math.floor(Math.random() * 3) + 1,
        isActive: Math.random() > 0.3, // 70% active
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return reminders;
  }

  generateLargeDataset() {
    return {
      transactions: this.generateTestTransactions(1000),
      accounts: this.generateTestAccounts(100),
      categories: this.generateTestCategories(200),
      reminders: this.generateTestReminders(150)
    };
  }
}