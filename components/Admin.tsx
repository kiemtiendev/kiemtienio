
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
  Activity,
  Loader2,
  X,
  Gamepad2,
  Building2,
  Database,
  Terminal,
  Copy,
  CheckCircle2,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Admin: React.FC<Props> = ({ user }) => {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'announcements' | 'giftcodes' | 'logs' | 'setup'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dữ liệu từ DB
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // Trạng thái UI
  const [isSyncing, setIsSyncing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  // Form states cho tạo mới
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'low' as 'low' | 'high' });
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });

  const refreshData = async () => {
    setIsSyncing(true);
    try {
      const [u, w, g, a, adsData, l] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawals(),
        dbService.getGiftcodes(),
        dbService.getAnnouncements(),
        dbService.getAds(true),
        dbService.getActivityLogs()
      ]);
      setAllUsers(u);
      setWithdrawals(w);
      setGiftcodes(g);
      setAnnouncements(a);
      setAds(adsData);
      setLogs(l);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Admin:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBan = async (u: User) => {
    const updated = { ...u, isBanned: !u.isBanned };
    await dbService.updateUser(u.id, { isBanned: !u.isBanned });
    setAllUsers(prev => prev.map(item => item.id === u.id ? updated : item));
  };

  const handleWithdrawAction = async (id: string, status: 'completed' | 'rejected', userId: string, amount: number) => {
    await dbService.updateWithdrawalStatus(id, status, userId, amount);
    refreshData();
  };

  const handleAddAd = async () => {
    await dbService.saveAd({ ...newAd, isActive: true });
    setNewAd({ title: '', imageUrl: '', targetUrl: '' });
    setShowModal(null);
    refreshData();
  };

  const handleAddAnn = async () => {
    await dbService.saveAnnouncement({ ...newAnn, createdAt: new Date().toISOString() });
    setNewAnn({ title: '', content: '', priority: 'low' });
    setShowModal(null);
    refreshData();
  };

  const handleAddGc = async () => {
    await dbService.addGiftcode(newGc);
    setNewGc({ code: '', amount: 10000, maxUses: 100 });
    setShowModal(null);
    refreshData();
  };

  const copySql = () => {
    const sql = `DROP TABLE IF EXISTS public.users_data CASCADE;
CREATE TABLE public.users_data (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fullname TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  points NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_task_date TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  referred_by TEXT,
  bank_info TEXT DEFAULT '',
  id_game TEXT DEFAULT '',
  task_counts JSONB DEFAULT '{}'::jsonb,
  referral_count INTEGER DEFAULT 0,
  referral_bonus NUMERIC DEFAULT 0
);
ALTER TABLE public.users_data DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';`;
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const adminTabs = [
    { id: 'users', label: 'Hội viên', icon: <Users className="w-4 h-4" /> },
    { id: 'withdrawals', label: 'Rút thưởng', icon: <CreditCard className="w-4 h-4" />, badge: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'ads', label: 'Quảng cáo', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'announcements', label: 'Thông báo', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'giftcodes', label: 'Giftcode', icon: <Ticket className="w-4 h-4" /> },
    { id: 'logs', label: 'Nhật ký', icon: <History className="w-4 h-4" /> },
    { id: 'setup', label: 'Hệ thống', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">NOVA ADMIN PANEL</h1>
            <div className="flex items-center gap-2 mt-2">
               <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isSyncing ? 'Đang đồng bộ Nova Cloud...' : 'Hệ thống trực tuyến'}</span>
            </div>
          </div>
        </div>
        <button onClick={refreshData} className="px-8 py-4 bg-slate-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-slate-800 transition-all flex items-center gap-3 italic">
           <Activity className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> LÀM MỚI DỮ LIỆU
        </button>
      </div>

      {/* Điều hướng Tab */}
      <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
        {adminTabs.map(item => {
          const isActive = tab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)} 
              className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black transition-all text-[10px] uppercase tracking-widest whitespace-nowrap border-2 ${isActive ? 'bg-blue-600 border-blue-500/50 text-white shadow-2xl' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}
            >
              {item.icon} 
              <span>{item.label}</span>
              {item.badge ? <span className="ml-2 bg-red-600 px-2 py-0.5 rounded-full text-[8px] text-white">{item.badge}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Nội dung chính của Admin */}
      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl min-h-[600px] bg-slate-950/40 relative overflow-hidden">
        
        {/* TAB: HỘI VIÊN */}
        {tab === 'users' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="relative w-full md:w-96">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                   <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Tìm hội viên (Email, Tên, ID)..." 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-blue-500 shadow-inner" 
                   />
                </div>
                <div className="flex gap-4">
                   <div className="px-6 py-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Tổng hội viên</span>
                      <span className="text-2xl font-black text-white italic">{allUsers.length}</span>
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                     <th className="px-6 py-4">Hội viên</th>
                     <th className="px-6 py-4 text-center">Số dư</th>
                     <th className="px-6 py-4 text-center">Nhiệm vụ</th>
                     <th className="px-6 py-4 text-right">Hành động</th>
                   </tr>
                 </thead>
                 <tbody>
                   {allUsers.filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                     <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                       <td className="px-6 py-6">
                          <div className="font-black text-white italic text-base uppercase">{u.fullname}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u.email} • ID: {u.id}</div>
                       </td>
                       <td className="px-6 py-6 text-center">
                          <span className="font-black text-emerald-500 italic text-lg">{formatK(u.balance)} P</span>
                       </td>
                       <td className="px-6 py-6 text-center">
                          <span className="font-black text-blue-400 italic">{u.tasksToday || 0} / 20</span>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <button onClick={() => handleToggleBan(u)} className={`p-4 rounded-xl transition-all ${u.isBanned ? 'bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white'}`}>
                            {u.isBanned ? <Unlock className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* TAB: RÚT THƯỞNG */}
        {tab === 'withdrawals' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
             {withdrawals.length === 0 ? (
               <div className="py-20 text-center opacity-30">
                  <CreditCard className="w-20 h-20 mx-auto mb-6" />
                  <p className="font-black uppercase italic tracking-widest">Không có yêu cầu rút tiền nào.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-6">
                 {withdrawals.map(w => (
                   <div key={w.id} className={`glass-card p-8 rounded-[3rem] border-l-8 ${w.status === 'pending' ? 'border-amber-500' : w.status === 'completed' ? 'border-emerald-500' : 'border-red-500'} flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-white/[0.03] transition-all`}>
                      <div className="flex gap-6 items-center">
                        <div className={`p-5 rounded-2xl ${w.type === 'bank' ? 'bg-blue-600/10 text-blue-400' : 'bg-purple-600/10 text-purple-400'}`}>
                           {w.type === 'bank' ? <Building2 className="w-8 h-8" /> : <Gamepad2 className="w-8 h-8" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Người rút: {w.userName}</div>
                          <h4 className="font-black text-2xl text-white italic tracking-tight">{w.type === 'bank' ? `${w.amount.toLocaleString()}đ` : 'Rút Kim Cương Game'}</h4>
                          <div className="text-[11px] text-blue-400 font-bold bg-blue-400/10 px-3 py-1 rounded-full mt-2 inline-block">Thông tin: {w.details}</div>
                        </div>
                      </div>
                      
                      {w.status === 'pending' ? (
                        <div className="flex gap-4">
                           <button onClick={() => handleWithdrawAction(w.id, 'completed', w.userId, w.amount)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">DUYỆT CHI</button>
                           <button onClick={() => handleWithdrawAction(w.id, 'rejected', w.userId, w.amount)} className="px-8 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase italic tracking-widest hover:bg-red-600 hover:text-white transition-all">TỪ CHỐI</button>
                        </div>
                      ) : (
                        <span className={`px-6 py-3 rounded-full text-[10px] font-black uppercase italic ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {w.status === 'completed' ? 'ĐÃ HOÀN TẤT' : 'ĐÃ TỪ CHỐI'}
                        </span>
                      )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {/* TAB: QUẢNG CÁO */}
        {tab === 'ads' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">QUẢN LÝ QUẢNG CÁO</h3>
                 <button onClick={() => setShowModal('ad')} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-3">
                    <PlusCircle className="w-5 h-5" /> THÊM BANNER
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {ads.map(ad => (
                   <div key={ad.id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                      <img src={ad.imageUrl} alt={ad.title} className="w-full h-40 object-cover rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-700" />
                      <h4 className="font-black text-white italic uppercase text-lg">{ad.title}</h4>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">{ad.targetUrl}</div>
                      <div className="mt-6 flex justify-between items-center">
                         <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase italic ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                           {ad.isActive ? 'ĐANG HIỂN THỊ' : 'ĐANG ẨN'}
                         </span>
                         <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* TAB: THÔNG BÁO HỆ THỐNG */}
        {tab === 'announcements' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">THÔNG BÁO TOÀN DÂN</h3>
                 <button onClick={() => setShowModal('ann')} className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-3">
                    <Megaphone className="w-5 h-5" /> TẠO THÔNG BÁO
                 </button>
              </div>
              <div className="space-y-6">
                 {announcements.map(ann => (
                   <div key={ann.id} className="glass-card p-8 rounded-[3rem] border border-white/5 hover:bg-white/[0.03] transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-white italic uppercase text-xl">{ann.title}</h4>
                         <span className="text-[10px] text-slate-600 font-bold">{new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium italic">{ann.content}</p>
                      <div className="mt-6 flex justify-end">
                         <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* TAB: GIFTCODE */}
        {tab === 'giftcodes' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">HỆ THỐNG GIFTCODE</h3>
                 <button onClick={() => setShowModal('gc')} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-3">
                    <PlusCircle className="w-5 h-5" /> TẠO GIFTCODE
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                       <th className="px-6 py-4">Mã Code</th>
                       <th className="px-6 py-4 text-center">Giá trị</th>
                       <th className="px-6 py-4 text-center">Lượt nhập</th>
                       <th className="px-6 py-4 text-right">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody>
                     {giftcodes.map(gc => (
                       <tr key={gc.code} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                         <td className="px-6 py-6 font-black text-white tracking-widest">{gc.code}</td>
                         <td className="px-6 py-6 text-center font-black text-rose-500">{formatK(gc.amount)} P</td>
                         <td className="px-6 py-6 text-center font-black text-slate-400">{(gc.usedBy?.length || 0)} / {gc.maxUses}</td>
                         <td className="px-6 py-6 text-right">
                            <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* TAB: NHẬT KÝ */}
        {tab === 'logs' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">NHẬT KÝ HOẠT ĐỘNG</h3>
              <div className="space-y-3">
                 {logs.map((log, i) => (
                   <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] hover:bg-white/[0.05] transition-all">
                      <span className="text-slate-600 font-bold shrink-0">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                      <span className="font-black text-blue-400 italic uppercase shrink-0">{log.userName}</span>
                      <span className="text-slate-300 font-medium italic flex-1">{log.action}: {log.details}</span>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* TAB: HỆ THỐNG / SETUP */}
        {tab === 'setup' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="glass-card p-10 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 space-y-6">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="w-6 h-6 text-amber-500" />
                   <h4 className="text-lg font-black text-white uppercase italic">Cấu hình Database Nova Cloud</h4>
                </div>
                <p className="text-slate-400 text-sm font-medium italic">Nếu bạn gặp lỗi ghi dữ liệu hoặc thiếu cột, hãy copy đoạn mã SQL bên dưới và chạy trong <b>Supabase SQL Editor</b>.</p>
                
                <div className="relative group">
                   <pre className="w-full bg-black/80 border border-slate-800 rounded-2xl p-8 text-blue-400 font-mono text-[9px] overflow-x-auto max-h-72 italic scrollbar-thin">
{`DROP TABLE IF EXISTS public.users_data CASCADE;
CREATE TABLE public.users_data (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fullname TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  points NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_task_date TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  referred_by TEXT,
  bank_info TEXT DEFAULT '',
  id_game TEXT DEFAULT '',
  task_counts JSONB DEFAULT '{}'::jsonb,
  referral_count INTEGER DEFAULT 0,
  referral_bonus NUMERIC DEFAULT 0
);
ALTER TABLE public.users_data DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';`}
                   </pre>
                   <button onClick={copySql} className="absolute top-4 right-4 p-4 bg-slate-900/80 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all shadow-2xl">
                    {sqlCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* MODAL CỦA CÁC TAB (THÊM MỚI) */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowModal(null)}></div>
           <div className="glass-card w-full max-w-lg p-10 md:p-14 rounded-[4rem] border border-white/10 relative animate-in zoom-in-95 shadow-3xl">
              <button onClick={() => setShowModal(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X /></button>
              
              {showModal === 'ad' && (
                <div className="space-y-8">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">THÊM QUẢNG CÁO</h3>
                   <div className="space-y-5">
                      <input type="text" placeholder="Tiêu đề Banner" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <input type="text" placeholder="Link ảnh (URL)" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <input type="text" placeholder="Link đích (URL)" value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <button onClick={handleAddAd} className="w-full bg-blue-600 py-6 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl">XÁC NHẬN LƯU</button>
                   </div>
                </div>
              )}

              {showModal === 'ann' && (
                <div className="space-y-8">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">TẠO THÔNG BÁO</h3>
                   <div className="space-y-5">
                      <input type="text" placeholder="Tiêu đề thông báo" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <textarea placeholder="Nội dung thông báo chi tiết..." value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} rows={5} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none resize-none" />
                      <button onClick={handleAddAnn} className="w-full bg-amber-600 py-6 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl">GỬI THÔNG BÁO</button>
                   </div>
                </div>
              )}

              {showModal === 'gc' && (
                <div className="space-y-8">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">TẠO GIFTCODE</h3>
                   <div className="space-y-5">
                      <input type="text" placeholder="Mã Code (VD: NOVAFREE)" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none uppercase tracking-widest" />
                      <input type="number" placeholder="Số điểm tặng" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <input type="number" placeholder="Số lượt nhập tối đa" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                      <button onClick={handleAddGc} className="w-full bg-rose-600 py-6 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl">PHÁT HÀNH GIFTCODE</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      <style>{`
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Admin;
