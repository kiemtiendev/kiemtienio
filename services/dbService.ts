
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
    avatarUrl: u.avatar_url || '',
    fullname: u.fullname || '',
    email: u.email || '',
    balance: Number(u.balance ?? 0),
    referralCount: Number(u.referral_count ?? 0),
    referralBonus: Number(u.referral_bonus ?? 0)
  };
};

export const dbService = {
  login: async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const { data, error } = await supabase.from('users_data').select('*').eq('email', cleanEmail).eq('password', cleanPass).maybeSingle();
    if (error || !data) return { success: false, message: 'Sai email hoặc mật khẩu.' };
    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  register: async (fullname: string, email: string, pass: string, refBy?: string) => {
    const cleanFullname = fullname.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const { data: existing } = await supabase.from('users_data').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return { success: false, message: 'Email này đã được đăng ký.' };

    const newUser = {
      fullname: cleanFullname,
      email: cleanEmail,
      password: cleanPass,
      balance: 0,
      total_earned: 0,
      tasks_today: 0,
      tasks_week: 0,
      is_banned: false,
      is_admin: false,
      join_date: new Date().toISOString(),
      referred_by: refBy
    };

    const { data, error } = await supabase.from('users_data').insert([newUser]).select().single();
    if (error) return { success: false, message: error.message };
    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  requestPasswordReset: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data } = await supabase.from('users_data').select('id').eq('email', cleanEmail).maybeSingle();
    if (!data) return { success: false, message: 'Email không tồn tại trong hệ thống.' };
    // Giả lập gửi mã xác nhận qua Bot
    return { success: true, message: 'Yêu cầu thành công! Vui lòng lấy mã 6 số từ Telegram Bot.' };
  },

  resetPasswordWithCode: async (email: string, code: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    // Logic thực tế cần kiểm tra mã code lưu trong bảng reset_codes
    // Ở đây giả lập chấp nhận mọi mã 6 số cho demo hoặc cần tích hợp API Bot
    if (code.length !== 6) return { success: false, message: 'Mã xác nhận phải gồm 6 chữ số.' };
    
    const { error } = await supabase.from('users_data').update({ password: newPass.trim() }).eq('email', cleanEmail);
    if (error) return { success: false, message: 'Không thể cập nhật mật khẩu.' };
    return { success: true, message: 'Mật khẩu đã được thay đổi thành công!' };
  },

  logout: () => { localStorage.removeItem('nova_session_id'); },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
    return (error || !data) ? null : mapUser(data);
  },

  updateUser: async (userId: string, updates: Partial<any>) => {
    const { error } = await supabase.from('users_data').update(updates).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật thành công.' };
  },

  getVipRequests: async (userId: string) => {
    const { data } = await supabase.from('vip_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  createVipDepositRequest: async (req: any) => {
    const { error } = await supabase.from('vip_requests').insert([{
      user_id: req.userId,
      user_name: req.userName,
      email: req.email.trim().toLowerCase(),
      vip_tier: req.vipTier,
      amount_vnd: req.amountVnd,
      bank_details: req.bankDetails,
      transfer_content: req.transferContent,
      bill_url: req.billUrl,
      status: 'pending'
    }]);
    return { success: !error, message: error ? error.message : 'Gửi yêu cầu nạp VIP thành công. Vui lòng chờ Admin duyệt bill!' };
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
  },

  getAnnouncements: async (includeInactive = false) => {
    let q = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return data || [];
  },

  getAds: async (includeInactive = false) => {
    let q = supabase.from('ads').select('*');
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return data || [];
  },

  getNotifications: async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${userId},user_id.eq.all`).order('created_at', { ascending: false });
    return data || [];
  },

  getAllUsers: async () => {
    const { data } = await supabase.from('users_data').select('*');
    return (data || []).map(mapUser);
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    if (timeElapsed < 15) return { error: 'SENTINEL_SECURITY_VIOLATION' };
    const { data: u } = await supabase.from('users_data').select('balance, total_earned, tasks_today, tasks_week, task_counts').eq('id', userId).single();
    if (!u) return { error: 'User not found' };
    const newCounts = { ...(u.task_counts || {}) };
    newCounts[gateName] = (newCounts[gateName] || 0) + 1;
    const { error } = await supabase.from('users_data').update({
      balance: u.balance + points,
      total_earned: u.total_earned + points,
      tasks_today: u.tasks_today + 1,
      tasks_week: u.tasks_week + 1,
      last_task_date: new Date().toISOString(),
      task_counts: newCounts
    }).eq('id', userId);
    return { success: !error, error: error?.message };
  },

  addWithdrawal: async (req: any) => {
    const pointsNeeded = req.amount * RATE_VND_TO_POINT;
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', req.userId).single();
    if (!u || u.balance < pointsNeeded) return { error: 'Số dư không đủ để rút.' };
    const { error: balanceError } = await supabase.from('users_data').update({ balance: u.balance - pointsNeeded }).eq('id', req.userId);
    if (balanceError) return { error: balanceError.message };
    const { error } = await supabase.from('withdrawals').insert([{
      user_id: req.userId,
      user_name: req.userName,
      amount: req.amount,
      type: req.type,
      status: req.status,
      details: req.details,
      created_at: req.createdAt
    }]);
    return { success: !error, error: error?.message };
  },

  addNotification: async (notif: any) => {
    const { error } = await supabase.from('notifications').insert([{
      user_id: notif.userId || 'all',
      user_name: notif.userName || 'System',
      title: notif.title,
      content: notif.content,
      type: notif.type || 'system',
      created_at: new Date().toISOString()
    }]);
    return { success: !error };
  },

  linkPhone: async (userId: string, phone: string) => {
    const { error } = await supabase.from('users_data').update({ phone_number: phone.trim() }).eq('id', userId);
    return { success: !error };
  },

  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data } = await supabase.from('users_data').select('password').eq('id', userId).single();
    if (!data || data.password !== oldPass.trim()) return { success: false, message: 'Mật khẩu cũ không đúng.' };
    const { error } = await supabase.from('users_data').update({ password: newPass.trim() }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Đổi mật khẩu thành công.' };
  },

  claimGiftcode: async (userId: string, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const { data: gc } = await supabase.from('giftcodes').select('*').eq('code', cleanCode).maybeSingle();
    if (!gc) return { success: false, message: 'Mã Giftcode không tồn tại.' };
    if (!gc.is_active) return { success: false, message: 'Mã Giftcode đã hết hạn.' };
    const usedBy = gc.used_by || [];
    if (usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
    if (usedBy.length >= gc.max_uses) return { success: false, message: 'Mã Giftcode đã hết lượt.' };
    const { data: u } = await supabase.from('users_data').select('balance, total_giftcode_earned').eq('id', userId).single();
    if (!u) return { success: false, message: 'Người dùng không tồn tại.' };
    await supabase.from('giftcodes').update({ used_by: [...usedBy, userId] }).eq('code', cleanCode);
    const { error } = await supabase.from('users_data').update({
      balance: u.balance + gc.amount,
      total_giftcode_earned: (u.total_giftcode_earned || 0) + gc.amount
    }).eq('id', userId);
    return { success: !error, amount: gc.amount, message: error ? error.message : `Bạn nhận được ${gc.amount} P!` };
  },

  adjustBalance: async (userId: string, amount: number) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u) return { success: false, message: 'User not found' };
    const { error } = await supabase.from('users_data').update({ balance: u.balance + amount }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật số dư thành công.' };
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('users_data').delete().eq('id', userId);
    return { success: !error, message: error ? error.message : 'Xóa hội viên thành công.' };
  },

  updateWithdrawalStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
    return { success: !error };
  },

  addGiftcode: async (gc: any) => {
    const { error } = await supabase.from('giftcodes').insert([{
      code: gc.code.trim().toUpperCase(),
      amount: gc.amount,
      max_uses: gc.maxUses,
      used_by: [],
      created_at: new Date().toISOString(),
      is_active: true
    }]);
    return { error };
  },

  saveAd: async (ad: any) => {
    const { error } = await supabase.from('ads').insert([{
      title: ad.title.trim(),
      image_url: ad.imageUrl.trim(),
      target_url: ad.targetUrl.trim(),
      is_active: true
    }]);
    return { error };
  },

  updateAdStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
    return { success: !error };
  },

  deleteAd: async (id: string) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    return { success: !error };
  },

  saveAnnouncement: async (ann: any) => {
    const { error } = await supabase.from('announcements').insert([{
      title: ann.title.trim(),
      content: ann.content.trim(),
      priority: ann.priority,
      created_at: new Date().toISOString(),
      is_active: true
    }]);
    return { error };
  },

  updateAnnouncementStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
    return { success: !error };
  },

  deleteAnnouncement: async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    return { success: !error };
  }
};
