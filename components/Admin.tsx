
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
  Building2,
  Database,
  Terminal,
  Copy,
  CheckCircle2
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Admin: React.FC<Props> = ({ user }) => {
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'ads' | 'announcements' | 'giftcodes' | 'notifications' | 'logs' | 'setup'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giftcodes, setGiftcodes] = useState<Giftcode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

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
    const interval = setInterval(refreshData, 15000);
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

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({ show: true, type: 'confirm', title, message, onConfirm });
  };

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val?: string) => void) => {
    setModalConfig({ show: true, type: 'prompt', title, message, onConfirm, inputValue: defaultValue });
  };

  const copySql = () => {
    const sql = `DROP TABLE IF EXISTS public.users_data CASCADE;
CREATE TABLE public.users_data (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fullname TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_task_date TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  referred_by TEXT,
  bank_info TEXT,
  id_game TEXT,
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
    { id: 'users', label: 'Hội viên', icon: <Users /> },
    { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard />, badge: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'setup', label: 'Cài đặt DB', icon: <Database /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell />, badge: notifications.filter(n => !n.isRead).length },
    { id: 'logs', label: 'Nhật ký', icon: <History /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* Modal Render logic omitted for brevity, same as previous */}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">ADMIN DASHBOARD</h1>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        {adminTabs.map(item => {
          const isActive = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id as any)} className={`flex items-center gap-3 px-10 py-6 rounded-[2.5rem] font-black transition-all text-[11px] uppercase tracking-widest whitespace-nowrap border-2 ${isActive ? 'bg-blue-600 border-blue-500/50 text-white shadow-2xl' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
              {item.icon} <span>{item.label}</span>
              {item.badge ? <span className="ml-2 bg-red-600 px-2 py-1 rounded-full text-[8px]">{item.badge}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl min-h-[500px] bg-slate-950/40">
        {tab === 'setup' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="flex items-center gap-4">
                <div className="p-5 bg-blue-600/20 rounded-3xl text-blue-400"><Terminal className="w-8 h-8" /></div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">CÀI ĐẶT DATABASE TỔNG LỰC</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Sửa triệt để mọi lỗi thiếu cột</p>
                </div>
             </div>

             <div className="glass-card p-10 rounded-[3rem] border border-red-500/20 bg-red-500/5 space-y-6">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="w-6 h-6 text-red-500" />
                   <h4 className="text-lg font-black text-white uppercase italic">XỬ LÝ LỖI "COLUMN DOES NOT EXIST"</h4>
                </div>
                <p className="text-slate-400 text-sm font-medium italic">Hãy Copy đoạn SQL bên dưới, dán vào <b>SQL Editor</b> trong Supabase Dashboard và nhấn <b>Run</b>. Lưu ý: Lệnh này sẽ xóa bảng cũ và tạo lại bảng mới hoàn toàn sạch sẽ.</p>
                
                <div className="relative group">
                   <pre className="w-full bg-black/80 border border-slate-800 rounded-2xl p-8 text-blue-400 font-mono text-[10px] overflow-x-auto max-h-60">
{`DROP TABLE IF EXISTS public.users_data CASCADE;
CREATE TABLE public.users_data (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fullname TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  last_task_date TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  referred_by TEXT,
  bank_info TEXT,
  id_game TEXT,
  task_counts JSONB DEFAULT '{}'::jsonb,
  referral_count INTEGER DEFAULT 0,
  referral_bonus NUMERIC DEFAULT 0
);
ALTER TABLE public.users_data DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';`}
                   </pre>
                   <button onClick={copySql} className="absolute top-4 right-4 p-4 bg-slate-900/80 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90">
                    {sqlCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                   </button>
                </div>
             </div>
          </div>
        )}

        {tab === 'users' && (
           <div className="space-y-10 animate-in slide-in-from-right-4">
             <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 w-7 h-7" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm hội viên..." className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-20 pr-10 py-6 text-white font-bold outline-none focus:border-blue-500" />
             </div>
             <table className="w-full text-left">
               <thead>
                 <tr className="text-slate-500 text-[10px] uppercase font-black">
                   <th className="px-10 py-4">Hội viên</th>
                   <th className="px-10 py-4">Số dư</th>
                   <th className="px-10 py-4 text-right">Thao tác</th>
                 </tr>
               </thead>
               <tbody>
                 {allUsers.filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                   <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                     <td className="px-10 py-6">
                        <div className="font-black text-white">{u.fullname}</div>
                        <div className="text-[10px] text-slate-600">{u.email}</div>
                     </td>
                     <td className="px-10 py-6 font-black text-emerald-400">{formatK(u.balance)} P</td>
                     <td className="px-10 py-6 text-right">
                        <button onClick={() => refreshData()} className="p-3 text-blue-500"><Activity className="w-5 h-5" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
