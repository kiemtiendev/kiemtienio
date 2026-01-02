
import React, { useState, useEffect } from 'react';
import { User, VipTier } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK, ADMIN_BANKS, SLOGAN } from '../constants.tsx';
import { 
  Crown, Sparkles, Zap, ShieldCheck, CheckCircle2, Trophy, 
  ArrowRight, Loader2, Star, CreditCard, Wallet, Copy, 
  CheckCircle, Image as ImageIcon, AlertTriangle, X, History, Clock,
  Medal
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Vip: React.FC<Props> = ({ user, onUpdateUser }) => {
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
    { 
      name: 'VIP BASIC', 
      vnd: 20000, 
      days: 1, 
      tier: VipTier.BASIC, 
      color: 'text-blue-400', 
      bg: 'bg-blue-600/10', 
      border: 'border-blue-500/20',
      rich: 'basic-border-rich',
      shimmer: 'vip-basic-shimmer'
    },
    { 
      name: 'VIP PRO', 
      vnd: 100000, 
      days: 7, 
      tier: VipTier.PRO, 
      color: 'text-amber-400', 
      bg: 'bg-amber-600/10', 
      border: 'border-amber-500/20',
      rich: 'pro-border-rich',
      shimmer: 'vip-pro-shimmer'
    },
    { 
      name: 'VIP ELITE', 
      vnd: 500000, 
      days: 30, 
      tier: VipTier.ELITE, 
      color: 'text-purple-400', 
      bg: 'bg-purple-600/10', 
      border: 'border-purple-500/20',
      rich: 'elite-border-rich',
      shimmer: 'vip-elite-shimmer'
    }
  ];

  useEffect(() => {
    dbService.getVipRequests(user.id).then(setVipHistory);
    dbService.getVipLeaderboard().then(setVipLeaderboard);
  }, [user.id]);

  const openDeposit = (pkg: any) => {
    setSelectedPkg(pkg);
    setRandomBank(ADMIN_BANKS[Math.floor(Math.random() * ADMIN_BANKS.length)]);
    setOrderId(Math.random().toString(36).substring(2, 10).toUpperCase());
    setShowDepositModal(true);
    setPaymentMethod(null);
    setBillFile(null);
  };

  const generateTransferContent = () => {
    if (!selectedPkg) return "";
    const tier = selectedPkg.tier.toUpperCase();
    const name = user.fullname.replace(/\s+/g, '').toUpperCase();
    const gmail = user.email.split('@')[0].toUpperCase();
    return `N-VIP-ADAM-${tier}-${orderId}-${name}-${gmail}`;
  };

  const handleBuyWithPoints = async () => {
    if (user.balance < selectedPkg.vnd * 10) return alert("Số dư Nova (P) không đủ.");
    if (!confirm(`XÁC NHẬN: Nâng cấp gói ${selectedPkg.name}. VIP hiện tại của bạn sẽ bị thay thế.`)) return;

    setIsLoading(true);
    const res = await dbService.upgradeVipTiered(user.id, selectedPkg.vnd);
    setIsLoading(false);
    
    if (res.success) {
      alert(res.message);
      const updated = await dbService.getCurrentUser();
      if (updated) onUpdateUser(updated);
      setShowDepositModal(false);
      dbService.getVipRequests(user.id).then(setVipHistory);
    } else alert(res.message);
  };

  const handleBankDepositSubmit = async () => {
    setIsLoading(true);
    const res = await dbService.createVipDepositRequest({
      userId: user.id,
      userName: user.fullname,
      email: user.email,
      vipTier: selectedPkg.tier,
      amount_vnd: selectedPkg.vnd,
      bankDetails: `${randomBank.bank} - ${randomBank.account}`,
      transferContent: generateTransferContent(),
      billUrl: billFile || '',
      status: 'pending'
    });
    setIsLoading(false);
    alert(res.message);
    dbService.getVipRequests(user.id).then(setVipHistory);
    setShowDepositModal(false);
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
  };

  const getVipCrownColor = (tier: VipTier) => {
    switch(tier) {
      case VipTier.ELITE: return 'text-purple-400 fill-purple-400';
      case VipTier.PRO: return 'text-amber-400 fill-amber-400';
      case VipTier.BASIC: return 'text-blue-400 fill-blue-400';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in">
      {/* Header */}
      <div className="glass-card p-12 rounded-[4rem] text-center relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <Crown className="w-24 h-24 text-amber-500 mx-auto mb-6 drop-shadow-glow vip-crown-float" />
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">HỆ THỐNG VIP <span className="text-amber-400">DIAMOND NOVA</span></h1>
        <p className="text-slate-400 mt-4 font-medium italic uppercase tracking-widest text-[10px]">{SLOGAN}</p>
      </div>

      {/* Expiration Alert Section */}
      {user.isVip && (
        <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] flex items-center justify-between shadow-xl">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-600/10 rounded-2xl">
                 <Clock className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <div>
                 <h4 className="text-lg font-black text-white italic uppercase">THỜI HẠN VIP HIỆN TẠI</h4>
                 <p className="text-slate-500 text-xs font-bold italic uppercase tracking-widest">
                   Hạng: <span className="text-blue-400">{user.vipTier.toUpperCase()}</span> | 
                   Ngày hết hạn: <span className="text-white">{user.vipUntil ? new Date(user.vipUntil).toLocaleString('vi-VN') : 'N/A'}</span>
                 </p>
              </div>
           </div>
           <button onClick={() => window.scrollTo({top: 600, behavior: 'smooth'})} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/20">GIA HẠN NGAY</button>
        </div>
      )}

      {/* VIP TOP Leaderboard */}
      <div className="glass-card p-10 rounded-[3.5rem] border border-amber-500/10 bg-amber-500/5">
         <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20"><Trophy className="w-6 h-6" /></div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">BẢNG VÀNG ĐẠI GIA NOVA</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vipLeaderboard.length === 0 ? (
               <div className="col-span-full py-10 text-center text-slate-600 font-black italic uppercase text-xs">Chưa có dữ liệu vinh danh</div>
            ) : (
               vipLeaderboard.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/5 bg-slate-900/40">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {idx < 3 ? <Medal size={20} /> : idx + 1}
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <div className="text-[11px] font-black text-white uppercase truncate italic">{item.name}</div>
                        <div className="text-[10px] font-black text-amber-500 italic">Tổng nạp: {item.total.toLocaleString()}đ</div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Packages Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map(pkg => (
          <div key={pkg.tier} className={`glass-card p-10 rounded-[3rem] border-2 transition-all shadow-xl flex flex-col justify-between group hover:scale-105 relative overflow-hidden ${pkg.rich} ${pkg.bg}`}>
            <div className={`absolute inset-0 pointer-events-none opacity-20 ${pkg.shimmer}`}></div>
            <div className="text-center space-y-6 relative z-10">
              <div className="flex justify-center mb-2">
                <Crown className={`w-12 h-12 vip-crown-float ${getVipCrownColor(pkg.tier)}`} />
              </div>
              <div className={`text-[12px] font-black uppercase tracking-[0.4em] ${pkg.color}`}>{pkg.name}</div>
              <div className="text-4xl font-black text-white italic tracking-tighter">{pkg.days} NGÀY</div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-slate-400 text-xs italic font-bold"><CheckCircle2 size={14} className="text-emerald-500" /> +50% Thưởng nhiệm vụ</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic font-bold"><CheckCircle2 size={14} className="text-emerald-500" /> Ưu tiên duyệt lệnh 5 phút</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic font-bold"><CheckCircle2 size={14} className="text-emerald-500" /> Huy hiệu {pkg.tier.toUpperCase()} hồ sơ</div>
              </div>
            </div>
            <button 
              onClick={() => openDeposit(pkg)}
              className={`relative z-10 w-full mt-10 py-5 rounded-2xl font-black text-[11px] uppercase italic tracking-widest transition-all ${pkg.tier === VipTier.ELITE ? 'bg-purple-600' : pkg.tier === VipTier.PRO ? 'bg-amber-500 text-black' : 'bg-blue-600'} text-white active:scale-95 shadow-lg`}
            >
              NÂNG CẤP NGAY
            </button>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="glass-card p-10 rounded-[3rem] border border-white/5 bg-slate-900/20 shadow-2xl">
         <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 border border-blue-500/20"><History className="w-6 h-6" /></div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">LỊCH SỬ GIAO DỊCH VIP</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="text-[10px] font-black text-slate-500 uppercase italic border-b border-white/5">
                  <tr>
                     <th className="px-6 py-4">Gói VIP</th>
                     <th className="px-6 py-4">Số Tiền</th>
                     <th className="px-6 py-4">Thời Gian</th>
                     <th className="px-6 py-4">Trạng Thái</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {vipHistory.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-600 font-black uppercase italic text-xs">Chưa có giao dịch nào</td>
                     </tr>
                  ) : (
                     vipHistory.map((v, i) => (
                        <tr key={v.id || i} className="group hover:bg-white/[0.02] transition-colors">
                           <td className="px-6 py-5 font-bold text-white uppercase italic">{v.vip_tier}</td>
                           <td className="px-6 py-5 font-black text-blue-500">{v.amount_vnd?.toLocaleString()}đ</td>
                           <td className="px-6 py-5 text-slate-500 text-xs font-medium italic">
                             {new Date(v.created_at).toLocaleString('vi-VN')}
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border ${v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : v.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                 {v.status === 'pending' ? 'ĐANG CHỜ' : v.status === 'completed' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI'}
                              </span>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-8 rounded-[3rem] border border-white/10 relative my-auto animate-in zoom-in-95 shadow-3xl">
            <button onClick={() => setShowDepositModal(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black text-white italic uppercase mb-8">PHƯƠNG THỨC THANH TOÁN</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <button onClick={() => setPaymentMethod('points')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'points' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/40'}`}>
                  <Wallet className="w-8 h-8 text-blue-400" />
                  <span className="font-black text-[10px] uppercase italic">Điểm Nova (P)</span>
                  <span className="text-xs text-slate-500">{(selectedPkg.vnd * 10).toLocaleString()} P</span>
               </button>
               <button onClick={() => setPaymentMethod('bank')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'bank' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900/40'}`}>
                  <CreditCard className="w-8 h-8 text-amber-400" />
                  <span className="font-black text-[10px] uppercase italic">Ngân hàng (VNĐ)</span>
                  <span className="text-xs text-slate-500">{selectedPkg.vnd.toLocaleString()} VNĐ</span>
               </button>
            </div>

            {paymentMethod === 'points' && (
              <div className="space-y-6 p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-bold italic">Số dư hiện tại:</span>
                    <span className="font-black text-white">{user.balance.toLocaleString()} P</span>
                 </div>
                 <button onClick={handleBuyWithPoints} disabled={isLoading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase italic text-[11px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'XÁC NHẬN THANH TOÁN'}
                 </button>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                 <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-500 uppercase italic">Ngân hàng</span>
                       <span className="font-bold text-amber-400">{randomBank?.bank}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-500 uppercase italic">Số tài khoản</span>
                       <div className="flex items-center gap-3">
                          <span className="font-bold text-white tracking-widest">{randomBank?.account}</span>
                          <button onClick={() => copyToClipboard(randomBank?.account)} className="text-slate-500 hover:text-blue-400 transition-colors"><Copy size={14} /></button>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                       <span className="text-[10px] font-black text-amber-500 uppercase italic shrink-0">Nội dung</span>
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-[9px] font-bold text-white truncate">{generateTransferContent()}</span>
                          <button onClick={() => copyToClipboard(generateTransferContent())} className="text-amber-500 hover:text-amber-400 transition-colors shrink-0"><Copy size={14} /></button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 text-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">Tải ảnh bill chuyển khoản</label>
                    <div className="relative h-24 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 hover:border-amber-500 transition-all cursor-pointer bg-slate-900/20">
                       {billFile ? <img src={billFile} className="h-full w-full object-contain rounded-3xl" /> : <ImageIcon size={24} />}
                       <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setBillFile(reader.result as string);
                             reader.readAsDataURL(file);
                          }
                       }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                 </div>

                 <button onClick={handleBankDepositSubmit} disabled={isLoading} className="w-full py-5 bg-amber-600 text-white font-black rounded-2xl uppercase italic text-[11px] shadow-lg shadow-amber-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'ĐÃ CHUYỂN KHOẢN'}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .drop-shadow-glow { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.5)); }
        .shadow-3xl { box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.5); }
      `}</style>
    </div>
  );
};

export default Vip;
