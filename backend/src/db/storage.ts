import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../config';
import { IUser, ICategory, ITransaction, IBudget, INotification } from '../types';
import { defaultCategories } from './defaultCategories';

// Mongoose Schemas (used if MongoDB connects successfully)
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, default: '' },
  googleId: { type: String, default: null },
  avatar: { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  currency: { type: String, default: 'LKR' },
  preferences: {
    notificationThreshold: { type: Number, default: 80 },
    browserNotificationsEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: null },
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  icon: { type: String, default: 'Tag' },
  color: { type: String, default: '#6366f1' },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  categoryId: { type: String, required: true },
  description: { type: String, default: '' },
  transactionDate: { type: String, required: true }
}, { timestamps: true });

const BudgetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  categoryId: { type: String, default: null },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  warningThreshold: { type: Number, default: 80 }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['NEAR_LIMIT', 'EXCEEDED'], required: true },
  budgetId: { type: String, required: true },
  period: { type: String, required: true },
  threshold: { type: Number, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

let UserModel: mongoose.Model<any>;
let CategoryModel: mongoose.Model<any>;
let TransactionModel: mongoose.Model<any>;
let BudgetModel: mongoose.Model<any>;
let NotificationModel: mongoose.Model<any>;

// File-based Storage (Local zero-config fallback)
class FileStorage {
  private dataDir: string;
  private usersFile: string;
  private categoriesFile: string;
  private transactionsFile: string;
  private budgetsFile: string;
  private notificationsFile: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.categoriesFile = path.join(this.dataDir, 'categories.json');
    this.transactionsFile = path.join(this.dataDir, 'transactions.json');
    this.budgetsFile = path.join(this.dataDir, 'budgets.json');
    this.notificationsFile = path.join(this.dataDir, 'notifications.json');

    this.initFiles();
  }

  private initFiles() {
    if (!fs.existsSync(this.usersFile)) fs.writeFileSync(this.usersFile, '[]', 'utf8');
    if (!fs.existsSync(this.transactionsFile)) fs.writeFileSync(this.transactionsFile, '[]', 'utf8');
    if (!fs.existsSync(this.budgetsFile)) fs.writeFileSync(this.budgetsFile, '[]', 'utf8');
    if (!fs.existsSync(this.notificationsFile)) fs.writeFileSync(this.notificationsFile, '[]', 'utf8');

    if (!fs.existsSync(this.categoriesFile)) {
      const initialCats: ICategory[] = defaultCategories.map((c, idx) => ({
        id: `def-cat-${idx + 1}`,
        userId: null,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        isDefault: true,
        createdAt: new Date().toISOString()
      }));
      fs.writeFileSync(this.categoriesFile, JSON.stringify(initialCats, null, 2), 'utf8');
    }
  }

  private read<T>(filePath: string): T[] {
    try {
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  }

  private write<T>(filePath: string, data: T[]) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // Users
  getUsers(): IUser[] { return this.read<IUser>(this.usersFile); }
  saveUsers(users: IUser[]) { this.write(this.usersFile, users); }

  // Categories
  getCategories(): ICategory[] { return this.read<ICategory>(this.categoriesFile); }
  saveCategories(cats: ICategory[]) { this.write(this.categoriesFile, cats); }

  // Transactions
  getTransactions(): ITransaction[] { return this.read<ITransaction>(this.transactionsFile); }
  saveTransactions(txs: ITransaction[]) { this.write(this.transactionsFile, txs); }

  // Budgets
  getBudgets(): IBudget[] { return this.read<IBudget>(this.budgetsFile); }
  saveBudgets(b: IBudget[]) { this.write(this.budgetsFile, b); }

  // Notifications
  getNotifications(): INotification[] { return this.read<INotification>(this.notificationsFile); }
  saveNotifications(n: INotification[]) { this.write(this.notificationsFile, n); }
}

class StorageManager {
  public isMongoConnected = false;
  private fileStorage: FileStorage;

  constructor() {
    this.fileStorage = new FileStorage();
  }

  async init(): Promise<void> {
    try {
      console.log(`[Database] Attempting connection to MongoDB: ${config.mongoUri}...`);
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 10000
      });
      this.isMongoConnected = true;

      UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
      CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
      TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
      BudgetModel = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
      NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

      // Seed default categories in MongoDB if empty
      const existingCats = await CategoryModel.countDocuments({ isDefault: true });
      if (existingCats === 0) {
        for (let i = 0; i < defaultCategories.length; i++) {
          const dc = defaultCategories[i];
          await CategoryModel.create({
            id: `def-cat-${i + 1}`,
            userId: null,
            name: dc.name,
            type: dc.type,
            icon: dc.icon,
            color: dc.color,
            isDefault: true
          });
        }
      }

      console.log('[Database] Connected successfully to MongoDB!');
    } catch (err: any) {
      this.isMongoConnected = false;
      console.log(`[Database] MongoDB connection notice (${err.message}). Using fast persistent JSON file storage in ./data directory.`);
    }
  }

  // User methods
  async findUserByEmail(email: string): Promise<IUser | null> {
    if (this.isMongoConnected) {
      const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      return doc ? (doc as unknown as IUser) : null;
    }
    const users = this.fileStorage.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id: string): Promise<IUser | null> {
    if (this.isMongoConnected) {
      const doc = await UserModel.findOne({ id }).lean();
      return doc ? (doc as unknown as IUser) : null;
    }
    const users = this.fileStorage.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async findUserByGoogleId(googleId: string): Promise<IUser | null> {
    if (this.isMongoConnected) {
      const doc = await UserModel.findOne({ googleId }).lean();
      return doc ? (doc as unknown as IUser) : null;
    }
    const users = this.fileStorage.getUsers();
    return users.find(u => u.googleId === googleId) || null;
  }

  async createUser(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const user: IUser = {
      id,
      ...data,
      email: data.email.toLowerCase(),
      createdAt: now,
      updatedAt: now
    };

    if (this.isMongoConnected) {
      await UserModel.create(user);
      return user;
    }

    const users = this.fileStorage.getUsers();
    users.push(user);
    this.fileStorage.saveUsers(users);
    return user;
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const now = new Date().toISOString();
    if (this.isMongoConnected) {
      const doc = await UserModel.findOneAndUpdate(
        { id },
        { ...updates, updatedAt: now },
        { new: true }
      ).lean();
      return doc ? (doc as unknown as IUser) : null;
    }

    const users = this.fileStorage.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    users[idx] = { ...users[idx], ...updates, updatedAt: now };
    this.fileStorage.saveUsers(users);
    return users[idx];
  }

  // Category methods
  async getCategories(userId: string): Promise<ICategory[]> {
    if (this.isMongoConnected) {
      const docs = await CategoryModel.find({
        $or: [{ userId: null }, { userId }]
      }).lean();
      return docs as unknown as ICategory[];
    }
    const cats = this.fileStorage.getCategories();
    return cats.filter(c => c.userId === null || c.userId === userId);
  }

  async getCategoryById(id: string, userId?: string): Promise<ICategory | null> {
    if (this.isMongoConnected) {
      const query: any = { id };
      if (userId) query.$or = [{ userId: null }, { userId }];
      const doc = await CategoryModel.findOne(query).lean();
      return doc ? (doc as unknown as ICategory) : null;
    }
    const cats = this.fileStorage.getCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat) return null;
    if (userId && cat.userId !== null && cat.userId !== userId) return null;
    return cat;
  }

  async createCategory(userId: string, data: Omit<ICategory, 'id' | 'userId' | 'isDefault' | 'createdAt'>): Promise<ICategory> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cat: ICategory = {
      id,
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon || 'Tag',
      color: data.color || '#6366f1',
      isDefault: false,
      createdAt: now
    };

    if (this.isMongoConnected) {
      await CategoryModel.create(cat);
      return cat;
    }

    const cats = this.fileStorage.getCategories();
    cats.push(cat);
    this.fileStorage.saveCategories(cats);
    return cat;
  }

  async updateCategory(id: string, userId: string, data: Partial<ICategory>): Promise<ICategory | null> {
    if (this.isMongoConnected) {
      const doc = await CategoryModel.findOneAndUpdate(
        { id, userId, isDefault: false },
        data,
        { new: true }
      ).lean();
      return doc ? (doc as unknown as ICategory) : null;
    }

    const cats = this.fileStorage.getCategories();
    const idx = cats.findIndex(c => c.id === id && c.userId === userId && !c.isDefault);
    if (idx === -1) return null;

    cats[idx] = { ...cats[idx], ...data };
    this.fileStorage.saveCategories(cats);
    return cats[idx];
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    if (this.isMongoConnected) {
      const res = await CategoryModel.deleteOne({ id, userId, isDefault: false });
      return res.deletedCount > 0;
    }

    const cats = this.fileStorage.getCategories();
    const filtered = cats.filter(c => !(c.id === id && c.userId === userId && !c.isDefault));
    if (filtered.length === cats.length) return false;

    this.fileStorage.saveCategories(filtered);
    return true;
  }

  // Transaction methods
  async getTransactions(userId: string, filters?: {
    type?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ITransaction[]> {
    let txs: ITransaction[] = [];
    if (this.isMongoConnected) {
      const query: any = { userId };
      if (filters?.type) query.type = filters.type;
      if (filters?.categoryId) query.categoryId = filters.categoryId;
      if (filters?.startDate || filters?.endDate) {
        query.transactionDate = {};
        if (filters.startDate) query.transactionDate.$gte = filters.startDate;
        if (filters.endDate) query.transactionDate.$lte = filters.endDate;
      }
      if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
        query.amount = {};
        if (filters.minAmount !== undefined) query.amount.$gte = filters.minAmount;
        if (filters.maxAmount !== undefined) query.amount.$lte = filters.maxAmount;
      }
      if (filters?.search) {
        query.description = { $regex: filters.search, $options: 'i' };
      }

      const sortField = filters?.sortBy === 'amount' ? 'amount' : 'transactionDate';
      const sortDirection = filters?.sortOrder === 'asc' ? 1 : -1;

      const docs = await TransactionModel.find(query).sort({ [sortField]: sortDirection }).lean();
      return docs as unknown as ITransaction[];
    }

    txs = this.fileStorage.getTransactions().filter(t => t.userId === userId);

    if (filters?.type) {
      txs = txs.filter(t => t.type === filters.type);
    }
    if (filters?.categoryId) {
      txs = txs.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters?.startDate) {
      txs = txs.filter(t => t.transactionDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      txs = txs.filter(t => t.transactionDate <= filters.endDate!);
    }
    if (filters?.minAmount !== undefined) {
      txs = txs.filter(t => t.amount >= filters.minAmount!);
    }
    if (filters?.maxAmount !== undefined) {
      txs = txs.filter(t => t.amount <= filters.maxAmount!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      txs = txs.filter(t => t.description.toLowerCase().includes(q));
    }

    const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;
    txs.sort((a, b) => {
      if (filters?.sortBy === 'amount') {
        return (a.amount - b.amount) * sortOrder;
      }
      return (new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()) * sortOrder;
    });

    return txs;
  }

  async getTransactionById(id: string, userId: string): Promise<ITransaction | null> {
    if (this.isMongoConnected) {
      const doc = await TransactionModel.findOne({ id, userId }).lean();
      return doc ? (doc as unknown as ITransaction) : null;
    }
    const txs = this.fileStorage.getTransactions();
    return txs.find(t => t.id === id && t.userId === userId) || null;
  }

  async createTransaction(userId: string, data: Omit<ITransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ITransaction> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const tx: ITransaction = {
      id,
      userId,
      type: data.type,
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description || '',
      transactionDate: data.transactionDate || now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    if (this.isMongoConnected) {
      await TransactionModel.create(tx);
      return tx;
    }

    const txs = this.fileStorage.getTransactions();
    txs.push(tx);
    this.fileStorage.saveTransactions(txs);
    return tx;
  }

  async updateTransaction(id: string, userId: string, data: Partial<ITransaction>): Promise<ITransaction | null> {
    const now = new Date().toISOString();
    if (this.isMongoConnected) {
      const doc = await TransactionModel.findOneAndUpdate(
        { id, userId },
        { ...data, updatedAt: now },
        { new: true }
      ).lean();
      return doc ? (doc as unknown as ITransaction) : null;
    }

    const txs = this.fileStorage.getTransactions();
    const idx = txs.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return null;

    txs[idx] = { ...txs[idx], ...data, updatedAt: now };
    this.fileStorage.saveTransactions(txs);
    return txs[idx];
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    if (this.isMongoConnected) {
      const res = await TransactionModel.deleteOne({ id, userId });
      return res.deletedCount > 0;
    }

    const txs = this.fileStorage.getTransactions();
    const filtered = txs.filter(t => !(t.id === id && t.userId === userId));
    if (filtered.length === txs.length) return false;

    this.fileStorage.saveTransactions(filtered);
    return true;
  }

  async countTransactionsByCategoryId(categoryId: string, userId: string): Promise<number> {
    if (this.isMongoConnected) {
      return await TransactionModel.countDocuments({ categoryId, userId });
    }
    const txs = this.fileStorage.getTransactions();
    return txs.filter(t => t.categoryId === categoryId && t.userId === userId).length;
  }

  async reassignTransactionsCategory(oldCategoryId: string, newCategoryId: string, userId: string): Promise<number> {
    if (this.isMongoConnected) {
      const res = await TransactionModel.updateMany({ categoryId: oldCategoryId, userId }, { categoryId: newCategoryId });
      return res.modifiedCount;
    }
    const txs = this.fileStorage.getTransactions();
    let count = 0;
    txs.forEach(t => {
      if (t.categoryId === oldCategoryId && t.userId === userId) {
        t.categoryId = newCategoryId;
        count++;
      }
    });
    this.fileStorage.saveTransactions(txs);
    return count;
  }

  // Budget methods
  async getBudgets(userId: string, month?: number, year?: number): Promise<IBudget[]> {
    if (this.isMongoConnected) {
      const query: any = { userId };
      if (month !== undefined) query.month = month;
      if (year !== undefined) query.year = year;
      const docs = await BudgetModel.find(query).lean();
      return docs as unknown as IBudget[];
    }

    let budgets = this.fileStorage.getBudgets().filter(b => b.userId === userId);
    if (month !== undefined) budgets = budgets.filter(b => b.month === month);
    if (year !== undefined) budgets = budgets.filter(b => b.year === year);
    return budgets;
  }

  async getBudgetById(id: string, userId: string): Promise<IBudget | null> {
    if (this.isMongoConnected) {
      const doc = await BudgetModel.findOne({ id, userId }).lean();
      return doc ? (doc as unknown as IBudget) : null;
    }
    const budgets = this.fileStorage.getBudgets();
    return budgets.find(b => b.id === id && b.userId === userId) || null;
  }

  async createOrUpdateBudget(userId: string, data: {
    categoryId: string | null;
    amount: number;
    month: number;
    year: number;
    warningThreshold?: number;
  }): Promise<IBudget> {
    const now = new Date().toISOString();
    const threshold = data.warningThreshold ?? 80;

    if (this.isMongoConnected) {
      const existing = await BudgetModel.findOne({
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year
      });

      if (existing) {
        existing.amount = data.amount;
        existing.warningThreshold = threshold;
        existing.updatedAt = now;
        await existing.save();
        return existing.toObject();
      }

      const newBudget: IBudget = {
        id: crypto.randomUUID(),
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        warningThreshold: threshold,
        createdAt: now,
        updatedAt: now
      };
      await BudgetModel.create(newBudget);
      return newBudget;
    }

    const budgets = this.fileStorage.getBudgets();
    const idx = budgets.findIndex(
      b => b.userId === userId && b.categoryId === data.categoryId && b.month === data.month && b.year === data.year
    );

    if (idx !== -1) {
      budgets[idx].amount = data.amount;
      budgets[idx].warningThreshold = threshold;
      budgets[idx].updatedAt = now;
      this.fileStorage.saveBudgets(budgets);
      return budgets[idx];
    }

    const newBudget: IBudget = {
      id: crypto.randomUUID(),
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      month: data.month,
      year: data.year,
      warningThreshold: threshold,
      createdAt: now,
      updatedAt: now
    };
    budgets.push(newBudget);
    this.fileStorage.saveBudgets(budgets);
    return newBudget;
  }

  async updateBudget(id: string, userId: string, updates: Partial<IBudget>): Promise<IBudget | null> {
    const now = new Date().toISOString();
    if (this.isMongoConnected) {
      const doc = await BudgetModel.findOneAndUpdate(
        { id, userId },
        { ...updates, updatedAt: now },
        { new: true }
      ).lean();
      return doc ? (doc as unknown as IBudget) : null;
    }

    const budgets = this.fileStorage.getBudgets();
    const idx = budgets.findIndex(b => b.id === id && b.userId === userId);
    if (idx === -1) return null;

    budgets[idx] = { ...budgets[idx], ...updates, updatedAt: now };
    this.fileStorage.saveBudgets(budgets);
    return budgets[idx];
  }

  async deleteBudget(id: string, userId: string): Promise<boolean> {
    if (this.isMongoConnected) {
      const res = await BudgetModel.deleteOne({ id, userId });
      return res.deletedCount > 0;
    }

    const budgets = this.fileStorage.getBudgets();
    const filtered = budgets.filter(b => !(b.id === id && b.userId === userId));
    if (filtered.length === budgets.length) return false;

    this.fileStorage.saveBudgets(filtered);
    return true;
  }

  // Notification methods
  async getNotifications(userId: string): Promise<INotification[]> {
    if (this.isMongoConnected) {
      const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return docs as unknown as INotification[];
    }
    const notifs = this.fileStorage.getNotifications().filter(n => n.userId === userId);
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findNotification(userId: string, budgetId: string, period: string, threshold: number): Promise<INotification | null> {
    if (this.isMongoConnected) {
      const doc = await NotificationModel.findOne({ userId, budgetId, period, threshold }).lean();
      return doc ? (doc as unknown as INotification) : null;
    }
    const notifs = this.fileStorage.getNotifications();
    return notifs.find(n => n.userId === userId && n.budgetId === budgetId && n.period === period && n.threshold === threshold) || null;
  }

  async createNotification(data: Omit<INotification, 'id' | 'createdAt'>): Promise<INotification> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const notif: INotification = {
      id,
      ...data,
      createdAt: now
    };

    if (this.isMongoConnected) {
      await NotificationModel.create(notif);
      return notif;
    }

    const notifs = this.fileStorage.getNotifications();
    notifs.unshift(notif);
    this.fileStorage.saveNotifications(notifs);
    return notif;
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    if (this.isMongoConnected) {
      const res = await NotificationModel.updateOne({ id, userId }, { read: true });
      return res.modifiedCount > 0;
    }

    const notifs = this.fileStorage.getNotifications();
    const item = notifs.find(n => n.id === id && n.userId === userId);
    if (!item) return false;
    item.read = true;
    this.fileStorage.saveNotifications(notifs);
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    if (this.isMongoConnected) {
      const res = await NotificationModel.updateMany({ userId, read: false }, { read: true });
      return res.modifiedCount;
    }

    const notifs = this.fileStorage.getNotifications();
    let count = 0;
    notifs.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    this.fileStorage.saveNotifications(notifs);
    return count;
  }
}

export const storage = new StorageManager();
