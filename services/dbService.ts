
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

    if (actualTotal > expectedTotal + 100) {
      return { 
        isValid: false, 
        reason: `Mất cân đối: Thực tế (${actualTotal}) > Hợp lệ (${expectedTotal}). Chênh lệch: ${actualTotal - expectedTotal} P`,
        score: u.security_score
      };
    }

    return { isValid: true, score: u.security_score };
  },

  autoBanUser: async (userId: string, reason: string) => {
    await supabase.from('users_data').update({ 
      is_banned: true, 
      ban_reason: `SENTINEL_AUTO: ${reason}` 
    }).eq('id', userId);
    
    await dbService.logActivity(userId, 'System', 'AUTO_BAN', reason);
    await dbService.addNotification({
      type: 'security',
      title: 'SENTINEL: PHÁT HIỆN GIAN LẬN',
      content: `User ${userId} bị khóa tự động. Lý do: ${reason}`,
      userId: 'all',
      userName: 'Nova Sentinel'
    });
  },

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
        is_admin: isFirst, is_banned: false, security_score: 100,
        total_giftcode_earned: 0,
        join_date: new Date().toISOString(), referred_by: refId || null, bank_info: '', id_game: '', task_counts: {},
        avatar_url: ''
      };

      const { error } = await supabase.from('users_data').insert([newUser]);
      if (error) return { success: false, message: 'Lỗi ghi DB: ' + error.message };

      if (refId) {
        const { data: refUser } = await supabase.from('users_data').select('*').eq('id', refId).maybeSingle();
        if (refUser) {
          await supabase.rpc('secure_add_points', { target_id: refId, auth_key: SECURE_AUTH_KEY });
          await supabase.from('users_data').update({
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

  updateUser: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.banReason !== undefined) dbUpdates.ban_reason = updates.banReason;
    if (updates.taskCounts !== undefined) dbUpdates.task_counts = updates.taskCounts;
    if (updates.tasksToday !== undefined) dbUpdates.tasks_today = updates.tasksToday;
    if (updates.tasksWeek !== undefined) dbUpdates.tasks_week = updates.tasksWeek;
    if (updates.lastTaskDate !== undefined) dbUpdates.last_task_date = updates.lastTaskDate;
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    return await supabase.from('users_data').update(dbUpdates).eq('id', id);
  },

  addPointsSecurely: async (id: string, timeElapsed: number) => {
    if (timeElapsed < 15) {
      await dbService.autoBanUser(id, `Speed-Cheat: Vượt link quá nhanh (${timeElapsed}s)`);
      return { error: 'SENTINEL_SECURITY_VIOLATION' };
    }

    const { error } = await supabase.rpc('secure_add_points', { 
      target_id: id, 
      auth_key: SECURE_AUTH_KEY 
    });
    return { error };
  },

  claimGiftcode: async (userId: string, code: string): Promise<{ success: boolean, message: string, amount?: number }> => {
    try {
      const { data: gc, error } = await supabase.from('giftcodes').select('*').eq('code', code.toUpperCase()).maybeSingle();
      if (error || !gc || !gc.is_active) return { success: false, message: 'Mã không tồn tại hoặc đã hết hạn.' };

      const usedBy = gc.used_by || [];
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
        
        await dbService.logActivity(userId, 'System', 'GIFTCODE', `Nhập mã ${code} +${gc.amount} P`);
      }

      return { success: true, message: `Thành công! +${gc.amount} P`, amount: gc.amount };
    } catch (e: any) {
      return { success: false, message: 'Lỗi xử lý: ' + e.message };
    }
  },

  getAllUsers: async () => {
    const { data, error } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(mapUser);
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
    const audit = await dbService.auditUserIntegrity(req.userId);
    if (!audit.isValid) {
      await dbService.autoBanUser(req.userId, `Audit-Failure: ${audit.reason}`);
      return { error: 'SECURITY_AUDIT_FAILED' };
    }

    const { data: user } = await supabase.from('users_data').select('balance, security_score').eq('id', req.userId).maybeSingle();
    const pointsNeeded = Number(req.amount) * RATE_VND_TO_POINT;
    
    if (!user || user.balance < pointsNeeded) {
      return { error: 'INSUFFICIENT_BALANCE' };
    }

    // NOVA UPDATE: Insert and select the generated ID
    const { data: inserted, error } = await supabase.from('withdrawals').insert([{
      user_id: req.userId, user_name: req.userName, amount: req.amount, type: req.type, status: 'pending', details: req.details
    }]).select().single();

    if (!error && inserted) {
      // NOVA ALERT: Send notification to admin with Withdrawal ID and security score
      await dbService.addNotification({
        type: 'withdrawal',
        title: 'YÊU CẦU RÚT TIỀN MỚI',
        content: `ID: #${inserted.id} - ${req.userName} rút ${req.amount.toLocaleString()}đ. ĐIỂM TIN CẬY: ${user.security_score}%`,
        userId: 'all',
        userName: req.userName
      });
    }

    return { error };
  },

  updateWithdrawalStatus: async (id: string, status: 'completed' | 'rejected') => {
    const { data: withdrawal, error: fetchErr } = await supabase.from('withdrawals').select('*').eq('id', id).maybeSingle();
    if (fetchErr || !withdrawal) return { error: fetchErr || 'Withdrawal not found' };

    if (status === 'rejected' && withdrawal.status === 'pending') {
      const refundPoints = Number(withdrawal.amount) * RATE_VND_TO_POINT;
      const { data: user } = await supabase.from('users_data').select('balance').eq('id', withdrawal.user_id).maybeSingle();

      if (user) {
        const newBalance = Number(user.balance || 0) + refundPoints;
        await supabase.from('users_data').update({ balance: newBalance }).eq('id', withdrawal.user_id);
        await dbService.logActivity(withdrawal.user_id, withdrawal.user_name, 'Hoàn điểm (Refund)', `+${refundPoints} P`);
      }
    }
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
    return await supabase.from('ads').insert([{ title: ad.title, image_url: ad.imageUrl, target_url: ad.targetUrl, is_active: true }]);
  },

  updateAdStatus: async (id: string, isActive: boolean) => {
    return await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
  },

  deleteAd: async (id: string) => {
    return await supabase.from('ads').delete().eq('id', id);
  },

  getGiftcodes: async (all = false) => {
    let q = supabase.from('giftcodes').select('*');
    if (!all) q = q.eq('is_active', true);
    const { data, error } = await q.order('created_at', { ascending: false });
    return error ? handleDbError(error) : (data || []).map(g => ({ ...g, maxUses: g.max_uses, usedBy: g.used_by || [], isActive: g.is_active }));
  },

  addGiftcode: async (gc: any) => {
    return await supabase.from('giftcodes').insert([{ code: gc.code.toUpperCase(), amount: gc.amount, max_uses: gc.maxUses, used_by: [], is_active: true }]);
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
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return error ? handleDbError(error) : (data || []).map(l => ({ 
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      action: l.action,
      details: l.details,
      createdAt: l.created_at 
    }));
  },

  getTotalUserCount: async () => {
    const { count, error } = await supabase.from('users_data').select('*', { count: 'exact', head: true });
    return error ? 0 : (count || 0);
  },

  requestResetCode: async (email: string, telegramUsername: string) => {
    try {
      const { data, error } = await supabase.from('users_data').select('id').eq('email', email).maybeSingle();
      if (error || !data) return { success: false, message: 'Email không tồn tại.' };
      
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase.from('users_data').update({ reset_code: resetCode }).eq('email', email);
      
      await dbService.logActivity(data.id, email, 'Yêu cầu Reset mật khẩu', `Username: ${telegramUsername}`);
      
      return { success: true, message: `Mã đã được tạo. Hãy nhấn nút bên dưới để nhận mã qua Bot.` };
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
  }
};
