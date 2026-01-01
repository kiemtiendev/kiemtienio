
import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Users, CreditCard, Search, Ban, Unlock, Plus, Trash2, Megaphone, ShieldCheck, 
  ShoppingBag, Ticket, History, Activity, Database, Copy, CheckCircle2, X, 
  PlusCircle, Gamepad2, Building2, AlertTriangle, Loader2, Eye, EyeOff,
  LayoutTemplate, Image as ImageIcon, MessageSquarePlus, Tag
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Admin: React.FC<Props> = ({ user }) => {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'announcements' | 'giftcodes' | 'logs' | 'setup'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawSearchTerm, setWithdrawSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'low' as 'low' | 'high' });
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });

  const refreshData = async () => {
    setIsSyncing(true);
    try {
      const [u, w, g, a, adsData, l] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getWithdrawals(),
        dbService.getGiftcodes(true), 
        dbService.getAnnouncements(true), 
        dbService.getAds(true),
        dbService.getActivityLogs()
      ]);
      setAllUsers(u);
      setWithdrawals(w);
      setGiftcodes(g);
      setAnnouncements(a);
      setAds(adsData);
      setLogs(l);
    } catch (err: any) {
      console.error("Sync error:", err?.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [tab]);

  const handleToggleBan = async (u: User) => {
    await dbService.updateUser(u.id, { isBanned: !u.isBanned });
    refreshData();
  };

  const handleWithdrawAction = async (id: string, status: 'completed' | 'rejected') => {
    await dbService.updateWithdrawalStatus(id, status);
    refreshData();
  };

  const handleAddAd = async () => {
    if (!newAd.title || !newAd.imageUrl) return alert("Vui lòng nhập đủ thông tin!");
    try {
      const { error } = await dbService.saveAd(newAd);
      if (error) throw error;
      setNewAd({ title: '', imageUrl: '', targetUrl: '' });
      setShowModal(null);
      refreshData();
    } catch (err: any) {
      alert("Lỗi khi tạo quảng cáo: " + (err?.message || "Lỗi hệ thống. Đảm bảo bạn đã chạy SQL Setup."));
    }
  };

  const handleToggleAd = async (id: string, current: boolean) => {
    await dbService.updateAdStatus(id, !current);
    refreshData();
  };

  const handleDeleteAd = async (id: string) => {
    if (window.confirm("Xóa quảng cáo này?")) {
      await dbService.deleteAd(id);
      refreshData();
    }
  };

  const handleAddAnn = async () => {
    if (!newAnn.title || !newAnn.content) return alert("Vui lòng nhập đủ thông tin!");
    try {
      const { error } = await dbService.saveAnnouncement(newAnn);
      if (error) throw error;
      setNewAnn({ title: '', content: '', priority: 'low' });
      setShowModal(null);
      refreshData();
    } catch (err: any) {
      alert("Lỗi khi tạo thông báo: " + (err?.message || "Lỗi hệ thống. Đảm bảo bạn đã chạy SQL Setup."));
    }
  };

  const handleToggleAnn = async (id: string, current: boolean) => {
    await dbService.updateAnnouncementStatus(id, !current);
    refreshData();
  };

  const handleDeleteAnn = async (id: string) => {
    if (window.confirm("Xóa thông báo này?")) {
      await dbService.deleteAnnouncement(id);
      refreshData();
    }
  };

  const handleAddGc = async () => {
    if (!newGc.code || !newGc.amount) return alert("Vui lòng nhập đủ thông tin!");
    try {
      const { error } = await dbService.addGiftcode(newGc);
      if (error) throw error;
      setNewGc({ code: '', amount: 10000, maxUses: 100 });
      setShowModal(null);
      refreshData();
    } catch (err: any) {
      alert("Lỗi khi tạo Giftcode: " + (err?.message || "Lỗi hệ thống. Đảm bảo bạn đã chạy SQL Setup."));
    }
  };

  const handleToggleGc = async (code: string, current: boolean) => {
    await dbService.updateGiftcodeStatus(code, !current);
    refreshData();
  };

  const handleDeleteGc = async (code: string) => {
    if (window.confirm(`Xóa Giftcode ${code}?`)) {
      await dbService.deleteGiftcode(code);
      refreshData();
    }
  };

  const copySql = () => {
    const sql = `-- MÃ KHỞI TẠO VÀ SỬA LỖI DATABASE DIAMOND NOVA (FULL REPAIR)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Bảng Dữ liệu người dùng
CREATE TABLE IF NOT EXISTS public.users_data (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    fullname TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    total_earned NUMERIC DEFAULT 0,
    tasks_today INTEGER DEFAULT 0,
    tasks_week INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    join_date TIMESTAMPTZ DEFAULT NOW(),
    last_task_date TIMESTAMPTZ,
    bank_info TEXT DEFAULT '',
    id_game TEXT DEFAULT '',
    task_counts JSONB DEFAULT '{}'::jsonb,
    referral_count INTEGER DEFAULT 0,
    reset_code TEXT
);

-- 2. Bảng Yêu cầu rút tiền
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users_data(id),
    user_name TEXT,
    amount NUMERIC,
    type TEXT,
    status TEXT DEFAULT 'pending',
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Quảng cáo Banner
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    image_url TEXT,
    target_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Thông báo hệ thống
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    priority TEXT DEFAULT 'low',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Giftcodes
CREATE TABLE IF NOT EXISTS public.giftcodes (
    code TEXT PRIMARY KEY,
    amount NUMERIC,
    max_uses INTEGER,
    used_by JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Nhật ký hoạt động
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_name TEXT,
    action TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPAIR: TỰ ĐỘNG THÊM CỘT BỊ THIẾU VÀO CÁC BẢNG HIỆN CÓ
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS reset_code TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS tasks_today INTEGER DEFAULT 0;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS tasks_week INTEGER DEFAULT 0;

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.giftcodes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.giftcodes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tắt RLS để Prototype hoạt động mượt mà
ALTER TABLE public.users_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giftcodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;`;
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.userName.toLowerCase().includes(withdrawSearchTerm.toLowerCase()) ||
    w.details.toLowerCase().includes(withdrawSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">NOVA ADMIN</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic mt-1">Hệ thống quản trị Vision 1.1</p>
          </div>
        </div>
        <button onClick={refreshData} className="px-6 py-3 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase text-white hover:bg-slate-800 flex items-center gap-2 transition-all">
           <Activity className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} /> ĐỒNG BỘ
        </button>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {[
          { id: 'users', label: 'Hội viên', icon: <Users className="w-4 h-4" /> },
          { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard className="w-4 h-4" />, badge: withdrawals.filter(w=>w.status==='pending').length },
          { id: 'ads', label: 'Quảng cáo', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'announcements', label: 'Thông báo', icon: <Megaphone className="w-4 h-4" /> },
          { id: 'giftcodes', label: 'Giftcode', icon: <Ticket className="w-4 h-4" /> },
          { id: 'logs', label: 'Nhật ký', icon: <History className="w-4 h-4" /> },
          { id: 'setup', label: 'Hệ thống', icon: <Database className="w-4 h-4" /> },
        ].map(i => (
          <button key={i.id} onClick={() => setTab(i.id as any)} className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${tab === i.id ? 'bg-blue-600 border-blue-500 shadow-2xl text-white' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}>
            {i.icon} <span>{i.label}</span>
            {i.badge ? <span className="ml-2 bg-red-600 px-2 py-0.5 rounded-full text-[8px] text-white">{i.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl bg-slate-950/40 relative min-h-[600px]">
        {tab === 'users' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="relative w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm hội viên (Email, Tên, ID)..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-blue-500 shadow-inner" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                      <th className="px-6 py-4">Hội viên</th>
                      <th className="px-6 py-4 text-center">Số dư</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-6">
                           <div className="font-black text-white italic text-base uppercase">{u.fullname}</div>
                           <div className="text-[10px] text-slate-500 font-bold uppercase">{u.email}</div>
                        </td>
                        <td className="px-6 py-6 text-center font-black text-emerald-500 italic text-lg">{formatK(u.balance)} P</td>
                        <td className="px-6 py-6 text-right">
                           <button onClick={() => handleToggleBan(u)} className={`p-4 rounded-xl transition-all ${u.isBanned ? 'bg-emerald-600/10 text-emerald-500' : 'bg-red-600/10 text-red-500'}`}>
                             {u.isBanned ? <Unlock size={20} /> : <Ban size={20} />}
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {tab === 'withdrawals' && (
           <div className="space-y-6 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-md">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                   <input 
                      type="text" 
                      value={withdrawSearchTerm} 
                      onChange={e => setWithdrawSearchTerm(e.target.value)} 
                      placeholder="Tìm theo Gmail hoặc Tên người rút..." 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 shadow-inner text-xs" 
                   />
                </div>
             </div>
             {filteredWithdrawals.length === 0 ? <p className="text-center py-20 text-slate-600 font-black italic">Không tìm thấy yêu cầu rút tiền nào khớp.</p> : 
               filteredWithdrawals.map(w => (
                 <div key={w.id} className="glass-card p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex gap-6 items-center">
                       <div className={`p-5 rounded-2xl ${w.type==='bank'?'bg-emerald-600/10 text-emerald-400':'bg-purple-600/10 text-purple-400'}`}>
                          {w.type==='bank'?<Building2 size={32}/>:<Gamepad2 size={32}/>}
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-blue-400 uppercase italic mb-1">Gmail/User: {w.userName}</div>
                          <h4 className="font-black text-2xl text-white italic tracking-tighter">{w.amount.toLocaleString()}đ ({w.type.toUpperCase()})</h4>
                          <div className="text-[11px] text-slate-400 font-bold italic mt-1 bg-white/5 px-3 py-1 rounded-full inline-block">Thông tin: {w.details}</div>
                       </div>
                    </div>
                    {w.status === 'pending' ? (
                      <div className="flex gap-4">
                         <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl shadow-emerald-600/20">DUYỆT CHI</button>
                         <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="px-8 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase italic tracking-widest">HỦY BỎ</button>
                      </div>
                    ) : (
                      <span className={`px-6 py-3 rounded-full text-[10px] font-black uppercase italic ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {w.status === 'completed' ? 'ĐÃ HOÀN TẤT' : 'ĐÃ TỪ CHỐI'}
                      </span>
                    )}
                 </div>
               ))
             }
           </div>
        )}

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
                   <div key={ad.id} className={`glass-card p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group transition-all ${!ad.isActive ? 'grayscale opacity-40' : ''}`}>
                      <img src={ad.imageUrl} alt={ad.title} className="w-full h-40 object-cover rounded-2xl mb-4 transition-all duration-700 group-hover:scale-105" />
                      <h4 className="font-black text-white italic uppercase text-lg">{ad.title}</h4>
                      <div className="mt-4 flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-500 italic truncate flex-1 pr-4">{ad.targetUrl}</span>
                         <div className="flex gap-2">
                           <button onClick={() => handleToggleAd(ad.id, ad.isActive)} className={`p-3 rounded-xl transition-all ${ad.isActive ? 'bg-blue-600/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                              {ad.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                           </button>
                           <button onClick={() => handleDeleteAd(ad.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {tab === 'announcements' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">THÔNG BÁO HỆ THỐNG</h3>
                 <button onClick={() => setShowModal('ann')} className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-3">
                    <Megaphone className="w-5 h-5" /> TẠO THÔNG BÁO
                 </button>
              </div>
              <div className="space-y-6">
                 {announcements.map(ann => (
                   <div key={ann.id} className={`glass-card p-8 rounded-[3rem] border border-white/5 relative group transition-all ${!ann.isActive ? 'grayscale opacity-50' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-white italic uppercase text-xl">{ann.title}</h4>
                         <div className="flex items-center gap-4">
                           <span className="text-[10px] text-slate-600 font-bold">{new Date(ann.createdAt).toLocaleDateString('vi-VN')}</span>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => handleToggleAnn(ann.id, ann.isActive || false)} className={`p-2 rounded-lg transition-all ${ann.isActive ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-500 hover:bg-slate-500/10'}`}>
                               {ann.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                             </button>
                             <button onClick={() => handleDeleteAnn(ann.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                           </div>
                         </div>
                      </div>
                      <p className="text-slate-400 text-sm font-medium italic">{ann.content}</p>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {tab === 'giftcodes' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">HỆ THỐNG GIFTCODE</h3>
                 <button onClick={() => setShowModal('gc')} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-3">
                    <Ticket className="w-5 h-5" /> TẠO GIFTCODE
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                       <th className="px-6 py-4">Mã Code</th>
                       <th className="px-6 py-4 text-center">Giá trị</th>
                       <th className="px-6 py-4 text-center">Sử dụng</th>
                       <th className="px-6 py-4 text-right">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody>
                     {giftcodes.map(gc => (
                       <tr key={gc.code} className={`border-b border-white/5 hover:bg-white/[0.02] transition-all ${!gc.isActive ? 'grayscale opacity-40' : ''}`}>
                         <td className="px-6 py-6 font-black text-white tracking-widest uppercase italic">{gc.code}</td>
                         <td className="px-6 py-6 text-center font-black text-rose-500 italic text-lg">{formatK(gc.amount)} P</td>
                         <td className="px-6 py-6 text-center font-black text-slate-400 italic">{(gc.usedBy?.length || 0)} / {gc.maxUses}</td>
                         <td className="px-6 py-6 text-right">
                           <div className="flex gap-2 justify-end">
                             <button onClick={() => handleToggleGc(gc.code, gc.isActive || false)} className={`p-3 rounded-xl transition-all ${gc.isActive ? 'bg-blue-600/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                               {gc.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                             </button>
                             <button onClick={() => handleDeleteGc(gc.code)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        )}

        {tab === 'logs' && (
           <div className="space-y-4 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">NHẬT KÝ HOẠT ĐỘNG</h3>
              {logs.map((log, i) => (
                <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] hover:bg-white/[0.05] transition-all">
                   <span className="text-slate-600 font-bold shrink-0">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                   <span className="font-black text-blue-400 italic uppercase shrink-0">{log.userName}</span>
                   <span className="text-slate-300 font-medium italic flex-1">{log.action}: {log.details}</span>
                </div>
              ))}
           </div>
        )}

        {tab === 'setup' && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="p-10 rounded-[3rem] border border-blue-500/20 bg-blue-500/5 space-y-6">
                 <div className="flex items-center gap-4 text-amber-500">
                    <AlertTriangle className="w-8 h-8" />
                    <h4 className="text-xl font-black text-white italic uppercase">CÀI ĐẶT DATABASE SUPABASE (SỬA LỖI COLUMN)</h4>
                 </div>
                 <p className="text-slate-400 text-sm font-medium italic leading-relaxed">Sử dụng đoạn mã này để sửa lỗi thiếu cột 'created_at', 'tasks_today' và đồng bộ mọi bảng cần thiết.</p>
                 <div className="relative group">
                    <pre className="w-full bg-black/80 border border-slate-800 rounded-2xl p-8 text-blue-400 font-mono text-[10px] overflow-x-auto max-h-72 italic">
                       {`CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Khởi tạo hoặc sửa bảng users_data
CREATE TABLE IF NOT EXISTS public.users_data (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    fullname TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    total_earned NUMERIC DEFAULT 0,
    tasks_today INTEGER DEFAULT 0,
    tasks_week INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    join_date TIMESTAMPTZ DEFAULT NOW(),
    last_task_date TIMESTAMPTZ,
    bank_info TEXT DEFAULT '',
    id_game TEXT DEFAULT '',
    task_counts JSONB DEFAULT '{}'::jsonb,
    referral_count INTEGER DEFAULT 0,
    reset_code TEXT
);

-- Bảng withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users_data(id),
    user_name TEXT,
    amount NUMERIC,
    type TEXT,
    status TEXT DEFAULT 'pending',
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng ads (Khắc phục lỗi thiếu created_at)
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    image_url TEXT,
    target_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    priority TEXT DEFAULT 'low',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng giftcodes
CREATE TABLE IF NOT EXISTS public.giftcodes (
    code TEXT PRIMARY KEY,
    amount NUMERIC,
    max_uses INTEGER,
    used_by JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CẬP NHẬT CỘT CHO CÁC BẢNG ĐÃ TỒN TẠI
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS tasks_today INTEGER DEFAULT 0;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS tasks_week INTEGER DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.giftcodes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tắt RLS
ALTER TABLE public.users_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giftcodes DISABLE ROW LEVEL SECURITY;`}
                    </pre>
                    <button onClick={copySql} className="absolute top-4 right-4 p-4 bg-slate-900/80 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all shadow-2xl flex items-center gap-2 font-black uppercase text-[10px]">
                       {sqlCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                       {sqlCopied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP SQL'}
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowModal(null)}></div>
           <div className="glass-card w-full max-w-lg p-8 md:p-12 rounded-[3.5rem] border border-white/10 relative animate-in zoom-in-95 shadow-3xl bg-slate-950/80">
              <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X /></button>
              
              {showModal === 'ad' && (
                <div className="space-y-6">
                   <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-500 border border-blue-500/20"><ImageIcon className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter text-center">TẠO QUẢNG CÁO</h3>
                   </div>
                   <div className="space-y-4">
                      <input type="text" placeholder="Tiêu đề Banner" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      <input type="text" placeholder="URL Hình ảnh" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      <input type="text" placeholder="Link đích" value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      <button onClick={handleAddAd} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl transition-all mt-4">KÍCH HOẠT QUẢNG CÁO</button>
                   </div>
                </div>
              )}

              {showModal === 'ann' && (
                <div className="space-y-6">
                   <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-amber-600/20 rounded-2xl text-amber-500 border border-amber-500/20"><MessageSquarePlus className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter text-center">THÔNG BÁO MỚI</h3>
                   </div>
                   <div className="space-y-4">
                      <input type="text" placeholder="Tiêu đề bản tin" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-amber-500 transition-all" />
                      <textarea placeholder="Nội dung thông báo..." value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} rows={4} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-amber-500 transition-all resize-none" />
                      <button onClick={handleAddAnn} className="w-full bg-amber-600 py-5 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl transition-all mt-4">PHÁT HÀNH TIN</button>
                   </div>
                </div>
              )}

              {showModal === 'gc' && (
                <div className="space-y-6">
                   <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-rose-600/20 rounded-2xl text-rose-500 border border-rose-500/20"><Tag className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter text-center">TẠO GIFTCODE</h3>
                   </div>
                   <div className="space-y-4">
                      <input type="text" placeholder="Mã Code (In hoa)" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black italic tracking-widest outline-none focus:border-rose-500 transition-all" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Điểm tặng" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-rose-500 transition-all" />
                        <input type="number" placeholder="Lượt nhập" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-rose-500 transition-all" />
                      </div>
                      <button onClick={handleAddGc} className="w-full bg-rose-600 py-5 rounded-2xl font-black text-white uppercase italic tracking-widest shadow-xl transition-all mt-4">LƯU MÃ QUÀ TẶNG</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
