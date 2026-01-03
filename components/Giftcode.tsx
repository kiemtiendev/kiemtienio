
import React, { useState } from 'react';
import { User } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { 
  Ticket, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User, persist?: boolean) => void;
  showGoldSuccess: (title: string, description: string) => void;
}

const Giftcode: React.FC<Props> = ({ user, onUpdateUser, showGoldSuccess }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleClaim = async () => {
    // Clean input code robustly
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode || status === 'loading') return;
    setStatus('loading');
    
    try {
      const res = await dbService.claimGiftcode(user.id, cleanCode);

      if (res.success) {
        // Fetch fresh user data from server (where balance was incremented)
        const updatedUser = await dbService.getCurrentUser();
        // Update local state ONLY, do not persist to DB
        if(updatedUser) onUpdateUser(updatedUser, false);
        
        setStatus('success');
        setMsg(res.message);
        setCode('');
        
        // Trình diễn Gold Modal sang trọng
        showGoldSuccess(
          "KÍCH HOẠT THÀNH CÔNG", 
          `Hệ thống đã xác nhận mã quà tặng. Bạn vừa nhận được ${Number(res.amount).toLocaleString()} P vào tài khoản Nova.`
        );
      } else {
        setStatus('error');
        setMsg(res.message || "Lỗi không xác định");
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      setMsg('Lỗi hệ thống. Vui lòng thử lại sau.');
    } finally {
      // Auto clear status after 5s if it's error or success (but keep loading if stuck?)
      setTimeout(() => { 
          setStatus(prev => {
              if (prev === 'success' || prev === 'error') return 'idle';
              return prev;
          }); 
          if(status === 'success' || status === 'error') setMsg('');
      }, 5000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto format uppercase and remove spaces while typing
    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
    setCode(val);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Ticket className="w-48 h-48 text-rose-500" />
        </div>

        <div className="text-center space-y-4 mb-10">
          <div className="inline-block p-4 bg-rose-500/20 rounded-3xl mb-4">
            <Ticket className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">NHẬP MÃ QUÀ TẶNG</h1>
          <p className="text-slate-400 font-medium">Theo dõi Fanpage để săn Giftcode giới hạn mỗi ngày!</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              value={code}
              onChange={handleInputChange}
              placeholder="VÍ DỤ: NOVA2025"
              className={`w-full bg-slate-900 border-2 ${status === 'error' ? 'border-red-500/50' : 'border-slate-800'} rounded-[1.5rem] px-8 py-6 text-white text-2xl font-black tracking-[0.2em] text-center focus:outline-none focus:ring-4 focus:ring-rose-500/20 transition-all uppercase`}
            />
          </div>

          <button 
            onClick={handleClaim}
            disabled={!code.trim() || status === 'loading'}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white font-black py-6 rounded-[1.5rem] transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 text-lg italic"
          >
            {status === 'loading' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>KÍCH HOẠT QUÀ TẶNG</span>
              </>
            )}
          </button>

          {status !== 'idle' && msg && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm">{msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Giftcode;
