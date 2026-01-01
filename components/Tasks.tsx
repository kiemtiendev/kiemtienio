
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { TASK_RATES, formatK, DAILY_TASK_LIMIT } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { openTaskLink } from '../services/taskService.ts';
import { 
  Zap, 
  Loader2, 
  Lock, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  LockKeyhole, 
  Terminal, 
  Activity, 
  MousePointer2,
  LayoutGrid,
  Cpu
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

  const startTask = async (id: number) => {
    const gate = TASK_RATES[id];
    const currentCount = user.taskCounts[gate.name] || 0;
    
    if (currentCount >= gate.limit) return;
    if (user.tasksToday >= DAILY_TASK_LIMIT) return alert(`Hệ thống: Bạn đã đạt giới hạn ${DAILY_TASK_LIMIT} nhiệm vụ/ngày!`);

    setGeneratingGate(id);
    const token = generateToken();
    
    const taskData: PendingTask = { 
      gateId: id, 
      gateName: gate.name, 
      points: gate.reward, 
      token, 
      timestamp: Date.now() 
    };
    
    localStorage.setItem('nova_pending_task', JSON.stringify(taskData));
    setActiveTask(taskData);
    
    // Fix: dbService.logActivity expects 4 arguments based on updated definition.
    await dbService.logActivity(user.id, user.fullname, 'Nhiệm vụ mới', `Cổng: ${gate.name}`);
    await openTaskLink(id, user.id, token);
    setGeneratingGate(null);
  };

  const verifyTask = () => {
    if (!activeTask || !inputToken.trim()) return;
    setStatus('loading');

    setTimeout(async () => {
      const input = inputToken.trim().toUpperCase();
      if (input === activeTask.token || input === activeTask.token.replace('NOVA-', '')) {
        const newTaskCounts = { ...user.taskCounts };
        newTaskCounts[activeTask.gateName] = (newTaskCounts[activeTask.gateName] || 0) + 1;

        const updatedUser = {
          ...user,
          balance: user.balance + activeTask.points,
          totalEarned: (user.totalEarned || 0) + activeTask.points,
          tasksToday: (user.tasksToday || 0) + 1,
          taskCounts: newTaskCounts,
          lastTaskDate: new Date().toISOString()
        };

        onUpdateUser(updatedUser);
        // Fix: dbService.logActivity expects 4 arguments.
        await dbService.logActivity(user.id, user.fullname, 'Hoàn thành nhiệm vụ', `Nhận +${activeTask.points} P từ ${activeTask.gateName}`);
        
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
    }, 1200);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-24 px-2">
      {/* 1. AUTHENTICATION TERMINAL */}
      <div className="relative pt-8 max-w-4xl mx-auto">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#02040a] px-10 z-10 border-x-2 border-cyan-500/50 py-1">
          <span className="text-[11px] font-black text-cyan-500 tracking-[0.5em] uppercase italic flex items-center gap-3">
             <Terminal className="w-4 h-4" /> VERIFICATION CORE
          </span>
        </div>
        <div className="glass-card p-10 md:p-16 rounded-[4rem] border-2 border-cyan-500/20 bg-gradient-to-b from-blue-900/30 to-black/95 backdrop-blur-3xl shadow-[0_0_100px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="flex flex-col items-center text-center gap-8 relative z-10">
             <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center border-2 border-cyan-500/30 security-pulse">
                {status === 'loading' ? (
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                ) : (
                  <LockKeyhole className="w-12 h-12 text-cyan-400" />
                )}
             </div>
             <div className="space-y-2">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">XÁC THỰC SECURITY KEY</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed max-w-md mx-auto">NHẬP MÃ THU THẬP ĐƯỢC TỪ BLOG ĐỂ GIẢI PHÓNG ĐIỂM THƯỞNG</p>
             </div>
             <div className="w-full space-y-6">
                <div className="relative group">
                  <input type="text" value={inputToken} onChange={(e) => setInputToken(e.target.value)} placeholder="NOVA-XXXX-XXXX" className="w-full bg-black/80 border-2 border-slate-900 rounded-3xl px-10 py-7 text-cyan-400 text-center font-black tracking-[0.4em] outline-none transition-all text-2xl uppercase focus:border-cyan-500 shadow-inner" />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500 animate-ping"></div>
                </div>
                <button onClick={verifyTask} disabled={status === 'loading' || !inputToken.trim() || !activeTask} className={`w-full py-8 rounded-3xl font-black text-[12px] tracking-[0.4em] transition-all flex items-center justify-center gap-4 italic shadow-2xl ${status === 'loading' || !activeTask ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 text-white hover:brightness-125 hover:shadow-cyan-500/40 active:scale-95'}`}>
                  {status === 'loading' ? 'XÁC MINH DỮ LIỆU...' : 'KÍCH HOẠT QUY TRÌNH TRÍCH XUẤT'}
                </button>
                {status === 'success' && (
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-5 rounded-3xl flex items-center justify-center gap-4 text-emerald-400 font-black uppercase italic text-xs tracking-[0.2em] animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-6 h-6" /> 💎 THÀNH CÔNG! ĐÃ CỘNG {activeTask?.points} P
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-red-500/10 border-2 border-red-500/20 p-5 rounded-3xl flex items-center justify-center gap-4 text-red-400 font-black uppercase italic text-xs tracking-[0.2em]">
                    <ShieldAlert className="w-6 h-6" /> MÃ KEY KHÔNG CHÍNH XÁC! KIỂM TRA LẠI.
                  </div>
                )}
                {!activeTask && status !== 'success' && (
                   <div className="flex items-center justify-center gap-3 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic bg-black/40 py-4 rounded-2xl border border-white/5">
                      <MousePointer2 className="w-4 h-4" /> VUI LÒNG BẮT ĐẦU 1 NHIỆM VỤ PHÍA DƯỚI
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* 2. BẢNG NHIỆM VỤ */}
      <div className="space-y-10 pt-10">
        <div className="flex items-center gap-6 justify-center md:justify-start">
           <div className="p-5 bg-cyan-500/10 rounded-[1.5rem] border-2 border-cyan-500/20">
              <LayoutGrid className="w-8 h-8 text-cyan-400" />
           </div>
           <div>
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">BẢNG NHIỆM VỤ</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">CHỌN CỔNG TRUY CẬP ĐỂ BẮT ĐẦU NHẬN THƯỞNG</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Object.entries(TASK_RATES).map(([idStr, gate]) => {
            const id = parseInt(idStr);
            const currentCount = user.taskCounts[gate.name] || 0;
            const isFull = currentCount >= gate.limit;
            const isGenerating = generatingGate === id;
            return (
              <div key={id} className={`group relative glass-card p-12 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-2xl ${isFull ? 'border-red-500/10 grayscale opacity-40' : 'hover:border-cyan-400/50 border-white/5 bg-[#0a0f1e]/90'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="font-black text-3xl text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors">{gate.name}</h4>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">TASK ACCESS ID #{id}</span>
                    </div>
                    <div className={`p-4 rounded-2xl bg-black border-2 transition-all ${isFull ? 'border-red-500/20 text-red-500' : 'border-cyan-500/20 text-cyan-500 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}>
                      {isFull ? <Lock className="w-7 h-7" /> : <Zap className="w-7 h-7 animate-pulse" />}
                    </div>
                  </div>
                  <div className="space-y-6 mb-12">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-600 uppercase italic tracking-widest">THƯỞNG</span>
                      <span className="text-4xl font-black text-white italic tracking-tighter">+{formatK(gate.reward)} P</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-600 uppercase italic tracking-widest">HẠN MỨC</span>
                      <span className="text-sm font-black text-cyan-500 italic uppercase">{currentCount} / {gate.limit} Lượt</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => startTask(id)} disabled={isFull || isGenerating} className={`w-full h-18 rounded-3xl font-black uppercase italic text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn ${isFull ? 'bg-slate-900 text-slate-700' : 'bg-white text-black hover:bg-cyan-500 hover:text-white shadow-xl hover:shadow-cyan-500/30'}`}>
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : isFull ? 'NHIỆM VỤ ĐÃ HẾT' : (
                    <>
                      <span>BẮT ĐẦU NHIỆM VỤ</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`.shadow-glow-blue { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }`}</style>
    </div>
  );
};

export default Tasks;
