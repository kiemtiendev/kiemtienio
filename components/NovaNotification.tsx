
import React, { useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, 
  X, Sparkles, ShieldAlert 
} from 'lucide-react';
import { Notification } from '../types.ts';

interface Props {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NovaNotification: React.FC<Props> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-24 right-6 z-[300] flex flex-col gap-4 pointer-events-none">
      {notifications.map((notif) => (
        <ToastItem 
          key={notif.id} 
          notif={notif} 
          onClose={() => removeNotification(notif.id)} 
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notif: Notification; onClose: () => void }> = ({ notif, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, notif.duration || 5000);
    return () => clearTimeout(timer);
  }, [onClose, notif.duration]);

  const getStyle = () => {
    switch (notif.type) {
      case 'success': return { icon: <CheckCircle2 className="text-emerald-400" />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
      case 'error': return { icon: <XCircle className="text-rose-400" />, border: 'border-rose-500/30', bg: 'bg-rose-500/10' };
      case 'warning': return { icon: <AlertTriangle className="text-amber-400" />, border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
      case 'security': return { icon: <ShieldCheck className="text-blue-400" />, border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
      default: return { icon: <Info className="text-blue-400" />, border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
    }
  };

  const style = getStyle();

  return (
    <div className={`pointer-events-auto w-80 glass-card p-5 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 flex gap-4 items-start group`}>
      <div className="shrink-0 mt-1">{style.icon}</div>
      <div className="flex-1 space-y-1">
        <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">{notif.title}</h4>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">{notif.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
        <X size={14} />
      </button>
      {notif.type === 'security' && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400/30 animate-scan"></div>
        </div>
      )}
    </div>
  );
};

export const NovaSecurityModal: React.FC<{ score: number; onClose: () => void }> = ({ score, onClose }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-card rounded-[4rem] border border-blue-500/30 overflow-hidden p-12 text-center shadow-[0_0_100px_rgba(59,130,246,0.2)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="w-24 h-24 bg-blue-600/10 rounded-full border border-blue-500/30 flex items-center justify-center mx-auto relative overflow-hidden">
            <ShieldCheck className="w-12 h-12 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 bg-blue-500/10 animate-ping rounded-full"></div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">SENTINEL REPORT</h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Phân tích hành vi thời gian thực</p>
          </div>

          <div className="relative inline-flex flex-col items-center">
             <div className="text-[100px] font-black italic text-white leading-none tracking-tighter drop-shadow-glow">
                {score}<span className="text-3xl text-blue-500">%</span>
             </div>
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
               SECURITY SCORE: OPTIMIZED
             </span>
          </div>

          <p className="text-slate-400 text-sm font-medium italic leading-relaxed max-w-sm mx-auto">
            Hội viên này đã vượt qua các bài kiểm tra bảo mật Sentinel. Không phát hiện dấu hiệu can thiệp Proxy, VPN hay Tool tự động.
          </p>

          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase italic text-xs tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            ĐÓNG BẢN BÁO CÁO
          </button>
        </div>

        {/* Decorative elements */}
        <Sparkles className="absolute top-10 right-10 text-blue-500/10 w-24 h-24" />
        <ShieldAlert className="absolute -bottom-6 -left-6 text-blue-500/5 w-48 h-48" />
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.5));
        }
      `}</style>
    </div>
  );
};

export default NovaNotification;
