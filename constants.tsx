
import React from 'react';
import { 
  LayoutDashboard,
  Coins,
  CreditCard,
  History,
  Bot,
  Bell,
  Ticket,
  Trophy,
  Users,
  BookOpen,
  User,
  Cloud
} from 'lucide-react';
import { AppView, TaskGate } from './types.ts';

// Cấu hình tài chính
export const ADMIN_ID = "7790668848";
export const EXCHANGE_RATE = 22000; // 1$ = 22k
export const POINT_EXCHANGE = 10;   // 1 VNĐ = 10 điểm
export const RATE_VND_TO_POINT = 10;
export const POINT_PER_DIAMOND = 2000; 
export const REFERRAL_REWARD = 5000;
export const DAILY_TASK_LIMIT = 20;

export const WITHDRAW_MILESTONES = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
export const BLOG_DESTINATION = "https://avudev-verifi.blogspot.com/";

export const SOCIAL_LINKS = {
  YOUTUBE: "https://youtube.com/@itachiwa_01?si=xL-3vNdye1dFF-v7",
  TELEGRAM_GROUP: "https://t.me/+JzOTfYqCwAU4MzE1",
  TELEGRAM_ADMIN: "https://t.me/VanhTRUM",
  ZALO_ADMIN: "https://zalo.me/0337117930",
  FANPAGE: "beacons.ai/vanhtrumvn"
};

/**
 * Danh sách 6 cổng nhiệm vụ chính thức
 * Mức thưởng: 1320 P (các cổng 1,2,4,5,6) và 1050 P (cổng 3)
 */
export const TASK_RATES: Record<number, { name: string, reward: number, limit: number, apiKey: string }> = {
  1: { name: "LINK4M", reward: 1320, limit: 2, apiKey: "68208afab6b8fc60542289b6" },
  2: { name: "YEULINK", reward: 1320, limit: 4, apiKey: "891b97fa-faa4-4446-bdd3-17add1ea42bc" },
  3: { name: "YEUMONEY", reward: 1050, limit: 3, apiKey: "2103f2aa67d874c161e5f4388b2312af6d43742734a8ea41716b8a2cc94b7b02" },
  4: { name: "XLINK", reward: 1320, limit: 2, apiKey: "ac55663f-ef85-4849-8ce1-4ca99bd57ce7" },
  5: { name: "TRAFFICTOT", reward: 1320, limit: 5, apiKey: "hIg7wtrv8xpqhhS0QESenpEwZdOsWCdE" },
  6: { name: "LAYMANET", reward: 1320, limit: 3, apiKey: "ad22fab4209242db6c1bc093898fe2e8" }
};

export const TASK_GATES: (TaskGate & { id: number })[] = Object.entries(TASK_RATES).map(([id, data]) => ({
  id: parseInt(id),
  name: data.name,
  rate: data.reward,
  quota: data.limit,
  apiKey: data.apiKey
}));

export const formatK = (num: number | undefined | null): string => {
  if (num === undefined || num === null || num === 0) return "0";
  const absNum = Math.abs(num);
  if (absNum >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (absNum >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (absNum >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

export const NAV_ITEMS = [
  { id: AppView.DASHBOARD, label: 'Trang chủ', icon: <LayoutDashboard /> },
  { id: AppView.TASKS, label: 'Khai thác điểm', icon: <Coins /> },
  { id: AppView.WITHDRAW, label: 'Rút Thưởng', icon: <CreditCard /> },
  { id: AppView.HISTORY, label: 'Lịch sử rút', icon: <History /> },
  { id: AppView.SUPPORT, label: 'Trợ lý AI Gemini', icon: <Bot /> },
  { id: AppView.NOTIFICATIONS, label: 'Thông báo', icon: <Bell /> },
  { id: AppView.GIFTCODE, label: 'Nhập Giftcode', icon: <Ticket /> },
  { id: AppView.LEADERBOARD, label: 'Bảng Xếp Hạng', icon: <Trophy /> },
  { id: AppView.REFERRAL, label: 'Mời Bạn Bè', icon: <Users /> },
  { id: AppView.GUIDE, label: 'Hướng dẫn', icon: <BookOpen /> },
  { id: AppView.PROFILE, label: 'Tài Khoản', icon: <User /> },
  { id: AppView.ADMIN, label: 'Hệ Thống', icon: <Cloud />, adminOnly: true },
];
