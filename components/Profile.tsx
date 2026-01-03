
import React, { useState } from 'react';
import { User, VipTier } from '../types.ts';
import { 
  Shield, Save, KeyRound, Phone, Fingerprint, CheckCircle2, UserX, Lock, ShieldCheck, Crown, Loader2
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';
// Import SOCIAL_LINKS from constants.tsx to satisfy line 160
import { SOCIAL_LINKS } from '../constants.tsx';

interface Props {
  user: User;
  onUpdateUser: (user: User) => Promise<any>;
}

const Profile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [bank, setBank] = useState(user.bankInfo);
  const [gameId, setGameId] = useState(user.idGame);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdateInfo = async () => {
    setIsSaving(true);
    const updatedUser = { ...user, bankInfo: bank, idGame: gameId, phoneNumber: phone };
    
    // Check result of update
    const res = await onUpdateUser(updatedUser);
    
    setIsSaving(false);
    
    if (res && res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    } else {
        alert(res?.message || "Lỗi cập nhật. Vui lòng thử lại.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) return alert("Vui lòng điền đủ thông tin.");
    
    setPassLoading(true);
    const res = await dbService.updatePassword(user.id, oldPass, newPass);
    setPassLoading(false);
    
    alert(res.message);
    if (res.success) {
      setOldPass('');
      setNewPass('');
      setIsChangingPass(false);
    }
  };

  const getVipRichStyle = () => {
    switch(user.vipTier) {
      case VipTier.ELITE: return 'elite-border-rich';
      case VipTier.PRO: return 'pro-border-rich';
      case VipTier.BASIC: return 'basic-border-rich';
      default: return 'border-white/10';
    }
  };

  const getVipCrownColor = () => {
    switch(user.vipTier) {
      case VipTier.ELITE: return 'text-purple-400 fill-purple-400';
      case VipTier.PRO: return 'text-amber-400 fill-amber-400';
      case VipTier.BASIC: return 'text-blue-400 fill-blue-400';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row items-center gap-8 glass-card p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
        {/* VIP Shimmer Overlay */}
        {user.isVip && (
          <div className={`absolute inset-0 pointer-events-none opacity-40 ${user.vipTier === VipTier.ELITE ? 'vip-elite-shimmer' : user.vipTier === VipTier.PRO ? 'vip-pro-shimmer' : 'vip-basic-shimmer'}`}></div>
        )}

        <div className={`w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center relative z-10 ${getVipRichStyle()}`}>
           {user.avatarUrl ? (
             <img src={user.avatarUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
           ) : (
             <span className="font-black text-5xl text-white italic">{user.fullname.charAt(0).toUpperCase()}</span>
           )}
           {user.isVip && <Crown className={`absolute -top-6 -right-6 w-12 h-12 vip-crown-float ${getVipCrownColor()}`} />}
        </div>
        <div className="text-center md:text-left relative z-10">
           <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">{user.fullname}</h1>
           <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <span className="bg-slate-900 border border-white/5 text-slate-500 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest italic">ID: {user.id.toUpperCase()}</span>
              <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2 ${user.isVip ? 'bg-white/5 border-white/10' : 'bg-slate-900 text-slate-700 border-white/5'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.vipTier === VipTier.ELITE ? 'bg-purple-400' : user.vipTier === VipTier.PRO ? 'bg-amber-400' : user.vipTier === VipTier.BASIC ? 'bg-blue-400' : 'bg-slate-700'}`}></div>
                 HẠNG: <span className={user.vipTier === VipTier.ELITE ? 'text-purple-400' : user.vipTier === VipTier.PRO ? 'text-amber-400' : user.vipTier === VipTier.BASIC ? 'text-blue-400' : 'text-slate-500'}>
                   {user.vipTier.toUpperCase()}
                 </span>
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
              <button 
                onClick={handleUpdateInfo} 
                disabled={isSaving}
                className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white uppercase italic text-[11px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : (saved ? 'ĐÃ CẬP NHẬT THÀNH CÔNG' : 'LƯU THÔNG TIN THAY ĐỔI')}
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
                   <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Mật khẩu mới</label>
                   <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-purple-500" />
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setIsChangingPass(false)} className="flex-1 py-4 bg-slate-900 text-slate-500 font-black rounded-xl text-[10px] uppercase">HỦY</button>
                   <button type="submit" disabled={passLoading} className="flex-[2] py-4 bg-purple-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50">
                      {passLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'XÁC NHẬN ĐỔI'}
                   </button>
                </div>
             </form>
           )}
           <div className="pt-6 border-t border-white/5 text-center">
              <p className="text-[9px] text-slate-600 font-bold italic mb-4 uppercase tracking-tighter">Lấy mã xác nhận tại Bot: <a href={SOCIAL_LINKS.telegramBot} target="_blank" className="text-blue-500 hover:underline">@anhvudev_kiemtienonline_bot</a></p>
              <button onClick={() => alert("Hãy liên hệ Admin để xóa tài khoản.")} className="w-full py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[9px] italic border border-red-500/20">YÊU CẦU XÓA TÀI KHOẢN</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
