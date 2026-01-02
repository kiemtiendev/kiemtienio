
import React, { useState, useEffect } from 'react';
import { User, Announcement } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { Sparkles, Star, TrendingUp, Zap, Clock, CreditCard, ArrowRight } from 'lucide-react';
import { formatK } from '../constants.tsx';

interface DashboardProps {
  user: User;
  setView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setView }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    dbService.getAnnouncements().then(setAnnouncements);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Fix: Added announcements state and fetch logic to fix "Cannot find name 'announcements'" */}
      <div className="glass-card p-4 rounded-3xl flex items-center gap-4 bg-slate-900/40 border border-white/5">
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap animate-marquee flex gap-10">
             {announcements.length > 0 ? (
               announcements.map((ann) => (
                 <span key={ann.id} className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">
                   ✦ {ann.title.toUpperCase()}: {ann.content}
                 </span>
               ))
             ) : (
               <span className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">CHÀO MỪNG ĐẾN VỚI DIAMOND NOVA - HỆ THỐNG NHIỆM VỤ KIẾM TIỀN QUÂN HUY KIM CƯƠNG MIỄN PHÍ</span>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none nova-gradient">DIAMOND NOVA HUB</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">HỆ THỐNG NHIỆM VỤ - KIẾM TIỀN <span className="text-blue-400 italic font-black">Online 24/7</span></p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
          <div className="flex flex-col items-end px-4">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Server Status</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase italic">Stable Vision 1.0</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-emerald-500 animate-pulse" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem] border-l-8 border-l-blue-600 bg-blue-600/5 shadow-xl group hover:scale-105 transition-all cursor-pointer" onClick={() => setView('tasks')}>
           <TrendingUp className="w-8 h-8 text-blue-500 mb-6 group-hover:rotate-12 transition-transform" />
           <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">Nhiệm vụ hôm nay</p>
           <h3 className="text-3xl font-black text-white italic">{user.tasksToday || 0}</h3>
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border-l-8 border-l-amber-500 bg-amber-500/5 shadow-xl group hover:scale-105 transition-all">
           <Star className="w-8 h-8 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">Số dư hiện tại</p>
           <h3 className="text-3xl font-black text-white italic">{formatK(user.balance)} P</h3>
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border-l-8 border-l-emerald-600 bg-emerald-600/5 shadow-xl group hover:scale-105 transition-all">
           <Zap className="w-8 h-8 text-emerald-500 mb-6 group-hover:-translate-y-1 transition-transform" />
           <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">Tổng thu nhập</p>
           <h3 className="text-3xl font-black text-white italic">{formatK(user.totalEarned)} P</h3>
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border-l-8 border-l-purple-600 bg-purple-600/5 shadow-xl group hover:scale-105 transition-all">
           <Clock className="w-8 h-8 text-purple-500 mb-6 group-hover:rotate-12 transition-transform" />
           <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">Ngày tham gia</p>
           <h3 className="text-xl font-black text-white italic">{new Date(user.joinDate).toLocaleDateString('vi-VN')}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10">
         <div className="lg:col-span-2 glass-card p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-transparent">
            <Sparkles className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none w-64 h-64 text-blue-500" />
            <div className="relative z-10 space-y-8">
               <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">BẮT ĐẦU KIẾM QUÂN HUY</h2>
                  <p className="text-slate-400 text-sm font-medium italic mt-2">Tham gia giải đố và vượt link rút gọn để nhận hàng ngàn điểm Nova (P) mỗi ngày.</p>
               </div>
               <div className="flex flex-wrap gap-4">
                  <button onClick={() => setView('tasks')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-[11px] tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95 transition-all">LÀM NHIỆM VỤ <ArrowRight size={16} /></button>
                  <button onClick={() => setView('guide')} className="px-8 py-4 bg-slate-900 text-slate-400 rounded-2xl font-black uppercase italic text-[11px] tracking-widest border border-white/5 hover:bg-slate-800 transition-all">XEM HƯỚNG DẪN</button>
               </div>
            </div>
         </div>

         <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 flex flex-col items-center text-center justify-center space-y-6 bg-slate-900/40">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20"><CreditCard className="w-10 h-10 text-emerald-500" /></div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">QUY ĐỔI THƯỞNG</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Đổi điểm lấy Quân Huy, Kim Cương <br />hoặc Tiền mặt về ATM</p>
            <button onClick={() => setView('withdraw')} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all">RÚT THƯỞNG NGAY</button>
         </div>
      </div>
    </div>
  );
};

// Fix: Added default export
export default Dashboard;
