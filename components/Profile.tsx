
import React, { useState } from 'react';
import { User, VipTier } from '../types.ts';
import { 
  Shield, Save, KeyRound, Phone, Fingerprint, CheckCircle2, UserX, Lock, ShieldCheck, Crown
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [bank, setBank] = useState(user.bankInfo);
  const [gameId, setGameId] = useState(user.idGame);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saved, setSaved] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateInfo = async () => {
    onUpdateUser({ ...user, bankInfo: bank, idGame: gameId, phoneNumber: phone });
    await dbService.linkPhone(user.id, phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) return alert("Vui lòng điền đủ thông tin.");
    const res = await dbService.updatePassword(user.id, oldPass, newPass);
    alert(res.message);
    if (res.success) {
      setOldPass('');
      setNewPass('');
      setIsChangingPass(false);
    }
  };

  const getVipColor = () => {
    switch(user.vipTier) {
      case VipTier.ELITE: return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
      case VipTier.PRO: return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
      case VipTier.BASIC: return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      default: return 'border-slate-800';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row items-center gap-8 glass-card p-10 rounded-[3.5rem] border border-white/5">
        <div className={`w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center border-4 relative ${getVipColor()}`}>
           {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover rounded-[2.2rem]" /> : <Fingerprint className="w-12 h-12 text-slate-700" />}
           {user.vipTier !== 'none' && <Crown className="absolute -top-4 -right-4 w-10 h-10 text-amber-500 fill-amber-500 animate-bounce" />}
        </div>
        <div className="text-center md:text-left">
           <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">{user.fullname}</h1>
           <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <span className="bg-slate-900 border border-white/5 text-slate-500 text-[9px] font-black px-4 py-1.5 rounded-full">#{user.id.toUpperCase()}</span>
              <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border ${user.vipTier !== 'none' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-900 text-slate-700 border-white/5'}`}>
                 RANK: {user.vipTier.toUpperCase()}
              </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
           <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-4">
              <ShieldCheck className="text-blue-500" /> THÔNG TIN TÀI KHOẢN
           </h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Số điện thoại liên kết</label>
                 <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                   <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="033xxxxxxx" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Thông tin Bank (STK - TÊN - BANK)</label>
                 <textarea value={bank} onChange={e => setBank(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">ID Game (FF/LQ)</label>
                 <input type="text" value={gameId} onChange={e => setGameId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500" />
              </div>
              <button onClick={handleUpdateInfo} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white uppercase italic text-[11px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                {saved ? 'ĐÃ CẬP NHẬT THÀNH CÔNG' : 'LƯU THÔNG TIN THAY ĐỔI'}
              </button>
           </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
           <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-4">
              <KeyRound className="text-purple-500" /> BẢO MẬT & MẬT KHẨU
           </h3>
           {!isChangingPass ? (
              <button onClick={() => setIsChangingPass(true)} className="w-full py-10 rounded-[2rem] border-2 border-dashed border-slate-800 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:border-purple-500 hover:text-purple-500 transition-all flex flex-col items-center gap-4">
                 <Lock className="w-8 h-8" />
                 BẤM VÀO ĐÂY ĐỂ ĐỔI MẬT KHẨU
              </button>
           ) : (
             <form onSubmit={handleChangePassword} className="space-y-6 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Mật khẩu hiện tại</label>
                   <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Mật khẩu mới</label>
                   <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none" />
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setIsChangingPass(false)} className="flex-1 py-4 bg-slate-900 text-slate-500 font-black rounded-xl text-[10px] uppercase">HỦY</button>
                   <button type="submit" className="flex-[2] py-4 bg-purple-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20">XÁC NHẬN ĐỔI</button>
                </div>
             </form>
           )}
           <div className="pt-6 border-t border-white/5">
              <button onClick={() => alert("Hãy liên hệ Admin để xóa tài khoản.")} className="w-full py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[9px] italic border border-red-500/20">YÊU CẦU XÓA TÀI KHOẢN</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
