
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
  Cloud,
  Crown
} from 'lucide-react';
import { AppView, TaskGate } from './types.ts';

export const ADMIN_ID = "7790668848";
export const RATE_VND_TO_POINT = 10;
export const REFERRAL_REWARD = 5000;
export const DAILY_TASK_LIMIT = 20;
export const VIP_TASK_LIMIT = 35;

export const BLOG_DESTINATION = "https://diamondnova-rewards.blogspot.com/verify";
export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/diamondnova",
  telegram: "https://t.me/VanhTRUM",
  youtube: "https://youtube.com/@diamondnova"
};

export const WITHDRAW_MILESTONES = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
export const DIAMOND_EXCHANGE: Record<number, number> = {
  5000: 25,
  10000: 55,
  20000: 115,
  50000: 285,
  100000: 600,
  200000: 1250,
  500000: 3200
};
export const QUAN_HUY_EXCHANGE: Record<number, number> = {
  5000: 10,
  10000: 20,
  20000: 42,
  50000: 108,
  100000: 220,
  200000: 450,
  500000: 1150
};

export const ADMIN_BANKS = [
  { bank: "MBBANK", account: "0337117930", owner: "HOANG MAI ANH VU" },
  { bank: "MBV", account: "9612345678", owner: "HOANG MAI ANH VU" },
  { bank: "VIETINBANK", account: "103885892927", owner: "HOANG MAI ANH VU" },
  { bank: "TPBANK", account: "55000123789", owner: "HOANG MAI ANH VU" }
];

export const SLOGAN = "HỆ THỐNG NHIỆM VỤ - KIẾM TIỀN - Nhận Thẻ Game Quân Huy - Kim Cương Miễn Phí";
export const COPYRIGHT = "Bản quyền bởi DIAMOND NOVA";

export const TASK_RATES: Record<number, { name: string, reward: number, limit: number, apiKey: string }> = {
  1: { name: "LINK4M", reward: 1320, limit: 2, apiKey: "68208afab6b8fc60542289b6" },
  2: { name: "YEULINK", reward: 1320, limit: 4, apiKey: "891b97fa-faa4-4446-bdd3-17add1ea42bc" },
  3: { name: "YEUMONEY", reward: 1050, limit: 3, apiKey: "2103f2aa67d874c161e5f4388b2312af6d43742734a8ea41716b8a2cc94b7b02" },
  4: { name: "XLINK", reward: 1320, limit: 2, apiKey: "ac55663f-ef85-4849-8ce1-4ca99bd57ce7" },
  5: { name: "TRAFFICTOT", reward: 1320, limit: 5, apiKey: "hIg7wtrv8xpqhhS0QESenpEwZdOsWCdE" },
  6: { name: "LAYMANET", reward: 1320, limit: 3, apiKey: "ad22fab4209242db6c1bc093898fe2e8" }
};

export const NAV_ITEMS = [
  { id: AppView.DASHBOARD, label: 'Trang chủ', icon: <LayoutDashboard /> },
  { id: AppView.VIP, label: 'Nâng cấp VIP', icon: <Crown className="text-amber-400" /> },
  { id: AppView.TASKS, label: 'Nhiệm vụ', icon: <Coins /> },
  { id: AppView.WITHDRAW, label: 'Rút Thưởng Game', icon: <CreditCard /> },
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

export const formatK = (num: number | undefined | null): string => {
  if (num === undefined || num === null || num === 0) return "0";
  const absNum = Math.abs(num);
  if (absNum >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (absNum >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};
