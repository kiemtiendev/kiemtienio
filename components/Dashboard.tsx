
import React, { useState, useEffect } from 'react';
import { User, Announcement, AdBanner } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { Sparkles, Star, TrendingUp, Zap, Clock, CreditCard, ArrowRight, Megaphone, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatK } from '../constants.tsx';

interface DashboardProps {
  user: User;
  setView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setView }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    dbService.getAnnouncements().then(setAnnouncements);
    dbService.getAds().then(setAds);
  }, []);

  // Auto cycle ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads]);

  const marqueeContent = announcements.length > 0 
    ? announcements.map(ann => `✦ ${ann.title.toUpperCase()}: ${ann.content}`).join("    |    ")
    : "CHÀO MỪNG ĐẾN VỚI DIAMOND NOVA - HỆ THỐNG NHẬN QUÂN HUY VÀ KIM CƯƠNG MIỄN PHÍ HÀNG ĐẦU VIỆT NAM    |    SỰ KIỆN ĐUA TOP NHẬN QUÀ KHỦNG ĐANG DIỄN RA!";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 1. Thanh thông báo chạy ở trên cùng (Infinite Loop) */}
      <div className="fixed top-0 left-0 right-0 z-[150] bg-blue-600/90 backdrop-blur-md h-8 flex items-center overflow-hidden border-b border-white/10 md:left-72">
        <div className="bg-white text-blue-600 font-black text-[9px] px-4 h-full flex items-center z-20 italic uppercase shrink-0 shadow-lg">TIN MỚI</div>
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          <div className="animate-marquee whitespace-nowrap py-1">
            <span className="text-[10px] font-black text-white uppercase italic tracking-widest px-10">
              {marqueeContent}
            </span>
            {/* Duplicate content for seamless looping */}
            <span className="text-[10px] font-black text-white uppercase italic tracking-widest px-10">
              {marqueeContent}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Khung Quảng cáo Slideshow */}
      <div className="pt-4">
        <div className="relative w-full aspect-[21/9] md:aspect-[21/7] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-slate-900/40 group">
          {ads.length > 0 ? (
            <>
              {ads.map((ad, idx) => (
                <a 
                  key={ad.id} 
                  href={ad.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10">
                    <span className="text-blue-400 font-black text-[8px] uppercase tracking-widest mb-1 italic">TÀI TRỢ NOVA</span>
                    <h3 className="text-white text-lg md:text-2xl font-black italic uppercase tracking-tighter leading-none">{ad.title}</h3>
                  </div>
                </a>
              ))}
              {/* Dots navigation */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {ads.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentAdIndex(idx)}
                    className={`h-1 rounded-full transition-all ${idx === currentAdIndex ? 'w-6 bg-blue-500' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-700 font-black text-xs uppercase italic tracking-widest">Đang tải tài trợ...</div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
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

      {/* 3. Bảng thông báo lớn bên trên bảng số dư */}
      <div className="glass-card p-8 rounded-[3rem] border border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent">
        <Megaphone className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12 pointer-events-none" />
        <div className="flex items-center gap-4 mb-4">
           <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20"><Megaphone className="w-5 h-5 text-white" /></div>
           <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">THÔNG BÁO TỪ QUẢN TRỊ VIÊN</h4>
        </div>
        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.slice(0, 2).map(ann => (
              <div key={ann.id} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
                 <div className="w-1.5 h-auto bg-blue-600 rounded-full group-hover:scale-y-110 transition-transform"></div>
                 <div>
                    <h5 className="text-[11px] font-black text-blue-400 uppercase italic mb-1">{ann.title}</h5>
                    <p className="text-slate-400 text-xs font-medium italic">{ann.content}</p>
                 </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-xs italic font-medium">Hiện tại chưa có thông báo quan trọng nào. Hãy làm nhiệm vụ để tích lũy P!</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
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

export default Dashboard;
