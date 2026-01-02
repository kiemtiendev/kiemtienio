
import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
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
import { WITHDRAW_MILESTONES, RATE_VND_TO_POINT } from '../constants.tsx';

const Guide: React.FC = () => {
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
              <span className="nova-gradient">NHẬN THƯỞNG GAME</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
              Hệ thống Diamond Nova cho phép bạn Nhận Thẻ Game Quân Huy - Kim Cương Miễn Phí 100% qua 3 bước đơn giản.
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
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Vào mục "Nhận Quân Huy - Kim Cương", chọn một cổng rút gọn link để bắt đầu kiếm điểm P.</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative group hover:border-amber-500/30 transition-all">
           <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-400 mb-8 border border-amber-500/20 shadow-inner">
              <MousePointer2 className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic block mb-2">BƯỚC 02</span>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">VƯỢT LINK <br /> AN TOÀN</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Làm theo hướng dẫn của link rút gọn để lấy mã xác nhận NOVA KEY cuối cùng.</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative group hover:border-emerald-500/30 transition-all">
           <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 shadow-inner">
              <Key className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic block mb-2">BƯỚC 03</span>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">DÁN KEY <br /> NHẬN THƯỞNG</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed">Dán mã KEY vào khung xác thực để được hệ thống cộng điểm thưởng (P) ngay lập tức.</p>
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
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Tỷ lệ quy đổi: <span className="text-white">1 VNĐ = 10 P</span></p>
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
                  Hỗ trợ rút về Ngân hàng hoặc Ví điện tử (Momo, MB Bank, VCB...).
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Thời gian xử lý: 5 - 30 phút kể từ lúc gửi yêu cầu.
                </li>
              </ul>
            </div>

            {/* Game Method */}
            <div className="glass-card p-8 rounded-[3rem] border border-white/10 bg-black/40 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-purple-600/20 rounded-2xl text-purple-400 border border-purple-500/20"><Gamepad2 className="w-8 h-8" /></div>
                 <div>
                   <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">RÚT THƯỞNG GAME</h4>
                   <span className="text-[10px] font-bold text-slate-500">Nhận Thẻ Game Quân Huy - Kim Cương</span>
                 </div>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                  Hỗ trợ quy đổi trực tiếp sang Quân Huy (Liên Quân) hoặc Kim Cương (Free Fire).
                </li>
                <li className="flex gap-3 text-sm text-slate-400 font-medium italic">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                  Yêu cầu cung cấp chính xác ID Game trong hồ sơ cá nhân.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
