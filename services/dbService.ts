
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, AdminNotification, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { REFERRAL_REWARD } from '../constants.tsx';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || '';
const supabaseKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

const mapUser = (u: any): User => {
  if (!u) return null as any;
  return {
    ...u,
    adminId: u.admin_id,
    bankInfo: u.bank_info || '',
    idGame: u.id_game || '',
    totalEarned: Number(u.total_earned ?? 0),
    tasksToday: Number(u.tasks_today ?? 0),
    tasksWeek: Number(u.tasks_week ?? 0),
    isBanned: Boolean(u.is_banned ?? false),
    isAdmin: Boolean(u.is_admin ?? false),
    joinDate: u.join_date,
    lastTaskDate: u.last_task_date,
    lastLogin: u.last_login,
    referralCount: Number(u.referral_count ?? 0),
    referralBonus: Number(u.referral_bonus ?? 0),
    referredBy: u.referred_by,
    taskCounts: u.task_counts || {}
  };
};

const handleDbError = (err: any, fallback: any = []) => {
  if (err?.status === 404 || err?.code === 'PGRST116') {
    return fallback;
  }
  const errorMsg = err?.message || JSON.stringify(err);
  console.error("Database detail:", errorMsg);
  return fallback;
};

export const dbService = {
  signup: async (email: string, pass: string, fullname: string, refId?: string) => {
    try {
      const { data: existing } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
      if (existing) return { success: false, message: 'Email đã tồn tại' };

      const userId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const { count } = await supabase.from('users_data').select('id', { count: 'exact', head: true });
      const isFirst = (count || 0) === 0;

      const newUser = {
        id: userId, admin_id: userId, email, password_hash: btoa(pass), fullname: fullname.toUpperCase(),
        balance: 0, total_earned: 0, tasks_today: 0, tasks_week: 0, 
        is_admin: isFirst, is_banned: false,
        join_date: new Date().toISOString(), referred_by: refId || null, bank_info: '', id_game: '', task_counts: {}
      };

      const { error } = await supabase.from('users_data').insert([newUser]);
      if (error) return { success: false, message: 'Lỗi ghi DB: ' + error.message };

      if (refId) {
        const { data: refUser } = await supabase.from('users_data').select('*').eq('id', refId).maybeSingle();
        if (refUser) {
          await supabase.from('users_data').update({
            balance: Number(refUser.balance || 0) + REFERRAL_REWARD,
            referral_count: Number(refUser.referral_count || 0) + 1
          }).eq('id', refId);
        }
      }
      return { success: true, message: 'Đăng ký thành công' };
    } catch (e: any) { return { success: false, message: e.message }; }
  },

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

  getTotalUserCount: async () => {
    const { count } = await supabase.from('users_data').select('id', { count: 'exact', head: true });
    return count || 0;
  },

  updateUser: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.taskCounts !== undefined) dbUpdates.task_counts = updates.taskCounts;
    if (updates.tasksToday !== undefined) dbUpdates.tasks_today = updates.tasksToday;
    if (updates.tasksWeek !== undefined) dbUpdates.tasks_week = updates.tasksWeek;
    if (updates.totalEarned !== undefined) dbUpdates.total_earned = updates.totalEarned;
    if (updates.lastTaskDate !== undefined) dbUpdates.last_task_date = updates.lastTaskDate;
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    return await supabase.from('users_data').update(dbUpdates).eq('id', id);
  },

  requestResetCode: async (email: string, telegramUsername: string) => {
    try {
      const { data, error } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
      if (error || !data) return { success: false, message: 'Email không tồn tại.' };
      
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase.from('users_data').update({ reset_code: resetCode }).eq('email', email);
      
      // Ghi nhật ký để Admin biết user nào vừa yêu cầu
      await dbService.logActivity(data.id, email, 'Yêu cầu Reset mật khẩu', `Telegram: ${telegramUsername}`);
      
      return { success: true, message: `Mã đã được gửi tự động tới ${telegramUsername} qua Bot.` };
    } catch (e: any) {
      return { success: false, message: 'Lỗi máy chủ: ' + e.message };
    }
  },

  resetPassword: async (email: string, code: string, newPass: string) => {
    const { data, error } = await supabase.from('users_data').select('reset_code').eq('email', email).maybeSingle();
    if (error || !data) return { success: false, message: 'Lỗi xác thực dữ liệu.' };
    if (data.reset_code === code) {
      await supabase.from('users_data').update({ password_hash: btoa(newPass), reset_code: null }).eq('email', email);
      return { success: true, message: 'Đổi mật khẩu thành công.' };
    }
    return { success: false, message: 'Mã xác minh không chính xác.' };
  },

  getAllUsers: async () => {
    const { data, error } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(mapUser);
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    return error ? handleDbError(error) : (data || []).map(w => ({ ...w, userId: w.user_id, userName: w.user_name, createdAt: w.created_at }));
  },

  addWithdrawal: async (req: any) => {
    return await supabase.from('withdrawals').insert([{
      user_id: req.userId, user_name: req.userName, amount: req.amount, type: req.type, status: 'pending', details: req.details
    }]);
  },

  updateWithdrawalStatus: async (id: string, status: string) => {
    return await supabase.from('withdrawals').update({ status }).eq('id', id);
  },

  getNotifications: async (userId?: string) => {
    let q = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userId) q = q.or(`user_id.eq.${userId},user_id.eq.all`);
    const { data, error } = await q;
    return error ? handleDbError(error) : (data || []).map(n => ({ ...n, userId: n.user_id, createdAt: n.created_at }));
  },

  addNotification: async (n: any) => {
    return await supabase.from('notifications').insert([{
      type: n.type, title: n.title, content: n.content, user_id: n.userId || 'all', user_name: n.userName || 'System'
    }]);
  },

  getAnnouncements: async (all = false) => {
    try {
      let q = supabase.from('announcements').select('*');
      if (!all) q = q.eq('is_active', true);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => ({ ...a, createdAt: a.created_at, isActive: a.is_active }));
    } catch (e) {
      const { data } = await supabase.from('announcements').select('*');
      return (data || []).map(a => ({ ...a, createdAt: a.created_at, isActive: a.is_active }));
    }
  },

  saveAnnouncement: async (ann: any) => {
    return await supabase.from('announcements').insert([{ 
      title: ann.title, content: ann.content, priority: ann.priority || 'low', is_active: true
    }]);
  },

  updateAnnouncementStatus: async (id: string, isActive: boolean) => {
    return await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
  },

  deleteAnnouncement: async (id: string) => {
    return await supabase.from('announcements').delete().eq('id', id);
  },

  getAds: async (all = false) => {
    try {
      let q = supabase.from('ads').select('*');
      if (!all) q = q.eq('is_active', true);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(ad => ({ ...ad, imageUrl: ad.image_url, targetUrl: ad.target_url, isActive: ad.is_active }));
    } catch (e) {
      const { data } = await supabase.from('ads').select('*');
      return (data || []).map(ad => ({ ...ad, imageUrl: ad.image_url, target_url: ad.target_url, isActive: ad.is_active }));
    }
  },

  saveAd: async (ad: any) => {
    return await supabase.from('ads').insert([{ title: ad.title, image_url: ad.imageUrl, target_url: ad.targetUrl, is_active: true }]);
  },

  updateAdStatus: async (id: string, isActive: boolean) => {
    return await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
  },

  deleteAd: async (id: string) => {
    return await supabase.from('ads').delete().eq('id', id);
  },

  getGiftcodes: async (all = false) => {
    try {
      let q = supabase.from('giftcodes').select('*');
      if (!all) q = q.eq('is_active', true);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(g => ({ ...g, maxUses: g.max_uses, usedBy: g.used_by || [], isActive: g.is_active }));
    } catch (e) {
      const { data } = await supabase.from('giftcodes').select('*');
      return (data || []).map(g => ({ ...g, maxUses: g.max_uses, usedBy: g.used_by || [], isActive: g.is_active }));
    }
  },

  addGiftcode: async (gc: any) => {
    return await supabase.from('giftcodes').insert([{ 
      code: gc.code.toUpperCase(), amount: gc.amount, max_uses: gc.maxUses, used_by: [], is_active: true
    }]);
  },

  updateGiftcodeStatus: async (code: string, isActive: boolean) => {
    return await supabase.from('giftcodes').update({ is_active: isActive }).eq('code', code);
  },

  deleteGiftcode: async (code: string) => {
    return await supabase.from('giftcodes').delete().eq('code', code);
  },

  logActivity: async (uId: string, uName: string, action: string, details: string) => {
    await supabase.from('activity_logs').insert([{ user_id: uId, user_name: uName, action, details }]);
  },

  getActivityLogs: async () => {
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []).map(l => ({ ...l, createdAt: l.created_at }));
    } catch (e) {
      const { data } = await supabase.from('activity_logs').select('*').limit(50);
      return (data || []).map(l => ({ ...l, createdAt: l.created_at }));
    }
  }
};
