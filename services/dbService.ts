
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, AdminNotification, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { REFERRAL_REWARD, RATE_VND_TO_POINT } from '../constants.tsx';

// Khởi tạo Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping function to convert DB snake_case to Frontend camelCase
const mapUser = (u: any): User => {
  if (!u) return null as any;
  return {
    ...u,
    totalEarned: u.total_earned ?? 0,
    isBanned: u.is_banned ?? false,
    isAdmin: u.is_admin ?? false,
    joinDate: u.join_date,
    lastTaskDate: u.last_task_date,
    lastLogin: u.last_login,
    referralCount: u.referral_count ?? 0,
    referralBonus: u.referral_bonus ?? 0,
    referredBy: u.referred_by,
    taskCounts: u.task_counts || {}
  };
};

export const dbService = {
  // --- AUTH ---
  signup: async (email: string, pass: string, fullname: string, refId?: string) => {
    // Kiểm tra tồn tại
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return { success: false, message: 'Email đã tồn tại!' };

    const userId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    const isFirst = (count || 0) === 0;

    const newUser = {
      id: userId,
      email,
      password_hash: btoa(pass), // Demo: Nên dùng auth thực tế của Supabase
      fullname: fullname.toUpperCase(),
      balance: 0,
      total_earned: 0,
      is_admin: isFirst,
      is_banned: false,
      join_date: new Date().toISOString(),
      referred_by: refId || null
    };

    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return { success: false, message: error.message };

    // Xử lý referral bonus
    if (refId) {
      const { data: refUser } = await supabase.from('users').select('*').eq('id', refId).single();
      if (refUser) {
        await supabase.from('users').update({
          balance: refUser.balance + REFERRAL_REWARD,
          total_earned: (refUser.total_earned || 0) + REFERRAL_REWARD,
          referral_count: (refUser.referral_count || 0) + 1,
          referral_bonus: (refUser.referral_bonus || 0) + REFERRAL_REWARD
        }).eq('id', refId);
      }
    }

    await dbService.addNotification({
      type: 'auth',
      title: 'HỘI VIÊN MỚI',
      content: `${fullname.toUpperCase()} vừa gia nhập hệ thống.`,
      userId: userId,
      userName: fullname.toUpperCase()
    });

    return { success: true, message: 'Đăng ký thành công!' };
  },

  login: async (email: string, pass: string) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', btoa(pass))
      .single();

    if (error || !user) return null;

    localStorage.setItem('nova_session_id', user.id);
    return mapUser(user);
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
    return user ? mapUser(user) : null;
  },

  logout: () => {
    localStorage.removeItem('nova_session_id');
  },

  getTotalUserCount: async () => {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    return count || 0;
  },

  // --- USER DATA ---
  updateUser: async (id: string, updates: Partial<User>) => {
    const dbUpdates: any = { ...updates };
    if (updates.totalEarned !== undefined) dbUpdates.total_earned = updates.totalEarned;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
    if (updates.lastTaskDate !== undefined) dbUpdates.last_task_date = updates.lastTaskDate;
    if (updates.taskCounts !== undefined) dbUpdates.task_counts = updates.taskCounts;
    
    await supabase.from('users').update(dbUpdates).eq('id', id);
  },

  getAllUsers: async () => {
    const { data } = await supabase.from('users').select('*').order('balance', { ascending: false });
    return (data || []).map(mapUser);
  },

  // --- WITHDRAWALS ---
  getWithdrawals: async (userId?: string) => {
    let query = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query;
    return (data || []).map(w => ({
      ...w,
      userId: w.user_id,
      userName: w.user_name,
      createdAt: w.created_at
    }));
  },

  addWithdrawal: async (req: Partial<WithdrawalRequest>) => {
    const { error } = await supabase.from('withdrawals').insert([{
      user_id: req.userId,
      user_name: req.userName,
      amount: req.amount,
      type: req.type,
      status: 'pending',
      details: req.details,
      created_at: new Date().toISOString()
    }]);
    
    if (!error) {
      await dbService.addNotification({
        type: 'withdrawal',
        title: 'YÊU CẦU RÚT TIỀN',
        content: `Hội viên ${req.userName} vừa yêu cầu rút ${req.amount?.toLocaleString()}đ`,
        userId: req.userId,
        userName: req.userName
      });
    }
  },

  updateWithdrawalStatus: async (id: string, status: string, userId?: string, amount?: number) => {
    await supabase.from('withdrawals').update({ status }).eq('id', id);
    if (status === 'rejected' && userId && amount) {
      const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (user) {
        await supabase.from('users').update({ balance: user.balance + (amount * RATE_VND_TO_POINT) }).eq('id', userId);
      }
    }
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId?: string) => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userId) query = query.or(`user_id.eq.${userId},user_id.eq.all`);
    const { data } = await query;
    return (data || []).map(n => ({
      ...n,
      userId: n.user_id,
      userName: n.user_name,
      isRead: n.is_read,
      createdAt: n.created_at
    }));
  },

  addNotification: async (notif: Partial<AdminNotification>) => {
    await supabase.from('notifications').insert([{
      type: notif.type,
      title: notif.title,
      content: notif.content,
      user_id: notif.userId || 'all',
      user_name: notif.userName || 'System',
      is_read: false,
      created_at: new Date().toISOString()
    }]);
  },

  markNotificationRead: async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  deleteNotification: async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
  },

  clearAllNotifications: async () => {
    await supabase.from('notifications').delete().neq('id', '0');
  },

  // --- ANNOUNCEMENTS & ADS ---
  getAnnouncements: async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    return (data || []).map(a => ({
      ...a,
      createdAt: a.created_at
    }));
  },

  saveAnnouncement: async (ann: any) => {
    const dbAnn = {
      title: ann.title,
      content: ann.content,
      priority: ann.priority || 'low',
      created_at: ann.createdAt || new Date().toISOString()
    };
    await supabase.from('announcements').insert([dbAnn]);
  },

  getAds: async (includeInactive = false) => {
    let query = supabase.from('ads').select('*');
    if (!includeInactive) query = query.eq('is_active', true);
    const { data } = await query;
    return (data || []).map(ad => ({
      ...ad,
      imageUrl: ad.image_url,
      targetUrl: ad.target_url,
      isActive: ad.is_active,
      isHidden: ad.is_hidden
    }));
  },

  saveAd: async (ad: any) => {
    const dbAd = {
      title: ad.title,
      image_url: ad.imageUrl,
      target_url: ad.targetUrl,
      is_active: ad.isActive ?? true,
      is_hidden: ad.isHidden ?? false
    };
    await supabase.from('ads').upsert([dbAd]);
  },

  // --- GIFTCODES ---
  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return (data || []).map(g => ({
      ...g,
      maxUses: g.max_uses,
      usedBy: g.used_by || [],
      createdAt: g.created_at
    }));
  },

  addGiftcode: async (gc: any) => {
    await supabase.from('giftcodes').insert([{
      code: gc.code,
      amount: gc.amount,
      max_uses: gc.maxUses,
      used_by: [],
      created_at: new Date().toISOString()
    }]);
  },

  saveGiftcodes: async (codes: Giftcode[]) => {
    // This is a bulk update helper
    for (const gc of codes) {
      await supabase.from('giftcodes').update({
        used_by: gc.usedBy
      }).eq('code', gc.code);
    }
  },

  // --- LOGS ---
  logActivity: async (userId: string, userName: string, action: string, details: string) => {
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      user_name: userName,
      action,
      details,
      created_at: new Date().toISOString()
    }]);
  },

  getActivityLogs: async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
    return (data || []).map(l => ({
      ...l,
      userId: l.user_id,
      userName: l.user_name,
      createdAt: l.created_at
    }));
  }
};
