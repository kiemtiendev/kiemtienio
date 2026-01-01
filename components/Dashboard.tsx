
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { User, AppView } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  ArrowUpRight, 
  Megaphone, 
  Zap, 
  Star, 
  TrendingUp, 
  ShoppingBag, 
  ExternalLink, 
  Bell, 
  Trophy, 
  ArrowRight,
  History,
  Info,
  Bot,
  Sparkles
} from 'lucide-react';

interface Props {
  user: User;
  setView: (view: AppView) => void;
}

const StatCard: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  value: string | number, 
  suffix: string, 
  borderColor: string, 
  iconColor: string,
  index: number
}> = ({ icon, label, value, suffix, borderColor, iconColor, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const cardCenter = rect.top + rect.height / 2;
      const viewCenter = viewportHeight / 2;
      const offset = (cardCenter - viewCenter) / viewCenter;
      const rotateX = offset * 20;
      const translateY = offset * 40;
      const scale = 1 - Math.abs(offset) * 0.1;

      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) translateY(${translateY}px) scale(${scale})`,
        transition: 'transform 0.1s cubic-bezier(0.33, 1, 0.68, 1)',
        willChange: 'transform'
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={cardRef}
      style={style}
      className={`glass-card p-8 md:p-10 rounded-[3rem] border-l-8 ${borderColor} relative overflow-hidden group hover:bg-white/[0.08] transition-colors duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
    >
      <div 
        className={`absolute top-0 right-0 w-32 h-32 ${iconColor} opacity-[0.15] -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-1000 pointer-events-none`}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-full h-full filter blur-[1px]' })}
      </div>
      <div className="relative z-10">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 italic block">
          {label}
        </span>
        <div className="flex items-baseline gap-3">
          <h2 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {value}
          </h2>
          <span className={`${iconColor} font-black text-sm uppercase`}>
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ user, setView }) => {
  const announcements = useMemo(() => dbService.getAnnouncements(), []);
  const ads = useMemo(() => dbService.getAds(false).filter(a => a.isActive), []);
  const latestAnnouncement = announcements[0];
  
  const personalNotifications = useMemo(() => {
    return dbService.getNotifications().filter(n => n.userId === user.id).slice(0, 5);
  }, [user.id]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <div className="w-full bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-blue-600/30 border border-blue-500/40 rounded-[2.5rem] overflow-hidden py-5 px-10 flex items-center gap-6 group shadow-2xl backdrop-blur-3xl">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/50 shrink-0 animate-pulse">
          <Megaphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap animate-marquee flex gap-20">
             {announcements.length > 0 ? (
               announcements.map((ann) => (
                 <span key={ann.id} className="text-sm font-black text-white uppercase italic tracking-[0.25em]">
                   ✦ {ann.title.toUpperCase()}: {ann.content}
                 </span>
               ))
             ) : (
               <>
                 <span className="text-sm font-black text-white uppercase italic tracking-[0.25em]">CHÀO MỪNG ĐẾN VỚI DIAMOND NOVA VISION 1.0 - KIẾM TIỀN & KIM CƯƠNG FF MIỄN PHÍ!</span>
                 <span className="text-sm font-black text-blue-400 uppercase italic tracking-[0.25em]">RÚT TIỀN CỰC NHANH VỀ ATM CHỈ TỪ 50,000 P (5K VNĐ) - XỬ LÝ TRONG 5-30 PHÚT!</span>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl nova-gradient">DIAMOND HUB</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-4">Xác nhận định danh: <span className="text-blue-400 italic font-black">{user.fullname}</span></p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView(AppView.TASKS)} className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 hover:brightness-125 text-white font-black px-12 py-6 rounded-3xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-4 transition-all active:scale-90 uppercase tracking-widest text-xs italic">BẮT ĐẦU NHIỆM VỤ <ArrowUpRight className="w-6 h-6" /></button>
          <button onClick={() => setView(AppView.LEADERBOARD)} className="p-6 bg-slate-900 border border-white/10 rounded-3xl hover:bg-slate-800 transition-all text-amber-500 shadow-2xl active:scale-95"><Trophy className="w-8 h-8" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Latest Announcement */}
        {latestAnnouncement && (
          <div 
            onClick={() => setView(AppView.NOTIFICATIONS)}
            className="glass-card p-8 md:p-10 rounded-[3.5rem] border border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-transparent flex items-center gap-8 group cursor-pointer hover:bg-white/[0.05] transition-all shadow-2xl relative overflow-hidden h-full"
          >
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
               <Bell className="w-10 h-10 text-white animate-bounce" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] italic">TIN TỨC QUAN TRỌNG</span>
                 <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded italic">NEW</span>
               </div>
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 line-clamp-1">{latestAnnouncement.title}</h3>
               <p className="text-slate-400 text-sm font-medium italic line-clamp-1">{latestAnnouncement.content}</p>
            </div>
          </div>
        )}

        {/* AI Assistant Quick Card */}
        <div 
          onClick={() => setView(AppView.SUPPORT)}
          className="glass-card p-8 md:p-10 rounded-[3.5rem] border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-transparent flex items-center gap-8 group cursor-pointer hover:bg-white/[0.05] transition-all shadow-2xl relative overflow-hidden h-full"
        >
          <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
             <Bot className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
               <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] italic">TRỢ LÝ THÔNG MINH</span>
               <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
             </div>
             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">HỎI AI GEMINI 3.0</h3>
             <p className="text-slate-400 text-sm font-medium italic">Hỗ trợ 24/7 về nạp, rút và nhiệm vụ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        <StatCard 
          index={0}
          icon={<Zap />}
          label="Nhiệm vụ hôm nay"
          value={user.tasksToday}
          suffix="/ 10"
          borderColor="border-l-blue-600"
          iconColor="text-blue-500"
        />
        <StatCard 
          index={1}
          icon={<Star />}
          label="Số dư hiện tại"
          value={formatK(user.balance)}
          suffix="P"
          borderColor="border-l-emerald-600"
          iconColor="text-emerald-500"
        />
        <StatCard 
          index={2}
          icon={<TrendingUp />}
          label="Tổng tích lũy"
          value={formatK(user.totalEarned || 0)}
          suffix="P"
          borderColor="border-l-purple-600"
          iconColor="text-purple-500"
        />
      </div>

      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 bg-slate-900/10 shadow-inner">
        <div className="flex items-center gap-5 mb-8">
           <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-400 border border-blue-500/20">
              <History className="w-8 h-8" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">BẢNG TIN HOẠT ĐỘNG</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Lịch sử thông báo & thưởng cá nhân</p>
           </div>
        </div>

        <div className="space-y-4">
           {personalNotifications.length === 0 ? (
             <div className="py-10 text-center">
                <p className="text-slate-600 font-black uppercase italic tracking-widest text-xs">Chưa có thông báo hoạt động nào mới.</p>
             </div>
           ) : (
             personalNotifications.map((n, i) => (
               <div key={n.id} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-5">
                     <div className={`p-3 rounded-xl ${n.type === 'referral' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>
                        {n.type === 'referral' ? <TrendingUp className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                     </div>
                     <div>
                        <h4 className="text-white font-black uppercase italic text-sm group-hover:text-blue-400 transition-colors">{n.title}</h4>
                        <p className="text-slate-500 text-[11px] font-medium italic">{n.content}</p>
                     </div>
                  </div>
                  <span className="text-[10px] text-slate-700 font-black italic">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
               </div>
             ))
           )}
        </div>
        
        <button 
          onClick={() => setView(AppView.NOTIFICATIONS)}
          className="w-full mt-8 py-4 border-2 border-white/5 rounded-2xl text-[10px] font-black text-slate-600 uppercase italic tracking-widest hover:text-white hover:border-blue-500/30 transition-all bg-white/[0.02]"
        >
          XEM TẤT CẢ THÔNG BÁO
        </button>
      </div>

      {ads.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-6 px-4">
             <ShoppingBag className="w-8 h-8 text-amber-500" />
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">ĐỐI TÁC TÀI TRỢ</h3>
             <div className="flex-1 h-px bg-gradient-to-r from-slate-800 via-slate-700 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {ads.map(ad => (
              <a key={ad.id} href={ad.targetUrl} target="_blank" className="glass-card group p-8 rounded-[3.5rem] border border-white/5 hover:border-blue-500/50 transition-all flex flex-col h-full bg-slate-900/30 shadow-2xl overflow-hidden">
                <div className="aspect-video rounded-[2.5rem] overflow-hidden mb-8 relative shrink-0 border border-white/10 shadow-inner">
                   <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                   <div className="absolute top-6 right-6 p-3 bg-black/70 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-6 h-6" /></div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="text-white font-black text-xl md:text-2xl uppercase italic tracking-tight leading-tight mb-6 group-hover:text-blue-400 transition-colors">{ad.title}</h4>
                  <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">Premium Partner</span>
                    <span className="text-blue-500 font-black text-[12px] uppercase italic tracking-[0.25em] group-hover:translate-x-3 transition-transform">XEM NGAY →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
