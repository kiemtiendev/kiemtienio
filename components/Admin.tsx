
import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, AdminNotification, ActivityLog } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Users, 
  CreditCard, 
  Search, 
  Ban, 
  Unlock,
  Plus,
  Zap,
  Trash2,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Bell,
  History,
  Eye,
  AlertTriangle,
  MessageSquare,
  Activity,
  Loader2,
  X,
  Gamepad2,
  Building2
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Admin: React.FC<Props> = ({ user }) => {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'announcements' | 'giftcodes' | 'notifications' | 'logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshData = async () => {
    setIsSyncing(true);
    try {
      const [u, w, g, a, adsData, n, l] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawals(),
        dbService.getGiftcodes(),
        dbService.getAnnouncements(),
        dbService.getAds(true),
        dbService.getNotifications(),
        dbService.getActivityLogs()
      ]);
      setAllUsers(u);
      setWithdrawals(w);
      setGiftcodes(g);
      setAnnouncements(a);
      setAds(adsData);
      setNotifications(n);
      setLogs(l);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Admin:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Tự động làm mới mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  // Modal States
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    message: string;
    onConfirm: (inputValue?: string) => void;
    inputValue?: string;
  }>({ show: false, type: 'confirm', title: '', message: '', onConfirm: () => {} });

  // Forms State
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [adForm, setAdForm] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [isAddingAnn, setIsAddingAnn] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [giftForm, setGiftForm] = useState({ code: '', amount: 5000, limit: 100 });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({ show: true, type: 'confirm', title, message, onConfirm });
  };

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val?: string) => void) => {
    setModalConfig({ show: true, type: 'prompt', title, message, onConfirm, inputValue: defaultValue });
  };

  const handleSaveAd = async () => {
    if (!adForm.title || !adForm.imageUrl) return alert('Điền đủ thông tin!');
    await dbService.saveAd({ 
      title: adForm.title, 
      imageUrl: adForm.imageUrl, 
      targetUrl: adForm.targetUrl || '#', 
      isActive: true, 
      isHidden: false 
    });
    setAdForm({ title: '', imageUrl: '', targetUrl: '' });
    setIsAddingAd(false);
    refreshData();
  };

  const handleSaveAnn = async () => {
    if (!annForm.title || !annForm.content) return alert('Điền đủ nội dung!');
    await dbService.saveAnnouncement({ 
      title: annForm.title, 
      content: annForm.content, 
      priority: 'low', 
      createdAt: new Date().toISOString() 
    });
    setAnnForm({ title: '', content: '' });
    setIsAddingAnn(false);
    refreshData();
  };

  const handleSaveGift = async () => {
    if (!giftForm.code) return alert('Mã không hợp lệ!');
    await dbService.addGiftcode({ 
      code: giftForm.code.toUpperCase(), 
      amount: giftForm.amount, 
      maxUses: giftForm.limit 
    });
    setGiftForm({ code: '', amount: 5000, limit: 100 });
    setIsAddingGift(false);
    refreshData();
  };

  const toggleBan = async (u: User) => {
    await dbService.updateUser(u.id, { isBanned: !u.isBanned });
    refreshData();
  };

  const handleAdjustPoints = (u: User) => {
    showPrompt('ĐIỀU CHỈNH ĐIỂM', `Nhập số điểm cần điều chỉnh cho ${u.fullname} (Dùng dấu - để trừ):`, '1000', async (val) => {
      if (!val) return;
      const amount = parseInt(val);
      if (isNaN(amount)) return alert("Vui lòng nhập số!");
      await dbService.updateUser(u.id, { balance: Math.max(0, u.balance + amount) });
      refreshData();
    });
  };

  const handleUpdateWithdrawal = async (id: string, status: string, userId: string, amount: number) => {
    await dbService.updateWithdrawalStatus(id, status, userId, amount);
    refreshData();
  };

  const adminTabs = [
    { id: 'users', label: 'Hội viên', icon: <Users /> },
    { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard />, badge: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'notifications', label: 'Thông báo', icon: <Bell />, badge: notifications.filter(n => !n.isRead).length },
    { id: 'logs', label: 'Nhật ký', icon: <History /> },
    { id: 'ads', label: 'Quảng cáo', icon: <ShoppingBag /> },
    { id: 'announcements', label: 'Tin tức', icon: <Megaphone /> },
    { id: 'giftcodes', label: 'Mã Quà', icon: <Ticket /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* Modal */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
           <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 shadow-2xl relative">
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className={`p-5 rounded-3xl ${modalConfig.type === 'confirm' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {modalConfig.type === 'confirm' ? <AlertTriangle className="w-10 h-10" /> : <MessageSquare className="w-10 h-10" />}
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{modalConfig.title}</h2>
                 <p className="text-slate-400 font-medium italic text-sm">{modalConfig.message}</p>
                 {modalConfig.type === 'prompt' && (
                   <input 
                    type="text" 
                    value={modalConfig.inputValue} 
                    onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500" 
                    autoFocus 
                   />
                 )}
                 <div className="flex gap-4 w-full pt-4">
                    <button onClick={() => setModalConfig({...modalConfig, show: false})} className="flex-1 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 font-black uppercase text-[10px]">HỦY</button>
                    <button onClick={() => { modalConfig.onConfirm(modalConfig.inputValue); setModalConfig({...modalConfig, show: false}); }} className={`flex-1 py-4 ${modalConfig.type === 'confirm' ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black uppercase text-[10px] rounded-2xl shadow-xl`}>XÁC NHẬN</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Header Admin */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-600/40 relative">
            <ShieldCheck className="w-10 h-10 text-white" />
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`}></div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-3 mt-3">
               <Activity className="w-4 h-4 text-emerald-500" />
               <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest italic">
                Hệ thống: {isSyncing ? 'Đang đồng bộ Cloud...' : 'Hoạt động ổn định'}
               </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 px-8 py-4 bg-slate-900/50 rounded-3xl border border-white/5">
           <div className="text-center">
              <span className="text-[9px] font-black text-slate-600 uppercase italic block">Hội viên</span>
              <span className="text-2xl font-black text-white italic tracking-tighter">{allUsers.length}</span>
           </div>
           <div className="w-px h-10 bg-white/10"></div>
           <div className="text-center">
              <span className="text-[9px] font-black text-slate-600 uppercase italic block">Cần duyệt</span>
              <span className="text-2xl font-black text-amber-500 italic tracking-tighter">
                {withdrawals.filter(w => w.status === 'pending').length}
              </span>
           </div>
        </div>
      </div>

      {/* Tabs Admin */}
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        {adminTabs.map(item => {
          const isActive = tab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)} 
              className={`flex items-center gap-3 px-10 py-6 rounded-[2.5rem] font-black transition-all text-[11px] uppercase tracking-widest whitespace-nowrap relative border-2 ${isActive ? 'bg-blue-600 border-blue-500/50 text-white shadow-2xl shadow-blue-600/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
            >
              {item.icon} <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] min-w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-[#06080c] shadow-lg animate-bounce">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl min-h-[500px] bg-slate-950/40 relative">
        {isSyncing && (
          <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse w-full rounded-t-[4rem]"></div>
        )}

        {tab === 'users' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
            <div className="relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 w-7 h-7" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Tìm hội viên theo tên hoặc email..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-20 pr-10 py-6 text-white font-bold outline-none focus:border-blue-500" 
              />
            </div>
            <div className="overflow-x-auto rounded-[2.5rem] border border-white/10">
              <table className="w-full">
                <thead className="bg-slate-900/80 text-left">
                  <tr>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">Thành viên</th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Số dư</th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers
                    .filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(u => (
                    <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${u.isBanned ? 'bg-red-950/20 opacity-60' : ''}`}>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 ${u.isAdmin ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-600/20 text-blue-400'}`}>{u.fullname.charAt(0)}</div>
                          <div>
                            <div className="font-black text-white italic text-base flex items-center gap-2">
                               {u.fullname}
                            </div>
                            <div className="text-[11px] text-slate-600 font-bold uppercase">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-emerald-400 italic text-xl text-center">{formatK(u.balance)} P</td>
                      <td className="px-10 py-8">
                        <div className="flex justify-end gap-4">
                           <button onClick={() => handleAdjustPoints(u)} className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Zap className="w-6 h-6" /></button>
                           <button onClick={() => toggleBan(u)} className={`p-4 rounded-2xl transition-all ${u.isBanned ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white'}`}>{u.isBanned ? <Unlock className="w-6 h-6" /> : <Ban className="w-6 h-6" />}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'withdrawals' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><CreditCard className="w-8 h-8 text-emerald-500" /> DANH SÁCH RÚT TIỀN</h3>
             <div className="grid grid-cols-1 gap-6">
               {withdrawals.length === 0 ? (
                 <p className="text-center italic opacity-30 uppercase font-black py-20">Danh sách trống</p>
               ) : (
                 withdrawals.map(req => (
                   <div key={req.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-2xl ${req.type === 'bank' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           {req.type === 'bank' ? <Building2 className="w-7 h-7" /> : <Gamepad2 className="w-7 h-7" />}
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-white uppercase italic">{req.userName}</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{req.type === 'bank' ? 'ATM/STK' : 'ID GAME'}: {req.details}</p>
                        </div>
                     </div>
                     <div className="text-center">
                        <span className="text-2xl font-black text-emerald-400 italic">{req.amount.toLocaleString()}đ</span>
                        <p className="text-[10px] text-slate-600 font-bold italic">{new Date(req.createdAt).toLocaleString()}</p>
                     </div>
                     <div className="flex gap-3">
                        {req.status === 'pending' ? (
                          <>
                            <button onClick={() => handleUpdateWithdrawal(req.id, 'completed', req.userId, req.amount)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase">DUYỆT</button>
                            <button onClick={() => handleUpdateWithdrawal(req.id, 'rejected', req.userId, req.amount)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">HỦY</button>
                          </>
                        ) : (
                          <span className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase ${req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{req.status}</span>
                        )}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Bell className="w-8 h-8 text-amber-500" /> THÔNG BÁO QUẢN TRỊ</h3>
                <button onClick={async () => { if(confirm('Xóa hết?')) { await dbService.clearAllNotifications(); refreshData(); }}} className="text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest italic px-6 py-3 rounded-2xl bg-red-500/5 hover:bg-red-600 transition-all">XÓA TẤT CẢ</button>
             </div>
             <div className="space-y-6">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest">Không có thông báo mới</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`glass-card p-8 rounded-[2.5rem] border border-white/5 flex items-start justify-between gap-8 ${notif.isRead ? 'opacity-40' : 'bg-slate-900/50 border-blue-500/30'}`}>
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-blue-500 uppercase italic bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{notif.type}</span>
                            <span className="text-[10px] text-slate-600 font-bold">{new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                          <h4 className="text-white font-black uppercase italic text-lg mb-2">{notif.title}</h4>
                          <p className="text-slate-400 text-sm italic">{notif.content}</p>
                       </div>
                       <div className="flex flex-col gap-3">
                          {!notif.isRead && (
                            <button onClick={async () => { await dbService.markNotificationRead(notif.id); refreshData(); }} className="p-4 bg-blue-600 text-white rounded-2xl"><Eye className="w-5 h-5" /></button>
                          )}
                          <button onClick={async () => { await dbService.deleteNotification(notif.id); refreshData(); }} className="p-4 bg-slate-800 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Ticket className="w-8 h-8 text-rose-500" /> QUẢN LÝ GIFTCODE</h3>
              <button onClick={() => setIsAddingGift(true)} className="flex items-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all"><Plus className="w-4 h-4" /> TẠO MỚI</button>
            </div>

            {isAddingGift && (
              <div className="glass-card p-8 rounded-[2.5rem] border border-rose-500/30 space-y-6 bg-rose-500/5 animate-in zoom-in-95">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input type="text" placeholder="MÃ (VD: NOVA2025)" value={giftForm.code} onChange={e => setGiftForm({...giftForm, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                    <input type="number" placeholder="SỐ ĐIỂM (P)" value={giftForm.amount} onChange={e => setGiftForm({...giftForm, amount: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                    <input type="number" placeholder="GIỚI HẠN NHẬP" value={giftForm.limit} onChange={e => setGiftForm({...giftForm, limit: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsAddingGift(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px]">HỦY</button>
                    <button onClick={handleSaveGift} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px]">XÁC NHẬN TẠO</button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {giftcodes.map(gc => (
                 <div key={gc.code} className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                    <div>
                       <h4 className="text-xl font-black text-white italic tracking-widest">{gc.code}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{gc.amount.toLocaleString()} P • Đã dùng: {gc.usedBy.length}/{gc.maxUses}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-600/10 rounded-xl flex items-center justify-center text-rose-500"><Ticket className="w-6 h-6" /></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Megaphone className="w-8 h-8 text-blue-500" /> QUẢN LÝ TIN TỨC</h3>
                <button onClick={() => setIsAddingAnn(true)} className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all"><Plus className="w-4 h-4" /> THÊM TIN MỚI</button>
             </div>

             {isAddingAnn && (
               <div className="glass-card p-8 rounded-[2.5rem] border border-blue-500/30 space-y-6 bg-blue-500/5 animate-in zoom-in-95">
                  <input type="text" placeholder="Tiêu đề tin tức" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                  <textarea placeholder="Nội dung chi tiết..." rows={4} value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold resize-none" />
                  <div className="flex gap-4">
                    <button onClick={() => setIsAddingAnn(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px]">HỦY</button>
                    <button onClick={handleSaveAnn} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px]">ĐĂNG TIN</button>
                  </div>
               </div>
             )}

             <div className="space-y-6">
                {announcements.map(ann => (
                  <div key={ann.id} className="glass-card p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                     <h4 className="text-white font-black italic uppercase text-lg mb-2">{ann.title}</h4>
                     <p className="text-slate-500 text-sm italic mb-4 line-clamp-2">{ann.content}</p>
                     <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        <div className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'ads' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><ShoppingBag className="w-8 h-8 text-purple-500" /> BANNER QUẢNG CÁO</h3>
                <button onClick={() => setIsAddingAd(true)} className="flex items-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all"><Plus className="w-4 h-4" /> THÊM BANNER</button>
             </div>

             {isAddingAd && (
               <div className="glass-card p-8 rounded-[2.5rem] border border-purple-500/30 space-y-6 bg-purple-500/5 animate-in zoom-in-95">
                  <input type="text" placeholder="Tên chiến dịch" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                  <input type="text" placeholder="URL Hình ảnh" value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                  <input type="text" placeholder="URL Đích (Link khi nhấn)" value={adForm.targetUrl} onChange={e => setAdForm({...adForm, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white font-bold" />
                  <div className="flex gap-4">
                    <button onClick={() => setIsAddingAd(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px]">HỦY</button>
                    <button onClick={handleSaveAd} className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px]">LƯU QUẢNG CÁO</button>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ads.map(ad => (
                  <div key={ad.id} className="glass-card overflow-hidden rounded-[3rem] border border-white/5 relative group">
                     <img src={ad.imageUrl} alt={ad.title} className="w-full h-48 object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
                     <div className="p-6">
                        <h4 className="text-white font-black italic uppercase">{ad.title}</h4>
                        <div className="flex items-center justify-between mt-4">
                           <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{ad.isActive ? 'ĐANG CHẠY' : 'DỪNG'}</span>
                           <button className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
             <div className="flex items-center gap-4 mb-6">
                <History className="w-8 h-8 text-slate-400" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">NHẬT KÝ HOẠT ĐỘNG</h3>
             </div>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-6 group hover:bg-white/[0.05] transition-all">
                     <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:text-blue-400 transition-colors">LOG</div>
                        <div>
                           <div className="text-[11px] font-black uppercase italic text-slate-300">{log.userName} • {log.action}</div>
                           <div className="text-[10px] text-slate-600 font-medium italic mt-1">{log.details}</div>
                        </div>
                     </div>
                     <span className="text-[9px] text-slate-700 font-bold uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center py-20 text-slate-700 font-black italic uppercase">Chưa có dữ liệu nhật ký.</p>}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
