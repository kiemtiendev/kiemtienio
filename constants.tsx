
import React from 'react';
import { 
  Rocket, 
  User, 
  CreditCard, 
  Trophy, 
  Ticket,
  Settings,
  Phone,
  BookOpen,
  History,
  LayoutDashboard,
  Cloud,
  Coins,
  Users,
  Bell
} from 'lucide-react';
import { AppView, TaskGate } from './types.ts';

// Điểm chuẩn: 1 VND = 10 Điểm
export const RATE_VND_TO_POINT = 10;
// Tỷ lệ Kim cương: 50.000 P (5k VND) = 25 KC -> 1 KC = 2000 P
export const POINT_PER_DIAMOND = 2000; 
// Thưởng giới thiệu: 5000 P (500đ)
export const REFERRAL_REWARD = 5000;

export const WITHDRAW_MILESTONES = [5000, 10000, 20000, 50000, 100000, 200000, 500000];

export const VERIFICATION_BLOG_URL = "https://wipsbot.github.io/diamond-nova/verify";

export const SOCIAL_LINKS = {
  YOUTUBE: "https://youtube.com/@DiamondNova",
  ZALO: "https://zalo.me/0337117930",
  ZALO_NUMBER: "0337117930",
  TELEGRAM: "https://t.me/anhvudev_kiemtienonline_bot",
  TELEGRAM_HANDLE: "@anhvudev_kiemtienonline_bot",
  GITHUB: "https://github.com/your-username/diamond-nova"
};

export const formatK = (num: number): string => {
  if (num === 0) return "0k";
  if (num < 1000) return `${(num / 1000).toFixed(1)}k`;
  const k = num / 1000;
  return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
};

export const TASK_GATES: TaskGate[] = [
  { name: 'Link4M', rate: 1000 * RATE_VND_TO_POINT, quota: 2, apiKey: "demo_key" },      
  { name: 'YeuMoney', rate: 1000 * RATE_VND_TO_POINT, quota: 3, apiKey: "demo_key" },    
  { name: 'XLink', rate: 500 * RATE_VND_TO_POINT, quota: 2, apiKey: "demo_key" },        
  { name: 'LayMaNgay', rate: 2000 * RATE_VND_TO_POINT, quota: 3, apiKey: "demo_key" },    
];

export const NAV_ITEMS = [
  { id: AppView.DASHBOARD, label: 'Trang chủ', icon: <LayoutDashboard /> },
  { id: AppView.TASKS, label: 'Bắt đầu nhiệm vụ', icon: <Coins /> },
  { id: AppView.WITHDRAW, label: 'Rút Thưởng', icon: <CreditCard /> },
  { id: AppView.HISTORY, label: 'Lịch sử rút', icon: <History /> },
  { id: AppView.NOTIFICATIONS, label: 'Thông báo', icon: <Bell /> },
  { id: AppView.GIFTCODE, label: 'Nhập Giftcode', icon: <Ticket /> },
  { id: AppView.LEADERBOARD, label: 'Bảng Xếp Hạng', icon: <Trophy /> },
  { id: AppView.REFERRAL, label: 'Mời Bạn Bè', icon: <Users /> },
  { id: AppView.GUIDE, label: 'Hướng dẫn', icon: <BookOpen /> },
  { id: AppView.PROFILE, label: 'Tài Khoản', icon: <User /> },
  { id: AppView.ADMIN, label: 'Hệ Thống', icon: <Cloud />, adminOnly: true },
];
