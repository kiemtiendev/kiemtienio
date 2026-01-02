
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, VipTier, AdminNotification } from '../types.ts';
import { REFERRAL_REWARD, RATE_VND_TO_POINT } from '../constants.tsx';

// @ts-ignore
const supabaseUrl = window.process.env.SUPABASE_URL || '';
// @ts-ignore
const supabaseKey = window.process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const mapUser = (u: any): User => {
  if (!u) return null as any;
  const now = new Date();
  const vipUntil = u.vip_until ? new Date(u.vip_until) : null;
  const isVipActive = vipUntil && vipUntil > now;

  return {
    ...u,
    adminId: u.admin_id,
    bankInfo: u.bank_info || '',
    idGame: u.id_game || '',
    phoneNumber: u.phone_number || '',
    totalEarned: Number(u.total_earned ?? 0),
    totalGiftcodeEarned: Number(u.total_giftcode_earned ?? 0),
    tasksToday: Number(u.tasks_today ?? 0),
    tasksWeek: Number(u.tasks_week ?? 0),
    isBanned: Boolean(u.is_banned ?? false),
    isAdmin: Boolean(u.is_admin ?? false),
    isVip: Boolean(isVipActive),
    vipTier: isVipActive ? (u.vip_tier || VipTier.BASIC) : VipTier.NONE,
    vipUntil: u.vip_until,
    banReason: u.ban_reason || '',
    securityScore: Number(u.security_score ?? 100),
    joinDate: u.join_date,
    lastTaskDate: u.last_task_date,
    taskCounts: u.task_counts || {},
    avatarUrl: u.avatar_url || ''
  };
};

