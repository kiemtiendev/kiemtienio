
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, Giftcode, Announcement, AdBanner, ActivityLog } from '../types.ts';
import { dbService, supabase } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Users, CreditCard, Search, Ban, Unlock, Trash2, Megaphone, ShieldCheck, 
  Ticket, History, Activity, Database, Copy, CheckCircle2, 
  PlusCircle, Gamepad2, Building2, Eye, EyeOff,
  TrendingUp, SearchIcon, Image as ImageIcon, Wallet
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
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">QUẢN TRỊ VIÊN</h1>
        </div>
        <button onClick={refreshData} disabled={isSyncing} className="p-3 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
          <Activity className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'users', label: 'Hội viên', icon: <Users size={16} /> },
          { id: 'withdrawals', label: 'Rút tiền', icon: <CreditCard size={16} /> },
          { id: 'giftcodes', label: 'Giftcode', icon: <Ticket size={16} /> },
          { id: 'ads', label: 'Quảng cáo', icon: <ImageIcon size={16} /> },
          { id: 'announcements', label: 'Thông báo', icon: <Megaphone size={16} /> },
          { id: 'logs', label: 'Lịch sử', icon: <History size={16} /> }
        ].map(i => (
          <button key={i.id} onClick={() => setTab(i.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${tab === i.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'}`}>
            {i.icon} <span>{i.label}</span>
          </button>
        ))}
      </div>

      <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-950/40 min-h-[500px]">
        {tab === 'users' && (
           <div className="space-y-6">
              <div className="relative w-full max-w-md"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm hội viên..." className="w-full bg-slate-900 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500" /></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500 uppercase font-black border-b border-white/5"><tr><th className="px-4 py-3">Hội viên</th><th className="px-4 py-3">Số dư</th><th className="px-4 py-3">Tin cậy</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-white/5">{filteredUsers.map(u => (<tr key={u.id} className="hover:bg-white/[0.02]"><td className="px-4 py-4"><div className="font-bold text-white">{u.fullname}</div><div className="text-[10px] text-slate-500">#{u.id} • {u.email}</div></td><td className="px-4 py-4 font-black text-emerald-500">{Number(u.balance).toLocaleString()} P</td><td className="px-4 py-4"><span className="text-blue-400 font-bold">{u.securityScore}%</span></td><td className="px-4 py-4 text-right flex justify-end gap-2"><button onClick={() => setEditBalanceUser(u)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg"><Wallet size={16} /></button><button onClick={() => dbService.updateUser(u.id, { isBanned: !u.isBanned }).then(refreshData)} className={`p-2 rounded-lg ${u.isBanned ? 'bg-emerald-600/10 text-emerald-400' : 'bg-red-600/10 text-red-500'}`}>{u.isBanned ? <Unlock size={16} /> : <Ban size={16} />}</button></td></tr>))}</tbody></table></div>
           </div>
        )}

        {tab === 'withdrawals' && (
           <div className="space-y-4">
             {filteredWithdrawals.map(w => (
               <div key={w.id} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex gap-4 items-center flex-1">
                     <div className={`p-3 rounded-xl ${w.type === 'bank' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-purple-600/10 text-purple-400'}`}>{w.type === 'bank' ? <Building2 size={24} /> : <Gamepad2 size={24} />}</div>
                     <div>
                        <div className="flex items-center gap-2"><span className="text-xs font-black text-white uppercase">{w.userName}</span><span className="text-[10px] text-blue-400">Score: {w.securityScore}%</span></div>
                        <h4 className="font-black text-lg text-emerald-500">{Number(w.amount).toLocaleString()}đ</h4>
                        <div className="text-[10px] text-slate-400 italic">Info: {w.details}</div>
                        {/* HIỂN THỊ ID ĐỂ LÀM NỘI DUNG CHUYỂN KHOẢN */}
                        <div className="mt-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded w-fit text-[10px] font-black uppercase">Nội dung CK: #{w.id}</div>
                     </div>
                  </div>
                  {w.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleWithdrawAction(w.id, 'completed')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold">DUYỆT</button>
                      <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="px-4 py-2 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-bold">HỦY</button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase ${w.status === 'completed' ? 'text-emerald-500' : 'text-red-500'}`}>{w.status === 'completed' ? 'Đã duyệt' : 'Đã từ chối'}</span>
                  )}
               </div>
             ))}
           </div>
        )}

        {tab === 'giftcodes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase italic">Kho mã quà tặng</h3>
              <button onClick={() => setShowAddModal('gc')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"><PlusCircle size={16} /> THÊM MÃ</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giftcodes.map(gc => (
                <div key={gc.code} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex items-center justify-between">
                   <div>
                      <h4 className="text-lg font-black text-white tracking-widest">{gc.code}</h4>
                      <div className="text-[10px] text-slate-500">Thưởng: {Number(gc.amount).toLocaleString()} P • Lượt: {gc.usedBy?.length || 0} / {gc.maxUses}</div>
                   </div>
                   <button onClick={() => dbService.deleteGiftcode(gc.code).then(refreshData)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal === 'gc' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 space-y-6">
            <h2 className="text-xl font-black text-white uppercase italic">Tạo Giftcode</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Mã Code" value={newGc.code} onChange={e => setNewGc({...newGc, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="number" placeholder="Số tiền tặng (P)" value={newGc.amount} onChange={e => setNewGc({...newGc, amount: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="number" placeholder="Giới hạn lượt dùng" value={newGc.maxUses} onChange={e => setNewGc({...newGc, maxUses: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <button onClick={handleCreateGc} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl uppercase">Tạo ngay</button>
            </div>
            <button onClick={() => setShowAddModal(null)} className="w-full text-slate-500 font-bold uppercase text-[10px]">Hủy bỏ</button>
          </div>
        </div>
      )}
    </div>
  );
}
