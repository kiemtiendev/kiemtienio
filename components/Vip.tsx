
import React, { useState, useEffect } from 'react';
import { User, VipTier } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { Crown, Sparkles, Zap, ShieldCheck, CheckCircle2, Trophy, ArrowRight, Loader2, Star } from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Vip: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vipUsers, setVipUsers] = useState<User[]>([]);
  
  const packages = [
    { name: 'VIP BASIC', vnd: 20000, days: 1, tier: VipTier.BASIC, color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20' },
    { name: 'VIP PRO', vnd: 100000, days: 7, tier: VipTier.PRO, color: 'text-amber-400', bg: 'bg-amber-600/10', border: 'border-amber-500/20' },
    { name: 'VIP ELITE', vnd: 500000, days: 30, tier: VipTier.ELITE, color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/20' }
  ];

  useEffect(() => {
    dbService.getVipUsers().then(setVipUsers);
  }, []);

  const handleBuy = async (vnd: number) => {
    if (user.balance < vnd * 10) return alert("Số dư không đủ.");
    if (!confirm(`Xác nhận đăng ký gói VIP này?`)) return;

    setIsLoading(true);
    const res = await dbService.upgradeVipTiered(user.id, vnd);
    setIsLoading(false);
    
    if (res.success) {
      alert(res.message);
      const updated = await dbService.getCurrentUser();
      if (updated) onUpdateUser(updated);
      dbService.getVipUsers().then(setVipUsers);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in">
      <div className="glass-card p-12 rounded-[4rem] text-center relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <Crown className="w-24 h-24 text-amber-500 mx-auto mb-6 drop-shadow-glow" />
        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">ĐẶC QUYỀN <span className="text-amber-400">VIP NOVA</span></h1>
        <p className="text-slate-400 mt-4 font-medium italic">Nâng tầm trải nghiệm, gia tăng thu nhập tối đa lên đến +50%</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map(pkg => (
          <div key={pkg.tier} className={`glass-card p-10 rounded-[3rem] border ${pkg.border} ${pkg.bg} flex flex-col justify-between group hover:scale-105 transition-all shadow-xl`}>
            <div className="text-center space-y-6">
              <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${pkg.color}`}>{pkg.name}</div>
              <div className="text-4xl font-black text-white italic tracking-tighter">{pkg.days} NGÀY</div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> +50% Thưởng nhiệm vụ</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> Ưu tiên rút tiền siêu tốc</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> Khung Avatar {pkg.tier.toUpperCase()}</div>
              </div>
            </div>
            <button 
              onClick={() => handleBuy(pkg.vnd)}
              disabled={isLoading}
              className={`w-full mt-10 py-5 rounded-2xl font-black text-[11px] uppercase italic tracking-widest transition-all ${pkg.tier === VipTier.ELITE ? 'bg-purple-600' : pkg.tier === VipTier.PRO ? 'bg-amber-500 text-black' : 'bg-blue-600'} text-white active:scale-95`}
            >
              KÍCH HOẠT {(pkg.vnd * 10).toLocaleString()} P
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10">
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 bg-slate-900/20">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4 mb-8">
             <Trophy className="text-amber-500" /> BẢNG XẾP HẠNG VIP
          </h3>
          <div className="space-y-4">
            {vipUsers.length === 0 ? (
              <p className="text-slate-600 text-center py-10 font-black uppercase italic text-xs">Chưa có hội viên VIP nào.</p>
            ) : (
              vipUsers.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                   <div className="flex items-center gap-4">
                      <span className="font-black text-slate-600 italic">#{i+1}</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Star size={18} className="text-amber-500" />
                      </div>
                      <span className="font-bold text-white uppercase italic text-sm">{v.fullname}</span>
                   </div>
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{v.vipTier}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 bg-slate-900/40 flex flex-col justify-center items-center text-center space-y-6">
           <Zap className="w-16 h-16 text-amber-500 animate-pulse" />
           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">TRẠNG THÁI CỦA BẠN</h3>
           {user.vipTier !== 'none' ? (
             <div className="space-y-2">
                <p className="text-amber-400 font-black uppercase italic tracking-widest">ĐANG LÀ {user.vipTier.toUpperCase()}</p>
                <p className="text-slate-500 text-[10px] font-bold">Hết hạn: {new Date(user.vipUntil!).toLocaleDateString('vi-VN')}</p>
             </div>
           ) : (
             <p className="text-slate-500 font-medium italic">Bạn đang sử dụng tài khoản thường. Hãy nâng cấp để nhận nhiều ưu đãi hơn.</p>
           )}
        </div>
      </div>
      <style>{`
        .drop-shadow-glow { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.5)); }
      `}</style>
    </div>
  );
};

export default Vip;
