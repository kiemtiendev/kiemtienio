
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, VipTier, AdminNotification, AdBanner, Announcement } from '../types.ts';
import { REFERRAL_REWARD, RATE_VND_TO_POINT } from '../constants.tsx';

// @ts-ignore
const supabaseUrl = window.process.env.SUPABASE_URL || '';
// @ts-ignore
const supabaseKey = window.process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to map DB snake_case user to camelCase User type
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

// Internal mapping for consistency between snake_case DB and camelCase components
const mapWithdrawal = (w: any): any => ({
  ...w,
  userId: w.user_id,
  userName: w.user_name,
  createdAt: w.created_at
});

const mapAnnouncement = (a: any): any => ({
  ...a,
  createdAt: a.created_at,
  isActive: a.is_active
});

const mapAd = (a: any): any => ({
  ...a,
  imageUrl: a.image_url,
  targetUrl: a.target_url,
  isActive: a.is_active
});

const mapNotification = (n: any): any => ({
  ...n,
  userId: n.user_id,
  userName: n.user_name,
  createdAt: n.created_at
});

export const dbService = {
  login: async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const { data, error } = await supabase
      .from('users_data')
      .select('*')
      .eq('email', cleanEmail)
      .eq('password_hash', cleanPass)
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: 'Sai email hoặc mật khẩu.' };
    }
    
    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  register: async (fullname: string, email: string, pass: string, refBy?: string) => {
    const cleanFullname = fullname.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const { data: existing } = await supabase
      .from('users_data')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) return { success: false, message: 'Email đã tồn tại.' };

    const newUser = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      fullname: cleanFullname,
      email: cleanEmail,
      password_hash: cleanPass,
      balance: 0,
      total_earned: 0,
      tasks_today: 0,
      tasks_week: 0,
      is_banned: false,
      is_admin: cleanEmail === 'admin@gmail.com', 
      join_date: new Date().toISOString(),
      referred_by: refBy
    };

    const { data, error } = await supabase.from('users_data').insert([newUser]).select().single();
    if (error) return { success: false, message: error.message };
    
    // Referral rewards logic
    if (refBy) {
        const { data: referrer } = await supabase.from('users_data').select('balance, referral_count, referral_bonus').eq('id', refBy).single();
        if (referrer) {
            await supabase.from('users_data').update({
                balance: referrer.balance + REFERRAL_REWARD,
                referral_count: (referrer.referral_count || 0) + 1,
                referral_bonus: (referrer.referral_bonus || 0) + REFERRAL_REWARD
            }).eq('id', refBy);
        }
    }

    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
    return (error || !data) ? null : mapUser(data);
  },

  updateUser: async (userId: string, updates: Partial<any>) => {
    const dbUpdates: any = {};
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.banReason !== undefined) dbUpdates.ban_reason = updates.banReason;

    Object.keys(updates).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (!dbUpdates[snakeKey]) {
            dbUpdates[snakeKey] = updates[key];
        }
    });

    const { error } = await supabase.from('users_data').update(dbUpdates).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật thành công.' };
  },

  // Fix: added linkPhone for Profile component
  linkPhone: async (userId: string, phoneNumber: string) => {
    const { error } = await supabase.from('users_data').update({ phone_number: phoneNumber }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Liên kết thành công.' };
  },

  // Fix: added updatePassword for Profile component
  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data, error: fetchError } = await supabase.from('users_data').select('password_hash').eq('id', userId).single();
    if (fetchError || data.password_hash !== oldPass) {
      return { success: false, message: 'Mật khẩu cũ không chính xác.' };
    }
    const { error } = await supabase.from('users_data').update({ password_hash: newPass }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Đổi mật khẩu thành công.' };
  },

  // Fix: added adjustBalance for Admin component
  adjustBalance: async (userId: string, amount: number) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u) return { success: false, message: 'User not found' };
    const { error } = await supabase.from('users_data').update({ balance: u.balance + amount }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật số dư thành công.' };
  },

  // Fix: added deleteUser for Admin component
  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('users_data').delete().eq('id', userId);
    return { success: !error, message: error ? error.message : 'Đã xóa người dùng.' };
  },

  getAds: async (includeInactive = false) => {
    let q = supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return (data || []).map(mapAd);
  },

  // Fix: added saveAd for Admin component
  saveAd: async (ad: any) => {
    const { data, error } = await supabase.from('ads').insert([{
      title: ad.title,
      image_url: ad.imageUrl,
      target_url: ad.targetUrl,
      is_active: true,
      created_at: new Date().toISOString()
    }]).select();
    return { data, error };
  },

  // Fix: added updateAdStatus for Admin component
  updateAdStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
    return { success: !error };
  },

  // Fix: added deleteAd for Admin component
  deleteAd: async (id: string) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    return { success: !error };
  },

  getAnnouncements: async (includeInactive = false) => {
    let q = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return (data || []).map(mapAnnouncement);
  },

  // Fix: added saveAnnouncement for Admin component
  saveAnnouncement: async (ann: any) => {
    const { data, error } = await supabase.from('announcements').insert([{
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      is_active: true,
      created_at: new Date().toISOString()
    }]).select();
    return { data, error };
  },

  // Fix: added updateAnnouncementStatus for Admin component
  updateAnnouncementStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
    return { success: !error };
  },

  // Fix: added deleteAnnouncement for Admin component
  deleteAnnouncement: async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    return { success: !error };
  },

  getAllUsers: async () => {
    const { data } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return (data || []).map(mapUser);
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return (data || []).map(mapWithdrawal);
  },

  // Fix: added addWithdrawal for Withdraw component
  addWithdrawal: async (request: any) => {
    const { error } = await supabase.from('withdrawals').insert([{
      user_id: request.userId,
      user_name: request.userName,
      amount: request.amount,
      type: request.type,
      status: request.status,
      details: request.details,
      created_at: request.createdAt
    }]);

    // Handle initial balance deduction
    if (!error) {
        const { data: u } = await supabase.from('users_data').select('balance').eq('id', request.userId).single();
        if (u) {
            await supabase.from('users_data').update({ balance: u.balance - (request.amount * RATE_VND_TO_POINT) }).eq('id', request.userId);
        }
    }

    return { success: !error, error: error?.message };
  },

  // Fix: added updateWithdrawalStatus for Admin component
  updateWithdrawalStatus: async (id: string, status: string) => {
    const { data: w } = await supabase.from('withdrawals').select('*').eq('id', id).single();
    if (!w) return { success: false };

    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);

    // If rejected, refund points to user
    if (!error && status === 'rejected') {
        const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.user_id).single();
        if (u) {
            await supabase.from('users_data').update({ balance: u.balance + (w.amount * RATE_VND_TO_POINT) }).eq('id', w.user_id);
        }
    }

    return { success: !error };
  },

  // Fix: added getGiftcodes for Admin component
  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  // Fix: added addGiftcode for Admin component
  addGiftcode: async (gc: any) => {
    const { data, error } = await supabase.from('giftcodes').insert([{
      code: gc.code,
      amount: gc.amount,
      max_uses: gc.maxUses,
      used_by: [],
      is_active: true,
      created_at: new Date().toISOString()
    }]).select();
    return { data, error };
  },

  // Fix: added claimGiftcode for Giftcode component
  claimGiftcode: async (userId: string, code: string) => {
    const { data: gc, error: gcError } = await supabase.from('giftcodes').select('*').eq('code', code).eq('is_active', true).maybeSingle();
    if (gcError || !gc) return { success: false, message: 'Mã không tồn tại hoặc đã hết hạn.' };
    
    const usedBy = gc.used_by || [];
    if (usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
    if (usedBy.length >= gc.max_uses) return { success: false, message: 'Mã đã đạt giới hạn lượt sử dụng.' };

    const { data: u } = await supabase.from('users_data').select('balance, total_giftcode_earned').eq('id', userId).single();
    if (!u) return { success: false, message: 'Người dùng không tồn tại.' };

    const { error: updateError } = await supabase.from('users_data').update({ 
      balance: u.balance + gc.amount,
      total_giftcode_earned: (u.total_giftcode_earned || 0) + gc.amount
    }).eq('id', userId);
    
    if (updateError) return { success: false, message: updateError.message };

    await supabase.from('giftcodes').update({ used_by: [...usedBy, userId] }).eq('code', code);
    
    return { success: true, amount: gc.amount, message: `Thành công! Bạn nhận được ${gc.amount} P.` };
  },

  // Fix: added getNotifications for UserNotifications component
  getNotifications: async (userId: string) => {
    const { data } = await supabase.from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.all`)
      .order('created_at', { ascending: false });
    return (data || []).map(mapNotification);
  },

  // Fix: added addNotification for Support/System messages
  addNotification: async (notif: any) => {
    const { error } = await supabase.from('notifications').insert([{
      user_id: notif.userId || 'all',
      user_name: notif.userName || 'System',
      title: notif.title,
      content: notif.content,
      type: notif.type || 'system',
      created_at: new Date().toISOString()
    }]);
    return { success: !error, error: error?.message };
  },

  // Fix: added getVipRequests for Vip component
  getVipRequests: async (userId?: string) => {
    let q = supabase.from('vip_requests').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

  // Fix: added createVipDepositRequest for Vip component
  createVipDepositRequest: async (req: any) => {
    const { error } = await supabase.from('vip_requests').insert([{
      user_id: req.userId,
      user_name: req.userName,
      email: req.email,
      vip_tier: req.vipTier,
      amount_vnd: req.amountVnd,
      bank_details: req.bankDetails,
      transfer_content: req.transferContent,
      bill_url: req.billUrl,
      status: 'pending',
      created_at: new Date().toISOString()
    }]);
    return { success: !error, message: error ? error.message : 'Gửi yêu cầu thành công, vui lòng chờ duyệt.' };
  },

  // Fix: added upgradeVipTiered for direct point-based upgrade in Vip component
  upgradeVipTiered: async (userId: string, amountVnd: number) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    const pointsNeeded = amountVnd * 10;
    if (!u || u.balance < pointsNeeded) return { success: false, message: 'Không đủ điểm Nova (P).' };
    
    let days = 1;
    let tier = VipTier.BASIC;
    if (amountVnd >= 500000) { days = 30; tier = VipTier.ELITE; }
    else if (amountVnd >= 100000) { days = 7; tier = VipTier.PRO; }

    const vipUntil = new Date();
    vipUntil.setDate(vipUntil.getDate() + days);

    const { error } = await supabase.from('users_data').update({
      balance: u.balance - pointsNeeded,
      vip_tier: tier,
      vip_until: vipUntil.toISOString()
    }).eq('id', userId);

    return { success: !error, message: error ? error.message : `Đã kích hoạt ${tier.toUpperCase()} thành công!` };
  },

  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    if (timeElapsed < 10) return { error: 'SECURITY_VIOLATION' }; 
    const { data: u } = await supabase.from('users_data').select('balance, total_earned, tasks_today, task_counts').eq('id', userId).single();
    if (!u) return { error: 'User not found' };
    
    const newCounts = { ...(u.task_counts || {}) };
    newCounts[gateName] = (newCounts[gateName] || 0) + 1;
    
    const { error } = await supabase.from('users_data').update({
      balance: u.balance + points,
      total_earned: u.total_earned + points,
      tasks_today: u.tasks_today + 1,
      last_task_date: new Date().toISOString(),
      task_counts: newCounts
    }).eq('id', userId);
    
    return { success: !error, error: error?.message };
  },

  logout: () => {
    localStorage.removeItem('nova_session_id');
  }
};
