
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, AdBanner, Announcement, Notification } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
import { formatK, RATE_VND_TO_POINT } from '../constants.tsx';
import { 
  Users, CreditCard, Ticket, Megaphone, ImageIcon, Eye, EyeOff, Trash2, 
  PlusCircle, Search, CheckCircle2, XCircle, Settings, UserMinus, 
  UserPlus, ShieldAlert, Ban, Unlock, Wallet, Activity, TrendingUp, DollarSign,
  RefreshCcw, UserX, AlertTriangle, Loader2
} from 'lucide-react';

interface AdminProps {
  user: User;
  onUpdateUser: (user: User) => void;
  setSecurityModal: (state: { isOpen: boolean; score: number }) => void;
  showToast: (title: string, message: string, type: Notification['type']) => void;
}

export default function Admin({ user, onUpdateUser, setSecurityModal, showToast }: AdminProps) {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'giftcodes' | 'announcements'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [showAddGc, setShowAddGc] = useState(false);
  const [showAddAd, setShowAddAd] = useState(false);
  const [showAddAnn, setShowAddAnn] = useState(false);
  
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'low' as 'low' | 'high' });
  
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const refreshData = async () => {
    try {
      const [u, w, a, g, ann] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawals(),
        dbService.getAds(true), 
        dbService.getGiftcodes(),
        dbService.getAnnouncements(true)
      ]);
      setUsers(u);
      setWithdrawals(w);
      setAds(a);
      setGiftcodes(g);
      setAnnouncements(ann);
    } catch (err) {
      console.error("Lỗi tải dữ liệu admin:", err);
    }
  };

  useEffect(() => {
    refreshData();

    const channels = [
      supabase.channel('admin-users-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'users_data' }, () => { refreshData(); }).subscribe(),
      supabase.channel('admin-withdraw-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => { refreshData(); }).subscribe(),
      supabase.channel('admin-ads-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, () => { refreshData(); }).subscribe(),
      supabase.channel('admin-gc-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'giftcodes' }, () => { refreshData(); }).subscribe(),
      supabase.channel('admin-ann-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { refreshData(); }).subscribe()
    ];

    return () => {
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, []);

  const stats = useMemo(() => {
    const totalPoints = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    const activeUsers = users.filter(u => {
      if (!u.lastTaskDate) return false;
      const last = new Date(u.lastTaskDate).getTime();
      return (Date.now() - last) < (24 * 60 * 60 * 1000);
    }).length;

    return {
      totalUsers: users.length,
      totalPoints,
      realMoney: Math.floor(totalPoints / RATE_VND_TO_POINT),
      pendingWithdrawals,
      activeUsers
    };
  }, [users, withdrawals]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullname.toLowerCase().includes(searchUser.toLowerCase()) || 
      u.email.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser]);

  const handleToggleBan = async (u: User) => {
    if (isActionLoading) return;
    const isUnbanning = u.isBanned;
    const reason = isUnbanning ? '' : prompt('Lý do khóa tài khoản?') || 'Vi phạm chính sách';
    
    if (!isUnbanning && reason === 'Vi phạm chính sách' && !confirm('Xác nhận KHÓA người dùng này?')) {
      setActiveUserMenu(null);
      return;
    }

    setIsActionLoading(true);
    setActiveUserMenu(null); 
    
    const res = await dbService.updateUser(u.id, { isBanned: !u.isBanned, banReason: reason });
    if (res.success) {
      showToast('QUẢN TRỊ VIÊN', `Đã ${isUnbanning ? 'mở khóa' : 'khóa'} tài khoản ${u.fullname} thành công.`, isUnbanning ? 'success' : 'warning');
      await refreshData();
    } else {
      showToast('LỖI', res.message, 'error');
    }
    setIsActionLoading(false);
  };

  const handleAdjustPoints = async (userId: string, isAdd: boolean) => {
    if (isActionLoading) return;
    const amountStr = prompt(`Nhập số điểm muốn ${isAdd ? 'CỘNG' : 'TRỪ'}?`) || '0';
    const amount = parseInt(amountStr);
    
    if (isNaN(amount) || amount === 0) {
      setActiveUserMenu(null);
      return;
    }
    
    setIsActionLoading(true);
    setActiveUserMenu(null);
    
    const res = await dbService.adjustBalance(userId, isAdd ? amount : -amount);
    if (res.success) {
      showToast('QUẢN TRỊ VIÊN', res.message, 'success');
      await refreshData();
    } else {
      showToast('LỖI', res.message, 'error');
    }
    setIsActionLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (isActionLoading) return;
    if (!confirm('CẢNH BÁO NGUY HIỂM: BẠN CÓ CHẮC MUỐN XÓA VĨNH VIỄN TÀI KHOẢN NÀY?')) {
      setActiveUserMenu(null);
      return;
    }
    
    setIsActionLoading(true);
    setActiveUserMenu(null);
    
    const res = await dbService.deleteUser(userId);
    if (res.success) {
      showToast('QUẢN TRỊ VIÊN', 'Đã xóa hội viên vĩnh viễn khỏi Cloud.', 'info');
      await refreshData();
    } else {
      showToast('LỖI', res.message, 'error');
    }
    setIsActionLoading(false);
  };

  const handleWithdrawAction = async (id: string, status: string) => {
    await dbService.updateWithdrawalStatus(id, status);
    showToast('QUẢN TRỊ VIÊN', `Đã cập nhật trạng thái đơn rút thành ${status.toUpperCase()}.`, 'info');
    await refreshData();
  };

  const handleCreateGiftcode = async () => {
    if (!newGc.code || !newGc.amount || !newGc.maxUses) return showToast('LỖI', "Vui lòng nhập đủ thông tin.", 'error');
    const res = await dbService.addGiftcode(newGc);
    if (res.error) {
      showToast('LỖI', res.error.message, 'error');
    } else {
      showToast('QUẢN TRỊ VIÊN', "Đã tạo Giftcode mới thành công!", 'success');
      setShowAddGc(false);
      setNewGc({ code: '', amount: 10000, maxUses: 100 });
      await refreshData();
    }
  };

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.imageUrl || !newAd.targetUrl) return showToast('LỖI', "Vui lòng nhập đủ thông tin.", 'error');
    const res = await dbService.saveAd(newAd);
    if (res.error) {
      showToast('LỖI', res.error.message, 'error');
    } else {
      showToast('QUẢN TRỊ VIÊN', "Đã tạo Quảng cáo mới!", 'success');
      setShowAddAd(false);
      setNewAd({ title: '', imageUrl: '', targetUrl: '' });
      await refreshData();
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnn.title || !newAnn.content) return showToast('LỖI', "Vui lòng nhập đủ thông tin.", 'error');
    const res = await dbService.saveAnnouncement(newAnn);
    if (res.error) {
      showToast('LỖI', res.error.message, 'error');
    } else {
      showToast('QUẢN TRỊ VIÊN', "Đã đăng thông báo mới tới tất cả hội viên!", 'success');
      setShowAddAnn(false);
      setNewAnn({ title: '', content: '', priority: 'low' as 'low' | 'high' });
      await refreshData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-blue-600 bg-blue-600/5 shadow-xl">
           <Users className="w-6 h-6 text-blue-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Hội viên</p>
           <h3 className="text-xl font-black text-white italic">{stats.totalUsers}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-amber-600 bg-amber-600/5 shadow-xl">
           <Wallet className="w-6 h-6 text-amber-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Tổng Điểm</p>
           <h3 className="text-xl font-black text-white italic">{formatK(stats.totalPoints)}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-emerald-600 bg-emerald-600/5 shadow-xl">
           <DollarSign className="w-6 h-6 text-emerald-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Tiền mặt</p>
           <h3 className="text-xl font-black text-white italic">{stats.realMoney.toLocaleString()}đ</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-rose-600 bg-rose-600/5 shadow-xl">
           <Activity className="w-6 h-6 text-rose-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Đơn Chờ</p>
           <h3 className="text-xl font-black text-white italic">{stats.pendingWithdrawals}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-indigo-600 bg-indigo-600/5 shadow-xl">
           <TrendingUp className="w-6 h-6 text-indigo-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Online 24h</p>
           <h3 className="text-xl font-black text-white italic">{stats.activeUsers}</h3>
        </div>
      </div>

      {/* Action Overlay */}
      {isActionLoading && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <span className="text-white font-black uppercase italic text-xs tracking-widest">Đang cập nhật Cloud...</span>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'users', label: 'Hội viên', icon: <Users size={14} /> },
          { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard size={14} /> },
          { id: 'ads', label: 'Quảng cáo', icon: <ImageIcon size={14} /> },
          { id: 'giftcodes', label: 'Giftcodes', icon: <Ticket size={14} /> },
          { id: 'announcements', label: 'Thông báo', icon: <Megaphone size={14} /> }
        ].map(i => (
          <button key={i.id} onClick={() => setTab(i.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all ${tab === i.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
            {i.icon} {i.label}
          </button>
        ))}
        <button onClick={refreshData} className="ml-auto p-3 bg-slate-900 text-slate-500 rounded-xl hover:text-white"><RefreshCcw size={14} /></button>
      </div>

      <div className="glass-card p-8 rounded-[3rem] border border-white/5 bg-slate-950/40 min-h-[500px]">
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">DANH SÁCH HỘI VIÊN</h3>
               <div className="relative flex-1 max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 <input type="text" placeholder="Tìm tên, email..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">STT</th>
                    <th className="px-4 py-4">Tên / Gmail</th>
                    <th className="px-4 py-4">Hạng</th>
                    <th className="px-4 py-4">Số dư</th>
                    <th className="px-4 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className={`text-xs group hover:bg-white/[0.02] ${u.isBanned ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-6 text-slate-600 font-black">#{i + 1}</td>
                      <td className="px-4 py-6">
                         <div className="font-bold text-white uppercase flex items-center gap-2">
                           {u.fullname} 
                           {u.isBanned && <span className="text-red-500 text-[8px] border border-red-500/30 px-1 rounded animate-pulse">BỊ KHÓA</span>}
                         </div>
                         <div className="text-[9px] text-slate-500 mt-1">{u.email}</div>
                      </td>
                      <td className="px-4 py-6">
                        <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase italic ${u.isVip ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-500'}`}>
                          {u.vipTier.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-6 font-black text-emerald-500">{u.balance.toLocaleString()} P</td>
                      <td className="px-4 py-6 text-right relative">
                        <button 
                          onClick={() => setActiveUserMenu(activeUserMenu === u.id ? null : u.id)}
                          className={`p-2 rounded-lg transition-all border ${activeUserMenu === u.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 hover:text-blue-500 border-white/5'}`}
                        >
                          <Settings size={16} />
                        </button>
                        {activeUserMenu === u.id && (
                          <div className="absolute right-4 top-16 z-[100] w-52 glass-card border border-white/10 rounded-2xl p-2 shadow-3xl animate-in fade-in slide-in-from-top-2">
                             <button onClick={() => handleToggleBan(u)} className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left font-bold ${u.isBanned ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {u.isBanned ? <Unlock size={14} /> : <Ban size={14} />} 
                                <span>{u.isBanned ? 'Mở Khóa (Unban)' : 'Khóa Tài Khoản'}</span>
                             </button>
                             <button onClick={() => handleAdjustPoints(u.id, true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-emerald-400 font-bold">
                                <UserPlus size={14} /> <span>Cộng Điểm</span>
                             </button>
                             <button onClick={() => handleAdjustPoints(u.id, false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-amber-500 font-bold">
                                <UserMinus size={14} /> <span>Trừ Điểm</span>
                             </button>
                             <button onClick={() => { setActiveUserMenu(null); setSecurityModal({ isOpen: true, score: u.securityScore || 100 }); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-blue-400 font-bold">
                                <ShieldAlert size={14} /> <span>Kiểm Tra Sentinel</span>
                             </button>
                             <div className="h-px bg-white/5 my-2"></div>
                             <button onClick={() => handleDeleteUser(u.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-600 hover:text-white text-left text-slate-500 font-bold transition-all">
                                <UserX size={14} /> <span>XÓA VĨNH VIỄN</span>
                             </button>
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

        {tab === 'withdrawals' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">YÊU CẦU THANH TOÁN</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Mã Đơn</th>
                    <th className="px-4 py-4">Hội Viên</th>
                    <th className="px-4 py-4">Thanh Toán</th>
                    <th className="px-4 py-4">Loại</th>
                    <th className="px-4 py-4">Tiền</th>
                    <th className="px-4 py-4">Trạng Thái</th>
                    <th className="px-4 py-4 text-right">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="text-xs hover:bg-white/[0.02]">
                      <td className="px-4 py-6 font-black text-blue-500">#{w.id.slice(0, 8)}</td>
                      <td className="px-4 py-6">
                         <div className="font-bold text-white uppercase">{w.user_name}</div>
                         <div className="text-[9px] text-slate-500 italic">{w.user_id}</div>
                      </td>
                      <td className="px-4 py-6 text-slate-400 italic text-[10px] max-w-[150px] truncate">{w.details}</td>
                      <td className="px-4 py-6 font-black uppercase italic text-blue-400">{w.type}</td>
                      <td className="px-4 py-6 font-black text-white">{w.amount.toLocaleString()}đ</td>
                      <td className="px-4 py-6">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${w.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                           {w.status === 'pending' ? 'CHỜ' : w.status === 'completed' ? 'OK' : 'HỦY'}
                         </span>
                      </td>
                      <td className="px-4 py-6 text-right">
                         {w.status === 'pending' && (
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="p-2 bg-emerald-600/10 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 size={16} /></button>
                              <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="p-2 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><XCircle size={16} /></button>
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

        {tab === 'ads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ QUẢNG CÁO (ADMIN)</h3>
              <button onClick={() => setShowAddAd(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                 <PlusCircle size={16} /> THÊM QUẢNG CÁO
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Ảnh</th>
                    <th className="px-4 py-4">Tên</th>
                    <th className="px-4 py-4">Link</th>
                    <th className="px-4 py-4">Trạng Thái</th>
                    <th className="px-4 py-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ads.map(ad => (
                    <tr key={ad.id} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <img src={ad.imageUrl} className="w-16 h-10 object-cover rounded-lg border border-white/5" />
                      </td>
                      <td className="px-4 py-4 font-black text-white">{ad.title}</td>
                      <td className="px-4 py-4 text-blue-400 text-[10px] italic truncate max-w-[150px]">{ad.targetUrl}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black italic ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {ad.isActive ? 'ĐANG HIỆN' : 'ĐANG ẨN'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => dbService.updateAdStatus(ad.id, !ad.isActive).then(refreshData)} 
                             className={`p-2 rounded-lg transition-all ${ad.isActive ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-emerald-600 text-white'}`}
                             title={ad.isActive ? "Ẩn quảng cáo" : "Hiện quảng cáo"}
                           >
                              {ad.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                           <button onClick={() => dbService.deleteAd(ad.id).then(refreshData)} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ GIFTCODE</h3>
              <button onClick={() => setShowAddGc(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                 <PlusCircle size={16} /> TẠO GIFTCODE
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Mã Code</th>
                    <th className="px-4 py-4">Thưởng</th>
                    <th className="px-4 py-4">Đã Dùng</th>
                    <th className="px-4 py-4">Tối Đa</th>
                    <th className="px-4 py-4 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {giftcodes.map(g => (
                    <tr key={g.code} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-6 font-black text-rose-500 tracking-widest uppercase">{g.code}</td>
                      <td className="px-4 py-6 font-black text-emerald-500">{g.amount.toLocaleString()} P</td>
                      <td className="px-4 py-6 text-slate-400 font-black">{(g.usedBy || []).length}</td>
                      <td className="px-4 py-6 text-slate-500 font-black">{g.maxUses}</td>
                      <td className="px-4 py-6 text-right">
                         <span className={`px-2 py-1 rounded text-[9px] font-black italic ${g.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                           {g.isActive ? 'ONLINE' : 'HẾT HẠN'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">THÔNG BÁO HỆ THỐNG</h3>
              <button onClick={() => setShowAddAnn(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                 <PlusCircle size={16} /> ĐĂNG TIN MỚI
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Mức Độ</th>
                    <th className="px-4 py-4">Tiêu Đề</th>
                    <th className="px-4 py-4">Nội Dung</th>
                    <th className="px-4 py-4">Trạng Thái</th>
                    <th className="px-4 py-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {announcements.map(ann => (
                    <tr key={ann.id} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase italic ${ann.priority === 'high' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-blue-500/20 text-blue-500'}`}>
                          {ann.priority === 'high' ? 'KHẨN CẤP' : 'THƯỜNG'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-white uppercase">{ann.title}</td>
                      <td className="px-4 py-4 text-slate-500 italic truncate max-w-[200px]">{ann.content}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black italic ${ann.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                          {ann.isActive ? 'ĐANG HIỆN' : 'ĐÃ ẨN'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => dbService.updateAnnouncementStatus(ann.id, !ann.isActive).then(refreshData)} className={`p-2 rounded-lg transition-all ${ann.isActive ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white'}`}>
                              {ann.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                           <button onClick={() => dbService.deleteAnnouncement(ann.id).then(refreshData)} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals... (omitted for brevity, assume they stay the same) */}
    </div>
  );
}
