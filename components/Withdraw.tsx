
import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest } from '../types.ts';
import { WITHDRAW_MILESTONES, RATE_VND_TO_POINT, formatK, POINT_PER_DIAMOND } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { Building2, Gamepad2, Wallet, CheckCircle, Loader2, History } from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  initialHistory?: boolean;
}

const Withdraw: React.FC<Props> = ({ user, onUpdateUser, initialHistory = false }) => {
  const [showHistory, setShowHistory] = useState(initialHistory);
  const [method, setMethod] = useState<'bank' | 'game' | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setShowHistory(initialHistory);
  }, [initialHistory]);

  const history = dbService.getWithdrawals(user.id);
  const pointsNeeded = selectedMilestone ? selectedMilestone * RATE_VND_TO_POINT : 0;
  const canAfford = user.balance >= pointsNeeded;

  // Quy đổi: 50.000 P (5k VND) = 25 KC -> 1 KC = 2000 P
  const getGameDiamondValue = (vnd: number) => {
    return Math.floor((vnd * RATE_VND_TO_POINT) / POINT_PER_DIAMOND);
  };

  const handleWithdraw = () => {
    if (!method || !selectedMilestone || !canAfford) return;
    const info = method === 'bank' ? user.bankInfo : user.idGame;
    if (!info) return alert(`Hãy cập nhật thông tin ${method === 'bank' ? 'ATM' : 'ID Game'} trong mục Hồ sơ.`);
    
    setIsProcessing(true);
    setTimeout(() => {
      // ID sẽ được dbService tự động gán theo định dạng 000000X
      const request: WithdrawalRequest = {
        id: '', 
        userId: user.id,
        userName: user.fullname,
        amount: selectedMilestone,
        type: method,
        status: 'pending',
        details: info,
        createdAt: new Date().toISOString()
      };
      dbService.addWithdrawal(request);
      
      onUpdateUser({ ...user, balance: user.balance - pointsNeeded });
      
      setIsProcessing(false);
      setIsSuccess(true);
      setMethod(null);
      setSelectedMilestone(null);
    }, 1500);
  };

  if (showHistory) {
    return (
      <div className="space-y-10 animate-in slide-in-from-right-12 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 border border-blue-500/20"><History className="w-8 h-8" /></div>
             <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">LỊCH SỬ GIAO DỊCH</h1>
          </div>
          <button onClick={() => setShowHistory(false)} className="px-10 py-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all italic shadow-lg">RÚT THƯỞNG MỚI</button>
        </div>
        
        {history.length === 0 ? (
          <div className="glass-card p-24 text-center text-slate-700 rounded-[3.5rem] font-black uppercase italic tracking-widest border border-white/5 bg-slate-900/10 shadow-inner">
             Chưa phát hiện giao dịch rút tiền nào.
          </div>
        ) : (
          <div className="space-y-6">
            {history.map(req => (
              <div key={req.id} className="glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between border-l-[10px] border-l-blue-600 gap-8 hover:bg-slate-900/40 transition-all shadow-xl">
                <div className="flex gap-6 items-center">
                  <div className={`p-5 rounded-2xl ${req.type === 'bank' ? 'bg-emerald-600/10 text-emerald-400' : 'bg-purple-600/10 text-purple-400'} border border-white/5`}>
                     {req.type === 'bank' ? <Building2 className="w-7 h-7" /> : <Gamepad2 className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">ID: #{req.id}</span>
                    </div>
                    <h4 className="font-black text-xl text-white uppercase italic tracking-tight">{formatK(req.amount * RATE_VND_TO_POINT)} {req.type === 'game' && <span className="text-purple-400 text-sm ml-2">({getGameDiamondValue(req.amount)} KC)</span>}</h4>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase italic border shadow-sm ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {req.status === 'pending' ? 'ĐANG CHỜ DUYỆT' : req.status === 'completed' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-xl">THANH KHOẢN NOVA</h1>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] italic">Rút tối thiểu từ {formatK(5000 * RATE_VND_TO_POINT)} P (5k VNĐ)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => setMethod('bank')} className={`glass-card p-12 rounded-[3.5rem] border-4 transition-all shadow-xl flex flex-col items-center text-center gap-4 group ${method === 'bank' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-slate-800'}`}>
          <div className="p-6 bg-blue-600/10 rounded-3xl group-hover:scale-110 transition-transform"><Building2 className="w-12 h-12 text-blue-400" /></div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Rút ATM/VND</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">1 VNĐ = 10 Điểm</p>
        </button>
        <button onClick={() => setMethod('game')} className={`glass-card p-12 rounded-[3.5rem] border-4 transition-all shadow-xl flex flex-col items-center text-center gap-4 group ${method === 'game' ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:border-slate-800'}`}>
          <div className="p-6 bg-purple-600/10 rounded-3xl group-hover:scale-110 transition-transform"><Gamepad2 className="w-12 h-12 text-purple-400" /></div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Kim Cương FF</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">50k P = 25 KC</p>
        </button>
      </div>

      {method && (
        <div className="glass-card p-10 md:p-14 rounded-[4rem] space-y-12 bg-slate-900/20 backdrop-blur-3xl shadow-2xl border border-white/5 animate-in slide-in-from-bottom-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {WITHDRAW_MILESTONES.map(val => {
              const pts = val * RATE_VND_TO_POINT;
              const isSelected = selectedMilestone === val;
              const isLow = user.balance < pts;
              return (
                <button 
                  key={val} 
                  disabled={isLow} 
                  onClick={() => setSelectedMilestone(val)} 
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 shadow-lg active:scale-95 ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'} ${isLow ? 'opacity-20 grayscale' : ''}`}
                >
                  <span className="text-2xl font-black text-white italic tracking-tighter">{method === 'game' ? `${getGameDiamondValue(val)} KC` : formatK(val * RATE_VND_TO_POINT)}</span>
                  <span className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest">{formatK(pts)} ĐIỂM</span>
                </button>
              );
            })}
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <button 
              onClick={handleWithdraw} 
              disabled={!selectedMilestone || !canAfford || isProcessing} 
              className="relative w-full bg-slate-950 hover:bg-black text-white font-black py-7 rounded-2xl uppercase tracking-[0.2em] italic transition-all disabled:opacity-40 shadow-2xl border border-white/10"
            >
              {isProcessing ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : (
                <div className="flex items-center justify-center gap-3">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  <span>XÁC NHẬN RÚT THƯỞNG</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsSuccess(false)}></div>
           <div className="glass-card p-12 rounded-[3.5rem] border border-emerald-500/30 text-center relative max-w-sm animate-in zoom-in-95 shadow-[0_0_80px_rgba(16,185,129,0.2)]">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                 <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic mb-4">THÀNH CÔNG!</h2>
              <p className="text-slate-400 font-medium italic mb-4">Yêu cầu của bạn đã được gửi tới Admin. Vui lòng đợi 5-30 phút để xử lý.</p>
              <button onClick={() => setIsSuccess(false)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest italic transition-all">OK, TÔI ĐÃ HIỂU</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
