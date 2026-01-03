
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, AdBanner, Announcement, Notification, VipTier } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
import { formatK, RATE_VND_TO_POINT } from '../constants.tsx';
import { 
  Users, CreditCard, Ticket, Megaphone, ImageIcon, Eye, EyeOff, Trash2, 
  PlusCircle, Search, CheckCircle2, XCircle, Settings, UserMinus, 
  UserPlus, ShieldAlert, Ban, Unlock, Wallet, Activity, TrendingUp, DollarSign,
  RefreshCcw, UserX, AlertTriangle, Loader2, X, ShieldCheck, Edit, Calendar, Clock,
  Building2, Gamepad2, FileText, ExternalLink, Copy, Crown
} from 'lucide-react';

interface AdminProps {
  user: User;
  onUpdateUser: (user: User) => void;
  setSecurityModal: (state: { isOpen: boolean; score: number }) => void;
  showToast: (title: string, message: string, type: Notification['type']) => void;
  showGoldSuccess: (title: string, description: string) => void;
}

export default function Admin({ user, onUpdateUser, setSecurityModal, showToast, showGoldSuccess }: AdminProps) {
  if (!user.isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-10 animate-in zoom-in-95">
        <div className="glass-card p-16 rounded-[4rem] border-2 border-red-500/30 text-center space-y-6">
          <ShieldAlert className="w-24 h-24 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">TRUY CẬP BỊ NGĂN CHẶN</h2>
          <p className="text-slate-500 font-bold italic uppercase tracking-widest text-xs">Bạn không có quyền hạn truy cập khu vực HỆ THỐNG.</p>
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl uppercase italic text-[10px] tracking-widest">QUAY LẠI AN TOÀN</button>
        </div>
      </div>
    );
  }

  const [tab, setTab] = useState<'users' | 'withdrawals' | 'payments' | 'ads' | 'giftcodes' | 'announcements'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [vipRequests, setVipRequests] = useState<any[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [showAddGc, setShowAddGc] = useState(false);
  const [editingGc, setEditingGc] = useState<Giftcode | null>(null);

  const [showAddAd, setShowAddAd] = useState(false);
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [viewBill, setViewBill] = useState<string | null>(null);
  
  const [newGc, setNewGc] = useState({ 
    code: '', 
    amount: 10000, 
    maxUses: 100, 
    startDate: '', 
    endDate: '' 
  });
  
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'low' as 'low' | 'high' });
  
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const refreshData = async () => {
    try {
      const [u, w, v, a, g, ann] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawals(),
        dbService.getVipRequests(),
        dbService.getAds(true), 
        dbService.getGiftcodes(),
        dbService.getAnnouncements(true)
      ]);
      setUsers(u);
      setWithdrawals(w);
      setVipRequests(v);
      setAds(a);
      setGiftcodes(g);
      setAnnouncements(ann);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { refreshData(); }, []);

  const stats = useMemo(() => {
    const totalPoints = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
    return {
      totalUsers: users.length,
      totalPoints,
      realMoney: Math.floor(totalPoints / RATE_VND_TO_POINT),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
      activeUsers: users.filter(u => u.lastTaskDate && (Date.now() - new Date(u.lastTaskDate).getTime()) < 86400000).length
    };
  }, [users, withdrawals]);

  const filteredUsers = useMemo(() => users.filter(u => u.fullname.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())), [users, searchUser]);

  const handleToggleBan = async (u: User) => {
    const reason = u.isBanned ? '' : prompt('Lý do khóa?') || 'Vi phạm chính sách';
    if (!u.isBanned && !(await confirm('KHÓA người dùng này?'))) return;
    setIsActionLoading(true);
    const res = await dbService.updateUser(u.id, { isBanned: !u.isBanned, banReason: reason });
    if (res.success) { showToast('ADMIN', `Đã cập nhật trạng thái ${u.fullname}`, 'info'); await refreshData(); }
    setIsActionLoading(false);
  };

  const handleAdjustPoints = async (uid: string, isAdd: boolean) => {
    const amt = parseInt(prompt(`Số điểm muốn ${isAdd ? 'CỘNG' : 'TRỪ'}?`) || '0');
    if (isNaN(amt) || amt === 0) return;
    setIsActionLoading(true);
    const res = await dbService.adjustBalance(uid, isAdd ? amt : -amt);
    if (res.success) { showToast('ADMIN', res.message, 'success'); await refreshData(); }
    setIsActionLoading(false);
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === user.id) return alert("Bạn không thể tự xóa chính mình!");
    if (u.email === 'adminavudev@gmail.com') return alert("Không thể xóa tài khoản Admin hệ thống!");
    
    if (!(await confirm(`CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa VĨNH VIỄN hội viên ${u.fullname}? Mọi dữ liệu điểm thưởng, lịch sử rút và VIP của họ sẽ biến mất hoàn toàn!`))) return;
    
    setIsActionLoading(true);
    const res = await dbService.deleteUser(u.id);
    
    if (res.success) {
      setUsers(prev => prev.filter(item => item.id !== u.id));
      setActiveUserMenu(null);
      showGoldSuccess(
        "XÓA HỘI VIÊN THÀNH CÔNG", 
        `Hệ thống đã loại bỏ toàn bộ dữ liệu của ${u.fullname} khỏi máy chủ Diamond Nova vĩnh viễn.`
      );
    } else {
      showToast('LỖI HỆ THỐNG', res.message, 'error');
    }
    setIsActionLoading(false);
  };

  const handleWithdrawAction = async (id: string, s: string) => {
    if (!confirm(`Bạn có chắc chắn muốn ${s === 'completed' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu này?`)) return;
    setIsActionLoading(true);
    await dbService.updateWithdrawalStatus(id, s);
    showToast('ADMIN', `Đã cập nhật trạng thái đơn rút: ${s.toUpperCase()}`, 'info');
    await refreshData();
    setIsActionLoading(false);
  };
  
  const updatePayment = async (billId: string, status: 'approved' | 'refunded', req?: any) => {
    if (!req && vipRequests) {
        req = vipRequests.find(v => String(v.id) === billId);
    }
    if (!req) return;

    if (!(await confirm(`Xác nhận ${status === 'approved' ? 'DUYỆT' : 'HOÀN TIỀN'} đơn nạp VIP của ${req.user_name}?`))) return;
    
    setIsActionLoading(true);
    const dbStatus = status === 'approved' ? 'completed' : 'refunded';
    const res = await dbService.updateVipRequestStatus(req.id, dbStatus, req.user_id, req.vip_tier, req.amount_vnd);
    setIsActionLoading(false);
    
    if (res.success) {
        showToast('ADMIN', `Đã xử lý đơn nạp VIP: ${status.toUpperCase()}`, 'success');
        await refreshData();
    } else {
        alert(res.message);
    }
  };

  // --- GIFTCODE HANDLERS ---
  const handleCreateGiftcode = async () => {
    if (!newGc.code || !newGc.amount) return alert("Nhập đủ thông tin.");
    setIsActionLoading(true);
    
    const start = newGc.startDate ? new Date(newGc.startDate).toISOString() : undefined;
    const end = newGc.endDate ? new Date(newGc.endDate).toISOString() : undefined;

    const res = await dbService.addGiftcode(newGc.code, newGc.amount, newGc.maxUses, start, end);
    setIsActionLoading(false);
    
    if (!res.error) { 
      showToast('ADMIN', "Đã tạo Giftcode thành công!", 'success'); 
      setShowAddGc(false); 
      setNewGc({ code: '', amount: 10000, maxUses: 100, startDate: '', endDate: '' });
      refreshData(); 
    } else {
      alert("Lỗi tạo Giftcode: " + (res.error as any).message);
    }
  };

  const handleUpdateGiftcode = async () => {
    if (!editingGc || !editingGc.code) return;
    setIsActionLoading(true);

    const start = editingGc.startDate ? new Date(editingGc.startDate).toISOString() : undefined;
    const end = editingGc.endDate ? new Date(editingGc.endDate).toISOString() : undefined;

    const res = await dbService.updateGiftcode(editingGc.id, {
        code: editingGc.code,
        amount: editingGc.amount,
        maxUses: editingGc.maxUses,
        startDate: start,
        endDate: end
    });

    setIsActionLoading(false);
    if (res.success) {
        showToast('ADMIN', 'Đã cập nhật Giftcode!', 'success');
        setEditingGc(null);
        refreshData();
    } else {
        alert(res.message);
    }
  };

  const handleDeleteGiftcode = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa Giftcode này? Hành động không thể hoàn tác.')) return;
    setIsActionLoading(true);
    const res = await dbService.deleteGiftcode(id);
    setIsActionLoading(false);
    if(res.success) {
        showToast('ADMIN', 'Đã xóa Giftcode', 'info');
        refreshData();
    }
  };

  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const getVipRichStyle = (tier: VipTier) => {
    switch(tier) {
      case VipTier.ELITE: return 'elite-border-rich';
      case VipTier.PRO: return 'pro-border-rich';
      case VipTier.BASIC: return 'basic-border-rich';
      default: return 'border-white/10';
    }
  };

  const getVipCrownColor = (tier: VipTier) => {
    switch(tier) {
      case VipTier.ELITE: return 'text-purple-400 fill-purple-400';
      case VipTier.PRO: return 'text-amber-400 fill-amber-400';
      case VipTier.BASIC: return 'text-blue-400 fill-blue-400';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-32">
      <div className="glass-card p-8 rounded-[3.5rem] border border-blue-500/20 bg-blue-600/5 flex items-center justify-center md:justify-between shadow-2xl flex-wrap gap-4">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-600/30">
               <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">NOVA COMMAND CENTER</h1>
               <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Hệ thống đang được kiểm soát bởi: <span className="text-blue-400">ADMIN DIAMOND NOVA</span></span>
               </div>
            </div>
         </div>
         <button onClick={refreshData} className="px-8 py-3 bg-slate-900 text-slate-500 rounded-2xl hover:text-white border border-white/5 transition-all font-black text-[10px] uppercase tracking-widest italic flex items-center gap-3"><RefreshCcw size={14} /> TẢI LẠI DỮ LIỆU</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {[
          { label: 'Tổng Hội viên', val: stats.totalUsers, color: 'border-l-blue-600', bg: 'bg-blue-600/5', icon: <Users className="text-blue-500" /> },
          { label: 'Kho Điểm Nova', val: formatK(stats.totalPoints), color: 'border-l-amber-600', bg: 'bg-amber-600/5', icon: <Wallet className="text-amber-500" /> },
          { label: 'Dự chi (VND)', val: `${stats.realMoney.toLocaleString()}đ`, color: 'border-l-emerald-600', bg: 'bg-emerald-600/5', icon: <DollarSign className="text-emerald-500" /> },
          { label: 'Đơn Rút Chờ', val: stats.pendingWithdrawals, color: 'border-l-rose-600', bg: 'bg-rose-600/5', icon: <Activity className="text-rose-500" /> },
          { label: 'Online 24h', val: stats.activeUsers, color: 'border-l-indigo-600', bg: 'bg-indigo-600/5', icon: <TrendingUp className="text-indigo-500" /> }
        ].map((s, i) => (
          <div key={i} className={`glass-card p-7 rounded-[2.5rem] border-l-8 ${s.color} ${s.bg} shadow-lg group hover:scale-105 transition-all`}>
             {React.cloneElement(s.icon as any, { size: 24, className: 'mb-4 group-hover:rotate-12 transition-transform' })}
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 italic">{s.label}</p>
             <h3 className="text-2xl font-black text-white italic tracking-tighter">{s.val}</h3>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {['users', 'withdrawals', 'payments', 'ads', 'giftcodes', 'announcements'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase italic tracking-widest transition-all ${tab === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
            {t === 'users' ? 'Quản lý Hội viên' : t === 'withdrawals' ? 'Duyệt Rút tiền' : t === 'payments' ? 'Thanh toán' : t === 'ads' ? 'Ads Banner' : t === 'giftcodes' ? 'Mã Quà Tặng' : 'Tin Hệ Thống'}
          </button>
        ))}
      </div>

      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 bg-slate-950/40 min-h-[600px] shadow-3xl">
        {tab === 'users' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center gap-4">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">DANH SÁCH THÀNH VIÊN</h3>
               <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                 <input type="text" placeholder="Tìm tên hoặc email hội viên..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all shadow-inner" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5 tracking-[0.2em]"><th className="px-6 py-6">Thành viên</th><th className="px-6 py-6">Cấp độ</th><th className="px-6 py-6">Số dư</th><th className="px-6 py-6 text-right">Quản trị</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`text-xs group hover:bg-white/[0.03] transition-all ${u.isBanned ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-7">
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center relative border ${getVipRichStyle(u.vipTier)}`}>
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="font-black text-white italic">{u.fullname.charAt(0).toUpperCase()}</span>
                              )}
                              {u.isVip && <Crown className={`absolute -top-3 -right-3 w-5 h-5 vip-crown-float ${getVipCrownColor(u.vipTier)}`} />}
                           </div>
                           <div>
                              <div className="font-black text-white uppercase flex items-center gap-2 italic text-sm">{u.fullname} {u.isBanned && <span className="text-red-500 text-[8px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">BỊ KHÓA</span>}</div>
                              <div className="text-[10px] text-slate-600 font-bold mt-1 tracking-wider">{u.email}</div>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-7"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black italic border ${u.isVip ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-600 bg-slate-900 border-white/5'}`}>{u.vipTier.toUpperCase()}</span></td>
                      <td className="px-6 py-7 font-black text-emerald-500 text-base">{u.balance.toLocaleString()} P</td>
                      <td className="px-6 py-7 text-right relative">
                        <button onClick={() => setActiveUserMenu(activeUserMenu === u.id ? null : u.id)} className={`p-3 rounded-xl transition-all ${activeUserMenu === u.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white border border-white/5'}`}><Settings size={18} /></button>
                        {activeUserMenu === u.id && (
                          <div className="absolute right-6 top-16 z-[100] w-64 glass-card border border-white/10 rounded-3xl p-3 shadow-3xl animate-in fade-in slide-in-from-top-4">
                             <button onClick={() => handleToggleBan(u)} className={`w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left text-xs font-black italic uppercase ${u.isBanned ? 'text-emerald-500' : 'text-rose-500'}`}>{u.isBanned ? <Unlock size={16} /> : <Ban size={16} />} {u.isBanned ? 'Mở Khóa Hội Viên' : 'Khóa Tài Khoản'}</button>
                             <button onClick={() => handleAdjustPoints(u.id, true)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left text-xs font-black italic uppercase text-emerald-400"><UserPlus size={16} /> Cộng Điểm Nova</button>
                             <button onClick={() => handleAdjustPoints(u.id, false)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left text-xs font-black italic uppercase text-amber-500"><UserMinus size={16} /> Trừ Điểm Nova</button>
                             <div className="h-px bg-white/5 my-2" />
                             <button onClick={() => { setActiveUserMenu(null); setSecurityModal({ isOpen: true, score: u.securityScore || 100 }); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left text-xs font-black italic uppercase text-blue-400"><ShieldAlert size={16} /> Kiểm Tra Sentinel</button>
                             <button onClick={() => handleDeleteUser(u)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-left text-xs font-black italic uppercase text-red-500"><UserX size={16} /> Xóa Hội Viên</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (Các tab khác giữ nguyên, chỉ thay đổi tab users) ... */}
        {tab === 'withdrawals' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">DUYỆT YÊU CẦU RÚT TIỀN</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5 tracking-[0.2em]"><th className="px-6 py-6">Thời gian</th><th className="px-6 py-6">Hội viên</th><th className="px-6 py-6">Loại & Số tiền</th><th className="px-6 py-6">Chi tiết nhận</th><th className="px-6 py-6 text-right">Xử lý</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-slate-600 font-bold italic">Chưa có yêu cầu rút tiền nào</td></tr> :
                    withdrawals.map(w => (
                    <tr key={w.id} className="text-xs hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-7 text-slate-500 font-bold">{new Date(w.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-7">
                        <div className="font-black text-white uppercase italic">{w.userName}</div>
                        <div className="text-[9px] text-blue-500 mt-1">ID: #{w.userId}</div>
                      </td>
                      <td className="px-6 py-7">
                        <div className="flex items-center gap-2 mb-1">
                          {w.type === 'bank' ? <Building2 size={14} className="text-emerald-500" /> : <Gamepad2 size={14} className="text-purple-500" />}
                          <span className={`font-black uppercase italic ${w.type === 'bank' ? 'text-emerald-500' : 'text-purple-500'}`}>{w.type === 'bank' ? 'ATM' : 'GAME'}</span>
                        </div>
                        <div className="text-lg font-black text-white italic">{w.amount.toLocaleString()}đ</div>
                      </td>
                      <td className="px-6 py-7 max-w-xs break-words text-slate-300 font-medium italic">{w.details}</td>
                      <td className="px-6 py-7 text-right">
                         {w.status === 'pending' ? (
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all"><CheckCircle2 size={18} /></button>
                              <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="p-3 bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all"><XCircle size={18} /></button>
                           </div>
                         ) : (
                           <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic border ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                             {w.status === 'completed' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}
                           </span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">DUYỆT NẠP VIP (CHUYỂN KHOẢN)</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead><tr className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5 tracking-[0.2em]"><th className="px-6 py-6">Thời gian</th><th className="px-6 py-6">Người gửi</th><th className="px-6 py-6">Gói VIP</th><th className="px-6 py-6">Nội dung CK</th><th className="px-6 py-6">Bill</th><th className="px-6 py-6 text-right">Xử lý</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {vipRequests.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-slate-600 font-bold italic">Chưa có yêu cầu nạp tiền nào</td></tr> :
                     vipRequests.map((v) => (
                      <tr key={v.id} className="text-xs hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-7 text-slate-500 font-bold">{new Date(v.created_at).toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-7">
                          <div className="font-black text-white uppercase italic">{v.user_name}</div>
                          <div className="text-[9px] text-amber-500 mt-1 font-bold">{v.amount_vnd.toLocaleString()} VND</div>
                        </td>
                        <td className="px-6 py-7"><span className="px-3 py-1 bg-slate-800 rounded text-[10px] font-black uppercase text-white border border-white/10">{v.vip_tier}</span></td>
                        <td className="px-6 py-7">
                           <span className="font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded select-all whitespace-nowrap">{v.transfer_content || '---'}</span>
                        </td>
                        <td className="px-6 py-7">
                           {v.bill_url ? (
                             <button onClick={() => setViewBill(v.bill_url)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold italic bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                               <FileText size={14} /> Xem Bill
                             </button>
                           ) : <span className="text-slate-600 italic">Không có ảnh</span>}
                        </td>
                        <td className="px-6 py-7 text-right">
                           {v.status === 'pending' ? (
                             <div className="flex justify-end gap-2">
                                <button onClick={() => updatePayment(v.id, 'approved', v)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-black uppercase text-[9px] italic flex items-center gap-2"><CheckCircle2 size={14} /> DUYỆT</button>
                                <button onClick={() => updatePayment(v.id, 'refunded', v)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all font-black uppercase text-[9px] italic flex items-center gap-2"><RefreshCcw size={14} /> HOÀN TIỀN</button>
                             </div>
                           ) : (
                             <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic border ${v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                               {v.status === 'completed' ? 'ĐÃ DUYỆT' : 'ĐÃ HOÀN TIỀN'}
                             </span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ GIFTCODE</h3>
               <button onClick={() => setShowAddGc(true)} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase italic tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3">
                  <PlusCircle size={18} /> TẠO MÃ MỚI
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black text-slate-500 uppercase border-b border-white/5 tracking-widest"><th className="px-6 py-6">Mã Key</th><th className="px-6 py-6">Giá Trị</th><th className="px-6 py-6">Sử Dụng</th><th className="px-6 py-6">Thời Hạn</th><th className="px-6 py-6 text-right">Trạng Thái</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {giftcodes.map(g => {
                    const usedCount = (g.usedBy || []).length;
                    const percent = g.maxUses > 0 ? (usedCount / g.maxUses) * 100 : 0;
                    const isExpired = g.endDate && new Date() > new Date(g.endDate);

                    return (
                    <tr key={g.code} className="text-xs hover:bg-white/[0.03] transition-all group">
                      <td className="px-6 py-8 font-black text-rose-500 tracking-[0.3em] uppercase text-sm italic">{g.code}</td>
                      <td className="px-6 py-8 font-black text-emerald-500 text-base">{g.amount.toLocaleString()} P</td>
                      <td className="px-6 py-8">
                         <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-bold text-[10px]">{usedCount} / {g.maxUses} lượt</span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-rose-500" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-8 text-slate-500 text-[10px] font-bold">
                        {g.startDate && <div className="flex items-center gap-1 text-emerald-500/80"><Clock size={10} /> {new Date(g.startDate).toLocaleDateString()}</div>}
                        {g.endDate && <div className="flex items-center gap-1 text-red-500/80 mt-1"><X size={10} /> {new Date(g.endDate).toLocaleDateString()}</div>}
                        {!g.startDate && !g.endDate && <span>Vô thời hạn</span>}
                      </td>
                      <td className="px-6 py-8 text-right">
                         <div className="flex justify-end items-center gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic border ${g.isActive && !isExpired ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {g.isActive && !isExpired ? 'ACTIVE' : isExpired ? 'HẾT HẠN' : 'ĐÃ KHÓA'}
                            </span>
                            <button onClick={() => setEditingGc(g)} className="p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteGiftcode(g.id)} className="p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all"><Trash2 size={14} /></button>
                         </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (Các tab ads, announcements giữ nguyên) ... */}
         {tab === 'ads' && (
          <div className="space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">QUẢN TRỊ QUẢNG CÁO</h3>
                <button onClick={() => setShowAddAd(true)} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase italic shadow-xl transition-all active:scale-95 flex items-center gap-3">
                   <ImageIcon size={18} /> THÊM BANNER
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map(ad => (
                  <div key={ad.id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 flex gap-6 items-center group transition-all hover:border-blue-500/30">
                     <img src={ad.imageUrl} className="w-24 h-16 object-cover rounded-2xl shadow-lg border border-white/5" />
                     <div className="flex-1 overflow-hidden">
                        <h4 className="text-xs font-black text-white uppercase truncate italic">{ad.title}</h4>
                        <p className="text-[10px] text-slate-600 truncate mt-1 italic">{ad.targetUrl}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => dbService.updateAdStatus(ad.id, !ad.isActive).then(refreshData)} className={`p-3 rounded-xl transition-all ${ad.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 bg-slate-900'}`}>{ad.isActive ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                        <button onClick={() => dbService.deleteAd(ad.id).then(refreshData)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">THÔNG BÁO HỆ THỐNG</h3>
                <button onClick={() => setShowAddAnn(true)} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase italic shadow-xl transition-all active:scale-95 flex items-center gap-3">
                   <Megaphone size={18} /> GỬI TIN MỚI
                </button>
             </div>
             <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-6 glass-card rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded italic border ${ann.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{ann.priority === 'high' ? 'KHẨN CẤP' : 'THƯỜNG'}</span>
                           <span className="text-[9px] text-slate-600 font-bold italic">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-base font-black text-white uppercase italic tracking-tight">{ann.title}</h4>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => dbService.updateAnnouncementStatus(ann.id, !ann.isActive).then(refreshData)} className={`p-3 rounded-xl transition-all ${ann.isActive ? 'text-blue-400 bg-blue-400/10' : 'text-slate-600 bg-slate-900'}`}>{ann.isActive ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                        <button onClick={() => dbService.deleteAnnouncement(ann.id).then(refreshData)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {viewBill && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewBill(null)}>
           <button onClick={() => setViewBill(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X size={24} /></button>
           <img src={viewBill} className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* CREATE GIFTCODE MODAL */}
      {showAddGc && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="glass-card w-full max-w-md p-12 rounded-[4rem] border border-emerald-500/20 animate-in zoom-in-95 relative shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowAddGc(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10 flex items-center gap-4 text-emerald-400"><Ticket size={32} /> TẠO GIFTCODE</h4>
              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Mã Code (In Hoa)</label>
                    <input type="text" placeholder="VÍ DỤ: NEWYEAR2025" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic tracking-widest outline-none focus:border-emerald-500 transition-all shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Số Điểm (P)</label>
                       <input type="number" placeholder="10000" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-emerald-400 font-black italic outline-none focus:border-emerald-500 transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Lượt dùng tối đa</label>
                       <input type="number" placeholder="100" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic outline-none focus:border-emerald-500 transition-all shadow-inner" />
                    </div>
                 </div>
                 
                 {/* DATE PICKERS */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2 flex items-center gap-2"><Calendar size={10} /> Bắt đầu</label>
                        <input type="datetime-local" value={newGc.startDate} onChange={e => setNewGc({...newGc, startDate: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2 flex items-center gap-2"><Clock size={10} /> Kết thúc</label>
                        <input type="datetime-local" value={newGc.endDate} onChange={e => setNewGc({...newGc, endDate: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                 </div>

                 <button onClick={handleCreateGiftcode} disabled={isActionLoading} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl uppercase italic tracking-widest shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 mt-4 flex items-center justify-center">
                    {isActionLoading ? <Loader2 className="animate-spin" /> : 'PHÁT HÀNH GIFTCODE'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT GIFTCODE MODAL */}
      {editingGc && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="glass-card w-full max-w-md p-12 rounded-[4rem] border border-blue-500/20 animate-in zoom-in-95 relative shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-y-auto max-h-[90vh]">
              <button onClick={() => setEditingGc(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10 flex items-center gap-4 text-blue-400"><Edit size={32} /> CHỈNH SỬA CODE</h4>
              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Mã Code</label>
                    <input type="text" value={editingGc.code} onChange={e => setEditingGc({...editingGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic tracking-widest outline-none focus:border-blue-500 transition-all shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Số Điểm (P)</label>
                       <input type="number" value={editingGc.amount} onChange={e => setEditingGc({...editingGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-blue-400 font-black italic outline-none focus:border-blue-500 transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Max Uses</label>
                       <input type="number" value={editingGc.maxUses} onChange={e => setEditingGc({...editingGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic outline-none focus:border-blue-500 transition-all shadow-inner" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Bắt đầu</label>
                        <input type="datetime-local" value={formatDateForInput(editingGc.startDate)} onChange={e => setEditingGc({...editingGc, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Kết thúc</label>
                        <input type="datetime-local" value={formatDateForInput(editingGc.endDate)} onChange={e => setEditingGc({...editingGc, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" />
                    </div>
                 </div>

                 <button onClick={handleUpdateGiftcode} disabled={isActionLoading} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl uppercase italic tracking-widest shadow-2xl shadow-blue-600/30 transition-all active:scale-95 mt-4 flex items-center justify-center">
                    {isActionLoading ? <Loader2 className="animate-spin" /> : 'LƯU THAY ĐỔI'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showAddAd && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="glass-card w-full max-w-lg p-12 rounded-[4rem] border border-indigo-500/20 animate-in zoom-in-95 relative shadow-[0_0_100px_rgba(99,102,241,0.1)]">
              <button onClick={() => setShowAddAd(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10 flex items-center gap-4 text-indigo-400"><ImageIcon size={32} /> THÊM BANNER</h4>
              <div className="space-y-5">
                 <input type="text" placeholder="TIÊU ĐỀ QUẢNG CÁO" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic outline-none focus:border-indigo-500 transition-all shadow-inner" />
                 <input type="text" placeholder="LINK ẢNH (21:9)" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                 <input type="text" placeholder="ĐỊA CHỈ ĐÍCH (URL)" value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-indigo-400 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                 <button onClick={() => { dbService.saveAd(newAd).then(() => { setShowAddAd(false); refreshData(); showToast('ADMIN', 'Đã lưu Banner mới!', 'success'); }); }} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl uppercase italic tracking-widest shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 mt-4">KÍCH HOẠT BANNER</button>
              </div>
           </div>
        </div>
      )}

      {showAddAnn && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="glass-card w-full max-w-lg p-12 rounded-[4rem] border border-blue-500/20 animate-in zoom-in-95 relative shadow-[0_0_100px_rgba(59,130,246,0.1)]">
              <button onClick={() => setShowAddAnn(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10 flex items-center gap-4 text-blue-400"><Megaphone size={32} /> ĐĂNG TIN MỚI</h4>
              <div className="space-y-5">
                 <input type="text" placeholder="TIÊU ĐỀ THÔNG BÁO" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-black italic outline-none focus:border-blue-500 transition-all shadow-inner" />
                 <textarea placeholder="NỘI DUNG CHI TIẾT (NGẮN GỌN)" value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-3xl px-7 py-5 text-white font-medium outline-none focus:border-blue-500 transition-all shadow-inner" rows={4} />
                 <div className="flex gap-4">
                    <button onClick={() => { setNewAnn({...newAnn, priority: 'low'}); }} className={`flex-1 py-4 rounded-2xl font-black italic text-[10px] uppercase border transition-all ${newAnn.priority === 'low' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-slate-600 border-white/5'}`}>ƯU TIÊN: THƯỜNG</button>
                    <button onClick={() => { setNewAnn({...newAnn, priority: 'high'}); }} className={`flex-1 py-4 rounded-2xl font-black italic text-[10px] uppercase border transition-all ${newAnn.priority === 'high' ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-slate-900 text-slate-600 border-white/5'}`}>ƯU TIÊN: KHẨN CẤP</button>
                 </div>
                 <button onClick={() => { dbService.saveAnnouncement(newAnn).then(() => { setShowAddAnn(false); refreshData(); showToast('ADMIN', 'Thông báo đã được đăng!', 'success'); }); }} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl uppercase italic tracking-widest shadow-2xl shadow-blue-600/30 transition-all active:scale-95 mt-4">GỬI THÔNG BÁO TỚI TẤT CẢ</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
