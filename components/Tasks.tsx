
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
  RefreshCw,
  ShieldBan
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

  const checkAndResetDailyLimits = () => {
    if (!user.lastTaskDate) return;
    const lastDate = new Date(user.lastTaskDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    if (today > lastDate) {
      onUpdateUser({
        ...user,
        tasksToday: 0,
        taskCounts: {},
        lastTaskDate: new Date().toISOString() 
      });
    }
  };

  useEffect(() => {
    checkAndResetDailyLimits();
    const saved = localStorage.getItem('nova_pending_task');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Giới hạn 30 phút cho một nhiệm vụ
      if (Date.now() - parsed.timestamp < 1800 * 1000) {
        setActiveTask(parsed);
      } else {
        localStorage.removeItem('nova_pending_task');
      }
    }
    const interval = setInterval(checkAndResetDailyLimits, 60000);
    return () => clearInterval(interval);
  }, [user.lastTaskDate]);

  const generateToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return `NOVA-${Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")}`;
  };

  const startTask = async (id: number) => {
    const gate = TASK_RATES[id];
    const currentCount = user.taskCounts[gate.name] || 0;
    if (currentCount >= gate.limit) return;
    if (user.tasksToday >= DAILY_TASK_LIMIT) return alert(`Bạn đã đạt giới hạn ${DAILY_TASK_LIMIT} nhiệm vụ/ngày!`);

    setGeneratingGate(id);
    const token = generateToken();
    const taskData: PendingTask = { gateId: id, gateName: gate.name, points: gate.reward, token, timestamp: Date.now() };
    
    localStorage.setItem('nova_pending_task', JSON.stringify(taskData));
    setActiveTask(taskData);
    
    await dbService.logActivity(user.id, user.fullname, 'Bắt đầu nhiệm vụ', gate.name);
    await openTaskLink(id, user.id, token);
    setGeneratingGate(null);
  };

  const verifyTask = () => {
    if (!activeTask || !inputToken.trim()) return;
    setStatus('loading');

    setTimeout(async () => {
      const input = inputToken.trim().toUpperCase();
      const cleanToken = activeTask.token.replace('NOVA-', '');
      
      if (input === activeTask.token || input === cleanToken) {
        // Nova Sentinel: Tính thời gian thực hiện
        const timeElapsed = Math.floor((Date.now() - activeTask.timestamp) / 1000);
        
        // NOVA FIX: dbService sẽ tự cộng điểm và cập nhật thống kê tích lũy trong DB
        const { error } = await dbService.addPointsSecurely(user.id, timeElapsed, activeTask.points, activeTask.gateName);
        
        if (error) {
           console.error("Sentinel Blocked:", error);
           setStatus('error');
           if (error === 'SENTINEL_SECURITY_VIOLATION') {
             alert("SENTINEL: Phát hiện gian lận tốc độ! Tài khoản đã bị khóa.");
             window.location.reload();
           }
           return;
        }

        await dbService.logActivity(user.id, user.fullname, 'Hoàn thành nhiệm vụ', `+${activeTask.points} P (${timeElapsed}s)`);
        
        setStatus('success');
        localStorage.removeItem('nova_pending_task');
        
        setTimeout(() => {
          setActiveTask(null);
          setInputToken('');
          setStatus('idle');
        }, 2500);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1200);
  };

  const handleCancel = () => {
    if (window.confirm("Hủy bỏ nhiệm vụ hiện tại?")) {
      localStorage.removeItem('nova_pending_task');
      setActiveTask(null);
      setInputToken('');
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-24 px-2">
      <div className="relative pt-4 max-w-2xl mx-auto">
        <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border border-cyan-500/20 bg-gradient-to-b from-blue-900/20 to-black/95 backdrop-blur-3xl shadow-2xl overflow-hidden text-center relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
             
             {/* Sentinel Status Badge */}
             <div className="absolute top-4 right-8 flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                <ShieldBan className="w-3 h-3 text-cyan-400" />
                <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Sentinel Active</span>
             </div>

             <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30 mx-auto mb-6 security-pulse">
                {status === 'loading' ? <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /> : status === 'success' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <LockKeyhole className="w-8 h-8 text-cyan-400" />}
             </div>
             <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">XÁC THỰC MÃ KEY</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic mt-1">
                    {activeTask ? `ĐANG CHỜ MÃ TỪ CỔNG: ${activeTask.gateName}` : 'HÃY CHỌN CỔNG NHIỆM VỤ PHÍA DƯỚI'}
                  </p>
                </div>

                <div className="relative group">
                  <input 
                    type="text" 
                    value={inputToken} 
                    disabled={!activeTask || status === 'loading' || status === 'success'}
                    onChange={(e) => setInputToken(e.target.value)} 
                    placeholder={activeTask ? "NHẬP MÃ ĐÃ LẤY TẠI ĐÂY..." : "CHƯA KÍCH HOẠT NHIỆM VỤ"} 
                    className="w-full bg-black/80 border border-slate-800 rounded-3xl px-8 py-5 text-cyan-400 text-center font-black tracking-[0.3em] outline-none transition-all text-xl focus:border-cyan-500 shadow-inner uppercase disabled:opacity-30" 
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={verifyTask} 
                    disabled={!activeTask || status !== 'idle' || !inputToken.trim()} 
                    className="flex-1 py-5 rounded-2xl font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 disabled:opacity-30 uppercase italic tracking-widest shadow-xl transition-all active:scale-95"
                  >
                    {status === 'loading' ? 'ĐANG KIỂM TRA...' : 'KÍCH HOẠT NHẬN ĐIỂM'}
                  </button>
                  {activeTask && status === 'idle' && (
                    <button onClick={handleCancel} className="p-5 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                       <RefreshCw size={24} />
                    </button>
                  )}
                </div>

                {status === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase italic text-[10px] tracking-wider animate-bounce">
                    <CheckCircle2 className="w-4 h-4" /> THÀNH CÔNG! +{activeTask?.points} P ĐÃ ĐƯỢC CỘNG
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-black uppercase italic text-[10px] tracking-wider">
                    <ShieldAlert className="w-4 h-4" /> LỖI XÁC THỰC HOẶC MÃ SAI!
                  </div>
                )}
             </div>
        </div>
      </div>

      <div className="space-y-8 pt-8">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
           <div className="flex items-center gap-5">
              <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-glow">
                 <LayoutGrid className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                 <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">CÁC CỔNG NHIỆM VỤ</h3>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 italic">
                   HẠN MỨC CÒN LẠI: <span className="text-cyan-400">{DAILY_TASK_LIMIT - user.tasksToday}</span> LƯỢT / NGÀY
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">TỰ ĐỘNG RESET SAU 24 GIỜ</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(TASK_RATES).map(([idStr, gate]) => {
            const id = parseInt(idStr);
            const currentCount = user.taskCounts[gate.name] || 0;
            const isFull = currentCount >= gate.limit;
            const isGenerating = generatingGate === id;
            const isCurrentGate = activeTask?.gateId === id;

            return (
              <div key={id} className={`glass-card p-10 rounded-[3rem] border transition-all duration-500 flex flex-col justify-between shadow-2xl ${isFull ? 'grayscale opacity-40' : isCurrentGate ? 'border-cyan-400 bg-cyan-500/5' : 'hover:border-cyan-400/50 border-white/5 bg-[#0a0f1e]/90'}`}>
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="font-black text-2xl text-white uppercase italic tracking-tighter leading-none mb-1">{gate.name}</h4>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">NODE-GATE #{id}</span>
                    </div>
                    <div className={`p-4 rounded-2xl bg-black border ${isFull ? 'border-red-500/20 text-red-500' : isCurrentGate ? 'border-cyan-400 text-cyan-400 shadow-glow' : 'border-cyan-500/20 text-cyan-500'}`}>
                      {isFull ? <Lock className="w-6 h-6" /> : isCurrentGate ? <Activity className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 animate-pulse" />}
                    </div>
                  </div>
                  <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase italic">THƯỞNG ĐIỂM</span>
                      <span className="text-2xl font-black text-emerald-500 italic tracking-tighter">+{formatK(gate.reward)} P</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase italic">GIỚI HẠN</span>
                      <span className={`text-xs font-black italic uppercase ${isFull ? 'text-red-500' : 'text-cyan-500'}`}>{currentCount} / {gate.limit} LƯỢT</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => startTask(id)} 
                  disabled={isFull || isGenerating || (activeTask !== null && !isCurrentGate)} 
                  className={`w-full py-5 rounded-[1.5rem] font-black uppercase italic text-[11px] tracking-widest transition-all flex items-center justify-center gap-4 ${isFull ? 'bg-slate-900 text-slate-700' : (activeTask !== null && !isCurrentGate) ? 'bg-slate-900 text-slate-700 opacity-30 cursor-not-allowed' : 'bg-white text-black hover:bg-cyan-500 hover:text-white shadow-xl hover:-translate-y-1'}`}
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : isFull ? 'HẾT LƯỢT HÔM NAY' : (
                    <>
                      <span>MỞ LINK NHIỆM VỤ</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .shadow-glow { box-shadow: 0 0 20px rgba(34, 211, 238, 0.3); }
        .security-pulse { animation: securityPulse 2.5s infinite; }
        @keyframes securityPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
      `}</style>
    </div>
  );
};

export default Tasks;
