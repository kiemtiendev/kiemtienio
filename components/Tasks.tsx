
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { TASK_GATES, formatK } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { getShortLink } from '../services/taskService.ts';
import { 
  Zap, 
  Loader2, 
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Flame
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

interface PendingTask {
  gateId: number;
  gateName: string;
  points: number;
  token: string;
  timestamp: number;
}

const Tasks: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [activeTask, setActiveTask] = useState<PendingTask | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [generatingGate, setGeneratingGate] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nova_pending_task');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < 1800 * 1000) {
        setActiveTask(parsed);
      } else {
        localStorage.removeItem('nova_pending_task');
      }
    }
  }, []);

  const generateToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return `NOVA-${Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")}`;
  };

  const startTask = async (gate: typeof TASK_GATES[0]) => {
    const currentCount = user.taskCounts[gate.name] || 0;
    if (currentCount >= gate.quota) return;

    setGeneratingGate(gate.id);
    const token = generateToken();
    
    const shortLink = await getShortLink(gate.id, gate.apiKey || '', user.id, token);
    
    if (shortLink) {
      const taskData: PendingTask = { 
        gateId: gate.id, 
        gateName: gate.name, 
        points: gate.rate, 
        token, 
        timestamp: Date.now() 
      };
      localStorage.setItem('nova_pending_task', JSON.stringify(taskData));
      setActiveTask(taskData);
      setGeneratingGate(null);
      window.open(shortLink, "_blank");
    } else {
      setGeneratingGate(null);
      alert("Lỗi khởi tạo cổng khai thác. Vui lòng thử lại!");
    }
  };

  const verifyTask = () => {
    if (!activeTask || !inputToken.trim()) return;
    setStatus('loading');

    setTimeout(() => {
      if (inputToken.trim().toUpperCase() === activeTask.token) {
        const newTaskCounts = { ...user.taskCounts };
        newTaskCounts[activeTask.gateName] = (newTaskCounts[activeTask.gateName] || 0) + 1;

        const updatedUser = {
          ...user,
          balance: user.balance + activeTask.points,
          totalEarned: (user.totalEarned || 0) + activeTask.points,
          tasksToday: (user.tasksToday || 0) + 1,
          taskCounts: newTaskCounts
        };

        onUpdateUser(updatedUser);
        dbService.logActivity(user.id, user.fullname, 'Hoàn thành nhiệm vụ', `Nhận +${activeTask.points} P từ ${activeTask.gateName}`);
        
        setStatus('success');
        localStorage.removeItem('nova_pending_task');
        setTimeout(() => {
          setActiveTask(null);
          setInputToken('');
          setStatus('idle');
        }, 3000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1500);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Mining Dashboard Banner */}
      <div className="relative overflow-hidden glass-card p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-3xl bg-[#0a0f18] group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <Cpu className="w-80 h-80 text-blue-500" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 text-xs font-black uppercase tracking-[0.4em] italic shadow-glow-sm">
              <ShieldCheck className="w-4 h-4" /> SECURE MINING VISION 1.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-none uppercase tracking-tighter italic drop-shadow-2xl">
              MINING <span className="nova-gradient">CORE</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed italic">
              Khai thác điểm thưởng (P) thông qua các cổng liên kết xác thực. Hệ thống tự động quy đổi sang Kim Cương Free Fire hoặc VNĐ.
            </p>
          </div>
          
          <div className="w-full lg:w-[380px] glass-card p-10 rounded-[3.5rem] border border-white/10 bg-slate-950/50 backdrop-blur-3xl shadow-2xl">
             <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">Tổng khai thác hôm nay</span>
                   <h2 className="text-6xl font-black text-white italic tracking-tighter">{user.tasksToday || 0}</h2>
                </div>
                <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-500 border border-blue-500/20">
                   <Flame className="w-8 h-8 animate-pulse" />
                </div>
             </div>
             <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all" style={{ width: `${Math.min((user.tasksToday || 0) * 10, 100)}%` }} />
             </div>
          </div>
        </div>
      </div>

      {/* Grid 6 Nhiệm vụ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TASK_GATES.map((gate) => {
          const currentCount = user.taskCounts[gate.name] || 0;
          const isFull = currentCount >= gate.quota;
          const isGenerating = generatingGate === gate.id;

          return (
            <div key={gate.id} className={`glass-card p-10 rounded-[3.5rem] border-2 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between shadow-2xl ${isFull ? 'border-red-500/10 opacity-50 grayscale' : 'hover:border-blue-500/50 border-white/5 bg-[#0d121c]'}`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-black text-3xl text-white uppercase italic tracking-tighter">{gate.name}</h3>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">Node #{gate.id.toString().padStart(2, '0')}</span>
                  </div>
                  <div className={`p-3 rounded-2xl bg-slate-950 border border-white/10 ${isFull ? 'text-red-500' : 'text-blue-500'}`}>
                    {isFull ? <Lock className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase">Lợi nhuận</span>
                    <span className="text-2xl font-black text-white italic">+{formatK(gate.rate)} P</span>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase">Giới hạn</span>
                    <span className="text-sm font-black text-slate-300 italic">{currentCount} / {gate.quota} Lượt</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => startTask(gate)} 
                disabled={isFull || isGenerating}
                className={`w-full h-16 rounded-2xl font-black uppercase italic text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden ${isFull ? 'bg-slate-900 text-slate-600' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl active:scale-95'}`}
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : isFull ? 'QUOTA REACHED' : (
                  <>
                    <span>KHỞI CHẠY NODE</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Verification Terminal */}
      {activeTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setActiveTask(null)}></div>
          <div className="glass-card w-full max-w-xl p-12 md:p-16 rounded-[4rem] border border-blue-500/30 relative shadow-[0_0_100px_rgba(59,130,246,0.15)] bg-[#0a0f18]">
            <div className="text-center space-y-8 mb-12">
               <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-blue-500/20">
                  <ShieldCheck className="w-12 h-12 text-blue-500 animate-pulse" />
               </div>
               <div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">SECURE TERMINAL</h2>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] italic">Nhập mã định danh từ Blog xác thực</p>
               </div>
            </div>

            <div className="space-y-8">
              <input 
                type="text" 
                value={inputToken} 
                onChange={e => setInputToken(e.target.value)} 
                placeholder="NOVA-XXXX-XXXX" 
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl px-8 py-8 text-white text-center font-black tracking-[0.3em] outline-none transition-all text-xl uppercase focus:border-blue-600 shadow-3xl"
              />

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setActiveTask(null)}
                  className="py-6 rounded-2xl bg-slate-900 border border-white/5 text-slate-500 font-black uppercase italic tracking-widest text-[10px] hover:bg-slate-800 transition-all"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={verifyTask}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl shadow-2xl shadow-blue-600/40 uppercase tracking-[0.2em] transition-all italic active:scale-95 flex items-center justify-center gap-3"
                >
                  {status === 'loading' ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                    <>
                      <span>XÁC THỰC CORE</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {status === 'success' && (
              <div className="mt-8 text-emerald-500 font-black uppercase italic text-center text-xs tracking-widest animate-bounce">
                + {activeTask.points.toLocaleString()} P ĐÃ ĐƯỢC CỘNG VÀO CORE!
              </div>
            )}
            
            {status === 'error' && (
              <div className="mt-8 text-red-500 font-black uppercase italic text-center text-xs tracking-widest">
                <ShieldAlert className="w-4 h-4 inline mr-2" /> MÃ KHÔNG HỢP LỆ!
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .shadow-glow-sm { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
};

export default Tasks;
