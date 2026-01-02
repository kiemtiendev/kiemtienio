
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Users, CreditCard, Search, Ban, Unlock, Plus, Trash2, Megaphone, ShieldCheck, 
  ShoppingBag, Ticket, History, Activity, Database, Copy, CheckCircle2, X, 
  PlusCircle, Gamepad2, Building2, AlertTriangle, Loader2, Eye, EyeOff,
  Hash, ShieldAlert, TrendingUp, SearchIcon, Terminal, Image as ImageIcon,
  PlusSquare, BellRing, Shield, MinusCircle, Wallet
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

export default function Admin({ user, onUpdateUser }: Props) {
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
  const [showAddModal, setShowAddModal] = useState<string | null>(null);

  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', targetUrl: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'low' as 'low' | 'high' });
  const [newGc, setNewGc] = useState({ code: '', amount: 10000, maxUses: 100 });
  
  const [editBalanceUser, setEditBalanceUser] = useState<User | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number>(0);

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
      setAllUsers(u || []);
      setWithdrawals(w || []);
      setGiftcodes(g || []);
      setAnnouncements(a || []);
      setAds(adsData || []);
      setLogs(l || []);
    } catch (err) {
      console.error("Lỗi đồng bộ Admin:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [tab]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => 
      w.userName?.toLowerCase().includes(withdrawSearchTerm.toLowerCase()) ||
      w.details?.toLowerCase().includes(withdrawSearchTerm.toLowerCase()) ||
      w.id?.toString().includes(withdrawSearchTerm.toLowerCase())
    );
  }, [withdrawals, withdrawSearchTerm]);

  const stats = useMemo(() => {
    return {
      totalUsers: allUsers.length,
      totalBalance: allUsers.reduce((sum, u) => sum + (Number(u.balance) || 0), 0),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length
    };
  }, [allUsers, withdrawals]);

  const handleToggleBan = async (u: User) => {
    const reason = u.isBanned ? '' : 'Vi phạm quy định hệ thống';
    if (!window.confirm(u.isBanned ? `Mở khóa tài khoản ${u.fullname}?` : `Khóa tài khoản ${u.fullname}?`)) return;
    await dbService.updateUser(u.id, { isBanned: !u.isBanned, banReason: reason });
    refreshData();
  };

  const handleAdjustBalance = async (isDeduct: boolean) => {
    if (!editBalanceUser || balanceAdjustAmount <= 0) return;
    const amount = isDeduct ? -balanceAdjustAmount : balanceAdjustAmount;
    const newBalance = (Number(editBalanceUser.balance) || 0) + amount;
    if (newBalance < 0) return alert("Số dư không thể âm!");
    if (!window.confirm(`${isDeduct ? 'Trừ' : 'Cộng'} ${balanceAdjustAmount.toLocaleString()} P cho ${editBalanceUser.fullname}?`)) return;
    await dbService.updateUser(editBalanceUser.id, { balance: newBalance });
    await dbService.logActivity(user.id, user.fullname, 'ADJUST_BALANCE', `${isDeduct ? 'Trừ' : 'Cộng'} ${balanceAdjustAmount} P của ${editBalanceUser.fullname} (#${editBalanceUser.id})`);
    setEditBalanceUser(null);
    setBalanceAdjustAmount(0);
    refreshData();
  };

  const handleWithdrawAction = async (id: string, status: 'completed' | 'rejected') => {
    if (!window.confirm(status === 'completed' ? 'Xác nhận chuyển tiền thành công?' : 'Từ chối yêu cầu?')) return;
    await dbService.updateWithdrawalStatus(id, status);
    refreshData();
  };

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.imageUrl) return alert("Vui lòng điền đủ thông tin");
    await dbService.saveAd(newAd);
    setNewAd({ title: '', imageUrl: '', targetUrl: '' });
    setShowAddModal(null);
    refreshData();
  };

  const handleCreateAnn = async () => {
    if (!newAnn.title || !newAnn.content) return alert("Vui lòng điền đủ thông tin");
    await dbService.saveAnnouncement(newAnn);
    setNewAnn({ title: '', content: '', priority: 'low' });
    setShowAddModal(null);
    refreshData();
  };

  const handleCreateGc = async () => {
    if (!newGc.code || !newGc.amount) return alert("Vui lòng điền đủ thông tin");
    await dbService.addGiftcode(newGc);
    setNewGc({ code: '', amount: 10000, maxUses: 100 });
    setShowAddModal(null);
    refreshData();
  };

  const fullMaintenanceSql = `-- LỆNH CẬP NHẬT CẤU TRÚC DATABASE DIAMOND NOVA
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS security_score NUMERIC DEFAULT 100;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS total_giftcode_earned NUMERIC DEFAULT 0;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS reset_code TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS referral_bonus NUMERIC DEFAULT 0;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS bank_info TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS id_game TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS task_counts JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.users_data ADD COLUMN IF NOT EXISTS last_task_date TIMESTAMP WITH TIME ZONE;`;

  const copySql = () => {
    navigator.clipboard.writeText(fullMaintenanceSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">NOVA COMMAND</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic mt-2">Hệ thống quản trị trung tâm v1.7</p>
          </div>
        </div>
        <button 
          onClick={refreshData} 
          disabled={isSyncing}
          className="px-8 py-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-all disabled:opacity-50"
        >
           <Activity className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
           {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'LÀM MỚI DỮ LIỆU'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem] border border-blue-500/10 flex items-center justify-between">
           <div><span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Hội viên</span><h2 className="text-3xl font-black text-white italic">{stats.totalUsers}</h2></div>
           <Users size={28} className="text-blue-500/30" />
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border border-emerald-500/10 flex items-center justify-between">
           <div><span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Điểm lưu thông</span><h2 className="text-3xl font-black text-emerald-500 italic">{formatK(stats.totalBalance)} P</h2></div>
           <TrendingUp size={28} className="text-emerald-500/30" />
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border border-amber-500/10 flex items-center justify-between">
           <div><span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Yêu cầu rút</span><h2 className="text-3xl font-black text-amber-500 italic">{stats.pendingWithdrawals}</h2></div>
           <CreditCard size={28} className="text-amber-500/30" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
        {[
          { id: 'users', label: 'HỘI VIÊN', icon: <Users size={18} /> },
          { id: 'withdrawals', label: 'RÚT TIỀN', icon: <CreditCard size={18} /> },
          { id: 'ads', label: 'QUẢNG CÁO', icon: <ImageIcon size={18} /> },
          { id: 'announcements', label: 'THÔNG BÁO', icon: <Megaphone size={18} /> },
          { id: 'giftcodes', label: 'GIFTCODE', icon: <Ticket size={18} /> },
          { id: 'logs', label: 'NHẬT KÝ', icon: <History size={18} /> },
          { id: 'setup', label: 'DATABASE', icon: <Database size={18} /> },
        ].map(i => (
          <button 
            key={i.id} 
            onClick={() => setTab(i.id as any)} 
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${tab === i.id ? 'bg-blue-600/90 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            {i.icon} <span>{i.label}</span>
          </button>
        ))}
      </div>

      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 bg-slate-950/40 relative min-h-[500px]">
        {tab === 'users' && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="relative w-full max-w-md">
                 <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm hội viên..." className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                    <tr><th className="px-6 py-4">Hội viên</th><th className="px-6 py-4">Số dư</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-6">
                          <div className="font-black text-white italic">{u.fullname}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            {u.email}
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black border ${getSecurityColor(u.securityScore ?? 100)}`}>TRUST: {u.securityScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-black text-emerald-500 italic">{Number(u.balance).toLocaleString()} P</td>
                        <td className="px-6 py-6"><span className={`px-3 py-1 text-[8px] font-black rounded-full border ${u.isBanned ? 'bg-red-600/10 text-red-500 border-red-500/20' : 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20'}`}>{u.isBanned ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}</span></td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditBalanceUser(u)} className="p-3 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Chỉnh sửa số dư">
                              <Wallet size={18} />
                            </button>
                            <button onClick={() => handleToggleBan(u)} className={`p-3 rounded-xl transition-all ${u.isBanned ? 'bg-emerald-600/10 text-emerald-400' : 'bg-red-600/10 text-red-500'}`} title={u.isBanned ? 'Mở khóa' : 'Khóa'}>
                              {u.isBanned ? <Unlock size={18} /> : <Ban size={18} />}
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

        {tab === 'withdrawals' && (
           <div className="space-y-6">
              <div className="relative w-full max-w-md mb-4">
                 <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                 <input type="text" value={withdrawSearchTerm} onChange={e => setWithdrawSearchTerm(e.target.value)} placeholder="Tìm lệnh rút..." className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-amber-500" />
              </div>
             {filteredWithdrawals.map(w => (
               <div key={w.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-right-4">
                  <div className="flex gap-6 items-center flex-1">
                     <div className={`p-5 rounded-2xl ${w.type === 'bank' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-purple-600/10 text-purple-400'}`}>{w.type === 'bank' ? <Building2 size={28} /> : <Gamepad2 size={28} />}</div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[9px] font-black text-blue-500 uppercase italic">{w.userName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border flex items-center gap-1 ${getSecurityColor(w.securityScore ?? 100)}`}>
                             <Shield size={10} /> ĐIỂM TIN CẬY: {w.securityScore}%
                          </span>
                        </div>
                        <h4 className="font-black text-2xl text-white italic">{Number(w.amount).toLocaleString()}đ</h4>
                        <div className="flex flex-col gap-1 mt-2">
                           <div className="text-[10px] text-slate-400 italic bg-white/5 px-3 py-1 rounded-lg inline-block w-fit">Info: {w.details}</div>
                           {/* NOVA UPDATE: Hiển thị ID rút tiền ngay dưới thông tin bank/game */}
                           <div className="text-[10px] text-blue-400 font-black uppercase italic bg-blue-400/10 px-3 py-1 rounded-lg inline-block w-fit border border-blue-400/20">Nội dung CK: #{w.id}</div>
                        </div>
                     </div>
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex gap-4">
                       <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase italic">DUYỆT CHI</button>
                       <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="px-8 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase italic">HỦY LỆNH</button>
                    </div>
                  )}
                  {w.status !== 'pending' && (
                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase italic border ${w.status === 'completed' ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'}`}>{w.status === 'completed' ? 'ĐÃ DUYỆT' : 'ĐÃ TỪ CHỐI'}</span>
                  )}
               </div>
             ))}
           </div>
        )}

        {tab === 'ads' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase">Quản lý banner</h3>
              <button onClick={() => setShowAddModal('ad')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 italic"><PlusCircle size={16} /> THÊM QUẢNG CÁO</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map(ad => (
                <div key={ad.id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 overflow-hidden">
                   <img src={ad.imageUrl} alt={ad.title} className="w-full aspect-video object-cover rounded-2xl mb-4 border border-white/10" />
                   <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-white italic uppercase mb-1">{ad.title}</h4>
                        <div className="text-[9px] text-slate-500 truncate">{ad.targetUrl}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => dbService.updateAdStatus(ad.id, !ad.isActive).then(refreshData)} className={`p-3 rounded-xl ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>{ad.isActive ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                        <button onClick={() => dbService.deleteAd(ad.id).then(refreshData)} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 size={18} /></button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase">Tin tức hệ thống</h3>
              <button onClick={() => setShowAddModal('ann')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 italic"><PlusSquare size={16} /> SOẠN THÔNG BÁO</button>
            </div>
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="glass-card p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl ${ann.priority === 'high' ? 'bg-red-600/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}><Megaphone size={24} /></div>
                      <div>
                        <h4 className="font-black text-white italic uppercase">{ann.title}</h4>
                        <p className="text-slate-500 text-xs italic">{ann.content}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => dbService.updateAnnouncementStatus(ann.id, !ann.isActive).then(refreshData)} className={`p-3 rounded-xl ${ann.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>{ann.isActive ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                      <button onClick={() => dbService.deleteAnnouncement(ann.id).then(refreshData)} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 size={18} /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase">Kho mã quà tặng</h3>
              <button onClick={() => setShowAddModal('gc')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 italic"><PlusCircle size={16} /> TẠO GIFTCODE</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giftcodes.map(gc => (
                <div key={gc.code} className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                   <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Code</div>
                      <h4 className="text-2xl font-black text-white tracking-widest italic group-hover:text-blue-400 transition-colors">{gc.code}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-emerald-500 font-black text-xs">+{gc.amount.toLocaleString()} P</span>
                        <span className="text-slate-500 text-[10px] font-bold">Lượt dùng: {gc.usedBy?.length || 0} / {gc.maxUses}</span>
                      </div>
                   </div>
                   <button onClick={() => dbService.deleteGiftcode(gc.code).then(refreshData)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'logs' && (
           <div className="space-y-4 animate-in slide-in-from-right-4">
              <h3 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-4"><History className="text-blue-500" /> Hệ thống log</h3>
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 rounded-2xl border border-white/5 text-[10px] bg-white/[0.02]">
                    <span className="text-slate-600 font-bold shrink-0">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                    <span className={`font-black uppercase shrink-0 px-2 py-0.5 rounded ${log.action?.includes('BAN') ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>[{log.action}]</span>
                    <span className="text-slate-300 font-medium italic flex-1 truncate">{log.userName}: {log.details}</span>
                  </div>
                ))}
              </div>
           </div>
        )}

        {tab === 'setup' && (
           <div className="space-y-8">
              <div className="p-10 rounded-[3rem] border border-amber-500/20 bg-amber-500/5 space-y-6">
                 <div className="flex items-center gap-4 text-amber-500"><ShieldAlert size={32} /><h4 className="text-xl font-black text-white italic uppercase">BẢO TRÌ DATABASE</h4></div>
                 <p className="text-slate-400 text-sm font-medium italic leading-relaxed">Nếu hệ thống báo lỗi thiếu cột (Missing column), hãy copy mã SQL dưới đây và chạy trong SQL Editor của Supabase.</p>
                 <div className="relative group">
                    <pre className="w-full bg-black/90 border border-slate-800 rounded-[2rem] p-12 text-blue-400 font-mono text-[10px] overflow-x-auto italic leading-relaxed pt-14">{fullMaintenanceSql}</pre>
                    <button onClick={copySql} className="absolute top-4 right-6 px-6 py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 font-black uppercase text-[10px]">{sqlCopied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}{sqlCopied ? 'ĐÃ COPY' : 'COPY SQL'}</button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {editBalanceUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditBalanceUser(null)}></div>
          <div className="glass-card w-full max-w-sm p-10 rounded-[3rem] border border-white/10 relative z-10 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white italic uppercase mb-2">ĐIỀU CHỈNH SỐ DƯ</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{editBalanceUser.fullname} (#{editBalanceUser.id})</p>
              <p className="text-sm font-black text-emerald-500 mt-2 italic">Hiện tại: {Number(editBalanceUser.balance).toLocaleString()} P</p>
            </div>
            <div className="space-y-4">
              <div className="relative group">
                 <input 
                  type="number" 
                  value={balanceAdjustAmount} 
                  onChange={e => setBalanceAdjustAmount(Math.max(0, parseInt(e.target.value) || 0))} 
                  placeholder="NHẬP SỐ ĐIỂM (P)..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white font-black text-center outline-none focus:border-blue-500"
                 />
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAdjustBalance(false)} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl italic uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                  <PlusCircle size={16} /> CỘNG ĐIỂM
                </button>
                <button onClick={() => handleAdjustBalance(true)} className="flex-1 py-4 bg-red-600/10 border border-red-500/20 text-red-500 font-black rounded-2xl italic uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                  <MinusCircle size={16} /> TRỪ ĐIỂM
                </button>
              </div>
            </div>
            <button onClick={() => setEditBalanceUser(null)} className="w-full text-slate-600 font-black uppercase text-[10px] italic">HỦY BỎ</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(null)}></div>
          <div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative z-10 space-y-8">
            <h2 className="text-2xl font-black text-white italic uppercase">{showAddModal === 'ad' ? 'Thêm quảng cáo' : showAddModal === 'ann' ? 'Viết thông báo' : 'Tạo giftcode'}</h2>
            
            {showAddModal === 'ad' && (
              <div className="space-y-4">
                <input type="text" placeholder="Tiêu đề quảng cáo" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input type="text" placeholder="Link ảnh banner (URL)" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input type="text" placeholder="Link đích khi bấm vào" value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <button onClick={handleCreateAd} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic uppercase tracking-widest">LƯU QUẢNG CÁO</button>
              </div>
            )}

            {showAddModal === 'ann' && (
              <div className="space-y-4">
                <input type="text" placeholder="Tiêu đề thông báo" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <textarea placeholder="Nội dung chi tiết..." value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} rows={4} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none resize-none" />
                <select value={newAnn.priority} onChange={e => setNewAnn({...newAnn, priority: e.target.value as any})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none">
                  <option value="low">Độ ưu tiên: Thường</option>
                  <option value="high">Độ ưu tiên: Cao (Màu đỏ)</option>
                </select>
                <button onClick={handleCreateAnn} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic uppercase tracking-widest">PHÁT THÔNG BÁO</button>
              </div>
            )}

            {showAddModal === 'gc' && (
              <div className="space-y-4">
                <input type="text" placeholder="Mã Giftcode (VD: NOVA2025)" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white font-black tracking-widest outline-none" />
                <input type="number" placeholder="Số tiền tặng (P)" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input type="number" placeholder="Giới hạn lượt nhập" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <button onClick={handleCreateGc} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic uppercase tracking-widest">TẠO MÃ NGAY</button>
              </div>
            )}
            <button onClick={() => setShowAddModal(null)} className="w-full text-slate-500 font-black uppercase text-[10px] italic">HỦY BỎ</button>
          </div>
        </div>
      )}
    </div>
  );
}
