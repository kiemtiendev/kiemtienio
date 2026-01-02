
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
  SUPPORT = 'support',
  VIP = 'vip'
}

export enum VipTier {
  NONE = 'none',
  BASIC = 'basic', // 20k - 100k
  PRO = 'pro',     // 100k - 500k
  ELITE = 'elite'  // > 500k
}

/* Added TaskGate interface for task management configuration */
export interface TaskGate {
  id: number;
  name: string;
  rate: number;
  quota: number;
  apiKey: string;
}

/* Added AdminNotification interface for system and user-specific messages */
export interface AdminNotification {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  type: 'withdrawal' | 'referral' | 'auth' | 'feedback' | 'system';
  createdAt: string;
}

export interface User {
  id: string;
  adminId?: string;
  email: string;
  fullname: string;
  bankInfo: string;
  idGame: string;
  phoneNumber?: string;
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
  /* Added isVip property to satisfy UI logic in App.tsx */
  isVip: boolean;
  vipUntil?: string; // ISO Date
  vipTier: VipTier;
  banReason?: string;
  securityScore?: number;
  referralCount?: number;
  referralBonus?: number;
  referredBy?: string;
  avatarUrl?: string;
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
}

export interface Giftcode {
  code: string;
  amount: number;
  maxUses: number;
  usedBy: string[];
  createdAt: string;
  isActive?: boolean;
}

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'high';
  isActive?: boolean;
}
