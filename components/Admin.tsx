
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, AdBanner, Announcement, Notification } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
import { formatK, RATE_VND_TO_POINT } from '../constants.tsx';
import { 
  Users, CreditCard, Ticket, Megaphone, ImageIcon, Eye, EyeOff, Trash2, 
  PlusCircle, Search, CheckCircle2, XCircle, Settings, UserMinus, 
  UserPlus, ShieldAlert, Ban, Unlock, Wallet, Activity, TrendingUp, DollarSign,
  RefreshCcw, UserX, AlertTriangle, Loader2, X, ShieldCheck
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
  const [showAddAd, setShowAddAd] = useState(false);
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [viewBill, setViewBill] = useState<string | null>(null);
  
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });
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
    await dbService.updateWithdrawalStatus(id, s);
    showToast('ADMIN', `Đơn rút ${s.toUpperCase()}`, 'info');
    await refreshData();
  };
  
  const updatePayment = async (billId: string, status: 'approved' | 'refunded', req?: any) => {
    let request = req;
    if (!request && vipRequests) {
        request = vipRequests.find(v => `#NV${String(v.id).slice(0,4)}` === billId || String(v.id) === billId);
    }

    const statusText = status === 'approved' ? 'DUYỆT THÀNH CÔNG' : 'HOÀN TIỀN THÀNH CÔNG';
    const type = status === 'approved' ? 'success' : 'info';
    
    if (request) {
        if (!(await confirm(`Xác nhận ${status === 'approved' ? 'DUYỆT' : 'HOÀN'} đơn ${billId}?`))) return;
        setIsActionLoading(true);
        const dbStatus = status === 'approved' ? 'completed' : 'refunded';
        const res = await dbService.updateVipRequestStatus(request.id, dbStatus, request.user_id, request.vip_tier, request.amount_vnd);
        setIsActionLoading(false);
        
        if (res.success) {
            if((window as any).novaNotify) {
                (window as any).novaNotify(type, 'THANH TOÁN', `Đơn hàng ${billId} đã được ${statusText}!`);
            }
            await refreshData();
        } else {
            if((window as any).novaNotify) {
                (window as any).novaNotify('error', 'LỖI', res.message || 'Có lỗi xảy ra');
            }
        }
    } else {
        if((window as any).novaNotify) {
            (window as any).novaNotify(type, 'THANH TOÁN', `Đơn hàng ${billId} đã được ${statusText}! (Demo)`);
        }
    }
  };

  const handleCreateGiftcode = async () => {
    if (!newGc.code || !newGc.amount) return alert("Nhập đủ thông tin.");
    setIsActionLoading(true);
    const res = await dbService.addGiftcode(newGc.code, newGc.amount, newGc.maxUses);
    setIsActionLoading(false);
    
    if (!res.error) { 
      showToast('ADMIN', "Đã tạo Giftcode thành công!", 'success'); 
      setShowAddGc(false); 
      setNewGc({ code: '', amount: 10000, maxUses: 100 });
      refreshData(); 
    } else {
      alert("Lỗi tạo Giftcode: " + (res.error as any).message);
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
                         <div className="font-black text-white uppercase flex items-center gap-3 italic text-sm">{u.fullname} {u.isBanned && <span className="text-red-500 text-[8px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">BỊ KHÓA</span>}</div>
                         <div className="text-[10px] text-slate-600 font-bold mt-1 tracking-wider">{u.email}</div>
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

        {tab === 'withdrawals' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">PHÊ DUYỆT RÚT THƯỞNG</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5 tracking-widest"><th className="px-6 py-6">Mã Đơn</th><th className="px-6 py-6">Hội Viên</th><th className="px-6 py-6">Số Tiền</th><th className="px-6 py-6 text-right">Tình Trạng</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="text-xs hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-8 font-black text-blue-500 italic">#ORD-{String(w.id).slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-8">
                         <div className="font-black text-white uppercase italic text-sm">{w.userName}</div>
                         <div className="text-[10px] text-slate-600 font-bold truncate max-w-[150px] mt-1">{w.details}</div>
                      </td>
                      <td className="px-6 py-8 font-black text-white text-base">{w.amount.toLocaleString()}đ</td>
                      <td className="px-6 py-8 text-right">
                         {w.status === 'pending' ? (
                           <div className="flex justify-end gap-3">
                              <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="p-3 bg-emerald-600/10 text-emerald-400 rounded-2xl hover:bg-emerald-600 hover:text-white border border-emerald-500/20 transition-all shadow-lg shadow-emerald-500/10"><CheckCircle2 size={18} /></button>
                              <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white border border-red-500/20 transition-all shadow-lg shadow-red-500/10"><XCircle size={18} /></button>
                           </div>
                         ) : <span className={`text-[10px] font-black uppercase italic px-4 py-1.5 rounded-full border ${w.status === 'completed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}>{w.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {tab === 'payments' && (
          <div className="space-y-8 animate-in slide-in-from-right-10">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter" style={{ color: '#e2b13c' }}>Quản Lý Thanh Toán (Nạp VIP)</h3>
            
            <div className="nova-card">
                <div className="nova-card-header">
                    <h3 className="text-lg font-black uppercase tracking-widest" style={{ color: '#e2b13c' }}>Danh Sách Yêu Cầu Nạp VIP</h3>
                </div>
                
                <div className="nova-table-responsive">
                    <table className="nova-table w-full">
                        <thead>
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Hội Viên</th>
                                <th>Số Tiền</th>
                                <th>Ảnh Bill</th>
                                <th>Tình Trạng</th>
                                <th className="text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody id="payment-list">
                            {vipRequests.map((req) => (
                              <tr key={req.id}>
                                  <td className="font-bold">#NV{String(req.id).slice(0,4)}</td>
                                  <td>
                                    <div className="font-bold text-white">{req.user_name}</div>
                                    <div className="text-[10px] opacity-60">{req.email}</div>
                                  </td>
                                  <td style={{ color: '#2ecc71', fontWeight: 900 }}>+ {req.amount_vnd?.toLocaleString()}đ</td>
                                  <td>
                                    {req.bill_url ? (
                                      <button 
                                        onClick={() => setViewBill(req.bill_url)}
                                        className="flex items-center gap-2 text-[9px] font-black text-blue-400 bg-blue-400/10 px-3 py-2 rounded-lg hover:bg-blue-400 hover:text-white transition-all border border-blue-400/20 uppercase tracking-wider"
                                      >
                                         <ImageIcon size={12} /> Xem Bill
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-slate-600 italic opacity-50">---</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`badge ${req.status === 'pending' ? 'badge-pending' : req.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                                      {req.status === 'pending' ? 'Chờ xử lý' : req.status === 'completed' ? 'Thành công' : 'Đã hủy'}
                                    </span>
                                  </td>
                                  <td className="text-right">
                                    {req.status === 'pending' && (
                                      <>
                                        <button className="btn-action btn-approve" onClick={() => updatePayment(String(req.id), 'approved', req)}>Duyệt</button>
                                        <button className="btn-action btn-refund" onClick={() => updatePayment(String(req.id), 'refunded', req)}>Hoàn</button>
                                      </>
                                    )}
                                  </td>
                              </tr>
                            ))}
                            {vipRequests.length === 0 && (
                              <tr><td colSpan={6} className="text-center py-8 opacity-50 italic">Không có yêu cầu thanh toán nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
            :root {
                --gold: #e2b13c; --blue: #3b82f6; --dark: #0d1117;
            }

            .nova-card {
                background: rgba(20, 24, 33, 0.95);
                border: 1px solid rgba(226, 177, 60, 0.2);
                border-radius: 15px; padding: 20px; margin-top: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            .nova-table {
                width: 100%; border-collapse: collapse; margin-top: 15px;
                color: #fff; font-size: 14px;
            }

            .nova-table th {
                text-align: left; padding: 12px; border-bottom: 2px solid var(--gold);
                color: var(--gold); text-transform: uppercase; letter-spacing: 1px; font-weight: 900; font-style: italic;
            }

            .nova-table td { padding: 15px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }

            /* Badge Tình trạng */
            .badge { padding: 4px 8px; border-radius: 5px; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .badge-pending { background: rgba(241, 196, 15, 0.2); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); }
            .badge-success { background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
            .badge-danger { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.3); }

            /* Nút bấm hành động */
            .btn-action {
                padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
                font-weight: 800; margin-left: 8px; transition: 0.3s;
                text-transform: uppercase; font-size: 10px; letter-spacing: 1px;
            }

            .btn-approve { background: #2ecc71; color: #fff; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); }
            .btn-refund { background: #ff4d4d; color: #fff; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }

            .btn-action:hover { transform: scale(1.1); filter: brightness(1.2); }
            `}</style>
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
                <thead><tr className="text-[10px] font-black text-slate-500 uppercase border-b border-white/5 tracking-widest"><th className="px-6 py-6">Mã Key</th><th className="px-6 py-6">Giá Trị</th><th className="px-6 py-6">Sử Dụng</th><th className="px-6 py-6 text-right">Trạng Thái</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {giftcodes.map(g => (
                    <tr key={g.code} className="text-xs hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-8 font-black text-rose-500 tracking-[0.3em] uppercase text-sm italic">{g.code}</td>
                      <td className="px-6 py-8 font-black text-emerald-500 text-base">{g.amount.toLocaleString()} P</td>
                      <td className="px-6 py-8 text-slate-500 font-black italic text-sm">{(g.usedBy || []).length} <span className="text-[10px] opacity-40">/</span> {g.maxUses}</td>
                      <td className="px-6 py-8 text-right"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic ${g.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{g.isActive ? 'ĐANG KÍCH HOẠT' : 'ĐÃ KẾT THÚC'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

      {showAddGc && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="glass-card w-full max-w-md p-12 rounded-[4rem] border border-emerald-500/20 animate-in zoom-in-95 relative shadow-[0_0_100px_rgba(16,185,129,0.1)]">
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
                 <button onClick={handleCreateGiftcode} disabled={isActionLoading} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl uppercase italic tracking-widest shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 mt-4 flex items-center justify-center">
                    {isActionLoading ? <Loader2 className="animate-spin" /> : 'PHÁT HÀNH GIFTCODE'}
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
