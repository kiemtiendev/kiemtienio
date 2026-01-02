
import React, { useState, useEffect } from 'react';
import { User, VipTier } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK, ADMIN_BANKS, SLOGAN } from '../constants.tsx';
import { 
  Crown, Sparkles, Zap, ShieldCheck, CheckCircle2, Trophy, 
  ArrowRight, Loader2, Star, CreditCard, Wallet, Copy, 
  CheckCircle, Image as ImageIcon, AlertTriangle, X, History, Clock,
  Medal, ArrowUp
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  // Add missing prop type to fix type error in App.tsx
  showGoldSuccess: (title: string, description: string) => void;
}

const Vip: React.FC<Props> = ({ user, onUpdateUser, showGoldSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vipHistory, setVipHistory] = useState<any[]>([]);
  const [vipLeaderboard, setVipLeaderboard] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'bank' | null>(null);
  const [randomBank, setRandomBank] = useState<any>(null);
  const [billFile, setBillFile] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');

  const packages = [
    { name: 'VIP BASIC', vnd: 20000, days: 1, tier: VipTier.BASIC, color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20', rich: 'basic-border-rich', shimmer: 'vip-basic-shimmer' },
    { name: 'VIP PRO', vnd: 100000, days: 7, tier: VipTier.PRO, color: 'text-amber-400', bg: 'bg-amber-600/10', border: 'border-amber-500/20', rich: 'pro-border-rich', shimmer: 'vip-pro-shimmer' },
    { name: 'VIP ELITE', vnd: 500000, days: 30, tier: VipTier.ELITE, color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/20', rich: 'elite-border-rich', shimmer: 'vip-elite-shimmer' }
  ];

  const refreshData = async () => {
    const [history, leaderboard] = await Promise.all([
      dbService.getVipRequests(user.id),
      dbService.getVipLeaderboard()
    ]);
    setVipHistory(history);
    setVipLeaderboard(leaderboard);
  };

  useEffect(() => { refreshData(); }, [user.id]);

  const openDeposit = (pkg: any) => {
    setSelectedPkg(pkg);
    setRandomBank(ADMIN_BANKS[Math.floor(Math.random() * ADMIN_BANKS.length)]);
    setOrderId(Math.random().toString(36).substring(2, 10).toUpperCase());
    setShowDepositModal(true);
    setPaymentMethod(null);
    setBillFile(null);
  };

  // Fixed handleBuyWithPoints to use showGoldSuccess for a better UI experience
  const handleBuyWithPoints = async () => {
    if (user.balance < selectedPkg.vnd * 10) return alert("Số dư Nova không đủ.");
    if (!confirm(`XÁC NHẬN: Dùng ${(selectedPkg.vnd * 10).toLocaleString()} P để nâng cấp ${selectedPkg.name}?`)) return;
    setIsLoading(true);
    const res = await dbService.upgradeVipTiered(user.id, selectedPkg.vnd);
    setIsLoading(false);
    if (res.success) {
      const updated = await dbService.getCurrentUser();
      if (updated) onUpdateUser(updated);
      setShowDepositModal(false);
      refreshData();
      
      // Use the luxury gold success modal instead of a standard alert
      showGoldSuccess(
        "NÂNG CẤP VIP THÀNH CÔNG",
        `Chúc mừng! Bạn đã nâng cấp lên ${selectedPkg.name} thành công. Tận hưởng các quyền lợi đặc biệt ngay bây giờ.`
      );
    } else {
      alert(res.message);
    }
  };

  // Fixed handleBankSubmit to use showGoldSuccess for a better UI experience
  const handleBankSubmit = async () => {
    if (!billFile) return alert("Vui lòng tải ảnh bill chuyển khoản.");
    setIsLoading(true);
    const res = await dbService.createVipDepositRequest({
      user_id: user.id, user_name: user.fullname, email: user.email, vip_tier: selectedPkg.tier,
      amount_vnd: selectedPkg.vnd, bank_details: `${randomBank.bank} - ${randomBank.account}`,
      transfer_content: `N-VIP-${orderId}`, bill_url: billFile, status: 'pending', created_at: new Date().toISOString()
    });
    setIsLoading(false);
    
    if (res.success) { 
      setShowDepositModal(false); 
      refreshData();
      showGoldSuccess(
        "GỬI YÊU CẦU THÀNH CÔNG",
        "Yêu cầu nâng cấp VIP qua chuyển khoản đã được gửi. Admin sẽ duyệt trong vòng 5-30 phút."
      );
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 animate-in fade-in pb-20">
      <div className="glass-card p-12 rounded-[4rem] text-center border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <Crown className="w-20 h-20 text-amber-500 mx-auto mb-6 vip-crown-float" />
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">DIAMOND NOVA <span className="text-amber-400">VIP CENTER</span></h1>
        <p className="text-slate-400 mt-3 font-medium italic uppercase tracking-widest text-[10px]">{SLOGAN}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VIP Ranking */}
        <div className="lg:col-span-1 glass-card p-8 rounded-[3rem] border border-amber-500/10 bg-amber-500/5">
           <div className="flex items-center gap-3 mb-6 text-amber-500">
              <Trophy size={20} /> <h3 className="font-black italic uppercase text-sm tracking-widest">TOP ĐẠI GIA</h3>
           </div>
           <div className="space-y-3">
              {vipLeaderboard.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:bg-amber-500/10 transition-all">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>{idx+1}</span>
                      <span className="text-[11px] font-black text-white uppercase truncate">{item.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-amber-500 shrink-0">{item.total.toLocaleString()}đ</span>
                </div>
              ))}
           </div>
        </div>

        {/* VIP Packages */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
           {packages.map(pkg => (
             <div key={pkg.tier} className={`glass-card p-8 rounded-[3rem] border-2 transition-all flex flex-col justify-between group hover:scale-105 relative overflow-hidden ${pkg.rich} ${pkg.bg}`}>
                <div className={`absolute inset-0 pointer-events-none opacity-20 ${pkg.shimmer}`}></div>
                <div className="text-center space-y-4 relative z-10">
                   <Crown className={`w-10 h-10 mx-auto ${pkg.color}`} />
                   <div className={`text-[10px] font-black uppercase tracking-widest ${pkg.color}`}>{pkg.name}</div>
                   <div className="text-3xl font-black text-white italic tracking-tighter">{pkg.days} NGÀY</div>
                   <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 italic"><CheckCircle2 size={12} className="text-emerald-500" /> +50% Reward</div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 italic"><CheckCircle2 size={12} className="text-emerald-500" /> Duyệt đơn ưu tiên</div>
                   </div>
                </div>
                <button onClick={() => openDeposit(pkg)} className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[9px] uppercase italic transition-all">NÂNG CẤP</button>
             </div>
           ))}
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 bg-slate-900/10">
         <div className="flex items-center gap-4 mb-8">
            <History className="text-blue-400" />
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">LỊCH SỬ GIAO DỊCH VIP</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="text-[9px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr><th className="px-6 py-4">Gói</th><th className="px-6 py-4">Thanh Toán</th><th className="px-6 py-4">Thời Gian</th><th className="px-6 py-4 text-right">Trạng Thái</th></tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {vipHistory.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-600 font-black uppercase italic text-xs">Chưa có giao dịch nào</td></tr>
                  ) : (
                    vipHistory.map((v, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.02]">
                         <td className="px-6 py-5 font-bold text-white uppercase italic text-xs">{v.vip_tier}</td>
                         <td className="px-6 py-5 font-black text-amber-500 text-xs">{v.amount_vnd?.toLocaleString()}đ</td>
                         <td className="px-6 py-5 text-slate-500 text-[10px] font-medium italic">{new Date(v.created_at).toLocaleString('vi-VN')}</td>
                         <td className="px-6 py-5 text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase italic ${v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : v.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                               {v.status === 'pending' ? 'ĐANG CHỜ' : v.status === 'completed' ? 'THÀNH CÔNG' : 'HỦY'}
                            </span>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-10 rounded-[4rem] border border-white/10 relative animate-in zoom-in-95">
            <button onClick={() => setShowDepositModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black text-white italic uppercase mb-10 tracking-tighter">THANH TOÁN GÓI {selectedPkg.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <button onClick={() => setPaymentMethod('points')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'points' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800'}`}>
                  <Wallet className="w-8 h-8 text-blue-400" />
                  <span className="font-black text-[10px] uppercase italic">Nova Point (P)</span>
                  <span className="text-xs text-slate-500">{(selectedPkg.vnd * 10).toLocaleString()} P</span>
               </button>
               <button onClick={() => setPaymentMethod('bank')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'bank' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800'}`}>
                  <CreditCard className="w-8 h-8 text-amber-400" />
                  <span className="font-black text-[10px] uppercase italic">Ngân hàng (ATM)</span>
                  <span className="text-xs text-slate-500">{selectedPkg.vnd.toLocaleString()} VNĐ</span>
               </button>
            </div>

            {paymentMethod === 'points' && (
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400 font-bold italic text-sm">Số dư: {user.balance.toLocaleString()} P</span>
                    <ArrowRight size={20} className="text-blue-500" />
                    <span className="text-white font-black text-sm">Cần: {(selectedPkg.vnd * 10).toLocaleString()} P</span>
                 </div>
                 <button onClick={handleBuyWithPoints} disabled={isLoading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase italic text-[11px] transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'XÁC NHẬN MUA GÓI'}
                 </button>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                 <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500">Ngân hàng:</span><span className="font-black text-white">{randomBank?.bank}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500">Tài khoản:</span><div className="flex items-center gap-2"><span className="font-black text-white">{randomBank?.account}</span><button onClick={() => navigator.clipboard.writeText(randomBank?.account)}><Copy size={12} className="text-blue-500" /></button></div></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500">Nội dung:</span><div className="flex items-center gap-2"><span className="font-black text-amber-500">N-VIP-{orderId}</span><button onClick={() => navigator.clipboard.writeText(`N-VIP-${orderId}`)}><Copy size={12} className="text-amber-500" /></button></div></div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">Tải ảnh bill</label>
                    <div className="h-32 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center bg-slate-900/40 relative">
                       {billFile ? <img src={billFile} className="h-full w-full object-contain rounded-3xl" /> : <ImageIcon size={24} className="text-slate-700" />}
                       <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setBillFile(r.result as string); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                 </div>
                 <button onClick={handleBankSubmit} disabled={isLoading} className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl uppercase italic text-[11px] transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN'}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vip;
