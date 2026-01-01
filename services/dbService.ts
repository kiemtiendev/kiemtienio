
import { User, Giftcode, WithdrawalRequest, AdminNotification, AccountRecord, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { REFERRAL_REWARD, RATE_VND_TO_POINT } from '../constants.tsx';

const STORAGE_KEY_USER = 'diamond_earn_user_session';
const STORAGE_KEY_ACCOUNTS = 'diamond_earn_accounts'; 
const STORAGE_KEY_GIFTCODES = 'diamond_earn_giftcodes';
const STORAGE_KEY_WITHDRAWALS = 'diamond_earn_withdrawals';
const STORAGE_KEY_ALL_USERS = 'diamond_earn_all_users';
const STORAGE_KEY_NOTIFICATIONS = 'diamond_earn_notifications';
const STORAGE_KEY_ANNOUNCEMENTS = 'diamond_earn_announcements';
const STORAGE_KEY_ADS = 'diamond_earn_ads';
const STORAGE_KEY_LOGS = 'diamond_earn_activity_logs';

export const dbService = {
  signup: (email: string, pass: string, fullname: string, refId?: string): { success: boolean, message: string } => {
    const accounts: AccountRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ACCOUNTS) || '[]');
    if (accounts.find(a => a.email === email)) return { success: false, message: 'Email đã tồn tại!' };

    const allUsers = dbService.getAllUsers();
    const isFirstUser = allUsers.length === 0;
    const userId = Math.random().toString(36).substr(2, 9).toUpperCase();

    const newUser: User = {
      id: userId,
      email,
      fullname: fullname.toUpperCase(),
      bankInfo: '',
      idGame: '',
      balance: 0,
      totalEarned: 0,
      tasksToday: 0,
      tasksWeek: 0,
      taskCounts: {},
      joinDate: new Date().toLocaleDateString('vi-VN'),
      lastTaskDate: '',
      isBanned: false,
      isAdmin: isFirstUser,
      referralCount: 0,
      referralBonus: 0,
      referredBy: refId || ''
    };

    if (refId) {
      const referrer = allUsers.find(u => u.id === refId);
      if (referrer) {
        referrer.balance += REFERRAL_REWARD;
        referrer.totalEarned += REFERRAL_REWARD;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.referralBonus = (referrer.referralBonus || 0) + REFERRAL_REWARD;
        
        dbService.addNotification({
          type: 'referral',
          title: 'THƯỞNG GIỚI THIỆU MỚI',
          content: `Bạn nhận được +${REFERRAL_REWARD.toLocaleString()} P từ việc mời thành viên ${fullname.toUpperCase()}`,
          userId: referrer.id,
          userName: referrer.fullname
        });
      }
    }

    accounts.push({ email, passwordHash: btoa(pass), userId });
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));

    allUsers.push(newUser);
    localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(allUsers));
    
    dbService.logActivity(userId, fullname.toUpperCase(), 'Đăng ký', 'Tạo tài khoản mới thành công');
    
    return { success: true, message: 'Đăng ký thành công!' };
  },

  login: (email: string, pass: string): User | null => {
    const accounts: AccountRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ACCOUNTS) || '[]');
    const acc = accounts.find(a => a.email === email && a.passwordHash === btoa(pass));
    if (!acc) return null;
    
    const all = dbService.getAllUsers();
    const userIndex = all.findIndex(u => u.id === acc.userId);
    if (userIndex > -1) {
      all[userIndex].lastLogin = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(all));
      
      const user = all[userIndex];
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      
      dbService.logActivity(user.id, user.fullname, 'Đăng nhập', 'Truy cập vào hệ thống');
      return user;
    }
    return null;
  },

  logout: () => {
    const user = dbService.getCurrentUser();
    if (user) {
      dbService.logActivity(user.id, user.fullname, 'Đăng xuất', 'Thoát khỏi hệ thống');
    }
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (!data) return null;
    const sessionUser = JSON.parse(data);
    const all = dbService.getAllUsers();
    return all.find(u => u.id === sessionUser.id) || null;
  },

  updateCurrentUser: (user: User) => {
    const all = dbService.getAllUsers();
    const index = all.findIndex(u => u.id === user.id);
    if (index > -1) {
      all[index] = user;
      localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(all));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEY_ALL_USERS);
    return data ? JSON.parse(data) : [];
  },

  getTotalUserCount: (): number => dbService.getAllUsers().length + 1540,

  adminUpdateUser: (updatedUser: User) => {
    const all = dbService.getAllUsers();
    const index = all.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
      all[index] = updatedUser;
      localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(all));
      return true;
    }
    return false;
  },

  logActivity: (userId: string, userName: string, action: string, details: string) => {
    const logs: ActivityLog[] = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 1000)));
  },

  getActivityLogs: (): ActivityLog[] => {
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    return data ? JSON.parse(data) : [];
  },

  getAds: (includeHidden = false): AdBanner[] => {
    const data = localStorage.getItem(STORAGE_KEY_ADS);
    let all: AdBanner[] = data ? JSON.parse(data) : [];
    
    if (all.length === 0) {
      all = [
        {
          id: 'default-1',
          title: 'SHOP ACC FF GIÁ RẺ - UY TÍN SỐ 1',
          imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070',
          targetUrl: 'https://shopee.vn',
          isActive: true,
          isHidden: false
        },
        {
          id: 'default-2',
          title: 'DỊCH VỤ CÀY THUÊ LIÊN QUÂN',
          imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2071',
          targetUrl: 'https://zalo.me',
          isActive: true,
          isHidden: false
        }
      ];
      localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(all));
    }
    
    return includeHidden ? all : all.filter(a => !a.isHidden && a.isActive);
  },
  saveAd: (ad: AdBanner) => {
    const all = dbService.getAds(true);
    all.unshift(ad);
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(all));
  },
  toggleAdVisibility: (id: string) => {
    const all = dbService.getAds(true);
    const idx = all.findIndex(a => String(a.id) === String(id));
    if (idx > -1) {
      all[idx].isHidden = !all[idx].isHidden;
      localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(all));
      return true;
    }
    return false;
  },
  deleteAd: (id: string) => {
    const all = dbService.getAds(true);
    const filtered = all.filter(a => String(a.id) !== String(id));
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(filtered));
  },

  getWithdrawals: (userId?: string): WithdrawalRequest[] => {
    const data = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    const all: WithdrawalRequest[] = data ? JSON.parse(data) : [];
    return userId ? all.filter(r => r.userId === userId) : all;
  },
  addWithdrawal: (req: WithdrawalRequest) => {
    const all = dbService.getWithdrawals();
    const nextIdNumber = all.length;
    req.id = nextIdNumber.toString().padStart(7, '0');
    
    all.unshift(req);
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(all));

    dbService.logActivity(req.userId, req.userName, 'Rút tiền', `Yêu cầu rút ${req.amount.toLocaleString()}đ qua ${req.type}`);

    dbService.addNotification({
      type: 'withdrawal',
      title: `LỆNH RÚT #${req.id}`,
      content: `User: ${req.userName} | Loại: ${req.type === 'bank' ? 'ATM' : 'Kim cương'} | Số tiền: ${req.amount.toLocaleString()}đ | Info: ${req.details}`,
      userId: req.userId,
      userName: req.userName
    });
  },
  updateWithdrawalStatus: (id: string, status: 'pending' | 'completed' | 'rejected', reason?: string) => {
    console.log(`[DB] Cập nhật đơn #${id} sang ${status}`);
    const allWithdrawals = dbService.getWithdrawals();
    const idx = allWithdrawals.findIndex(w => String(w.id) === String(id));
    
    if (idx > -1) { 
      const request = allWithdrawals[idx];
      request.status = status; 
      localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(allWithdrawals)); 
      
      if (status === 'rejected') {
        const allUsers = dbService.getAllUsers();
        const userIdx = allUsers.findIndex(u => u.id === request.userId);
        if (userIdx > -1) {
          const refundPoints = request.amount * RATE_VND_TO_POINT;
          allUsers[userIdx].balance += refundPoints;
          localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(allUsers));
          
          dbService.addNotification({
            type: 'withdrawal',
            title: `LỆNH RÚT #${id} BỊ TỪ CHỐI`,
            content: `Lý do: ${reason || 'Thông tin không chính xác'}. Số điểm ${refundPoints.toLocaleString()} P đã được hoàn lại.`,
            userId: request.userId,
            userName: request.userName
          });
        }
      } else if (status === 'completed') {
        dbService.addNotification({
          type: 'withdrawal',
          title: `LỆNH RÚT #${id} THÀNH CÔNG`,
          content: `Yêu cầu rút ${request.amount.toLocaleString()}đ của bạn đã được thanh toán.`,
          userId: request.userId,
          userName: request.userName
        });
      }

      dbService.logActivity(request.userId, request.userName, 'Cập nhật rút tiền', `Lệnh rút #${id} chuyển sang: ${status}`);
      return true;
    }
    console.error(`[DB] Không tìm thấy đơn #${id} để cập nhật!`);
    return false;
  },

  getAnnouncements: (): Announcement[] => {
    const data = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveAnnouncement: (ann: Announcement) => {
    const all = dbService.getAnnouncements();
    all.unshift(ann);
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(all));
  },
  deleteAnnouncement: (id: string) => {
    const all = dbService.getAnnouncements();
    const filtered = all.filter(a => String(a.id) !== String(id));
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(filtered));
  },

  getGiftcodes: (): Giftcode[] => JSON.parse(localStorage.getItem(STORAGE_KEY_GIFTCODES) || '[]'),
  saveGiftcodes: (codes: Giftcode[]) => localStorage.setItem(STORAGE_KEY_GIFTCODES, JSON.stringify(codes)),
  addGiftcode: (gc: Giftcode) => { 
    const all = dbService.getGiftcodes(); 
    all.unshift(gc); 
    dbService.saveGiftcodes(all); 
  },
  deleteGiftcode: (c: string) => { 
    const all = dbService.getGiftcodes();
    const filtered = all.filter(g => g.code !== c); 
    dbService.saveGiftcodes(filtered); 
  },

  getNotifications: (): AdminNotification[] => {
    const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },
  addNotification: (notif: Partial<AdminNotification>) => {
    const all = dbService.getNotifications();
    const newNotif: AdminNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type: notif.type || 'system',
      title: notif.title || '',
      content: notif.content || '',
      userId: notif.userId || '',
      userName: notif.userName || '',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    all.unshift(newNotif);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
  },
  markNotificationRead: (id: string) => {
    const all = dbService.getNotifications();
    const index = all.findIndex(n => String(n.id) === String(id));
    if (index > -1) {
      all[index].isRead = true;
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    }
  },
  markAllNotificationsRead: () => {
    const all = dbService.getNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
  },
  deleteNotification: (id: string) => {
    const all = dbService.getNotifications().filter(n => String(n.id) !== String(id));
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
  },
  clearAllNotifications: () => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([]));
  }
};
