
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

const mapGiftcode = (g: any): Giftcode => ({
  code: g.code,
  amount: Number(g.amount || 0),
  maxUses: Number(g.max_uses || 0),
  usedBy: g.used_by || [],
  createdAt: g.created_at,
  isActive: Boolean(g.is_active)
});

const mapWithdrawal = (w: any): WithdrawalRequest => ({
  id: w.id,
  userId: w.user_id,
  userName: w.user_name,
  amount: Number(w.amount),
  type: w.type,
  status: w.status,
  details: w.details,
  createdAt: w.created_at
});

export const dbService = {
  login: async (email: string, pass: string, rememberMe: boolean = false) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.from('users_data').select('*').eq('email', cleanEmail).eq('password_hash', pass.trim()).maybeSingle();
    if (error || !data) return { success: false, message: 'Sai email hoặc mật khẩu.' };
    if (rememberMe) localStorage.setItem('nova_session_id', data.id);
    else sessionStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  register: async (fullname: string, email: string, pass: string, refBy?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data: existing } = await supabase.from('users_data').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return { success: false, message: 'Email đã tồn tại.' };

    // Tạo ID 8 chữ số ngẫu nhiên (10000000 - 99999999)
    const random8DigitId = Math.floor(10000000 + Math.random() * 90000000).toString();

    const newUser = {
      id: random8DigitId,
      fullname: fullname.trim().toUpperCase(),
      email: cleanEmail,
      password_hash: pass.trim(),
      balance: 0,
      total_earned: 0,
      tasks_today: 0,
      tasks_week: 0,
      is_banned: false,
      is_admin: cleanEmail === 'adminavudev@gmail.com', 
      join_date: new Date().toISOString(),
      referred_by: refBy
    };

    const { data, error } = await supabase.from('users_data').insert([newUser]).select().single();
    if (error) return { success: false, message: error.message };
    
    if (refBy) {
        const { data: r } = await supabase.from('users_data').select('balance, referral_count, referral_bonus').eq('id', refBy).single();
        if (r) await supabase.from('users_data').update({ balance: Number(r.balance) + REFERRAL_REWARD, referral_count: (r.referral_count || 0) + 1, referral_bonus: (r.referral_bonus || 0) + REFERRAL_REWARD }).eq('id', refBy);
    }

    localStorage.setItem('nova_session_id', data.id);
    return { success: true, user: mapUser(data) };
  },

  updatePassword: async (userId: string, oldPass: string, newPass: string) => {
    const { data: u, error: fetchErr } = await supabase.from('users_data').select('password_hash').eq('id', userId).single();
    if (fetchErr || !u) return { success: false, message: 'Người dùng không tồn tại.' };
    if (u.password_hash !== oldPass) return { success: false, message: 'Mật khẩu cũ không chính xác.' };
    
    const { error: updateErr } = await supabase.from('users_data').update({ password_hash: newPass }).eq('id', userId);
    return { success: !updateErr, message: updateErr ? updateErr.message : 'Đổi mật khẩu thành công.' };
  },

  resetPasswordWithCode: async (email: string, code: string, newPass: string) => {
    if (!code || code.length !== 6) return { success: false, message: 'Mã OTP không hợp lệ.' };
    
    const { error } = await supabase.from('users_data').update({ password_hash: newPass }).eq('email', email.trim().toLowerCase());
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Mật khẩu đã được đặt lại thành công.' };
  },

  getCurrentUser: async () => {
    const id = localStorage.getItem('nova_session_id') || sessionStorage.getItem('nova_session_id');
    if (!id) return null;
    const { data, error } = await supabase.from('users_data').select('*').eq('id', id).maybeSingle();
    return (error || !data) ? null : mapUser(data);
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {};
    if (updates.bankInfo !== undefined) dbUpdates.bank_info = updates.bankInfo;
    if (updates.idGame !== undefined) dbUpdates.id_game = updates.idGame;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.isBanned !== undefined) dbUpdates.is_banned = updates.isBanned;
    if (updates.banReason !== undefined) dbUpdates.ban_reason = updates.banReason;
    if (updates.balance !== undefined) dbUpdates.balance = Number(updates.balance);

    const { error } = await supabase.from('users_data').update(dbUpdates).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Cập nhật thành công.' };
  },

  deleteUser: async (userId: string) => {
    await Promise.all([
      supabase.from('withdrawals').delete().eq('user_id', userId),
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('vip_requests').delete().eq('user_id', userId)
    ]);

    const { error, status } = await supabase.from('users_data').delete().eq('id', userId);
    if (error) return { success: false, message: `Lỗi máy chủ: ${error.message}` };
    return { success: true, message: 'Hội viên đã được xóa khỏi hệ thống.' };
  },

  addPointsSecurely: async (userId: string, timeElapsed: number, points: number, gateName: string) => {
    if (timeElapsed < 5) return { error: 'SENTINEL_SECURITY_VIOLATION' };
    const { data: u } = await supabase.from('users_data').select('balance, total_earned, tasks_today, task_counts').eq('id', userId).single();
    if (!u) return { error: 'Not found' };
    const counts = { ...(u.task_counts || {}) };
    counts[gateName] = (counts[gateName] || 0) + 1;
    const { error } = await supabase.from('users_data').update({
      balance: Number(u.balance) + points,
      total_earned: Number(u.total_earned) + points,
      tasks_today: Number(u.tasks_today) + 1,
      task_counts: counts,
      last_task_date: new Date().toISOString()
    }).eq('id', userId);
    return { success: !error, error: error?.message };
  },

  adjustBalance: async (userId: string, amount: number) => {
    const { data: u } = await supabase.from('users_data').select('balance').eq('id', userId).single();
    if (!u) return { success: false };
    const { error } = await supabase.from('users_data').update({ balance: Number(u.balance) + amount }).eq('id', userId);
    return { success: !error, message: error ? error.message : 'Đã cập nhật số dư.' };
  },

  claimGiftcode: async (userId: string, code: string) => {
    const { data: gcRaw, error: gcError } = await supabase.from('giftcodes').select('*').eq('code', code.trim().toUpperCase()).eq('is_active', true).maybeSingle();
    if (gcError || !gcRaw) return { success: false, message: 'Mã không tồn tại hoặc đã hết hạn.' };
    
    const gc = mapGiftcode(gcRaw);
    if (gc.usedBy.includes(userId)) return { success: false, message: 'Bạn đã sử dụng mã này rồi.' };
    
    if (gc.maxUses > 0 && gc.usedBy.length >= gc.maxUses) {
      return { success: false, message: 'Mã đã đạt giới hạn lượt sử dụng.' };
    }

    const { data: u } = await supabase.from('users_data').select('id, balance, total_giftcode_earned').eq('id', userId).single();
    if (!u) return { success: false, message: 'Lỗi xác thực người dùng.' };

    const { error: updErr } = await supabase.from('users_data').update({ 
      balance: Number(u.balance) + gc.amount,
      total_giftcode_earned: (Number(u.total_giftcode_earned) || 0) + gc.amount
    }).eq('id', u.id);
    
    if (updErr) return { success: false, message: 'Lỗi hệ thống khi cộng điểm.' };

    // Update used_by safely
    const newUsedBy = [...(gc.usedBy || []), userId];
    await supabase.from('giftcodes').update({ used_by: newUsedBy }).eq('id', gcRaw.id);
    
    return { success: true, amount: gc.amount, message: `Thành công! Nhận ${gc.amount.toLocaleString()} P.` };
  },

  getVipLeaderboard: async () => {
    const { data, error } = await supabase.from('vip_requests').select('user_name, amount_vnd').eq('status', 'completed');
    if (error || !data) return [];
    const map = new Map();
    data.forEach(i => map.set(i.user_name, (map.get(i.user_name) || 0) + Number(i.amount_vnd)));
    return Array.from(map.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 10);
  },

  getVipRequests: async (userId?: string) => {
    let q = supabase.from('vip_requests').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return data || [];
  },

  createVipDepositRequest: async (req: any) => {
    const { error } = await supabase.from('vip_requests').insert([req]);
    if (!error) {
        // Thông báo cho Admin (Gửi tới hòm thư chung 'all')
        await supabase.from('notifications').insert([{
           user_id: 'all',
           title: 'YÊU CẦU NẠP VIP MỚI',
           content: `Hội viên ${req.user_name} vừa gửi yêu cầu nâng cấp ${req.vip_tier} (${req.amount_vnd.toLocaleString()}đ).`,
           type: 'system',
           created_at: new Date().toISOString()
        }]);
    }
    return { success: !error, message: error ? error.message : 'Gửi yêu cầu thành công, vui lòng chờ duyệt.' };
  },
  
  updateVipRequestStatus: async (requestId: string, status: 'completed' | 'refunded', userId?: string, vipTier?: string, amountVnd?: number) => {
    const { error } = await supabase.from('vip_requests').update({ status }).eq('id', requestId);
    if (error) return { success: false, message: error.message };

    if (status === 'completed' && userId && vipTier && amountVnd) {
      let days = 1;
      if (amountVnd >= 500000) days = 30;
      else if (amountVnd >= 100000) days = 7;
      else if (amountVnd >= 20000) days = 1;

      const until = new Date();
      until.setDate(until.getDate() + days);

      const { error: userError } = await supabase.from('users_data').update({
        vip_tier: vipTier,
        vip_until: until.toISOString()
      }).eq('id', userId);

      if (userError) return { success: false, message: 'Đã duyệt nhưng lỗi cập nhật VIP user.' };
    }
    
    return { success: true };
  },

  upgradeVipTiered: async (userId: string, amountVnd: number) => {
    const { data: u } = await supabase.from('users_data').select('balance, fullname').eq('id', userId).single();
    const pointsNeeded = amountVnd * 10;
    if (!u || u.balance < pointsNeeded) return { success: false, message: 'Không đủ điểm Nova.' };
    
    let days = amountVnd >= 500000 ? 30 : amountVnd >= 100000 ? 7 : 1;
    let tier = amountVnd >= 500000 ? VipTier.ELITE : amountVnd >= 100000 ? VipTier.PRO : VipTier.BASIC;
    
    const until = new Date();
    until.setDate(until.getDate() + days);
    
    const { error } = await supabase.from('users_data').update({
      balance: Number(u.balance) - pointsNeeded,
      vip_tier: tier,
      vip_until: until.toISOString()
    }).eq('id', userId);

    if (!error) {
      await supabase.from('vip_requests').insert([{ user_id: userId, user_name: u.fullname, vip_tier: tier, amount_vnd: amountVnd, status: 'completed', created_at: new Date().toISOString() }]);
    }
    
    return { success: !error, message: error ? error.message : `Đã kích hoạt ${tier.toUpperCase()} thành công!` };
  },

  getAllUsers: async () => { const { data } = await supabase.from('users_data').select('*').order('balance', { ascending: false }); return (data || []).map(mapUser); },
  
  getWithdrawals: async (userId?: string) => { 
    let q = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q; 
    return (data || []).map(mapWithdrawal);
  },

  addWithdrawal: async (request: any) => {
    const dbData = {
      user_id: request.userId,
      user_name: request.userName,
      amount: request.amount,
      type: request.type,
      status: request.status,
      details: request.details,
      created_at: request.createdAt
    };
    
    const { error } = await supabase.from('withdrawals').insert([dbData]);
    
    if (!error) {
        // Trừ tiền user
        const { data: u } = await supabase.from('users_data').select('balance').eq('id', request.userId).single();
        if (u) {
          await supabase.from('users_data').update({ 
            balance: Number(u.balance) - (request.amount * RATE_VND_TO_POINT) 
          }).eq('id', request.userId);
        }
        
        try {
          await supabase.from('notifications').insert([{
             user_id: 'all',
             title: 'YÊU CẦU RÚT TIỀN MỚI',
             content: `Hội viên ${request.userName} vừa yêu cầu rút ${request.amount.toLocaleString()}đ qua ${request.type === 'bank' ? 'ATM' : 'Game'}.`,
             type: 'withdrawal',
             created_at: new Date().toISOString()
          }]);
        } catch (e) {
          console.error("Error sending admin notification:", e);
        }
    }
    return { success: !error, message: error ? error.message : 'Gửi yêu cầu thành công' };
  },

  updateWithdrawalStatus: async (id: string, status: string) => {
    const { data: w } = await supabase.from('withdrawals').select('*').eq('id', id).single();
    if (!w) return { success: false };
    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
    
    if (!error) {
        if (status === 'rejected') {
            const { data: u } = await supabase.from('users_data').select('balance').eq('id', w.user_id).single();
            if (u) await supabase.from('users_data').update({ balance: Number(u.balance) + (w.amount * RATE_VND_TO_POINT) }).eq('id', w.user_id);
        }
        
        // Thông báo kết quả cho người dùng
        await supabase.from('notifications').insert([{
           user_id: w.user_id,
           title: status === 'completed' ? 'RÚT TIỀN THÀNH CÔNG' : 'YÊU CẦU BỊ TỪ CHỐI',
           content: status === 'completed' 
             ? `Yêu cầu rút ${Number(w.amount).toLocaleString()}đ của bạn đã được duyệt thành công.`
             : `Yêu cầu rút ${Number(w.amount).toLocaleString()}đ đã bị từ chối. Số dư đã được hoàn lại.`,
           type: 'withdrawal',
           created_at: new Date().toISOString()
        }]);
    }
    return { success: !error };
  },

  getGiftcodes: async () => { const { data } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false }); return (data || []).map(mapGiftcode); },
  addGiftcode: async (code: string, amount: number, maxUses: number) => {
    const { error } = await supabase.from('giftcodes').insert([{
      code: code.trim().toUpperCase(),
      amount: Number(amount),
      max_uses: Number(maxUses),
      used_by: [],
      created_at: new Date().toISOString(),
      is_active: true
    }]);
    return { error };
  },
  getAds: async (inc = false) => { let q = supabase.from('ads').select('*'); if (!inc) q = q.eq('is_active', true); const { data } = await q; return (data || []).map(a => ({...a, imageUrl: a.image_url, targetUrl: a.target_url})); },
  saveAd: async (ad: any) => { return await supabase.from('ads').insert([{ title: ad.title, image_url: ad.imageUrl, target_url: ad.targetUrl, is_active: true, created_at: new Date().toISOString() }]); },
  updateAdStatus: async (id: string, s: boolean) => { return await supabase.from('ads').update({ is_active: s }).eq('id', id); },
  deleteAd: async (id: string) => { return await supabase.from('ads').delete().eq('id', id); },
  getAnnouncements: async (inc = false) => { let q = supabase.from('announcements').select('*'); if (!inc) q = q.eq('is_active', true); const { data } = await q; return data || []; },
  saveAnnouncement: async (ann: any) => { return await supabase.from('announcements').insert([{ ...ann, is_active: true, created_at: new Date().toISOString() }]); },
  updateAnnouncementStatus: async (id: string, s: boolean) => { return await supabase.from('announcements').update({ is_active: s }).eq('id', id); },
  deleteAnnouncement: async (id: string) => { return await supabase.from('announcements').delete().eq('id', id); },
  getNotifications: async (uid: string) => { const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${uid},user_id.eq.all`).order('created_at', { ascending: false }); return data || []; },
  addNotification: async (n: any) => { return await supabase.from('notifications').insert([{ ...n, created_at: new Date().toISOString() }]); },
  logout: () => { localStorage.removeItem('nova_session_id'); sessionStorage.removeItem('nova_session_id'); }
};
