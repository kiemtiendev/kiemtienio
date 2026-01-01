
import React, { useState, useMemo, useEffect } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, AdminNotification, ActivityLog } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Users, 
  CreditCard, 
  Search, 
  Check, 
  X, 
  Ban, 
  Unlock,
  Plus,
  Zap,
  Trash2,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Save,
  Ticket,
  TrendingUp,
  Building2,
  Gamepad2,
  Bell,
  History,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Admin: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'announcements' | 'giftcodes' | 'notifications' | 'logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Custom Modal States
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    message: string;
    onConfirm: (inputValue?: string) => void;
    inputValue?: string;
  }>({
    show: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
    inputValue: ''
  });

  // Forms State
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [adForm, setAdForm] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [isAddingAnn, setIsAddingAnn] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [giftForm, setGiftForm] = useState({ code: '', amount: 5000, limit: 100 });

  useEffect(() => {
    refreshData();
  }, [tab]);

  const refreshData = () => {
    setAllUsers(dbService.getAllUsers());
    setWithdrawals(dbService.getWithdrawals());
    setGiftcodes(dbService.getGiftcodes());
    setAnnouncements(dbService.getAnnouncements());
    setAds(dbService.getAds(true));
    setNotifications(dbService.getNotifications());
    setLogs(dbService.getActivityLogs());
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({ show: true, type: 'confirm', title, message, onConfirm });
  };

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val?: string) => void) => {
    setModalConfig({ show: true, type: 'prompt', title, message, onConfirm, inputValue: defaultValue });
  };

  const handleSaveAd = () => {
    if (!adForm.title || !adForm.imageUrl) return alert('Điền đủ thông tin QC!');
    dbService.saveAd({
      id: Math.random().toString(36).substr(2, 9),
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

  const handleToggleAdVisibility = (id: string) => {
    dbService.toggleAdVisibility(id);
    refreshData();
  };

  const handleDeleteAd = (id: string) => {
    showConfirm('XÓA QUẢNG CÁO', 'Xác nhận xóa quảng cáo này vĩnh viễn khỏi hệ thống?', () => {
      dbService.deleteAd(id);
      refreshData();
    });
  };

  const handleSaveAnn = () => {
    if (!annForm.title || !annForm.content) return alert('Điền đủ nội dung TB!');
    dbService.saveAnnouncement({
      id: Math.random().toString(36).substr(2, 9),
      title: annForm.title,
      content: annForm.content,
      priority: 'low',
      createdAt: new Date().toISOString()
    });
    setAnnForm({ title: '', content: '' });
    setIsAddingAnn(false);
    refreshData();
  };

  const handleSaveGift = () => {
    if (!giftForm.code || giftForm.amount <= 0 || giftForm.limit <= 0) return alert('Thông tin mã không hợp lệ!');
    const existing = giftcodes.find(g => g.code.toUpperCase() === giftForm.code.toUpperCase());
    if (existing) return alert('Mã Giftcode đã tồn tại!');

    dbService.addGiftcode({
      code: giftForm.code.toUpperCase(),
      amount: giftForm.amount,
      maxUses: giftForm.limit,
      usedBy: [],
      createdAt: new Date().toISOString()
    });
    
    setGiftForm({ code: '', amount: 5000, limit: 100 });
    setIsAddingGift(false);
    refreshData();
  };

  const handleAdjustPoints = (u: User) => {
    showPrompt('ĐIỀU CHỈNH ĐIỂM', `Nhập số điểm muốn thay đổi cho ${u.fullname} (Ví dụ: 1000 hoặc -500):`, '1000', (val) => {
      if (!val) return;
      const amount = parseInt(val);
      if (isNaN(amount)) return alert('Nhập số hợp lệ!');
      const updatedUser = { 
        ...u, 
        balance: Math.max(0, u.balance + amount),
        totalEarned: amount > 0 ? (u.totalEarned || 0) + amount : (u.totalEarned || 0)
      };
      dbService.adminUpdateUser(updatedUser);
      refreshData();
    });
  };

  const toggleBan = (u: User) => {
    const action = u.isBanned ? 'MỞ KHÓA' : 'KHÓA';
    showConfirm(`${action} TÀI KHOẢN`, `Bạn có chắc chắn muốn ${action.toLowerCase()} hội viên ${u.fullname}?`, () => {
      dbService.adminUpdateUser({ ...u, isBanned: !u.isBanned });
      refreshData();
    });
  };

  const handleApproveWithdrawal = (id: string) => {
    showConfirm('DUYỆT ĐƠN RÚT', `Xác nhận ĐÃ THANH TOÁN đơn #${id}? Thao tác này sẽ gửi thông báo thành công cho hội viên.`, () => {
      const res = dbService.updateWithdrawalStatus(id, 'completed');
      if (res) refreshData();
      else alert('Lỗi: Không tìm thấy đơn rút!');
    });
  };

  const handleRejectWithdrawal = (id: string) => {
    showPrompt('TỪ CHỐI ĐƠN RÚT', 'Vui lòng nhập lý do từ chối (Lý do này sẽ hiển thị cho hội viên):', 'Thông tin thanh toán không chính xác', (reason) => {
      if (!reason) return;
      const res = dbService.updateWithdrawalStatus(id, 'rejected', reason);
      if (res) refreshData();
      else alert('Lỗi: Không tìm thấy đơn rút!');
    });
  };

  const clearAllNotifs = () => {
    showConfirm('XÓA TẤT CẢ', 'Xác nhận xóa sạch hòm thư thông báo Admin?', () => {
      dbService.clearAllNotifications();
      refreshData();
    });
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
      {/* --- CUSTOM MODAL SYSTEM --- */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.2)] relative animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className={`p-5 rounded-3xl ${modalConfig.type === 'confirm' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {modalConfig.type === 'confirm' ? <AlertTriangle className="w-10 h-10" /> : <MessageSquare className="w-10 h-10" />}
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{modalConfig.title}</h2>
                 <p className="text-slate-400 font-medium italic text-sm">{modalConfig.message}</p>
                 
                 {modalConfig.type === 'prompt' && (
                   <input 
                     type="text" 
                     value={modalConfig.inputValue}
                     onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                     autoFocus
                   />
                 )}

                 <div className="flex gap-4 w-full pt-4">
                    <button 
                      onClick={() => setModalConfig({...modalConfig, show: false})}
                      className="flex-1 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 font-black uppercase italic tracking-widest text-[10px] hover:bg-slate-800 transition-all"
                    >
                      HỦY BỎ
                    </button>
                    <button 
                      onClick={() => {
                        modalConfig.onConfirm(modalConfig.inputValue);
                        setModalConfig({...modalConfig, show: false});
                      }}
                      className={`flex-1 py-4 ${modalConfig.type === 'confirm' ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl transition-all active:scale-95`}
                    >
                      XÁC NHẬN
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-600/40">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">ADMIN DASHBOARD</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-3 italic">Hệ thống quản trị Vision 1.0</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        {adminTabs.map(item => {
          const isActive = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id as any)} className={`flex items-center gap-3 px-10 py-6 rounded-[2.5rem] font-black transition-all text-[11px] uppercase tracking-widest whitespace-nowrap relative border-2 ${isActive ? 'bg-blue-600 border-blue-500/50 text-white shadow-2xl shadow-blue-600/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:bg-slate-800'}`}>
              {item.icon} <span>{item.label}</span>
              {item.badge ? <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] min-w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-[#06080c] shadow-lg">{item.badge}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl min-h-[600px] relative bg-slate-950/40 backdrop-blur-3xl">
        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-10">
            <div className="relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 w-7 h-7" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm hội viên..." className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl pl-20 pr-10 py-6 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="overflow-x-auto rounded-[2.5rem] border border-white/10">
              <table className="w-full border-collapse">
                <thead className="bg-slate-900/80 text-left border-b border-white/10">
                  <tr>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">Thành viên</th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Số dư (P)</th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Tích lũy (P)</th>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                    <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-all ${u.isBanned ? 'bg-red-950/20' : ''}`}>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${u.isAdmin ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' : 'bg-blue-600/20 text-blue-400 border-blue-500/40'}`}>{u.fullname.charAt(0)}</div>
                          <div>
                            <div className="font-black text-white italic text-base flex items-center gap-2">{u.fullname} {u.isAdmin && <ShieldCheck className="w-4 h-4 text-amber-500" />}</div>
                            <div className="text-[11px] text-slate-600 font-bold uppercase tracking-tight">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-emerald-400 italic text-xl text-center">{formatK(u.balance)}</td>
                      <td className="px-10 py-8 font-black text-blue-400 italic text-xl text-center">{formatK(u.totalEarned || 0)}</td>
                      <td className="px-10 py-8">
                        <div className="flex justify-end gap-4">
                           <button onClick={() => handleAdjustPoints(u)} className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"><Zap className="w-6 h-6" /></button>
                           <button onClick={() => toggleBan(u)} className={`p-4 rounded-2xl transition-all border ${u.isBanned ? 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white border-emerald-500/20' : 'bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border-red-500/20'}`}>{u.isBanned ? <Unlock className="w-6 h-6" /> : <Ban className="w-6 h-6" />}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {tab === 'withdrawals' && (
          <div className="space-y-10 relative">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><CreditCard className="w-8 h-8 text-blue-500" /> YÊU CẦU THANH KHOẢN</h3>
            <div className="space-y-6">
              {withdrawals.length === 0 ? (
                <div className="p-20 text-center text-slate-700 font-black uppercase italic tracking-widest bg-slate-900/20 rounded-[3rem] border border-white/5 shadow-inner">Danh sách trống.</div>
              ) : (
                withdrawals.map(req => (
                  <div key={req.id} className="glass-card p-10 rounded-[3rem] border-2 border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-slate-900/40 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                    <div className="flex gap-8 items-center">
                       <div className={`p-6 rounded-3xl border-2 ${req.type === 'bank' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-600/10 text-purple-400 border-purple-500/20'}`}>
                          {req.type === 'bank' ? <Building2 className="w-8 h-8" /> : <Gamepad2 className="w-8 h-8" />}
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 italic">ID: #{req.id}</span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase italic border ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{req.status.toUpperCase()}</span>
                          </div>
                          <h4 className="text-white font-black text-2xl italic uppercase tracking-tight mt-3">{req.userName} - {req.amount.toLocaleString()} VND</h4>
                          <p className="text-[11px] text-slate-500 font-bold uppercase mt-2 italic">THÔNG TIN: {req.details}</p>
                       </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleApproveWithdrawal(req.id)} 
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-5 rounded-2xl flex items-center gap-3 uppercase tracking-widest text-[11px] italic transition-all shadow-xl shadow-emerald-600/30 cursor-pointer pointer-events-auto"
                        >
                          <Check className="w-5 h-5" /> DUYỆT ĐƠN
                        </button>
                        <button 
                          onClick={() => handleRejectWithdrawal(req.id)} 
                          className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black px-8 py-5 rounded-2xl flex items-center gap-3 uppercase tracking-widest text-[11px] italic transition-all border border-red-500/20 cursor-pointer pointer-events-auto"
                        >
                          <X className="w-5 h-5" /> TỪ CHỐI
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Bell className="w-8 h-8 text-amber-500" /> THÔNG BÁO HỆ THỐNG</h3>
              <div className="flex gap-4">
                <button onClick={() => { dbService.markAllNotificationsRead(); refreshData(); }} className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-widest italic flex items-center gap-2 border border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-600 transition-all">
                  <CheckCircle2 className="w-4 h-4" /> ĐỌC TẤT CẢ
                </button>
                <button onClick={clearAllNotifs} className="text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest italic flex items-center gap-2 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-600 transition-all">
                  <Trash2 className="w-4 h-4" /> XÓA TẤT CẢ
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {notifications.length === 0 ? (
                <div className="p-20 text-center text-slate-700 font-black uppercase italic tracking-widest bg-slate-900/20 rounded-[3rem] border border-white/5">Hộp thư trống.</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`glass-card p-8 rounded-[2.5rem] border border-white/5 transition-all relative overflow-hidden ${notif.isRead ? 'bg-slate-900/20 opacity-60' : 'bg-slate-900/50 border-blue-500/30 shadow-lg'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-blue-500 uppercase italic tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">{notif.type.toUpperCase()}</span>
                        {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold">{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                    <h4 className="text-white font-black uppercase italic text-lg mb-2">{notif.title}</h4>
                    <p className="text-slate-400 text-sm italic mb-6">{notif.content}</p>
                    <div className="flex justify-end gap-3">
                       {!notif.isRead && (
                         <button onClick={() => { dbService.markNotificationRead(notif.id); refreshData(); }} className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20">
                            <Eye className="w-5 h-5" />
                         </button>
                       )}
                       <button onClick={() => { dbService.deleteNotification(notif.id); refreshData(); }} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {tab === 'logs' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><History className="w-8 h-8 text-emerald-500" /> NHẬT KÝ HOẠT ĐỘNG</h3>
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Lọc nhật ký..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white font-bold text-xs" />
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-[2.5rem] border border-white/10 bg-slate-900/20">
              <table className="w-full">
                <thead className="bg-slate-900/80 text-left border-b border-white/10">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hội viên</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hành động</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.filter(l => l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || l.action.toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all text-xs">
                      <td className="px-8 py-5 text-slate-500 font-bold whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-8 py-5 text-blue-400 font-black italic uppercase">{log.userName}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-800 rounded-lg text-white font-black uppercase text-[9px] border border-white/10 italic">{log.action}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-400 italic">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADS TAB */}
        {tab === 'ads' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><ShoppingBag className="w-8 h-8 text-amber-500" /> QUẢNG CÁO ĐỐI TÁC</h3>
              <button onClick={() => setIsAddingAd(!isAddingAd)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30">
                {isAddingAd ? <><X className="w-5 h-5" /> ĐÓNG</> : <><Plus className="w-5 h-5" /> TẠO QC MỚI</>}
              </button>
            </div>

            {isAddingAd && (
              <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3rem] space-y-8 animate-in zoom-in-95 shadow-inner">
                <input type="text" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} placeholder="Tên đối tác / QC" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-black italic outline-none focus:border-blue-500" />
                <input type="text" value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} placeholder="URL Ảnh QC (16:9)" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-blue-500" />
                <input type="text" value={adForm.targetUrl} onChange={e => setAdForm({...adForm, targetUrl: e.target.value})} placeholder="URL đích khi Click" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-blue-500" />
                <button onClick={handleSaveAd} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black py-6 rounded-3xl uppercase tracking-widest italic transition-all flex items-center justify-center gap-4"><Save className="w-6 h-6" /> PHÁT HÀNH QUẢNG CÁO</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {ads.map(ad => (
                <div key={ad.id} className={`glass-card p-6 rounded-[3.5rem] border border-white/5 relative group transition-all shadow-xl ${ad.isHidden ? 'opacity-50 grayscale' : 'bg-slate-900/30 hover:border-blue-500/30'}`}>
                  <img src={ad.imageUrl} alt={ad.title} className="w-full aspect-video object-cover rounded-[2.5rem] mb-6 shadow-2xl border border-white/10" />
                  <div className="flex items-center justify-between px-4 mb-6">
                    <h4 className="text-white font-black italic uppercase text-lg truncate flex-1">{ad.title}</h4>
                    {ad.isHidden && <span className="text-[10px] font-black text-red-500 uppercase italic bg-red-500/10 px-2 py-1 rounded">ĐÃ ẨN</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleToggleAdVisibility(ad.id)} className={`py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all italic border flex items-center justify-center gap-2 ${ad.isHidden ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800/50 text-slate-400 border-white/5'}`}>
                      {ad.isHidden ? <><Eye className="w-4 h-4" /> HIỆN</> : <><EyeOff className="w-4 h-4" /> ẨN</>}
                    </button>
                    <button onClick={() => handleDeleteAd(ad.id)} className="py-4 rounded-[2rem] bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all italic border border-red-500/20 flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> XÓA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {tab === 'announcements' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Megaphone className="w-8 h-8 text-blue-500" /> QUẢN LÝ TIN TỨC</h3>
              <button onClick={() => setIsAddingAnn(!isAddingAnn)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30">
                {isAddingAnn ? <><X className="w-5 h-5" /> ĐÓNG</> : <><Plus className="w-5 h-5" /> TẠO TIN MỚI</>}
              </button>
            </div>

            {isAddingAnn && (
              <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3rem] space-y-8 animate-in zoom-in-95 shadow-inner">
                <input type="text" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="Tiêu đề tin tức" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-black italic outline-none focus:border-blue-500" />
                <textarea value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} placeholder="Nội dung thông báo..." rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-medium outline-none focus:border-blue-500 resize-none" />
                <button onClick={handleSaveAnn} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black py-6 rounded-3xl uppercase tracking-widest italic transition-all flex items-center justify-center gap-4"><Save className="w-6 h-6" /> ĐĂNG TIN TỨC</button>
              </div>
            )}

            <div className="space-y-6">
              {announcements.length === 0 ? (
                <div className="p-20 text-center text-slate-700 font-black uppercase italic tracking-widest bg-slate-900/20 rounded-[3rem] border border-white/5">Chưa có tin tức nào.</div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-slate-600 font-bold">{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                      <h4 className="text-white font-black uppercase italic text-lg mb-2 group-hover:text-blue-400 transition-colors">{ann.title}</h4>
                      <p className="text-slate-400 text-sm italic">{ann.content}</p>
                    </div>
                    <button onClick={() => { 
                      showConfirm('XÓA TIN TỨC', 'Xác nhận xóa bản tin này khỏi hệ thống?', () => {
                        dbService.deleteAnnouncement(ann.id); 
                        refreshData();
                      });
                    }} className="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* GIFTCODES TAB */}
        {tab === 'giftcodes' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4"><Ticket className="w-8 h-8 text-rose-500" /> QUẢN LÝ GIFTCODE</h3>
              <button onClick={() => setIsAddingGift(!isAddingGift)} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-rose-600/30">
                {isAddingGift ? <><X className="w-5 h-5" /> ĐÓNG</> : <><Plus className="w-5 h-5" /> TẠO CODE MỚI</>}
              </button>
            </div>

            {isAddingGift && (
              <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3rem] space-y-8 animate-in zoom-in-95 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input type="text" value={giftForm.code} onChange={e => setGiftForm({...giftForm, code: e.target.value.toUpperCase()})} placeholder="MÃ CODE (VD: NOVA2025)" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-black tracking-widest outline-none focus:border-rose-500" />
                  <input type="number" value={giftForm.amount} onChange={e => setGiftForm({...giftForm, amount: parseInt(e.target.value) || 0})} placeholder="Số điểm thưởng" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-rose-500" />
                </div>
                <input type="number" value={giftForm.limit} onChange={e => setGiftForm({...giftForm, limit: parseInt(e.target.value) || 0})} placeholder="Giới hạn số lượt nhập" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-rose-500" />
                <button onClick={handleSaveGift} className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-black py-6 rounded-3xl uppercase tracking-widest italic transition-all flex items-center justify-center gap-4"><Save className="w-6 h-6" /> PHÁT HÀNH GIFTCODE</button>
              </div>
            )}

            <div className="overflow-x-auto rounded-[2.5rem] border border-white/10 bg-slate-900/20">
              <table className="w-full">
                <thead className="bg-slate-900/80 text-left border-b border-white/10">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã Giftcode</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Thưởng (P)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Lượt dùng</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody>
                  {giftcodes.map(gc => (
                    <tr key={gc.code} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-8 py-6">
                        <span className="font-black text-white italic tracking-widest bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">{gc.code}</span>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-emerald-400 italic text-lg">{gc.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-center font-bold text-slate-400">{gc.usedBy.length} / {gc.maxUses}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end">
                           <button onClick={() => { 
                             showConfirm('XÓA GIFTCODE', `Xác nhận xóa mã quà tặng ${gc.code}?`, () => {
                               dbService.deleteGiftcode(gc.code); 
                               refreshData();
                             });
                           }} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                              <Trash2 className="w-5 h-5" />
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
    </div>
  );
};

export default Admin;
