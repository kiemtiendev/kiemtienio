
export enum AppView {
  DASHBOARD = 'dashboard',
  TASKS = 'tasks',
  WITHDRAW = 'withdraw',
  HISTORY = 'history',
  LEADERBOARD = 'leaderboard',
  PROFILE = 'profile',
  GIFTCODE = 'giftcode',
  REFERRAL = 'referral',
  ADMIN = 'admin',
  GUIDE = 'guide',
  NOTIFICATIONS = 'notifications',
  SUPPORT = 'support'
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface User {
  id: string;
  adminId?: string;
  email: string;
  fullname: string;
  bankInfo: string;
  idGame: string;
  balance: number;
  totalEarned: number;
  totalGiftcodeEarned: number;
  tasksToday: number;
  tasksWeek: number;
  taskCounts: Record<string, number>;
  joinDate: string;
  lastTaskDate: string;
  lastLogin?: string;
  isBanned: boolean;
  isAdmin: boolean;
  banReason?: string;
  securityScore?: number;
  referralCount?: number;
  referralBonus?: number;
  referredBy?: string;
  avatarUrl?: string;
}

export interface AccountRecord {
  email: string;
  passwordHash: string;
  userId: string;
}

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'bank' | 'game';
  status: 'pending' | 'completed' | 'rejected';
  details: string;
  createdAt: string;
  securityScore?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'high';
  isActive?: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'withdrawal' | 'feedback' | 'system' | 'auth' | 'referral' | 'security';
  title: string;
  content: string;
  userId: string;
  userName: string;
  isRead: boolean;
  createdAt: string;
}

export interface Giftcode {
  code: string;
  amount: number;
  maxUses: number;
  usedBy: string[];
  createdAt: string;
  isActive?: boolean;
}

export interface TaskGate {
  name: string;
  rate: number;
  quota: number;
  apiKey?: string;
}
