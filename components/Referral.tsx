
import React, { useState } from 'react';
import { User } from '../types.ts';
import { REFERRAL_REWARD, formatK } from '../constants.tsx';
import { 
  Users, 
  Copy, 
  CheckCircle2, 
  Gift, 
  Share2, 
  TrendingUp, 
  UserPlus,
  Coins
} from 'lucide-react';

interface Props {
  user: User;
}

const Referral: React.FC<Props> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  
  // Tạo link giới thiệu dựa trên đường dẫn hiện tại của web
  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${user.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden glass-card p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-2xl bg-gradient-to-br from-blue-600/10 to-purple-700/10">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Share2 className="w-64 h-64 text-blue-500" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-6">
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-xs font-black uppercase tracking-[0.3em] italic">
                  <Gift className="w-4 h-4" /> CHƯƠNG TRÌNH ĐẠI SỨ NOVA
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter italic">
                  MỜI BẠN <br />
                  <span className="nova-gradient">NHẬN {REFERRAL_REWARD.toLocaleString()} P</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium leading-relaxed italic">
                  Chia sẻ link giới thiệu của bạn cho bạn bè. Khi họ đăng ký tài khoản, bạn sẽ nhận được <b className="text-blue-400">{formatK(REFERRAL_REWARD)}</b> vào số dư ngay lập tức!
                </p>
            </div>

            <div className="w-full lg:w-96 glass-card p-10 rounded-[3rem] border border-white/10 bg-black/40 shadow-inner flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center border border-blue-500/30">
                   <UserPlus className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mã giới thiệu của bạn</span>
                   <h3 className="text-3xl font-black text-white tracking-widest uppercase italic">{user.id}</h3>
                </div>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-10 rounded-[3rem] border-l-8 border-l-emerald-500 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
          <div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Người đã mời</span>
            <h2 className="text-5xl font-black text-white italic tracking-tighter">{user.referralCount || 0}</h2>
          </div>
          <div className="p-6 bg-emerald-500/10 rounded-3xl text-emerald-500 group-hover:scale-110 transition-transform">
             <Users className="w-10 h-10" />
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-l-8 border-l-amber-500 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
          <div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Hoa hồng nhận được</span>
            <h2 className="text-5xl font-black text-white italic tracking-tighter">{formatK(user.referralBonus || 0)} <span className="text-lg text-amber-500">P</span></h2>
          </div>
          <div className="p-6 bg-amber-500/10 rounded-3xl text-amber-500 group-hover:scale-110 transition-transform">
             <Coins className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Link Sharing Section */}
      <div className="glass-card p-10 md:p-14 rounded-[4rem] border border-white/5 space-y-10 relative overflow-hidden bg-slate-900/20">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-30"></div>
         <div className="text-center space-y-4">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center justify-center gap-4">
               <TrendingUp className="w-8 h-8 text-blue-500" /> LINK GIỚI THIỆU CỦA BẠN
            </h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Copy link dưới đây và gửi cho bạn bè qua Zalo, Facebook, Telegram</p>
         </div>

         <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-3xl px-8 py-6 text-blue-400 font-bold text-sm truncate shadow-inner">
               {referralLink}
            </div>
            <button 
              onClick={copyToClipboard}
              className={`px-10 py-6 rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${copied ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}
            >
              {copied ? <><CheckCircle2 className="w-6 h-6" /> ĐÃ COPY</> : <><Copy className="w-6 h-6" /> COPY LINK</>}
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
            <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 font-black">1</div>
               <h4 className="text-white font-black text-sm uppercase italic">CHIA SẺ LINK</h4>
               <p className="text-slate-500 text-[10px] font-bold">Gửi link mời cho bạn bè của bạn</p>
            </div>
            <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 font-black">2</div>
               <h4 className="text-white font-black text-sm uppercase italic">BẠN BÈ ĐĂNG KÝ</h4>
               <p className="text-slate-500 text-[10px] font-bold">Họ nhấn vào link và tạo tài khoản</p>
            </div>
            <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 font-black">3</div>
               <h4 className="text-white font-black text-sm uppercase italic">NHẬN HOA HỒNG</h4>
               <p className="text-slate-500 text-[10px] font-bold">Hệ thống tự động cộng điểm cho bạn</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Referral;
