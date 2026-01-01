
import React, { useState, useEffect } from 'react';
import { User, TaskGate } from '../types.ts';
import { TASK_GATES, formatK } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { 
  Zap, 
  ExternalLink, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

interface PendingTask {
  gate: string;
  points: number;
  token: string;
  timestamp: number;
}

const Tasks: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [activeTask, setActiveTask] = useState<PendingTask | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'verifying_url'>('idle');
  const [generatingGate, setGeneratingGate] = useState<string | null>(null);

  useEffect(() => {
    const savedTask = localStorage.getItem('nova_pending_task');
    let pending: PendingTask | null = null;
    
    if (savedTask) {
      const parsed = JSON.parse(savedTask);
      if (Date.now() - parsed.timestamp < 1500 * 1000) {
        pending = parsed;
        setActiveTask(parsed);
      } else {
        localStorage.removeItem('nova_pending_task');
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');

    if (urlKey && pending && urlKey === pending.token) {
      setStatus('verifying_url');
      setInputToken(urlKey);
      const timer = setTimeout(() => {
        handleVerify(urlKey, pending!);
      }, 1200);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return () => clearTimeout(timer);
    }
  }, []);

  const generateSecureToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return `NOVA-${Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")}`;
  };

  const startTask = async (gate: TaskGate) => {
    if (user.tasksToday >= 10) return;
    const currentCount = user.taskCounts[gate.name] || 0;
    if (currentCount >= gate.quota) return;

    setGeneratingGate(gate.name);
    await new Promise(resolve => setTimeout(resolve, 800));

    const token = generateSecureToken();
    const currentUrl = window.location.origin + window.location.pathname;
    const target_url = `${currentUrl}?key=${token}`;
    const url_encoded = encodeURIComponent(target_url);
    
    const api_key = gate.apiKey || "demo_key";
    let api_url = `https://link4m.com/st?api=${api_key}&url=${url_encoded}`;
    if (gate.name === 'LayMaNgay') api_url = `https://laymangay.com/st?api=${api_key}&url=${url_encoded}`;

    const taskData: PendingTask = { gate: gate.name, points: gate.rate, token, timestamp: Date.now() };
    localStorage.setItem('nova_pending_task', JSON.stringify(taskData));
    setActiveTask(taskData);
    
    dbService.logActivity(user.id, user.fullname, 'Bắt đầu nhiệm vụ', `Gate: ${gate.name} - ${formatK(gate.rate)}P`);
    
    window.location.href = api_url;
  };

  const handleVerify = (tokenToVerify: string, taskInfo: PendingTask) => {
    if (!tokenToVerify || status === 'loading') return;
    setStatus('loading');
    setTimeout(() => {
      if (tokenToVerify.trim().toUpperCase() === taskInfo.token) {
        const newTaskCounts = { ...user.taskCounts };
        newTaskCounts[taskInfo.gate] = (newTaskCounts[taskInfo.gate] || 0) + 1;

        const updatedUser = {
          ...user,
          balance: user.balance + taskInfo.points,
          totalEarned: (user.totalEarned || 0) + taskInfo.points,
          tasksToday: user.tasksToday + 1,
          tasksWeek: (user.tasksWeek || 0) + 1,
          taskCounts: newTaskCounts,
          lastTaskDate: new Date().toISOString()
        };
        
        onUpdateUser(updatedUser);
        localStorage.removeItem('nova_pending_task');
        
        dbService.logActivity(user.id, user.fullname, 'Hoàn thành nhiệm vụ', `Nhận +${taskInfo.points.toLocaleString()} P từ ${taskInfo.gate}`);
        
        setStatus('success');
        setTimeout(() => { 
          setActiveTask(null); 
          setStatus('idle'); 
          setInputToken('');
          setGeneratingGate(null);
        }, 3000);
      } else { 
        setStatus('error'); 
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1500);
  };

  const dailyProgress = (user.tasksToday / 10) * 100;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-6">
      <div className="relative overflow-hidden glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <TrendingUp className="w-48 h-48 text-blue-500" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest italic drop-shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Nhiệm vụ siêu tốc
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-xl">
              MISSION <span className="text-slate-600">HUB</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed italic">
              Vượt link rút gọn để nhận điểm thưởng. Điểm thưởng sẽ được cộng trực tiếp vào <b className="text-blue-400">Số dư</b> và <b className="text-purple-400">Tổng tích lũy</b> của bạn.
            </p>
          </div>

          <div className="w-full lg:w-96 glass-card p-8 rounded-[2rem] border border-white/10 bg-black/40 shadow-inner relative overflow-hidden group">
            <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${user.tasksToday >= 10 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`} style={{ width: `${dailyProgress}%` }}></div>
            
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">Tiến độ hôm nay</span>
                <div className="flex items-baseline gap-2">
                  <h2 className={`text-4xl font-black italic tracking-tighter leading-none ${user.tasksToday >= 10 ? 'text-red-500' : 'text-white'}`}>{user.tasksToday}</h2>
                  <span className="text-slate-600 font-black text-sm uppercase">/ 10</span>
                </div>
              </div>
            </div>

            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${user.tasksToday >= 10 ? 'bg-red-500' : 'bg-blue-600'}`} 
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TASK_GATES.map((gate) => {
          const currentCount = user.taskCounts[gate.name] || 0;
          const isFull = currentCount >= gate.quota;
          const isDisabled = isFull || user.tasksToday >= 10;
          const isGenerating = generatingGate === gate.name;
          const gateProgress = (currentCount / gate.quota) * 100;

          return (
            <div key={gate.name} className={`glass-card p-8 rounded-[2.5rem] flex flex-col justify-between border-2 transition-all duration-500 group relative overflow-hidden shadow-2xl ${isDisabled ? 'border-red-500/10 opacity-60 grayscale-[0.5]' : 'hover:border-blue-500/50 border-transparent bg-slate-900/40'}`}>
              <div className="space-y-2 mb-8 relative z-10">
                <h3 className="font-black text-2xl text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">{gate.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-black text-lg italic tracking-tighter">+{formatK(gate.rate)}</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">P</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-8 shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000" style={{ width: `${gateProgress}%` }} />
              </div>

              <button 
                onClick={() => startTask(gate)} 
                disabled={isDisabled || isGenerating} 
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic text-xs tracking-[0.2em] transition-all disabled:bg-slate-900 shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : isFull ? 'HOÀN TẤT' : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400" />
                    BẮT ĐẦU NHIỆM VỤ
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {activeTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setActiveTask(null)}></div>
          <div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-blue-500/30 relative animate-in zoom-in-95 shadow-[0_0_100px_rgba(59,130,246,0.3)]">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-3">
               <ShieldCheck className="w-6 h-6 text-blue-500" />
               Xác thực nhiệm vụ
            </h2>
            <input 
              type="text" 
              value={inputToken} 
              onChange={e => setInputToken(e.target.value)} 
              placeholder="DÁN MÃ KEY TẠI ĐÂY..." 
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-8 py-6 text-white text-center font-black tracking-[0.4em] outline-none transition-all text-base uppercase focus:border-blue-600 shadow-inner"
            />
            <button 
              onClick={() => handleVerify(inputToken, activeTask)}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:brightness-110 text-white font-black py-6 rounded-2xl shadow-2xl shadow-blue-600/40 uppercase tracking-[0.2em] transition-all italic active:scale-95"
            >
              {status === 'loading' ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : 'XÁC NHẬN MÃ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