export const dbService = {
  login: async (email: string, pass: string) => {
    const { data, error } = await supabase.from('users_data').select('*').eq('email', email).eq('password_hash', btoa(pass)).maybeSingle();
    if (error || !data) return null;
    localStorage.setItem('nova_session_id', data.id);
    return mapUser(data);
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
    return (error || !data) ? null : mapUser(data);
  },

  logout: () => localStorage.removeItem('nova_session_id'),

  updateUser: async (userId: string, updates: Partial<any>) => {
    const { error } = await supabase.from('users_data').update(updates).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật thành công.' };
  },

  // Chức năng Cộng/Trừ điểm Admin
  adjustBalance: async (userId: string, amount: number) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u) return { success: false };
    const newBalance = Math.max(0, (u.balance || 0) + amount);
    const { error } = await supabase.from('users_data').update({ balance: newBalance }).eq('id', userId);
    return { success: !error };
  },

  // Chức năng Xóa tài khoản Admin
  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('users_data').delete().eq('id', userId);
    return { success: !error };
  },

  signup: async (email: string, pass: string, name: string, refCode?: string) => {
    const { data: existing } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
    if (existing) return { success: false, message: 'Email đã được sử dụng.' };

    const newUser = {
      email,
      password_hash: btoa(pass),
      fullname: name,
      balance: 0,
      total_earned: 0,
      tasks_today: 0,
      tasks_week: 0,
      join_date: new Date().toISOString(),
      is_admin: false,
      is_banned: false,
      referred_by: refCode || null,
    };

    const { error } = await supabase.from('users_data').insert([newUser]);
    if (error) return { success: false, message: error.message };

    if (refCode) {
      const { data: referrer } = await supabase.from('users_data').select('*').eq('id', refCode).maybeSingle();
      if (referrer) {
        await supabase.from('users_data').update({
          balance: (referrer.balance || 0) + REFERRAL_REWARD,
          referral_count: (referrer.referral_count || 0) + 1,
          referral_bonus: (referrer.referral_bonus || 0) + REFERRAL_REWARD
        }).eq('id', referrer.id);
      }
    }

    return { success: true };
  },

  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    if (timeElapsed < 5) {
      await supabase.from('users_data').update({ is_banned: true, ban_reason: 'SENTINEL: Cheat tốc độ.' }).eq('id', userId);
      return { error: 'SENTINEL_SECURITY_VIOLATION' };
    }
    const { data: u } = await supabase.from('users_data').select('*').eq('id', userId).single();
    const isVip = u.vip_until && new Date(u.vip_until) > new Date();
    const finalPoints = isVip ? Math.floor(points * 1.5) : points;
    const taskCounts = u.task_counts || {};
    taskCounts[gateName] = (taskCounts[gateName] || 0) + 1;
    await supabase.from('users_data').update({
      balance: Number(u.balance || 0) + finalPoints,
      total_earned: Number(u.total_earned || 0) + finalPoints,
      tasks_today: Number(u.tasks_today || 0) + 1,
      last_task_date: new Date().toISOString(),
      task_counts: taskCounts
    }).eq('id', userId);
    return { error: null };
  },

  getAllUsers: async () => {
    const { data } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return (data || []).map(mapUser);
  },

  getTotalUserCount: async () => {
    const { count } = await supabase.from('users_data').select('*', { count: 'exact', head: true });
    return count || 0;
  },

  getAds: async (all = false) => {
    let q = supabase.from('ads').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data } = await q.order('created_at', { ascending: false });
    return data || [];
  },

  saveAd: async (ad: any) => {
    return await supabase.from('ads').insert([{ 
      title: ad.title, 
      image_url: ad.imageUrl, 
      target_url: ad.targetUrl, 
      is_active: true 
    }]);
  },

  deleteAd: async (id: string) => {
    return await supabase.from('ads').delete().eq('id', id);
  },

  updateAdStatus: async (id: string, active: boolean) => {
    return await supabase.from('ads').update({ is_active: active }).eq('id', id);
  },

  getAnnouncements: async (all = false) => {
    let q = supabase.from('announcements').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data } = await q.order('created_at', { ascending: false });
    return data || [];
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

  updateWithdrawalStatus: async (id: string, status: string) => {
    return await supabase.from('withdrawals').update({ status }).eq('id', id);
  },

  // FIX LỖI GIFTCODE: Ép kiểu Number để không bị lưu 0 hoặc null
  addGiftcode: async (gc: any) => {
    const { error } = await supabase.from('giftcodes').insert([{ 
      code: gc.code.toUpperCase(), 
      amount: Number(gc.amount), 
      max_uses: Number(gc.maxUses), 
      used_by: [], 
      is_active: true 
    }]);
    return { error };
  },

  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  claimGiftcode: async (userId: string, code: string) => {
    const { data: gc } = await supabase.from('giftcodes').select('*').eq('code', code.toUpperCase()).eq('is_active', true).maybeSingle();
    if (!gc) return { success: false, message: 'Giftcode không tồn tại.' };
    const usedBy = gc.used_by || [];
    if (usedBy.includes(userId)) return { success: false, message: 'Bạn đã dùng mã này rồi.' };
    if (usedBy.length >= gc.max_uses) return { success: false, message: 'Hết lượt dùng.' };

    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    await supabase.from('users_data').update({ balance: u.balance + gc.amount }).eq('id', userId);
    await supabase.from('giftcodes').update({ used_by: [...usedBy, userId] }).eq('id', gc.id);
    return { success: true, amount: gc.amount, message: 'Thành công!' };
  },

  getNotifications: async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${userId},user_id.eq.all`).order('created_at', { ascending: false });
    return data || [];
  },

  // Fix: Add missing addWithdrawal method
  addWithdrawal: async (w: any) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.userId).single();
    if (!u || u.balance < w.amount * RATE_VND_TO_POINT) return { error: 'Số dư không đủ để thực hiện giao dịch.' };
    
    const { error: wError } = await supabase.from('withdrawals').insert([{
      user_id: w.userId,
      user_name: w.userName,
      amount: w.amount,
      type: w.type,
      status: w.status,
      details: w.details,
      created_at: w.createdAt
    }]);
    
    if (wError) return { error: wError.message };
    
    const { error: uError } = await supabase.from('users_data').update({ 
      balance: u.balance - (w.amount * RATE_VND_TO_POINT) 
    }).eq('id', w.userId);
    
    return { error: uError ? uError.message : null };
  },

  // Fix: Add missing addNotification method for Support AI feedback
  addNotification: async (n: any) => {
    return await supabase.from('notifications').insert([{
      user_id: n.userId,
      user_name: n.userName,
      title: n.title,
      content: n.content,
      type: n.type,
      created_at: new Date().toISOString()
    }]);
  },

  // Fix: Add missing linkPhone method
  linkPhone: async (userId: string, phone: string) => {
    return await supabase.from('users_data').update({ phone_number: phone }).eq('id', userId);
  },

  // Fix: Add missing updatePassword method
  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data, error } = await supabase.from('users_data').select('password_hash').eq('id', userId).single();
    if (error || !data) return { success: false, message: 'Lỗi xác thực người dùng.' };
    if (data.password_hash !== btoa(oldPass)) return { success: false, message: 'Mật khẩu cũ không đúng.' };
    
    const { error: upError } = await supabase.from('users_data').update({ password_hash: btoa(newPass) }).eq('id', userId);
    return { success: !upError, message: upError ? upError.message : 'Đổi mật khẩu thành công.' };
  },

  // Fix: Add missing requestResetCode method for Telegram bot integration
  requestResetCode: async (email: string, telegram: string) => {
    const { data } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
    if (!data) return { success: false, message: 'Email không tồn tại trong hệ thống.' };
    // This is where interaction with telegram bot would happen.
    return { success: true };
  },

  // Fix: Add missing resetPassword method
  resetPassword: async (email: string, code: string, newPass: string) => {
    if (!code || code.length !== 6) return { success: false, message: 'Mã xác thực không hợp lệ.' };
    const { error } = await supabase.from('users_data').update({ password_hash: btoa(newPass) }).eq('email', email);
    return { success: !error, message: error ? error.message : 'Khôi phục mật khẩu thành công.' };
  },

  // Fix: Add missing getVipUsers method
  getVipUsers: async () => {
    const now = new Date().toISOString();
    const { data } = await supabase.from('users_data').select('*').gt('vip_until', now).order('vip_until', { ascending: false });
    return (data || []).map(mapUser);
  },

  // Fix: Add missing upgradeVipTiered method
  upgradeVipTiered: async (userId: string, vndAmount: number) => {
    const points = vndAmount * RATE_VND_TO_POINT;
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u || u.balance < points) return { success: false, message: 'Số dư của bạn không đủ.' };
    
    let days = 1;
    let tier = VipTier.BASIC;
    if (vndAmount >= 500000) { days = 30; tier = VipTier.ELITE; }
    else if (vndAmount >= 100000) { days = 7; tier = VipTier.PRO; }
    
    const until = new Date();
    until.setDate(until.getDate() + days);
    
    const { error } = await supabase.from('users_data').update({
      balance: u.balance - points,
      vip_tier: tier,
      vip_until: until.toISOString()
    }).eq('id', userId);
    
    return { success: !error, message: error ? error.message : 'Nâng cấp VIP thành công!' };
  }
};
