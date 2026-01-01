
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
    <div className="space-y-8 animate-in fade-in duration-1000 pb-24 px-2">
      {/* 1. COMPACT AUTHENTICATION TERMINAL */}
      <div className="relative pt-4 max-w-2xl mx-auto">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#02040a] px-6 z-10 border-x border-cyan-500/50 py-0.5">
          <span className="text-[9px] font-black text-cyan-500 tracking-[0.3em] uppercase italic flex items-center gap-2">
             <Terminal className="w-3 h-3" /> SECURITY HUB
          </span>
        </div>
        <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-cyan-500/20 bg-gradient-to-b from-blue-900/20 to-black/95 backdrop-blur-3xl shadow-xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
             <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30 security-pulse">
                {status === 'loading' ? (
                  <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                ) : (
                  <LockKeyhole className="w-7 h-7 text-cyan-400" />
                )}
             </div>
             <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">XÁC THỰC MÃ KEY</h2>
                <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] italic">NHẬP MÃ TỪ BLOG ĐỂ NHẬN ĐIỂM</p>
             </div>
             <div className="w-full space-y-4">
                <div className="relative group">
                  <input type="text" value={inputToken} onChange={(e) => setInputToken(e.target.value)} placeholder="NOVA-XXXX-XXXX" className="w-full bg-black/80 border border-slate-900 rounded-2xl px-6 py-4 text-cyan-400 text-center font-black tracking-[0.2em] outline-none transition-all text-xl uppercase focus:border-cyan-500 shadow-inner" />
                </div>
                <button onClick={verifyTask} disabled={status === 'loading' || !inputToken.trim() || !activeTask} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 italic shadow-lg ${status === 'loading' || !activeTask ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 text-white hover:brightness-110 active:scale-95'}`}>
                  {status === 'loading' ? 'ĐANG KIỂM TRA...' : 'KÍCH HOẠT NHẬN ĐIỂM'}
                </button>
                {status === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase italic text-[9px] tracking-wider animate-bounce">
                    <CheckCircle2 className="w-4 h-4" /> ĐÃ CỘNG {activeTask?.points} P
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-black uppercase italic text-[9px] tracking-wider">
                    <ShieldAlert className="w-4 h-4" /> MÃ KEY KHÔNG HỢP LỆ!
                  </div>
                )}
                {!activeTask && status !== 'success' && (
                   <div className="flex items-center justify-center gap-2 text-slate-600 text-[8px] font-black uppercase tracking-wider italic">
                      <MousePointer2 className="w-3 h-3" /> CHƯA CÓ NHIỆM VỤ ĐANG CHỜ
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* 2. BẢNG NHIỆM VỤ */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center gap-4 justify-center md:justify-start">
           <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <LayoutGrid className="w-6 h-6 text-cyan-400" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">BẮT ĐẦU KHAI THÁC</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">HẠN MỨC CÒN LẠI: {DAILY_TASK_LIMIT - user.tasksToday} LƯỢT</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(TASK_RATES).map(([idStr, gate]) => {
            const id = parseInt(idStr);
            const currentCount = user.taskCounts[gate.name] || 0;
            const isFull = currentCount >= gate.limit;
            const isGenerating = generatingGate === id;
            return (
              <div key={id} className={`group relative glass-card p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-xl ${isFull ? 'border-red-500/10 grayscale opacity-40' : 'hover:border-cyan-400/50 border-white/5 bg-[#0a0f1e]/90'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-xl text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors">{gate.name}</h4>
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic">GATE #{id}</span>
                    </div>
                    <div className={`p-3 rounded-xl bg-black border transition-all ${isFull ? 'border-red-500/20 text-red-500' : 'border-cyan-500/20 text-cyan-500'}`}>
                      {isFull ? <Lock className="w-5 h-5" /> : <Zap className="w-5 h-5 animate-pulse" />}
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-600 uppercase italic">THƯỞNG</span>
                      <span className="text-2xl font-black text-white italic">+{formatK(gate.reward)} P</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-600 uppercase italic">LƯỢT NHẬN</span>
                      <span className="text-xs font-black text-cyan-500 italic uppercase">{currentCount} / {gate.limit}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => startTask(id)} disabled={isFull || isGenerating} className={`w-full h-14 rounded-2xl font-black uppercase italic text-[9px] tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn ${isFull ? 'bg-slate-900 text-slate-700' : 'bg-white text-black hover:bg-cyan-500 hover:text-white shadow-md'}`}>
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : isFull ? 'HẾT LƯỢT' : (
                    <>
                      <span>MỞ LINK</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
