
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, VipTier, AdminNotification, AdBanner, Announcement } from '../types.ts';
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

const mapGiftcode = (g: any): Giftcode => ({
  code: g.code,
  amount: Number(g.amount),
  maxUses: Number(g.max_uses),
  usedBy: Array.isArray(g.used_by) ? g.used_by : [],
  createdAt: g.created_at,
  isActive: Boolean(g.is_active)
});

const mapAd = (ad: any): AdBanner => ({
  id: ad.id,
  title: ad.title,
  imageUrl: ad.image_url,
  targetUrl: ad.target_url,
  isActive: Boolean(ad.is_active)
});

const mapAnnouncement = (ann: any): Announcement => ({
  id: ann.id,
  title: ann.title,
  content: ann.content,
  createdAt: ann.created_at,
  priority: ann.priority,
  isActive: Boolean(ann.is_active)
});

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

  adjustBalance: async (userId: string, amount: number) => {
    const { data: u, error: fetchError } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (fetchError || !u) return { success: false, message: 'Không tìm thấy người dùng.' };
    
    const newBalance = Math.max(0, Number(u.balance || 0) + amount);
    const { error: updateError } = await supabase.from('users_data').update({ balance: newBalance }).eq('id', userId);
    
    return { success: !updateError, message: updateError ? updateError.message : 'Đã thay đổi số dư.' };
  },

  deleteUser: async (userId: string) => {
    try {
      await supabase.from('withdrawals').delete().eq('user_id', userId);
      await supabase.from('notifications').delete().eq('user_id', userId);
      const { error } = await supabase.from('users_data').delete().eq('id', userId);
      if (error) throw error;
      return { success: true, message: 'Đã xóa người dùng và toàn bộ dữ liệu liên quan.' };
    } catch (err: any) {
      return { success: false, message: 'Lỗi xóa: ' + err.message };
    }
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
    return { success: true };
  },

  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    if (timeElapsed < 5) {
      await supabase.from('users_data').update({ is_banned: true, ban_reason: 'SENTINEL: Cheat tốc độ.' }).eq('id', userId);
      return { error: 'SENTINEL_SECURITY_VIOLATION' };
    }
    const { data: u } = await supabase.from('users_data').select('*').eq('id', userId).single();
    if (!u) return { error: 'USER_NOT_FOUND' };

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
    return (data || []).map(mapAd);
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
    return (data || []).map(mapAnnouncement);
  },

  saveAnnouncement: async (ann: any) => {
    return await supabase.from('announcements').insert([{
      title: ann.title,
      content: ann.content,
      priority: ann.priority || 'low',
      is_active: true
    }]);
  },

  deleteAnnouncement: async (id: string) => {
    return await supabase.from('announcements').delete().eq('id', id);
  },

  updateAnnouncementStatus: async (id: string, active: boolean) => {
    return await supabase.from('announcements').update({ is_active: active }).eq('id', id);
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

  addGiftcode: async (gc: any) => {
    const codeUpper = gc.code.trim().toUpperCase();
    const { data: existing } = await supabase.from('giftcodes').select('id').eq('code', codeUpper).maybeSingle();
    if (existing) {
      return { error: { message: `Mã [${codeUpper}] đã tồn tại. Vui lòng chọn tên khác.` } };
    }
    const { error } = await supabase.from('giftcodes').insert([{ 
      code: codeUpper, 
      amount: Number(gc.amount), 
      max_uses: Number(gc.maxUses), 
      used_by: [], 
      is_active: true 
    }]);
    return { error };
  },

  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapGiftcode);
  },

  claimGiftcode: async (userId: string, code: string) => {
    const { data: gc } = await supabase.from('giftcodes').select('*').eq('code', code.toUpperCase()).eq('is_active', true).maybeSingle();
    if (!gc) return { success: false, message: 'Giftcode không tồn tại hoặc đã bị ẩn.' };
    const usedBy = Array.isArray(gc.used_by) ? gc.used_by : [];
    if (usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
    if (usedBy.length >= Number(gc.max_uses)) return { success: false, message: 'Mã đã hết lượt dùng.' };
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u) return { success: false, message: 'Lỗi xác thực người dùng.' };
    await supabase.from('users_data').update({ balance: Number(u.balance || 0) + Number(gc.amount) }).eq('id', userId);
    await supabase.from('giftcodes').update({ used_by: [...usedBy, userId] }).eq('id', gc.id);
    return { success: true, amount: gc.amount, message: 'Kích hoạt thành công!' };
  },

  getNotifications: async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${userId},user_id.eq.all`).order('created_at', { ascending: false });
    return data || [];
  },

  addWithdrawal: async (w: any) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.userId).single();
    if (!u || u.balance < w.amount * RATE_VND_TO_POINT) return { error: 'Số dư không đủ.' };
    const { error: wError } = await supabase.from('withdrawals').insert([{
      user_id: w.userId,
      user_name: w.userName,
      amount: Number(w.amount),
      type: w.type,
      status: 'pending',
      details: w.details,
      created_at: new Date().toISOString()
    }]);
    if (wError) return { error: wError.message };
    await supabase.from('users_data').update({ 
      balance: Number(u.balance) - (Number(w.amount) * RATE_VND_TO_POINT) 
    }).eq('id', w.userId);
    return { error: null };
  },

  addNotification: async (n: any) => {
    return await supabase.from('notifications').insert([{
      user_id: n.userId,
      user_name: n.userName,
      title: n.title,
      content: n.content,
      type: n.type || 'system',
      created_at: new Date().toISOString()
    }]);
  },

  linkPhone: async (userId: string, phone: string) => {
    return await supabase.from('users_data').update({ phone_number: phone }).eq('id', userId);
  },

  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data } = await supabase.from('users_data').select('password_hash').eq('id', userId).single();
    if (!data || data.password_hash !== btoa(oldPass)) return { success: false, message: 'Mật khẩu cũ không đúng.' };
    const { error } = await supabase.from('users_data').update({ password_hash: btoa(newPass) }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Đổi mật khẩu thành công.' };
  },

  requestResetCode: async (email: string, telegram: string) => {
    const { data } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
    if (!data) return { success: false, message: 'Email không tồn tại.' };
    return { success: true };
  },

  resetPassword: async (email: string, code: string, newPass: string) => {
    if (!code || code.length !== 6) return { success: false, message: 'Mã xác thực không hợp lệ.' };
    const { error } = await supabase.from('users_data').update({ password_hash: btoa(newPass) }).eq('email', email);
    return { success: !error, message: error ? error.message : 'Khôi phục mật khẩu thành công.' };
  },

  getVipUsers: async () => {
    const now = new Date().toISOString();
    const { data } = await supabase.from('users_data').select('*').gt('vip_until', now).order('vip_until', { ascending: false });
    return (data || []).map(mapUser);
  },

  upgradeVipTiered: async (userId: string, vndAmount: number) => {
    const points = vndAmount * RATE_VND_TO_POINT;
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u || u.balance < points) return { success: false, message: 'Số dư không đủ.' };
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
