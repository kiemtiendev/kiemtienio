
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
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
    } catch (err) { console.error(err); } finally { setIsSyncing(false); }
  };

  useEffect(() => {
    refreshData();
    // NOVA REAL-TIME ADMIN: Lắng nghe thay đổi toàn hệ thống
    const adminChannel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'giftcodes' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_data' }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(adminChannel); };
  }, [tab]);

  const filteredUsers = useMemo(() => allUsers.filter(u => u.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.id?.toLowerCase().includes(searchTerm.toLowerCase())), [allUsers, searchTerm]);
  const filteredWithdrawals = useMemo(() => withdrawals.filter(w => w.userName?.toLowerCase().includes(withdrawSearchTerm.toLowerCase()) || w.details?.toLowerCase().includes(withdrawSearchTerm.toLowerCase()) || w.id?.toString().includes(withdrawSearchTerm.toLowerCase())), [withdrawals, withdrawSearchTerm]);

  const handleWithdrawAction = async (id: string, status: 'completed' | 'rejected') => {
    if (!window.confirm(status === 'completed' ? 'Xác nhận duyệt chi?' : 'Từ chối yêu cầu?')) return;
    await dbService.updateWithdrawalStatus(id, status);
    refreshData();
  };

  const handleCreateGc = async () => {
    if (!newGc.code || !newGc.amount) return alert("Vui lòng điền đủ thông tin");
    await dbService.addGiftcode(newGc);
    setNewGc({ code: '', amount: 10000, maxUses: 100 });
    setShowAddModal(null);
    refreshData();
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <div><h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">NOVA COMMAND</h1><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic mt-2">Hệ thống quản trị trung tâm v1.8</p></div>
        </div>
        <button onClick={refreshData} disabled={isSyncing} className="px-8 py-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-all disabled:opacity-50"><Activity className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'LÀM MỚI DỮ LIỆU'}</button>
      </div>

      <div className="flex flex-wrap gap-4 p-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
        {[{ id: 'users', label: 'HỘI VIÊN', icon: <Users size={18} /> }, { id: 'withdrawals', label: 'RÚT TIỀN', icon: <CreditCard size={18} /> }, { id: 'ads', label: 'QUẢNG CÁO', icon: <ImageIcon size={18} /> }, { id: 'announcements', label: 'THÔNG BÁO', icon: <Megaphone size={18} /> }, { id: 'giftcodes', label: 'GIFTCODE', icon: <Ticket size={18} /> }, { id: 'logs', label: 'NHẬT KÝ', icon: <History size={18} /> }].map(i => (
          <button key={i.id} onClick={() => setTab(i.id as any)} className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all border-2 ${tab === i.id ? 'bg-blue-600/90 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'}`}>{i.icon} <span>{i.label}</span></button>
        ))}
      </div>

      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 bg-slate-950/40 min-h-[500px]">
        {tab === 'users' && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="relative w-full max-w-md"><SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm hội viên..." className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-blue-500" /></div>
              <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5"><tr><th className="px-6 py-4">Hội viên</th><th className="px-6 py-4">Số dư</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-white/5">{filteredUsers.map(u => (<tr key={u.id} className="hover:bg-white/[0.02]"><td className="px-6 py-6"><div className="font-black text-white italic">{u.fullname}</div><div className="text-[10px] text-slate-500 flex items-center gap-2">{u.email} <span className="px-1.5 py-0.5 rounded text-[7px] font-black border border-blue-500/20 text-blue-400">T.CẬY: {u.securityScore}%</span></div></td><td className="px-6 py-6 font-black text-emerald-500 italic">{Number(u.balance).toLocaleString()} P</td><td className="px-6 py-6"><span className={`px-3 py-1 text-[8px] font-black rounded-full border ${u.isBanned ? 'bg-red-600/10 text-red-500 border-red-500/20' : 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20'}`}>{u.isBanned ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}</span></td><td className="px-6 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditBalanceUser(u)} className="p-3 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Wallet size={18} /></button><button onClick={() => dbService.updateUser(u.id, { isBanned: !u.isBanned }).then(refreshData)} className={`p-3 rounded-xl transition-all ${u.isBanned ? 'bg-emerald-600/10 text-emerald-400' : 'bg-red-600/10 text-red-500'}`}>{u.isBanned ? <Unlock size={18} /> : <Ban size={18} />}</button></div></td></tr>))}</tbody></table></div>
           </div>
        )}

        {tab === 'withdrawals' && (
           <div className="space-y-6">
              <div className="relative w-full max-w-md mb-4"><SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" /><input type="text" value={withdrawSearchTerm} onChange={e => setWithdrawSearchTerm(e.target.value)} placeholder="Tìm lệnh rút..." className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-amber-500" /></div>
             {filteredWithdrawals.map(w => (
               <div key={w.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-right-4">
                  <div className="flex gap-6 items-center flex-1">
                     <div className={`p-5 rounded-2xl ${w.type === 'bank' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-purple-600/10 text-purple-400'}`}>{w.type === 'bank' ? <Building2 size={28} /> : <Gamepad2 size={28} />}</div>
                     <div><div className="flex items-center gap-3 mb-1"><span className="text-[9px] font-black text-blue-500 uppercase italic">{w.userName}</span><span className="px-2 py-0.5 rounded-full text-[8px] font-black border border-blue-500/20 text-blue-400 flex items-center gap-1"><Shield size={10} /> T.CẬY: {w.securityScore}%</span></div><h4 className="font-black text-2xl text-white italic">{Number(w.amount).toLocaleString()}đ</h4><div className="flex flex-col gap-1 mt-2"><div className="text-[10px] text-slate-400 italic bg-white/5 px-3 py-1 rounded-lg inline-block w-fit">Info: {w.details}</div><div className="text-[10px] text-blue-400 font-black uppercase italic bg-blue-400/10 px-3 py-1 rounded-lg inline-block w-fit border border-blue-400/20">Nội dung CK: #{w.id}</div></div></div>
                  </div>
                  {w.status === 'pending' ? (<div className="flex gap-4"><button onClick={() => handleWithdrawAction(w.id, 'completed')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase italic shadow-lg shadow-emerald-600/20">DUYỆT CHI</button><button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="px-8 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase italic">HỦY LỆNH</button></div>) : (<span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase italic border ${w.status === 'completed' ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'}`}>{w.status === 'completed' ? 'ĐÃ DUYỆT' : 'ĐÃ TỪ CHỐI'}</span>)}
               </div>
             ))}
           </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-white italic uppercase">Kho mã quà tặng</h3><button onClick={() => setShowAddModal('gc')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 italic"><PlusCircle size={16} /> TẠO GIFTCODE</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giftcodes.map(gc => (
                <div key={gc.code} className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                   <div><div className="text-[10px] font-black text-slate-500 uppercase mb-1">MÃ CODE</div><h4 className="text-2xl font-black text-white tracking-widest italic group-hover:text-blue-400 transition-colors">{gc.code}</h4><div className="flex items-center gap-4 mt-2"><span className="text-emerald-500 font-black text-xs">+{Number(gc.amount).toLocaleString()} P</span><span className="text-slate-500 text-[10px] font-bold">Lượt dùng: {gc.usedBy?.length || 0} / {gc.maxUses}</span></div></div>
                   <button onClick={() => dbService.deleteGiftcode(gc.code).then(refreshData)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal === 'gc' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in"><div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(null)}></div><div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative z-10 space-y-8"><h2 className="text-2xl font-black text-white italic uppercase">Tạo Giftcode</h2><div className="space-y-4"><input type="text" placeholder="Mã Code (VD: NOVA2025)" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white font-black tracking-widest outline-none" /><input type="number" placeholder="Số tiền tặng (P)" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" /><input type="number" placeholder="Giới hạn lượt dùng" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-white outline-none" /><button onClick={handleCreateGc} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic uppercase tracking-widest shadow-lg shadow-blue-600/20">TẠO MÃ NGAY</button></div><button onClick={() => setShowAddModal(null)} className="w-full text-slate-500 font-black uppercase text-[10px] italic">HỦY BỎ</button></div></div>
      )}
    </div>
  );
}
