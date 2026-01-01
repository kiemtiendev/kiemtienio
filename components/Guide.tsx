
import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  MessageCircle, 
  Youtube, 
  CheckCircle2, 
  ExternalLink, 
  Target, 
  Key, 
  Flame, 
  MousePointer2,
  Wallet,
  Building2,
  Gamepad2,
  Clock,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import { SOCIAL_LINKS, WITHDRAW_MILESTONES, RATE_VND_TO_POINT, formatK } from '../constants.tsx';

const Guide: React.FC = () => {
  const minWithdrawVND = Math.min(...WITHDRAW_MILESTONES);
  const minPoints = minWithdrawVND * RATE_VND_TO_POINT;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden glass-card p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-2xl bg-gradient-to-br from-blue-600/5 to-indigo-700/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Sparkles className="w-64 h-64 text-blue-500" />
        </div>
        
        <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-xs font-black uppercase tracking-[0.3em] italic">
              <ShieldCheck className="w-4 h-4" /> QUY TRÌNH CHUẨN VISION 1.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter italic">
              CẨM NANG <br />
              <span className="nova-gradient">CÀY NHIỆM VỤ</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
              Hệ thống Diamond Nova sử dụng cơ chế vượt link rút gọn an toàn. Hãy làm theo 3 bước sau để nhận thưởng điểm (P) không giới hạn mỗi ngày.
            </p>
        </div>
      </div>

      {/* Main Guide Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative group hover:border-blue-500/30 transition-all">
           <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 shadow-inner">
              <Target className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic block mb-2">BƯỚC 01</span>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">CHỌN CỔNG <br /> NHIỆM VỤ</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Vào mục "Kiếm Kim Cương", chọn một cổng (Link4M, LayMaNgay,...) còn quota để bắt đầu.</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative group hover:border-amber-500/30 transition-all">
           <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-400 mb-8 border border-amber-500/20 shadow-inner">
              <MousePointer2 className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic block mb-2">BƯỚC 02</span>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">VƯỢT LINK <br /> AN TOÀN</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Làm theo hướng dẫn của link rút gọn (Vượt Captcha, Đợi giây) để lấy mã KEY cuối cùng.</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative group hover:border-emerald-500/30 transition-all">
           <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 shadow-inner">
              <Key className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic block mb-2">BƯỚC 03</span>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">DÁN KEY <br /> NHẬN THƯỞNG</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Quay lại trang Diamond Nova, dán KEY vào khung xác nhận. Hệ thống sẽ cộng điểm (P) ngay lập tức.</p>
        </div>
      </div>

      {/* Withdrawal Guide Section */}
      <div className="glass-card p-12 rounded-[4rem] border border-white/5 relative overflow-hidden bg-gradient-to-br from-emerald-600/10 to-blue-600/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -rotate-12"><Wallet className="w-64 h-64 text-emerald-500" /></div>
        
        <div className="relative z-10 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center justify-center gap-4">
               <Wallet className="w-10 h-10 text-emerald-500" /> HƯỚNG DẪN RÚT THƯỞNG
            </h2>
            <div className="flex items-center justify-center gap-3">
               <div className="bg-emerald-600/20 p-1 rounded-lg border border-emerald-500/30">
                 <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
               </div>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Tỷ lệ quy đổi: <span className="text-white">1 VNĐ = 10 P</span> (Ví dụ: 5.000 VNĐ = 50.000 P)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ATM Method */}
            <div className="glass-card p-8 rounded-[3rem] border border-white/10 bg-black/40 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-emerald-600/20 rounded-2xl text-emerald-400 border border-emerald-500/20"><Building2 className="w-8 h-8" /></div>
                 <div>
                   <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">RÚT TIỀN ATM / VND</h4>
                   <span className="text-[10px] font-bold text-slate-500">Quy đổi: 5.000đ = 50.000 P</span>
                 </div>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Hỗ trợ tất cả ngân hàng tại Việt Nam (MB, VCB, Momo...).
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Mức rút tối thiểu: <b className="text-white">50.000 P</b> (5.000đ).
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Yêu cầu: Cập nhật STK & Tên ngân hàng trong phần Hồ Sơ.
                </li>
              </ul>
            </div>

            {/* Game Method */}
            <div className="glass-card p-8 rounded-[3rem] border border-white/10 bg-black/40 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-purple-600/20 rounded-2xl text-purple-400 border border-purple-500/20"><Gamepad2 className="w-8 h-8" /></div>
                 <div>
                   <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">KIM CƯƠNG GAME</h4>
                   <span className="text-[10px] font-bold text-slate-500">Tỷ lệ: 50.000 P = 25 Kim cương</span>
                 </div>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                  Nạp trực tiếp vào tài khoản qua ID Game.
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                  Hỗ trợ game: Free Fire, Liên Quân Mobile.
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                  Yêu cầu: Cung cấp chính xác ID Game trong phần Hồ Sơ.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 bg-slate-900/40">
               <Clock className="w-8 h-8 text-blue-400" />
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Thời gian xử lý</p>
                  <p className="text-white font-black italic text-lg tracking-tight">5 - 30 PHÚT</p>
               </div>
            </div>
            <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 bg-slate-900/40">
               <ShieldAlert className="w-8 h-8 text-amber-400" />
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Phí giao dịch</p>
                  <p className="text-white font-black italic text-lg tracking-tight">MIỄN PHÍ 100%</p>
               </div>
            </div>
            <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 bg-slate-900/40">
               <ShieldCheck className="w-8 h-8 text-emerald-400" />
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Trạng thái cổng</p>
                  <p className="text-emerald-400 font-black italic text-lg tracking-tight">HOẠT ĐỘNG 24/7</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="glass-card p-12 rounded-[4rem] border border-white/5 bg-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Flame className="w-48 h-48 text-orange-500" /></div>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-4"><Zap className="w-7 h-7 text-amber-500" /> LƯU Ý QUAN TRỌNG (PRO TIPS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex gap-5">
              <div className="p-3 bg-emerald-500/10 rounded-xl h-fit border border-emerald-500/20"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">Nên sử dụng trình duyệt Chrome hoặc Safari bản mới nhất để link hoạt động mượt nhất.</p>
           </div>
           <div className="flex gap-5">
              <div className="p-3 bg-emerald-500/10 rounded-xl h-fit border border-emerald-500/20"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">Nếu gặp lỗi mã không hợp lệ, hãy kiểm tra xem bạn đã lấy đúng mã Key ở trang cuối cùng chưa.</p>
           </div>
           <div className="flex gap-5">
              <div className="p-3 bg-emerald-500/10 rounded-xl h-fit border border-emerald-500/20"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">Mã Key có hiệu lực trong vòng 1500 giây (~25 phút) kể từ khi tạo link.</p>
           </div>
           <div className="flex gap-5">
              <div className="p-3 bg-emerald-500/10 rounded-xl h-fit border border-emerald-500/20"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">Không sử dụng VPN, trình chặn quảng cáo hoặc tab ẩn danh khi vượt link.</p>
           </div>
        </div>
      </div>

      {/* Video & Community */}
      <div className="flex flex-col md:flex-row gap-8">
         <a href={SOCIAL_LINKS.YOUTUBE} target="_blank" className="flex-1 glass-card p-10 rounded-[3rem] border border-white/5 hover:bg-red-600/5 hover:border-red-600/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-6">
               <div className="p-5 bg-red-600/10 rounded-2xl text-red-500 border border-red-500/20"><Youtube className="w-10 h-10" /></div>
               <div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">XEM VIDEO HƯỚNG DẪN</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Săn kim cương 100% thành công</p>
               </div>
            </div>
            <ExternalLink className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
         </a>
         <a href={SOCIAL_LINKS.TELEGRAM} target="_blank" className="flex-1 glass-card p-10 rounded-[3rem] border border-white/5 hover:bg-blue-600/5 hover:border-blue-600/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-6">
               <div className="p-5 bg-blue-600/10 rounded-2xl text-blue-400 border border-red-500/20"><MessageCircle className="w-10 h-10" /></div>
               <div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">THAM GIA CỘNG ĐỒNG</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Cập nhật thông tin & Event mới</p>
               </div>
            </div>
            <ExternalLink className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
         </a>
      </div>
    </div>
  );
};

export default Guide;
