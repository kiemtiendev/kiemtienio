import React, { useMemo, useEffect, useState, useRef } from 'react';
import { User, AppView, Announcement, AdBanner, AdminNotification } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK, DAILY_TASK_LIMIT } from '../constants.tsx';
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
  return (
    <div 
      className={`glass-card p-6 md:p-8 rounded-[2.5rem] border-l-4 ${borderColor} relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300 shadow-xl`}
    >
      <div 
        className={`absolute top-0 right-0 w-24 h-24 ${iconColor} opacity-[0.1] -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none`}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-full h-full filter blur-[1px]' })}
      </div>
      <div className="relative z-10">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic block">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">
            {value}
          </h2>
          <span className={`${iconColor} font-black text-[10px] uppercase`}>
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ user, setView }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const anns = await dbService.getAnnouncements();
      setAnnouncements(anns);
      const allAds = await dbService.getAds(false);
      setAds(allAds.filter(a => a.isActive));
      const notifs = await dbService.getNotifications(user.id);
      setPersonalNotifications(notifs.slice(0, 5));
    };
    fetchData();
  }, [user.id]);

  const latestAnnouncement = announcements[0];
  
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Marquee Banner */}
      <div className="w-full bg-blue-600/10 border border-blue-500/20 rounded-2xl overflow-hidden py-3 px-6 flex items-center gap-4 group shadow-lg backdrop-blur-xl">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-600/30 shrink-0">
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap animate-marquee flex gap-10">
             {announcements.length > 0 ? (
               announcements.map((ann) => (
                 <span key={ann.id} className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">
                   ✦ {ann.title.toUpperCase()}: {ann.content}
                 </span>
               ))
             ) : (
               <span className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">CHÀO MỪNG ĐẾN VỚI DIAMOND NOVA - HỆ THỐNG KIẾM TIỀN & KIM CƯƠNG FF SỐ 1 VN</span>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none nova-gradient">DIAMOND HUB</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Xác nhận định danh: <span className="text-blue-400 italic font-black">{user.fullname}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView(AppView.TASKS)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest text-[10px] italic">BẮT ĐẦU <ArrowUpRight className="w-4 h-4" /></button>
          <button onClick={() => setView(AppView.LEADERBOARD)} className="p-4 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all text-amber-500 shadow-xl active:scale-95"><Trophy className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {latestAnnouncement && (
          <div 
            onClick={() => setView(AppView.NOTIFICATIONS)}
            className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-blue-500/10 bg-gradient-to-r from-blue-600/5 to-transparent flex items-center gap-6 group cursor-pointer hover:border-blue-500/30 transition-all shadow-xl relative overflow-hidden h-full"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
               <Bell className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">TIN MỚI</span>
                 <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black rounded italic">NEW</span>
               </div>
               <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-1 line-clamp-1">{latestAnnouncement.title}</h3>
               <p className="text-slate-500 text-[11px] font-medium italic line-clamp-1">{latestAnnouncement.content}</p>
            </div>
          </div>
        )}

        <div 
          onClick={() => setView(AppView.SUPPORT)}
          className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-violet-500/10 bg-gradient-to-r from-violet-600/5 to-transparent flex items-center gap-6 group cursor-pointer hover:border-violet-500/30 transition-all shadow-xl relative overflow-hidden h-full"
        >
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
             <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest italic">AI ASSISTANT</span>
               <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
             </div>
             <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-1">TRỢ LÝ GEMINI 3.0</h3>
             <p className="text-slate-500 text-[11px] font-medium italic">Hỗ trợ 24/7 về nạp & rút</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          index={0}
          icon={<Zap />}
          label="Nhiệm vụ ngày"
          value={user.tasksToday}
          suffix={`/ ${DAILY_TASK_LIMIT}`}
          borderColor="border-l-blue-600"
          iconColor="text-blue-500"
        />
        <StatCard 
          index={1}
          icon={<Star />}
          label="Số dư điểm"
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

      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/10 shadow-inner">
        <div className="flex items-center gap-4 mb-6">
           <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-500/20">
              <History className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">BẢNG TIN HOẠT ĐỘNG</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Lịch sử giao dịch & thưởng cá nhân</p>
           </div>
        </div>

        <div className="space-y-3">
           {personalNotifications.length === 0 ? (
             <div className="py-8 text-center">
                <p className="text-slate-700 font-black uppercase italic tracking-widest text-[9px]">Chưa có thông báo hoạt động nào mới.</p>
             </div>
           ) : (
             personalNotifications.map((n) => (
               <div key={n.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-4">
                     <div className={`p-2 rounded-lg ${n.type === 'referral' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>
                        {n.type === 'referral' ? <TrendingUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                     </div>
                     <div>
                        <h4 className="text-white font-black uppercase italic text-xs group-hover:text-blue-400 transition-colors">{n.title}</h4>
                        <p className="text-slate-500 text-[10px] font-medium italic">{n.content}</p>
                     </div>
                  </div>
                  <span className="text-[9px] text-slate-700 font-black italic">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
               </div>
             ))
           )}
        </div>
        
        <button 
          onClick={() => setView(AppView.NOTIFICATIONS)}
          className="w-full mt-6 py-3 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase italic tracking-widest hover:text-white hover:border-blue-500/30 transition-all bg-white/[0.01]"
        >
          XEM TẤT CẢ THÔNG BÁO
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
