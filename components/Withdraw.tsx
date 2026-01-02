
import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest } from '../types.ts';
import { WITHDRAW_MILESTONES, RATE_VND_TO_POINT, formatK, DIAMOND_EXCHANGE, QUAN_HUY_EXCHANGE } from '../constants.tsx';
import { dbService } from '../services/dbService.ts';
import { Building2, Gamepad2, Wallet, CheckCircle, Loader2, History, ArrowRightLeft } from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  initialHistory?: boolean;
  showGoldSuccess: (title: string, description: string) => void;
}

const Withdraw: React.FC<Props> = ({ user, onUpdateUser, initialHistory = false, showGoldSuccess }) => {
  const [showHistory, setShowHistory] = useState(initialHistory);
  const [method, setMethod] = useState<'bank' | 'game' | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    setShowHistory(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await dbService.getWithdrawals(user.id);
      setHistory(data);
    };
    fetchHistory();
  }, [user.id]);

  const pointsNeeded = selectedMilestone ? selectedMilestone * RATE_VND_TO_POINT : 0;
  const canAfford = user.balance >= pointsNeeded;

  const getGameDiamondValue = (vnd: number) => {
    return DIAMOND_EXCHANGE[vnd] || 0;
  };

  const getQuanHuyValue = (vnd: number) => {
    return QUAN_HUY_EXCHANGE[vnd] || 0;
  };

  const handleWithdraw = async () => {
    if (!method || !selectedMilestone || !canAfford) return;
    const info = method === 'bank' ? user.bankInfo : user.idGame;
    if (!info) return alert(`Hãy cập nhật thông tin ${method === 'bank' ? 'ATM' : 'ID Game / Tên Game'} trong mục Hồ sơ.`);
    
    setIsProcessing(true);
    const res = await dbService.addWithdrawal({
      userId: user.id,
      userName: `${user.fullname} (${user.email})`,
      amount: selectedMilestone,
      type: method,
      status: 'pending',
      details: info,
      createdAt: new Date().toISOString()
    });
    
    setIsProcessing(false);
    
    if (res && (res as any).error) {
      alert((res as any).error);
      return;
    }

    // Hiển thị Gold Modal sang trọng thay vì UI success cũ
    showGoldSuccess(
      "GỬI YÊU CẦU THÀNH CÔNG",
      `Yêu cầu rút thưởng trị giá ${selectedMilestone.toLocaleString()}đ đã được gửi tới hệ thống. Quà tặng sẽ được xử lý trong vòng 5-30 phút.`
    );

    setMethod(null);
    setSelectedMilestone(null);
    
    const data = await dbService.getWithdrawals(user.id);
    setHistory(data);
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
                    <h4 className="font-black text-xl text-white uppercase italic tracking-tight">
                      {req.type === 'bank' ? `${req.amount.toLocaleString()}đ` : `THƯỞNG GAME (${req.amount.toLocaleString()}đ)`}
                    </h4>
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
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] italic">
            Tỷ giá: <span className="text-blue-400">1 VNĐ = 10 P</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => { setMethod('bank'); setSelectedMilestone(null); }} className={`glass-card p-12 rounded-[3.5rem] border-4 transition-all shadow-xl flex flex-col items-center text-center gap-4 group ${method === 'bank' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-slate-800'}`}>
          <div className="p-6 bg-blue-600/10 rounded-3xl group-hover:scale-110 transition-transform"><Building2 className="w-12 h-12 text-blue-400" /></div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Rút ATM/VND</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Nhận tiền mặt qua STK</p>
        </button>
        <button onClick={() => { setMethod('game'); setSelectedMilestone(null); }} className={`glass-card p-12 rounded-[3.5rem] border-4 transition-all shadow-xl flex flex-col items-center text-center gap-4 group ${method === 'game' ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:border-slate-800'}`}>
          <div className="p-6 bg-purple-600/10 rounded-3xl group-hover:scale-110 transition-transform"><Gamepad2 className="w-12 h-12 text-purple-400" /></div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Rút Thưởng Game</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Nhận Quân Huy - Kim Cương Miễn Phí 100%</p>
        </button>
      </div>

      {method && (
        <div className="glass-card p-10 md:p-14 rounded-[4rem] space-y-12 bg-slate-900/20 backdrop-blur-3xl shadow-2xl border border-white/5 animate-in slide-in-from-bottom-6">
          <div className="text-center">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 italic">CHỌN HẠN MỨC QUY ĐỔI</h4>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {WITHDRAW_MILESTONES.map(val => {
              const pts = val * RATE_VND_TO_POINT;
              const isSelected = selectedMilestone === val;
              const isLow = user.balance < pts;
              return (
                <button 
                  key={val} 
                  disabled={isLow} 
                  onClick={() => setSelectedMilestone(val)} 
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 shadow-lg active:scale-95 group relative overflow-hidden ${isSelected ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'} ${isLow ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className="text-center space-y-1">
                    {method === 'game' ? (
                      <>
                        <div className={`text-xl font-black italic tracking-tighter transition-colors ${isSelected ? 'text-[#d4af37]' : 'text-white'}`}>
                          {getQuanHuyValue(val).toLocaleString()} Quân Huy
                        </div>
                        <div className="text-xs font-black text-blue-400 italic">
                          hoặc {getGameDiamondValue(val).toLocaleString()} Kim Cương
                        </div>
                      </>
                    ) : (
                      <span className={`text-2xl font-black italic tracking-tighter transition-colors ${isSelected ? 'text-[#d4af37]' : 'text-white'}`}>
                        {(val/1000).toLocaleString()}kđ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest group-hover:text-slate-400 transition-colors">
                      {formatK(pts)} P
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold">~ {(val).toLocaleString()}đ</span>
                  </div>
                  {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,1)] animate-pulse"></div>}
                </button>
              );
            })}
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Số dư: <span className="text-white">{user.balance.toLocaleString()} P</span></span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Yêu cầu: <span className={canAfford ? 'text-[#d4af37]' : 'text-red-500'}>{pointsNeeded.toLocaleString()} P</span></span>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37] to-[#b08d26] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <button 
                onClick={handleWithdraw} 
                disabled={!selectedMilestone || !canAfford || isProcessing} 
                className="relative w-full bg-slate-950 hover:bg-black text-white font-black py-7 rounded-2xl uppercase tracking-[0.2em] italic transition-all disabled:opacity-40 shadow-2xl border border-white/10"
              >
                {isProcessing ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : (
                  <div className="flex items-center justify-center gap-3">
                    <Wallet className="w-6 h-6 text-[#d4af37]" />
                    <span>XÁC NHẬN RÚT THƯỞNG</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
