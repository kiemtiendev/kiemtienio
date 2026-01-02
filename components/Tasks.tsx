
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { TASK_RATES, formatK, DAILY_TASK_LIMIT, VIP_TASK_LIMIT } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { openTaskLink } from '../services/taskService.ts';
import { 
  Zap, Loader2, RefreshCw, LayoutGrid, Crown, ShieldAlert, MousePointer2, AlertTriangle, XCircle
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Tasks: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [generatingGate, setGeneratingGate] = useState<number | null>(null);

  const isVip = user.vipTier !== 'none';
  const currentLimit = isVip ? VIP_TASK_LIMIT : DAILY_TASK_LIMIT;

  useEffect(() => {
    const saved = localStorage.getItem('nova_pending_task');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < 1800 * 1000) setActiveTask(parsed);
      else localStorage.removeItem('nova_pending_task');
    }
  }, []);

  const resetTask = () => {
    if (window.confirm("Hủy bỏ nhiệm vụ hiện tại để chọn cổng khác?")) {
      localStorage.removeItem('nova_pending_task');
      setActiveTask(null);
      setInputToken('');
      setStatus('idle');
    }
  };

  const startTask = async (id: number) => {
    if (activeTask) return alert("Bạn đang có một nhiệm vụ chưa hoàn thành. Hãy Reset nếu muốn đổi cổng.");
    const gate = TASK_RATES[id];
    if (user.tasksToday >= currentLimit) return alert(`Hết hạn mức ${currentLimit} nhiệm vụ/ngày!`);

    setGeneratingGate(id);
    const token = `NOVA-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const taskData = { gateId: id, gateName: gate.name, points: gate.reward, token, timestamp: Date.now() };
    
    localStorage.setItem('nova_pending_task', JSON.stringify(taskData));
    setActiveTask(taskData);
    await openTaskLink(id, user.id, token);
    setGeneratingGate(null);
  };

  const verifyTask = async () => {
    if (!activeTask || !inputToken.trim()) return;
    setStatus('loading');
    const input = inputToken.trim().toUpperCase();
    const cleanToken = activeTask.token.replace('NOVA-', '');
    
    if (input === activeTask.token || input === cleanToken) {
      const timeElapsed = Math.floor((Date.now() - activeTask.timestamp) / 1000);
      const res = await dbService.addPointsSecurely(user.id, timeElapsed, activeTask.points, activeTask.gateName);
      
      if (res.error) {
        setStatus('error');
        if (res.error === 'SENTINEL_SECURITY_VIOLATION') window.location.reload();
        return;
      }
      setStatus('success');
      localStorage.removeItem('nova_pending_task');
      setTimeout(() => { setActiveTask(null); setInputToken(''); setStatus('idle'); }, 2000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24 px-2">
      <div className="max-w-2xl mx-auto">
        <div className={`glass-card p-8 rounded-[2.5rem] border ${isVip ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-blue-500/20'} bg-slate-900/80 backdrop-blur-xl relative overflow-hidden`}>
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">XÁC THỰC MÃ KEY</h2>
                   <p className="text-[9px] text-slate-500 font-black uppercase mt-1 italic">Hệ thống SENTINEL đang giám sát</p>
                </div>
                {activeTask && (
                  <button onClick={resetTask} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20" title="Hủy nhiệm vụ">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
             </div>

             <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200/80 font-medium italic leading-relaxed">
                  <b>CẢNH BÁO:</b> Không sử dụng Proxy, VPN (1.1.1.1), hoặc tool tự động. Hệ thống sẽ khóa tài khoản vĩnh viễn nếu phát hiện gian lận tốc độ hoặc bug tiền.
                </p>
             </div>

             <div className="space-y-4">
                <input 
                  type="text" 
                  value={inputToken} 
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder={activeTask ? `NHẬP KEY TỪ ${activeTask.gateName}...` : "HÃY CHỌN CỔNG NHIỆM VỤ PHÍA DƯỚI"}
                  disabled={!activeTask || status === 'loading'}
                  className="w-full bg-black/60 border border-slate-800 rounded-2xl px-6 py-5 text-center font-black tracking-widest outline-none text-xl focus:border-blue-500 text-blue-400 uppercase"
                />
                <button 
                  onClick={verifyTask}
                  disabled={!activeTask || !inputToken.trim() || status === 'loading'}
                  className={`w-full py-5 rounded-2xl font-black text-white uppercase italic tracking-widest transition-all ${isVip ? 'bg-gradient-to-r from-amber-600 to-yellow-600 shadow-lg shadow-amber-600/20' : 'bg-blue-600 shadow-blue-600/20'} disabled:opacity-20`}
                >
                  {status === 'loading' ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : 'KÍCH HOẠT NHẬN THƯỞNG'}
                </button>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
        {Object.entries(TASK_RATES).map(([idStr, gate]) => {
          const id = parseInt(idStr);
          const currentCount = user.taskCounts[gate.name] || 0;
          const isFull = currentCount >= gate.limit;
          const reward = isVip ? Math.floor(gate.reward * 1.5) : gate.reward;

          return (
            <div key={id} className={`glass-card p-8 rounded-[2.5rem] border transition-all ${isFull ? 'grayscale opacity-30' : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:scale-105'}`}>
               <div className="flex justify-between mb-6">
                  <h4 className="font-black text-white italic uppercase tracking-tighter">{gate.name}</h4>
                  {isVip && <span className="bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded italic">+50% VIP</span>}
               </div>
               <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Thưởng</span>
                  <span className={`text-2xl font-black italic tracking-tighter ${isVip ? 'text-amber-500' : 'text-emerald-500'}`}>+{formatK(reward)} P</span>
               </div>
               <button 
                 onClick={() => startTask(id)}
                 disabled={isFull || activeTask !== null || generatingGate === id}
                 className="w-full py-4 rounded-xl bg-white text-black font-black text-[10px] uppercase italic tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
               >
                 {generatingGate === id ? <Loader2 className="animate-spin mx-auto" /> : isFull ? 'ĐÃ HẾT LƯỢT' : 'BẮT ĐẦU NHIỆM VỤ'}
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
