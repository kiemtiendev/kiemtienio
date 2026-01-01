
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

export const RATE_VND_TO_POINT = 10;
export const POINT_PER_DIAMOND = 2000; 
export const REFERRAL_REWARD = 5000;

export const WITHDRAW_MILESTONES = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
export const BLOG_DESTINATION = "https://avudev-verifi.blogspot.com/";

// Fix: Added missing SOCIAL_LINKS constant used in Guide.tsx
export const SOCIAL_LINKS = {
  YOUTUBE: "https://www.youtube.com/@diamondnova",
  TELEGRAM: "https://t.me/diamondnova_hub",
  FANPAGE: "https://www.facebook.com/diamondnova"
};

/**
 * Định dạng số theo chuẩn K (Ngàn), M (Triệu), B (Tỷ)
 */
export const formatK = (num: number | undefined | null): string => {
  if (num === undefined || num === null || num === 0) return "0";
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export const TASK_GATES: (TaskGate & { id: number })[] = [
  { id: 1, name: 'LINK4M', rate: 1000 * RATE_VND_TO_POINT, quota: 2, apiKey: "68208afab6b8fc60542289b6" },
  { id: 2, name: 'YEULINK', rate: 800 * RATE_VND_TO_POINT, quota: 4, apiKey: "891b97fa-faa4-4446-bdd3-17add1ea42bc" },
  { id: 3, name: 'YEUMONEY', rate: 1200 * RATE_VND_TO_POINT, quota: 2, apiKey: "2103f2aa67d874c161e5f4388b2312af6d43742734a8ea41716b8a2cc94b7b02" },
  { id: 4, name: 'XLINK', rate: 1000 * RATE_VND_TO_POINT, quota: 2, apiKey: "ac55663f-ef85-4849-8ce1-4ca99bd57ce7" },
  { id: 5, name: 'TRAFFICTOT', rate: 500 * RATE_VND_TO_POINT, quota: 5, apiKey: "578e007b91cceabed9f71903e47ebb3c1be75e91" },
  { id: 6, name: 'LAYMANET', rate: 1500 * RATE_VND_TO_POINT, quota: 3, apiKey: "ad22fab4209242db6c1bc093898fe2e8" },
];

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
