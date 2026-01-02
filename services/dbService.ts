
import { createClient } from '@supabase/supabase-js';
import { User, Giftcode, WithdrawalRequest, AdminNotification, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { REFERRAL_REWARD, SECURE_AUTH_KEY, RATE_VND_TO_POINT } from '../constants.tsx';

// @ts-ignore
const supabaseUrl = window.process.env.SUPABASE_URL || '';
// @ts-ignore
const supabaseKey = window.process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const mapUser = (u: any): User => {
  if (!u) return null as any;
  return {
    ...u,
    adminId: u.admin_id,
    bankInfo: u.bank_info || '',
    idGame: u.id_game || '',
    totalEarned: Number(u.total_earned ?? 0),
    totalGiftcodeEarned: Number(u.total_giftcode_earned ?? 0),
    tasksToday: Number(u.tasks_today ?? 0),
    tasksWeek: Number(u.tasks_week ?? 0),
    isBanned: Boolean(u.is_banned ?? false),
    isAdmin: Boolean(u.is_admin ?? false),
    banReason: u.ban_reason || '',
    securityScore: Number(u.security_score ?? 100),
    joinDate: u.join_date,
    lastTaskDate: u.last_task_date,
    lastLogin: u.last_login,
    referralCount: Number(u.referral_count ?? 0),
    referralBonus: Number(u.referral_bonus ?? 0),
    referredBy: u.referred_by,
    taskCounts: u.task_counts || {},
    avatarUrl: u.avatar_url || ''
  };
};

const handleDbError = (err: any, fallback: any = []) => {
  if (err?.status === 404 || err?.code === 'PGRST116') return fallback;
  console.error("Database detail:", err?.message || JSON.stringify(err));
  return fallback;
};

export const dbService = {
  auditUserIntegrity: async (userId: string): Promise<{ isValid: boolean, reason?: string, score?: number }> => {
    const { data: u, error } = await supabase.from('users_data').select('*').eq('id', userId).maybeSingle();
    if (error || !u) return { isValid: false, reason: "Không tìm thấy dữ liệu hội viên" };

    const { data: withdrawals } = await supabase.from('withdrawals').select('amount').eq('user_id', userId).neq('status', 'rejected');
    const totalWithdrawnPoints = (withdrawals || []).reduce((sum, w) => sum + (Number(w.amount) * RATE_VND_TO_POINT), 0);

    const pointsFromTasks = Number(u.total_earned || 0);
    const pointsFromGiftcodes = Number(u.total_giftcode_earned || 0);
    const pointsFromRefs = Number(u.referral_count || 0) * REFERRAL_REWARD;

    const expectedTotal = pointsFromTasks + pointsFromGiftcodes + pointsFromRefs;
    const actualTotal = Number(u.balance || 0) + totalWithdrawnPoints;

    if (actualTotal > expectedTotal + 1000) {
      const currentScore = Number(u.security_score || 100);
      const newScore = Math.max(0, currentScore - 30);
      await supabase.from('users_data').update({ security_score: newScore }).eq('id', userId);
      return { isValid: false, reason: `Mất cân đối tài chính`, score: newScore };
    }
    return { isValid: true, score: u.security_score };
  },

  signup: async (email: string, pass: string, fullname: string, refId?: string) => {
    try {
      const { data: existing } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
      if (existing) return { success: false, message: 'Email đã tồn tại' };

      const userId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const { count } = await supabase.from('users_data').select('id', { count: 'exact', head: true });
      
      const newUser = {
        id: userId, admin_id: userId, email, password_hash: btoa(pass), fullname: fullname.toUpperCase(),
        balance: 0, total_earned: 0, tasks_today: 0, tasks_week: 0, 
        is_admin: (count || 0) === 0, is_banned: false, security_score: 100,
        join_date: new Date().toISOString(), referred_by: refId || null
      };

      const { error } = await supabase.from('users_data').insert([newUser]);
      if (error) return { success: false, message: error.message };

      if (refId) {
        const { data: refUser } = await supabase.from('users_data').select('*').eq('id', refId).maybeSingle();
        if (refUser) {
          await supabase.rpc('secure_add_points', { target_id: refId, auth_key: SECURE_AUTH_KEY });
          await supabase.from('users_data').update({ referral_count: Number(refUser.referral_count || 0) + 1 }).eq('id', refId);
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

  deleteAccount: async (userId: string) => {
    const { error } = await supabase.from('users_data').delete().eq('id', userId);
    if (!error) {
      localStorage.removeItem('nova_session_id');
      return { success: true };
    }
    return { success: false, message: error.message };
  },

  updateUser: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.banReason !== undefined) dbUpdates.ban_reason = updates.banReason;
    if (updates.balance !== undefined) dbUpdates.balance = Number(updates.balance);
    if (updates.securityScore !== undefined) dbUpdates.security_score = Number(updates.securityScore);
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.id_game;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    return await supabase.from('users_data').update(dbUpdates).eq('id', id);
  },

  // FIXED: Added missing addPointsSecurely method for task validation and point updating
  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    // Nova Sentinel: Kiểm tra tốc độ hoàn thành (Dưới 5 giây được coi là gian lận)
    if (timeElapsed < 5) {
      // Tự động khóa tài khoản nếu nghi ngờ gian lận
      await supabase.from('users_data').update({ 
        is_banned: true, 
        ban_reason: 'SENTINEL: Phát hiện gian lận tốc độ hoàn thành nhiệm vụ.' 
      }).eq('id', userId);
      return { error: 'SENTINEL_SECURITY_VIOLATION' };
    }

    const { data: u, error: fetchErr } = await supabase.from('users_data').select('*').eq('id', userId).maybeSingle();
    if (fetchErr || !u) return { error: 'USER_NOT_FOUND' };

    const taskCounts = u.task_counts || {};
    taskCounts[gateName] = (taskCounts[gateName] || 0) + 1;

    const { error: updateErr } = await supabase.from('users_data').update({
      balance: Number(u.balance || 0) + points,
      total_earned: Number(u.total_earned || 0) + points,
      tasks_today: Number(u.tasks_today || 0) + 1,
      tasks_week: Number(u.tasks_week || 0) + 1,
      last_task_date: new Date().toISOString(),
      task_counts: taskCounts
    }).eq('id', userId);

    return { error: updateErr?.message };
  },

  claimGiftcode: async (userId: string, code: string): Promise<{ success: boolean, message: string, amount?: number }> => {
    try {
      const { data: gc, error } = await supabase.from('giftcodes').select('*').eq('code', code.toUpperCase()).maybeSingle();
      if (error || !gc || !gc.is_active) return { success: false, message: 'Mã không tồn tại hoặc đã hết hạn.' };

      const usedBy = Array.isArray(gc.used_by) ? gc.used_by : [];
      if (usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
      if (usedBy.length >= gc.max_uses) return { success: false, message: 'Mã đã hết lượt nhập.' };

      const newUsedBy = [...usedBy, userId];
      const { error: updGcErr } = await supabase.from('giftcodes').update({ used_by: newUsedBy }).eq('code', gc.code);
      if (updGcErr) throw updGcErr;

      const { data: user } = await supabase.from('users_data').select('balance, total_giftcode_earned').eq('id', userId).maybeSingle();
      if (user) {
        await supabase.from('users_data').update({
          balance: Number(user.balance || 0) + Number(gc.amount),
          total_giftcode_earned: Number(user.total_giftcode_earned || 0) + Number(gc.amount)
        }).eq('id', userId);
      }
      return { success: true, message: `Thành công! +${gc.amount} P`, amount: gc.amount };
    } catch (e: any) { return { success: false, message: 'Lỗi: ' + e.message }; }
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*, users_data(security_score)').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    return error ? handleDbError(error) : (data || []).map(w => ({ 
      ...w, 
      userId: w.user_id, 
      userName: w.user_name, 
      createdAt: w.created_at,
      securityScore: w.users_data?.security_score ?? 100
    }));
  },

  addWithdrawal: async (req: any) => {
    const { data: user } = await supabase.from('users_data').select('balance, security_score').eq('id', req.userId).maybeSingle();
    const amountVnd = Number(req.amount);
    const pointsNeeded = amountVnd * RATE_VND_TO_POINT;
    
    if (!user || user.balance < pointsNeeded) return { error: 'INSUFFICIENT_BALANCE' };

    const { error: deductError } = await supabase.from('users_data').update({ balance: Number(user.balance) - pointsNeeded }).eq('id', req.userId);
    if (deductError) return { error: deductError.message };

    const { data: inserted, error } = await supabase.from('withdrawals').insert([{
      user_id: req.userId, user_name: req.userName, amount: amountVnd, type: req.type, status: 'pending', details: req.details
    }]).select().single();

    if (!error && inserted) {
      await dbService.addNotification({
        type: 'withdrawal',
        title: 'YÊU CẦU RÚT TIỀN MỚI',
        content: `ID: #${inserted.id} - ${req.userName} rút ${amountVnd.toLocaleString()}đ.`,
        userId: 'all', userName: req.userName
      });
    }
    return { error };
  },

  updateWithdrawalStatus: async (id: string, status: 'completed' | 'rejected') => {
    const { data: w } = await supabase.from('withdrawals').select('*').eq('id', id).maybeSingle();
    if (w && status === 'rejected' && w.status === 'pending') {
      const refund = Number(w.amount) * RATE_VND_TO_POINT;
      const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.user_id).maybeSingle();
      if (u) await supabase.from('users_data').update({ balance: Number(u.balance) + refund }).eq('id', w.user_id);
    }
    return await supabase.from('withdrawals').update({ status }).eq('id', id);
  },

  getAllUsers: async () => {
    const { data, error } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(mapUser);
  },

  getGiftcodes: async (all = false) => {
    let q = supabase.from('giftcodes').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data, error } = await q.order('created_at', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(g => ({ 
      ...g, 
      usedBy: g.used_by || [], 
      isActive: g.is_active,
      maxUses: g.max_uses,
      createdAt: g.created_at
    }));
  },

  addGiftcode: async (gc: any) => {
    return await supabase.from('giftcodes').insert([{ code: gc.code.toUpperCase(), amount: gc.amount, max_uses: gc.maxUses, used_by: [], is_active: true }]);
  },

  deleteGiftcode: async (code: string) => {
    return await supabase.from('giftcodes').delete().eq('code', code);
  },

  logActivity: async (uId: string, uName: string, action: string, details: string) => {
    await supabase.from('activity_logs').insert([{ user_id: uId, user_name: uName, action, details }]);
  },

  getActivityLogs: async () => {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return error ? handleDbError(error) : (data || []).map(l => ({ id: l.id, userId: l.user_id, userName: l.user_name, action: l.action, details: l.details, createdAt: l.created_at }));
  },

  getTotalUserCount: async () => {
    const { count } = await supabase.from('users_data').select('*', { count: 'exact', head: true });
    return count || 0;
  },

  getNotifications: async (userId?: string) => {
    let q = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userId) q = q.or(`user_id.eq.${userId},user_id.eq.all`);
    const { data, error } = await q;
    return error ? handleDbError(error) : (data || []).map(n => ({ ...n, userId: n.user_id, createdAt: n.created_at }));
  },

  addNotification: async (n: any) => {
    return await supabase.from('notifications').insert([{ type: n.type, title: n.title, content: n.content, user_id: n.userId || 'all', user_name: n.userName || 'System' }]);
  },

  getAnnouncements: async (all = false) => {
    let q = supabase.from('announcements').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data, error } = await q.order('created_at', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(a => ({ ...a, createdAt: a.created_at, isActive: a.is_active }));
  },

  saveAnnouncement: async (ann: any) => {
    return await supabase.from('announcements').insert([{ title: ann.title, content: ann.content, priority: ann.priority || 'low', is_active: true }]);
  },

  updateAnnouncementStatus: async (id: string, isActive: boolean) => {
    return await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
  },

  deleteAnnouncement: async (id: string) => {
    return await supabase.from('announcements').delete().eq('id', id);
  },

  getAds: async (all = false) => {
    let q = supabase.from('ads').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data, error } = await q.order('created_at', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(ad => ({ ...ad, imageUrl: ad.image_url, target_url: ad.target_url, isActive: ad.is_active }));
  },

  saveAd: async (ad: any) => {
    return await supabase.from('ads').insert([{ title: ad.title, image_url: ad.image_url, target_url: ad.target_url, is_active: true }]);
  },

  updateAdStatus: async (id: string, isActive: boolean) => {
    return await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
  },

  deleteAd: async (id: string) => {
    return await supabase.from('ads').delete().eq('id', id);
  },

  requestResetCode: async (email: string, telegramUsername: string) => {
    const { data } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
    if (!data) return { success: false, message: 'Email không tồn tại.' };
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('users_data').update({ reset_code: code }).eq('email', email);
    return { success: true };
  },

  resetPassword: async (email: string, code: string, newPass: string) => {
    const { data } = await supabase.from('users_data').select('reset_code').eq('email', email).maybeSingle();
    if (data?.reset_code === code) {
      await supabase.from('users_data').update({ password_hash: btoa(newPass), reset_code: null }).eq('email', email);
      return { success: true };
    }
    return { success: false, message: 'Mã không chính xác.' };
  }
};
