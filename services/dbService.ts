
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, AdminNotification, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { REFERRAL_REWARD, RATE_VND_TO_POINT } from '../constants.tsx';

// Truy cập an toàn qua window.process.env
const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || '';
const supabaseKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

const mapUser = (u: any): User => {
  if (!u) return null as any;
  return {
    ...u,
    bankInfo: u.bank_info || '',
    idGame: u.id_game || '',
    totalEarned: Number(u.total_earned ?? 0),
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

export const dbService = {
  signup: async (email: string, pass: string, fullname: string, refId?: string) => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('users_data')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error("Supabase Error Details:", JSON.stringify(checkError));
        const code = checkError.code || 'UNKNOWN';
        
        if (code === '42703') {
          return { 
            success: false, 
            message: `LỖI DB (42703): Bảng users_data của bạn đang bị thiếu cột quan trọng (id hoặc email). Hãy vào Admin -> Cài đặt DB để copy mã SQL tạo lại bảng!` 
          };
        }
        return { success: false, message: `Lỗi Database: ${checkError.message}` };
      }
      
      if (existing) return { success: false, message: 'Email này đã được sử dụng!' };

      const userId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const { count } = await supabase.from('users_data').select('id', { count: 'exact', head: true });
      const isFirst = (count || 0) === 0;

      const newUser = {
        id: userId,
        email,
        password_hash: btoa(pass),
        fullname: fullname.toUpperCase(),
        balance: 0,
        total_earned: 0,
        is_admin: isFirst,
        is_banned: false,
        join_date: new Date().toISOString(),
        referred_by: refId || null,
        bank_info: '',
        id_game: '',
        task_counts: {}
      };

      const { error: insertError } = await supabase.from('users_data').insert([newUser]);
      if (insertError) return { success: false, message: 'Lỗi đăng ký: ' + insertError.message };

      if (refId) {
        const { data: refUser } = await supabase.from('users_data').select('*').eq('id', refId).maybeSingle();
        if (refUser) {
          await supabase.from('users_data').update({
            balance: Number(refUser.balance || 0) + REFERRAL_REWARD,
            total_earned: Number(refUser.total_earned || 0) + REFERRAL_REWARD,
            referral_count: Number(refUser.referral_count || 0) + 1,
            referral_bonus: Number(refUser.referral_bonus || 0) + REFERRAL_REWARD
          }).eq('id', refId);
        }
      }

      await dbService.addNotification({
        type: 'auth',
        title: 'HỘI VIÊN MỚI',
        content: `${fullname.toUpperCase()} vừa gia nhập Diamond Nova.`,
        userId: userId,
        userName: fullname.toUpperCase()
      });

      return { success: true, message: 'Đăng ký thành công!' };
    } catch (err: any) {
      return { success: false, message: 'Lỗi hệ thống: ' + (err.message || String(err)) };
    }
  },

  login: async (email: string, pass: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users_data')
        .select('*')
        .eq('email', email)
        .eq('password_hash', btoa(pass))
        .maybeSingle();

      if (error) return null;
      if (!user) return null;
      
      localStorage.setItem('nova_session_id', user.id);
      return mapUser(user);
    } catch {
      return null;
    }
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id');
    if (!id) return null;
    try {
      const { data: user, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
      if (error || !user) return null;
      return mapUser(user);
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('nova_session_id');
  },

  getTotalUserCount: async () => {
    try {
      const { count } = await supabase.from('users_data').select('id', { count: 'exact', head: true });
      return count || 0;
    } catch {
      return 0;
    }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    const dbUpdates: any = { ...updates };
    
    if (updates.totalEarned !== undefined) dbUpdates.total_earned = updates.totalEarned;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
    if (updates.lastTaskDate !== undefined) dbUpdates.last_task_date = updates.lastTaskDate;
    if (updates.taskCounts !== undefined) dbUpdates.task_counts = updates.taskCounts;
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    
    delete dbUpdates.totalEarned;
    delete dbUpdates.isBanned;
    delete dbUpdates.isAdmin;
    delete dbUpdates.lastTaskDate;
    delete dbUpdates.taskCounts;
    delete dbUpdates.bankInfo;
    delete dbUpdates.idGame;

    await supabase.from('users_data').update(dbUpdates).eq('id', id);
  },

  getAllUsers: async () => {
    try {
      const { data, error } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
      if (error) return [];
      return (data || []).map(mapUser);
    } catch {
      return [];
    }
  },

  getWithdrawals: async (userId?: string) => {
    try {
      let query = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data } = await query;
      return (data || []).map(w => ({
        ...w,
        userId: w.user_id,
        userName: w.user_name,
        createdAt: w.created_at
      }));
    } catch {
      return [];
    }
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
      const { data: user } = await supabase.from('users_data').select('balance').eq('id', userId).maybeSingle();
      if (user) {
        await supabase.from('users_data').update({ balance: Number(user.balance || 0) + (amount * RATE_VND_TO_POINT) }).eq('id', userId);
      }
    }
  },

  getNotifications: async (userId?: string) => {
    try {
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
    } catch {
      return [];
    }
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
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },

  getAnnouncements: async () => {
    try {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return (data || []).map(a => ({ ...a, createdAt: a.created_at }));
    } catch {
      return [];
    }
  },

  saveAnnouncement: async (ann: any) => {
    await supabase.from('announcements').insert([{
      title: ann.title,
      content: ann.content,
      priority: ann.priority || 'low',
      created_at: ann.createdAt || new Date().toISOString()
    }]);
  },

  getAds: async (includeInactive = false) => {
    try {
      let query = supabase.from('ads').select('*');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data } = await query;
      return (data || []).map(ad => ({
        ...ad,
        imageUrl: ad.image_url,
        target_url: ad.target_url,
        isActive: ad.is_active,
        isHidden: ad.is_hidden
      }));
    } catch {
      return [];
    }
  },

  saveAd: async (ad: any) => {
    await supabase.from('ads').upsert([{
      title: ad.title,
      image_url: ad.imageUrl,
      target_url: ad.targetUrl,
      is_active: ad.isActive ?? true,
      is_hidden: ad.isHidden ?? false
    }]);
  },

  getGiftcodes: async () => {
    try {
      const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
      return (data || []).map(g => ({
        ...g,
        maxUses: g.max_uses,
        usedBy: g.used_by || [],
        createdAt: g.created_at
      }));
    } catch {
      return [];
    }
  },

  addGiftcode: async (gc: any) => {
    await supabase.from('giftcodes').insert([{
      code: gc.code,
      amount: gc.amount,
      max_uses: gc.max_uses,
      used_by: [],
      created_at: new Date().toISOString()
    }]);
  },

  saveGiftcodes: async (codes: Giftcode[]) => {
    for (const gc of codes) {
      await supabase.from('giftcodes').update({ used_by: gc.usedBy }).eq('code', gc.code);
    }
  },

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
    try {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return (data || []).map(l => ({
        ...l,
        userId: l.user_id,
        userName: l.user_name,
        createdAt: l.created_at
      }));
    } catch {
      return [];
    }
  }
};
