
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, AdBanner } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
import { formatK, RATE_VND_TO_POINT } from '../constants.tsx';
import { 
  Users, CreditCard, Ticket, Megaphone, ImageIcon, Eye, EyeOff, Trash2, 
  PlusCircle, Search, CheckCircle2, XCircle, Settings, UserMinus, 
  UserPlus, ShieldAlert, Ban, Unlock, Wallet, Activity, TrendingUp, DollarSign,
  RefreshCcw, UserX
} from 'lucide-react';

interface AdminProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export default function Admin({ user, onUpdateUser }: AdminProps) {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'giftcodes'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  
  const [showAddGc, setShowAddGc] = useState(false);
  const [showAddAd, setShowAddAd] = useState(false);
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');

  const refresh = async () => {
    const [u, w, a, g] = await Promise.all([
      dbService.getAllUsers(),
      dbService.getWithdrawals(),
      dbService.getAds(true),
      dbService.getGiftcodes()
    ]);
    setUsers(u);
    setWithdrawals(w);
    setAds(a);
    setGiftcodes(g);
  };

  useEffect(() => {
    refresh();
    // REAL-TIME SYNC: Lắng nghe mọi thay đổi trên các bảng quan trọng
    const channels = [
      supabase.channel('admin-users').on('postgres_changes', { event: '*', schema: 'public', table: 'users_data' }, refresh).subscribe(),
      supabase.channel('admin-withdraw').on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, refresh).subscribe(),
      supabase.channel('admin-notifs').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refresh).subscribe()
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  const stats = useMemo(() => {
    const totalPoints = users.reduce((sum, u) => sum + (u.balance || 0), 0);
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

  // Actions cho User Menu Setting
  const handleToggleBan = async (u: User) => {
    const reason = u.isBanned ? '' : prompt('Lý do ban?') || 'Vi phạm chính sách';
    await dbService.updateUser(u.id, { is_banned: !u.isBanned, ban_reason: reason });
    setActiveUserMenu(null);
  };

  const handleAdjustPoints = async (userId: string, isAdd: boolean) => {
    const amount = parseInt(prompt(`Nhập số điểm muốn ${isAdd ? 'CỘNG' : 'TRỪ'}?`) || '0');
    if (isNaN(amount) || amount <= 0) return;
    await dbService.adjustBalance(userId, isAdd ? amount : -amount);
    setActiveUserMenu(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('BẠN CÓ CHẮC MUỐN XÓA VĨNH VIỄN TÀI KHOẢN NÀY?')) return;
    await dbService.deleteUser(userId);
    setActiveUserMenu(null);
  };

  const handleWithdrawAction = async (id: string, status: string) => {
    await dbService.updateWithdrawalStatus(id, status);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      {/* 5 Bảng thống kê trên cùng trang hệ thống */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-blue-600 bg-blue-600/5 shadow-xl">
           <Users className="w-6 h-6 text-blue-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Tổng Người Dùng</p>
           <h3 className="text-xl font-black text-white italic">{stats.totalUsers}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-amber-600 bg-amber-600/5 shadow-xl">
           <Wallet className="w-6 h-6 text-amber-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Tổng Số Điểm</p>
           <h3 className="text-xl font-black text-white italic">{formatK(stats.totalPoints)}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-emerald-600 bg-emerald-600/5 shadow-xl">
           <DollarSign className="w-6 h-6 text-emerald-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Số Tiền Thực</p>
           <h3 className="text-xl font-black text-white italic">{stats.realMoney.toLocaleString()}đ</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-rose-600 bg-rose-600/5 shadow-xl">
           <Activity className="w-6 h-6 text-rose-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Số Lệnh Chờ</p>
           <h3 className="text-xl font-black text-white italic">{stats.pendingWithdrawals}</h3>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-indigo-600 bg-indigo-600/5 shadow-xl">
           <TrendingUp className="w-6 h-6 text-indigo-500 mb-2" />
           <p className="text-[9px] font-black text-slate-500 uppercase italic">Đang hoạt động</p>
           <h3 className="text-xl font-black text-white italic">{stats.activeUsers}</h3>
        </div>
      </div>

      {/* Menu Tabs Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'users', label: 'Hội viên', icon: <Users size={14} /> },
          { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard size={14} /> },
          { id: 'ads', label: 'Quảng cáo', icon: <ImageIcon size={14} /> },
          { id: 'giftcodes', label: 'Giftcodes', icon: <Ticket size={14} /> }
        ].map(i => (
          <button key={i.id} onClick={() => setTab(i.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all ${tab === i.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
            {i.icon} {i.label}
          </button>
        ))}
        <button onClick={refresh} className="ml-auto p-3 bg-slate-900 text-slate-500 rounded-xl hover:text-white"><RefreshCcw size={14} /></button>
      </div>

      <div className="glass-card p-8 rounded-[3rem] border border-white/5 bg-slate-950/40 min-h-[500px]">
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ HỘI VIÊN</h3>
               <div className="relative flex-1 max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 <input type="text" placeholder="Tìm tên, email..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Số thứ tự</th>
                    <th className="px-4 py-4">Tên / Gmail</th>
                    <th className="px-4 py-4">Rank</th>
                    <th className="px-4 py-4">Số tiền</th>
                    <th className="px-4 py-4 text-right">Setting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-6 text-slate-600 font-black">#{i + 1}</td>
                      <td className="px-4 py-6">
                         <div className="font-bold text-white uppercase">{u.fullname}</div>
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
                          className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-blue-500 border border-white/5 transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        {activeUserMenu === u.id && (
                          <div className="absolute right-4 top-16 z-[100] w-48 glass-card border border-white/10 rounded-2xl p-2 shadow-3xl animate-in fade-in slide-in-from-top-2">
                             <button onClick={() => handleToggleBan(u)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-rose-500 font-bold">
                                {u.isBanned ? <Unlock size={14} /> : <Ban size={14} />} <span>{u.isBanned ? 'Mở Khóa (Unban)' : 'Khóa (Ban)'}</span>
                             </button>
                             <button onClick={() => alert(`Điểm uy tín: ${u.securityScore || 100}%`)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-blue-400 font-bold">
                                <ShieldAlert size={14} /> <span>Check uy tín</span>
                             </button>
                             <button onClick={() => handleAdjustPoints(u.id, true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-emerald-400 font-bold">
                                <UserPlus size={14} /> <span>Cộng điểm</span>
                             </button>
                             <button onClick={() => handleAdjustPoints(u.id, false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-amber-500 font-bold">
                                <UserMinus size={14} /> <span>Trừ điểm</span>
                             </button>
                             <div className="h-px bg-white/5 my-2"></div>
                             <button onClick={() => handleDeleteUser(u.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-600 hover:text-white text-left text-slate-500 font-bold transition-all">
                                <UserX size={14} /> <span>Xóa tài khoản</span>
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
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">THÔNG BÁO RÚT TIỀN</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4"># Mã giao dịch</th>
                    <th className="px-4 py-4">Khách hàng</th>
                    <th className="px-4 py-4">Thông tin thanh toán</th>
                    <th className="px-4 py-4">Loại rút</th>
                    <th className="px-4 py-4">Số tiền</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-4 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-6 font-black text-blue-500">#{w.id} - DIAMOND NOVA</td>
                      <td className="px-4 py-6">
                         <div className="font-bold text-white uppercase">{w.user_name}</div>
                         <div className="text-[9px] text-slate-500 italic truncate max-w-[120px]">{w.user_id}</div>
                      </td>
                      <td className="px-4 py-6 text-slate-400 italic text-[10px] max-w-[150px] truncate">{w.details}</td>
                      <td className="px-4 py-6">
                        <span className={`font-black uppercase italic ${w.type === 'bank' ? 'text-emerald-500' : 'text-purple-500'}`}>
                          {w.type === 'bank' ? 'ATM / BANK' : 'GAME KC'}
                        </span>
                      </td>
                      <td className="px-4 py-6 font-black text-white">{w.amount.toLocaleString()}đ</td>
                      <td className="px-4 py-6">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${w.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                           {w.status === 'pending' ? 'ĐANG CHỜ' : w.status === 'completed' ? 'DUYỆT' : 'CHỐI'}
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
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ QUẢNG CÁO</h3>
              <button onClick={() => setShowAddAd(true)} className="px-10 py-5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                 <PlusCircle size={16} /> TẠO QUẢNG CÁO MỚI
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Hình ảnh</th>
                    <th className="px-4 py-4">Tên sản phẩm</th>
                    <th className="px-4 py-4">URL Link</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-4 py-4 text-right">Hành động</th>
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
                        <span className={`px-2 py-1 rounded text-[9px] font-black italic ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
                          {ad.isActive ? 'HIỆN' : 'ẨN'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => dbService.updateAdStatus(ad.id, !ad.isActive).then(refresh)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                              {ad.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                           <button onClick={() => dbService.deleteAd(ad.id).then(refresh)} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white">
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
              <button onClick={() => setShowAddGc(true)} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                 <PlusCircle size={16} /> TẠO GIFTCODE MỚI
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Tên mã (Code)</th>
                    <th className="px-4 py-4">Số điểm thưởng</th>
                    <th className="px-4 py-4">Lượt đã sử dụng</th>
                    <th className="px-4 py-4">Tối đa lượt dùng</th>
                    <th className="px-4 py-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {giftcodes.map(g => (
                    <tr key={g.code} className="text-xs group hover:bg-white/[0.02]">
                      <td className="px-4 py-6 font-black text-rose-500 tracking-widest">{g.code}</td>
                      <td className="px-4 py-6 font-black text-emerald-500">{g.amount.toLocaleString()} P</td>
                      <td className="px-4 py-6 text-slate-400 font-black">{(g.usedBy || []).length} lượt</td>
                      <td className="px-4 py-6 text-slate-500 font-black">{g.maxUses} lượt</td>
                      <td className="px-4 py-6 text-right">
                         <span className={`px-2 py-1 rounded text-[9px] font-black italic ${g.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                           {g.isActive ? 'ĐANG CHẠY' : 'HẾT LƯỢT'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo Giftcode - HÌNH CHỮ NHẬT */}
      {showAddGc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 space-y-6 animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">TẠO GIFTCODE</h2>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Tên mã (Code)</label>
                    <input type="text" placeholder="NOVA2025" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-emerald-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Số điểm thưởng</label>
                    <input type="number" placeholder="50000" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-emerald-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Số lượt dùng tối đa</label>
                    <input type="number" placeholder="100" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-emerald-500" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAddGc(false)} className="flex-1 py-4 bg-slate-800 text-slate-500 font-black rounded-xl text-[10px] uppercase italic tracking-widest">HỦY BỎ</button>
                 <button onClick={() => { dbService.addGiftcode(newGc).then(refresh); setShowAddGc(false); }} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase italic tracking-widest shadow-lg shadow-emerald-600/20">XÁC NHẬN TẠO</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Tạo Quảng Cáo - HÌNH CHỮ NHẬT */}
      {showAddAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 space-y-6 animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">TẠO QUẢNG CÁO</h2>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Tên sản phẩm</label>
                    <input type="text" placeholder="Tiêu đề quảng cáo" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Link URL hình ảnh</label>
                    <input type="text" placeholder="https://image-url.com/ad.jpg" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase italic">Link sản phẩm (Link đích)</label>
                    <input type="text" placeholder="https://shopee.vn/product" value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAddAd(false)} className="flex-1 py-4 bg-slate-800 text-slate-500 font-black rounded-xl text-[10px] uppercase italic tracking-widest">HỦY BỎ</button>
                 <button onClick={() => { dbService.saveAd(newAd).then(refresh); setShowAddAd(false); }} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase italic tracking-widest shadow-lg shadow-blue-600/20">LƯU QUẢNG CÁO</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
