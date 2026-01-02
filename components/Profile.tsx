
import React, { useState, useRef } from 'react';
import { User } from '../types.ts';
import { 
  Shield, Save, Gamepad, Building2, Fingerprint, Calendar, CheckCircle2, 
  BookOpen, Mail, Diamond, Crown, Zap, Star, ShieldCheck, ShieldAlert, 
  ShieldOff, Activity, Camera, X, RotateCcw, Aperture, UserX 
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [bank, setBank] = useState(user.bankInfo);
  const [gameId, setGameId] = useState(user.idGame);
  const [saved, setSaved] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, bankInfo: bank, idGame: gameId });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN? Hành động này không thể hoàn tác và toàn bộ số dư của bạn sẽ bị mất.")) {
      const res = await dbService.deleteAccount(user.id);
      if (res.success) window.location.reload();
      else alert("Lỗi: " + res.message);
    }
  };

  const score = user.securityScore ?? 100;
  const getSecurityStatus = () => {
    if (score > 80) return { label: 'TIN CẬY', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <ShieldCheck className="w-6 h-6" />, desc: 'Ưu tiên rút tiền siêu tốc.' };
    if (score >= 50) return { label: 'TRUNG BÌNH', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <ShieldAlert className="w-6 h-6" />, desc: 'Duyệt lệnh thủ công.' };
    return { label: 'RỦI RO', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <ShieldOff className="w-6 h-6" />, desc: 'Bị hạn chế rút tiền.' };
  };

  const security = getSecurityStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div onClick={() => setIsCameraOpen(true)} className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden group cursor-pointer relative">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Fingerprint className="w-10 h-10 text-white" />}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={20} className="text-white" /></div>
          </div>
          <div><h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{user.fullname}</h1><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{user.id.toUpperCase()}</span>{user.isAdmin && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">ADMIN</span>}</div></div>
        </div>
        <div className={`glass-card px-6 py-4 rounded-2xl border ${security.border} ${security.bg} flex items-center gap-4`}>
          <div className={`${security.color} animate-pulse`}>{security.icon}</div>
          <div><div className="flex items-center gap-2"><span className={`text-[10px] font-black uppercase tracking-widest ${security.color}`}>{security.label}</span><span className="text-white font-black text-lg italic">{score}%</span></div><p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Real-time Trust Score</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4"><div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400"><Mail className="w-6 h-6" /></div><div className="overflow-hidden"><p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Email</p><p className="text-white font-bold text-xs truncate">{user.email}</p></div></div>
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4"><div className="p-4 bg-emerald-600/10 rounded-2xl text-emerald-400"><Calendar className="w-6 h-6" /></div><div><p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Tham gia</p><p className="text-white font-bold text-xs">{new Date(user.joinDate).toLocaleDateString()}</p></div></div>
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4"><div className="p-4 bg-purple-600/10 rounded-2xl text-purple-400"><Diamond className="w-6 h-6" /></div><div><p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Rank</p><p className="text-white font-bold text-xs uppercase italic">{user.isAdmin ? 'NOVA ADMIN' : 'ELITE MEMBER'}</p></div></div>
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-900/40 flex items-center gap-4"><div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><Activity className="w-6 h-6" /></div><div><p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Sentinel Status</p><p className="text-emerald-400 font-black text-xs uppercase italic">Active</p></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-5"><Building2 className="w-32 h-32" /></div><h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Thông tin thanh toán</h3><div className="space-y-6"><div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bank (STK - Ngân hàng - Chủ TK)</label><textarea value={bank} onChange={(e) => setBank(e.target.value)} placeholder="VD: 1900110022 - MB - NGUYEN VAN A" rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-600 transition-all resize-none" /></div><div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">ID Game (FF / LQ)</label><input type="text" value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder="VD: 102938475" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-600 transition-all" /></div><div className="flex justify-end gap-4"><button onClick={handleDeleteAccount} className="px-6 py-5 rounded-2xl bg-red-600/10 text-red-500 font-black uppercase text-[10px] italic border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"><UserX className="w-4 h-4" /></button><button onClick={handleSave} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs italic transition-all active:scale-95">{saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}<span>{saved ? 'ĐÃ LƯU' : 'CẬP NHẬT'}</span></button></div></div></div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
