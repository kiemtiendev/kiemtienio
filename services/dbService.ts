
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

const mapGiftcode = (g: any): Giftcode => ({
  code: g.code,
  amount: Number(g.amount || 0),
  maxUses: Number(g.max_uses || 0),
  usedBy: g.used_by || [],
  createdAt: g.created_at,
  isActive: Boolean(g.is_active)
});

export const dbService = {
  login: async (email: string, pass: string, rememberMe: boolean = false) => {
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
    
    if (rememberMe) {
      localStorage.setItem('nova_session_id', data.id);
    } else {
      sessionStorage.setItem('nova_session_id', data.id);
    }
    
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
    
    // Referral rewards
    if (refBy) {
        const { data: referrer } = await supabase.from('users_data').select('balance, referral_count, referral_bonus').eq('id', refBy).single();
        if (referrer) {
            await supabase.from('users_data').update({
                balance: Number(referrer.balance) + REFERRAL_REWARD,
                referral_count: (referrer.referral_count || 0) + 1,
                referral_bonus: (referrer.referral_bonus || 0) + REFERRAL_REWARD
            }).eq('id', refBy);
        }
    }

    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id') || sessionStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
    return (error || !data) ? null : mapUser(data);
  },

  resetPasswordWithCode: async (email: string, code: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const { data, error } = await supabase
      .from('users_data')
      .select('*')
      .eq('email', cleanEmail)
      .eq('reset_code', cleanCode)
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' };
    }

    const { error: updateError } = await supabase
      .from('users_data')
      .update({ password_hash: newPass, reset_code: null })
      .eq('id', data.id);

    return { 
      success: !updateError, 
      message: updateError ? updateError.message : 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' 
    };
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {};
    
    // Map camelCase to snake_case for DB
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    // Fix: updates is Partial<User>, so it uses idGame instead of id_game
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.banReason !== undefined) dbUpdates.ban_reason = updates.banReason;
    if (updates.fullname !== undefined) dbUpdates.fullname = updates.fullname;
    if (updates.balance !== undefined) dbUpdates.balance = Number(updates.balance);
    if (updates.vipTier !== undefined) dbUpdates.vip_tier = updates.vipTier;
    if (updates.vipUntil !== undefined) dbUpdates.vip_until = updates.vipUntil;

    // Filter out undefined to prevent updating with nulls
    const filteredUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase.from('users_data').update(filteredUpdates).eq('id', userId);
    if (error) {
      console.error("Supabase Update Error:", error);
      return { success: false, message: `Lỗi hệ thống: ${error.message}` };
    }
    return { success: true, message: 'Cập nhật thành công.' };
  },

  linkPhone: async (userId: string, phone: string) => {
    const { error } = await supabase.from('users_data').update({ phone_number: phone }).eq('id', userId);
    return { success: !error };
  },

  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data, error: fetchError } = await supabase
      .from('users_data')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !data || data.password_hash !== oldPass) {
      return { success: false, message: 'Mật khẩu cũ không chính xác.' };
    }

    const { error: updateError } = await supabase
      .from('users_data')
      .update({ password_hash: newPass })
      .eq('id', userId);

    return { 
      success: !updateError, 
      message: updateError ? updateError.message : 'Đổi mật khẩu thành công.' 
    };
  },

  adjustBalance: async (userId: string, amount: number) => {
    const { data: u, error: fetchError } = await supabase
      .from('users_data')
      .select('balance')
      .eq('id', userId)
      .single();
      
    if (fetchError || !u) return { success: false, message: 'Không tìm thấy người dùng.' };
    
    const currentBalance = Number(u.balance || 0);
    const newBalance = currentBalance + Number(amount);

    const { error } = await supabase.from('users_data').update({ balance: newBalance }).eq('id', userId);
    if (error) return { success: false, message: `Lỗi: ${error.message}` };
    return { success: true, message: 'Cập nhật số dư thành công.' };
  },

  // Fix: Implement missing addPointsSecurely for task verification
  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    // Basic anti-cheat: if task is done too fast (e.g. < 5s)
    if (timeElapsed < 5) {
      return { error: 'SENTINEL_SECURITY_VIOLATION' };
    }

    const { data: u, error: fetchError } = await supabase
      .from('users_data')
      .select('balance, total_earned, tasks_today, tasks_week, task_counts')
      .eq('id', userId)
      .single();

    if (fetchError || !u) return { error: 'Không tìm thấy hội viên.' };

    const taskCounts = u.task_counts || {};
    taskCounts[gateName] = (taskCounts[gateName] || 0) + 1;

    const { error: updateError } = await supabase
      .from('users_data')
      .update({
        balance: Number(u.balance || 0) + points,
        total_earned: Number(u.total_earned || 0) + points,
        tasks_today: Number(u.tasks_today || 0) + 1,
        tasks_week: Number(u.tasks_week || 0) + 1,
        task_counts: taskCounts,
        last_task_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) return { error: updateError.message };
    return { success: true };
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('users_data').delete().eq('id', userId);
    if (error) {
      console.error("Supabase Delete Error:", error);
      return { success: false, message: `Không thể xóa: ${error.message}.` };
    }
    return { success: true, message: 'Đã xóa hội viên vĩnh viễn.' };
  },

  getAds: async (includeInactive = false) => {
    let q = supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return (data || []).map(a => ({...a, imageUrl: a.image_url, targetUrl: a.target_url}));
  },

  saveAd: async (ad: any) => {
    const { error } = await supabase.from('ads').insert([{
      title: ad.title,
      image_url: ad.imageUrl,
      target_url: ad.targetUrl,
      is_active: true,
      created_at: new Date().toISOString()
    }]);
    return { error };
  },

  updateAdStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('ads').update({ is_active: isActive }).eq('id', id);
    return { error };
  },

  deleteAd: async (id: string) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    return { error };
  },

  getAnnouncements: async (includeInactive = false) => {
    let q = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data } = await q;
    return data || [];
  },

  saveAnnouncement: async (ann: any) => {
    const { error } = await supabase.from('announcements').insert([{
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      is_active: true,
      created_at: new Date().toISOString()
    }]);
    return { error };
  },

  updateAnnouncementStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
    return { error };
  },

  deleteAnnouncement: async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    return { error };
  },

  getAllUsers: async () => {
    const { data } = await supabase.from('users_data').select('*').order('balance', { ascending: false });
    return (data || []).map(mapUser);
  },

  getWithdrawals: async (userId?: string) => {
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

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

    if (!error) {
        const { data: u } = await supabase.from('users_data').select('balance').eq('id', request.userId).single();
        if (u) {
            await supabase.from('users_data').update({ balance: Number(u.balance) - (request.amount * RATE_VND_TO_POINT) }).eq('id', request.userId);
        }
        await dbService.addNotification({
          userId: 'all',
          userName: request.userName,
          title: 'YÊU CẦU RÚT TIỀN MỚI',
          content: `Người dùng ${request.userName} vừa yêu cầu rút ${request.amount.toLocaleString()}đ.`,
          type: 'withdrawal'
        });
    }

    return { success: !error, error: error?.message };
  },

  updateWithdrawalStatus: async (id: string, status: string) => {
    const { data: w } = await supabase.from('withdrawals').select('*').eq('id', id).single();
    if (!w) return { success: false };
    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
    if (!error && status === 'rejected') {
        const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.user_id).single();
        if (u) {
            await supabase.from('users_data').update({ balance: Number(u.balance) + (w.amount * RATE_VND_TO_POINT) }).eq('id', w.user_id);
        }
    }
    return { success: !error };
  },

  getGiftcodes: async () => {
    const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapGiftcode);
  },

  addGiftcode: async (gc: any) => {
    const { error } = await supabase.from('giftcodes').insert([{
      code: gc.code,
      amount: gc.amount,
      max_uses: Number(gc.max_uses) || 100, // Đảm bảo không bằng 0 mặc định
      used_by: [],
      created_at: new Date().toISOString(),
      is_active: true
    }]);
    return { error };
  },

  claimGiftcode: async (userId: string, code: string) => {
    // 1. Tìm Giftcode
    const { data: gcRaw, error: gcError } = await supabase
      .from('giftcodes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (gcError || !gcRaw) return { success: false, message: 'Mã không tồn tại hoặc đã hết hạn.' };
    
    const gc = mapGiftcode(gcRaw);
    if (gc.usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
    
    // FIX: Sửa logic kiểm tra maxUses. Nếu admin vô tình để 0 hoặc mã đã hết lượt.
    if (gc.maxUses > 0 && gc.usedBy.length >= gc.maxUses) {
      return { success: false, message: 'Mã đã đạt giới hạn lượt sử dụng.' };
    }
    
    if (gc.maxUses <= 0 && gc.usedBy.length > 0) { // Trường hợp maxUses là 0 nhưng đã có người dùng
       return { success: false, message: 'Mã quà tặng này đã hết lượt sử dụng (Max: 0).' };
    }

    // 2. Tìm người dùng
    const { data: u, error: userError } = await supabase
      .from('users_data')
      .select('id, balance, total_giftcode_earned')
      .eq('id', userId.trim())
      .single();

    if (userError || !u) return { success: false, message: 'Lỗi xác thực người dùng.' };

    // 3. Cập nhật
    const { error: updateError } = await supabase.from('users_data').update({ 
      balance: Number(u.balance) + Number(gc.amount),
      total_giftcode_earned: (Number(u.total_giftcode_earned) || 0) + Number(gc.amount)
    }).eq('id', u.id);
    
    if (updateError) return { success: false, message: 'Lỗi cập nhật số dư.' };

    await supabase.from('giftcodes').update({ used_by: [...gc.usedBy, userId] }).eq('code', gc.code);
    return { success: true, amount: gc.amount, message: `Thành công! Nhận ${gc.amount.toLocaleString()} P.` };
  },

  getVipLeaderboard: async () => {
    // Lấy tất cả yêu cầu VIP đã hoàn thành
    const { data, error } = await supabase
      .from('vip_requests')
      .select('user_name, amount_vnd')
      .eq('status', 'completed');
    
    if (error || !data) return [];
    
    // Gom nhóm theo user_name và tính tổng
    const map = new Map();
    data.forEach(item => {
      const current = map.get(item.user_name) || 0;
      map.set(item.user_name, current + Number(item.amount_vnd));
    });
    
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  },

  getNotifications: async (userId: string) => {
    const { data } = await supabase.from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.all`)
      .order('created_at', { ascending: false });
    return data || [];
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
    return { success: !error, error: error?.message };
  },

  getVipRequests: async (userId?: string) => {
    let q = supabase.from('vip_requests').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

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

    if (!error) {
      await dbService.addNotification({
        userId: 'all',
        userName: req.userName,
        title: 'YÊU CẦU NÂNG CẤP VIP MỚI',
        content: `Hội viên ${req.userName} đã gửi yêu cầu nâng cấp VIP.`,
        type: 'system'
      });
    }

    return { success: !error, message: error ? error.message : 'Gửi yêu cầu thành công.' };
  },

  upgradeVipTiered: async (userId: string, amountVnd: number) => {
    const { data: u } = await supabase.from('users_data').select('balance, fullname, vip_until').eq('id', userId).single();
    const pointsNeeded = amountVnd * 10;
    if (!u || u.balance < pointsNeeded) return { success: false, message: 'Không đủ điểm Nova.' };
    
    let days = 1;
    let tier = VipTier.BASIC;
    if (amountVnd >= 500000) { days = 30; tier = VipTier.ELITE; }
    else if (amountVnd >= 100000) { days = 7; tier = VipTier.PRO; }
    
    const vipUntil = new Date();
    vipUntil.setDate(vipUntil.getDate() + days);
    
    const { error } = await supabase.from('users_data').update({
      balance: Number(u.balance) - pointsNeeded,
      vip_tier: tier,
      vip_until: vipUntil.toISOString()
    }).eq('id', userId);
    
    if (!error) {
      // Lưu vào lịch sử vip_requests để hiển thị
      await supabase.from('vip_requests').insert([{
        user_id: userId,
        user_name: u.fullname,
        vip_tier: tier,
        amount_vnd: amountVnd,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);
    }
    
    return { success: !error, message: error ? error.message : `Đã kích hoạt ${tier.toUpperCase()} thành công!` };
  },

  logout: () => {
    localStorage.removeItem('nova_session_id');
    sessionStorage.removeItem('nova_session_id');
  }
};