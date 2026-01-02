
import React, { useState, useEffect } from 'react';
import { User, VipTier } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { formatK, ADMIN_BANKS, SLOGAN } from '../constants.tsx';
import { 
  Crown, Sparkles, Zap, ShieldCheck, CheckCircle2, Trophy, 
  ArrowRight, Loader2, Star, CreditCard, Wallet, Copy, 
  CheckCircle, Image as ImageIcon, AlertTriangle, X, History, Clock
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Vip: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vipHistory, setVipHistory] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'bank' | null>(null);
  const [randomBank, setRandomBank] = useState<any>(null);
  const [billFile, setBillFile] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');

  const packages = [
    { name: 'VIP BASIC', vnd: 20000, days: 1, tier: VipTier.BASIC, color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20' },
    { name: 'VIP PRO', vnd: 100000, days: 7, tier: VipTier.PRO, color: 'text-amber-400', bg: 'bg-amber-600/10', border: 'border-amber-500/20' },
    { name: 'VIP ELITE', vnd: 500000, days: 30, tier: VipTier.ELITE, color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/20' }
  ];

  useEffect(() => {
    dbService.getVipRequests(user.id).then(setVipHistory);
  }, [user.id]);

  const openDeposit = (pkg: any) => {
    setSelectedPkg(pkg);
    setRandomBank(ADMIN_BANKS[Math.floor(Math.random() * ADMIN_BANKS.length)]);
    // Tạo ID lệnh 8 ký tự viết hoa
    setOrderId(Math.random().toString(36).substring(2, 10).toUpperCase());
    setShowDepositModal(true);
    setPaymentMethod(null);
    setBillFile(null);
  };

  // Định dạng chuẩn: N-VIP-ADAM-[TIER]-[ID_LENH]-[NAME]-[GMAIL]
  const generateTransferContent = () => {
    if (!selectedPkg) return "";
    const tier = selectedPkg.tier.toUpperCase();
    const name = user.fullname.replace(/\s+/g, '').toUpperCase();
    const gmail = user.email.split('@')[0].toUpperCase();
    return `N-VIP-ADAM-${tier}-${orderId}-${name}-${gmail}`;
  };

  const handleBuyWithPoints = async () => {
    if (user.balance < selectedPkg.vnd * 10) return alert("Số dư Nova (P) không đủ.");
    if (!confirm(`XÁC NHẬN: Nâng cấp gói ${selectedPkg.name}. \n\n⚠️ CẢNH BÁO: VIP không thể nâng cấp đè nhau. Nếu bạn đang có VIP, gói mới sẽ thay thế gói cũ. Bạn đồng ý?`)) return;

    setIsLoading(true);
    const res = await dbService.upgradeVipTiered(user.id, selectedPkg.vnd);
    setIsLoading(false);
    
    if (res.success) {
      alert(res.message);
      const updated = await dbService.getCurrentUser();
      if (updated) onUpdateUser(updated);
      setShowDepositModal(false);
    } else alert(res.message);
  };

  const handleBankDepositSubmit = async () => {
    setIsLoading(true);
    const res = await dbService.createVipDepositRequest({
      userId: user.id,
      userName: user.fullname,
      email: user.email,
      vipTier: selectedPkg.tier,
      amountVnd: selectedPkg.vnd,
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
    alert("Đã sao chép nội dung!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in">
      {/* Header */}
      <div className="glass-card p-12 rounded-[4rem] text-center relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <Crown className="w-24 h-24 text-amber-500 mx-auto mb-6 drop-shadow-glow" />
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">HỆ THỐNG VIP <span className="text-amber-400">DIAMOND NOVA</span></h1>
        <p className="text-slate-400 mt-4 font-medium italic uppercase tracking-widest text-[10px]">{SLOGAN}</p>
      </div>

      {/* Non-stackable Warning */}
      <div className="p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-[2.5rem] flex items-start gap-4 shadow-xl shadow-amber-500/5">
        <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-amber-500 font-black uppercase italic text-sm mb-1">CHÍNH SÁCH NÂNG CẤP VIP</h4>
          <p className="text-slate-300 text-xs font-medium italic leading-relaxed">
            Hệ thống Diamond Nova <b>KHÔNG hỗ trợ cộng dồn VIP</b>. Khi bạn kích hoạt gói VIP mới, thời hạn của gói VIP hiện tại sẽ <b>bị mất hoàn toàn</b> và được thay thế bằng gói mới. Vui lòng cân nhắc trước khi thực hiện.
          </p>
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map(pkg => (
          <div key={pkg.tier} className={`glass-card p-10 rounded-[3rem] border ${pkg.border} ${pkg.bg} flex flex-col justify-between group hover:scale-105 transition-all shadow-xl`}>
            <div className="text-center space-y-6">
              <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${pkg.color}`}>{pkg.name}</div>
              <div className="text-4xl font-black text-white italic tracking-tighter">{pkg.days} NGÀY</div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> +50% Thưởng nhiệm vụ</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> Ưu tiên duyệt lệnh 5 phút</div>
                <div className="flex items-center gap-3 text-slate-400 text-xs italic"><CheckCircle2 size={14} className="text-emerald-500" /> Huy hiệu {pkg.tier.toUpperCase()} hồ sơ</div>
              </div>
            </div>
            <button 
              onClick={() => openDeposit(pkg)}
              className={`w-full mt-10 py-5 rounded-2xl font-black text-[11px] uppercase italic tracking-widest transition-all ${pkg.tier === VipTier.ELITE ? 'bg-purple-600 shadow-purple-600/20' : pkg.tier === VipTier.PRO ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-blue-600 shadow-blue-600/20'} text-white active:scale-95 shadow-lg`}
            >
              NÂNG CẤP NGAY
            </button>
          </div>
        ))}
      </div>

      {/* VIP History Table */}
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
                           <td className="px-6 py-5 text-slate-500 text-xs font-medium italic">{new Date(v.created_at).toLocaleString('vi-VN')}</td>
                           <td className="px-6 py-5">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border ${v.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                 {v.status === 'pending' ? 'ĐANG CHỜ DUYỆT' : v.status === 'completed' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI'}
                              </span>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Nạp VIP */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-8 rounded-[3rem] border border-white/10 relative my-auto animate-in zoom-in-95 shadow-3xl">
            <button onClick={() => setShowDepositModal(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black text-white italic uppercase mb-8">CHỌN PHƯƠNG THỨC THANH TOÁN</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <button onClick={() => setPaymentMethod('points')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'points' ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                  <Wallet className="w-8 h-8 text-blue-400" />
                  <span className="font-black text-[10px] uppercase italic">Dùng Điểm Nova (P)</span>
                  <span className="text-xs text-slate-500 italic">Giá: {(selectedPkg.vnd * 10).toLocaleString()} P</span>
               </button>
               <button onClick={() => setPaymentMethod('bank')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'bank' ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                  <CreditCard className="w-8 h-8 text-amber-400" />
                  <span className="font-black text-[10px] uppercase italic">Chuyển khoản ngoài (VNĐ)</span>
                  <span className="text-xs text-slate-500 italic">Giá: {selectedPkg.vnd.toLocaleString()} VNĐ</span>
               </button>
            </div>

            {paymentMethod === 'points' && (
              <div className="space-y-6 p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-bold italic">Số dư hiện tại:</span>
                    <span className="font-black text-white">{user.balance.toLocaleString()} P</span>
                 </div>
                 <button onClick={handleBuyWithPoints} disabled={isLoading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase italic text-[11px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'XÁC NHẬN THANH TOÁN ĐIỂM'}
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
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                       <span className="text-[10px] font-black text-slate-500 uppercase italic">Người hưởng thụ</span>
                       <span className="font-bold text-white uppercase">{randomBank?.owner}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                       <span className="text-[10px] font-black text-amber-500 uppercase italic shrink-0">Nội dung chuyển</span>
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-[9px] font-bold text-white truncate">{generateTransferContent()}</span>
                          <button onClick={() => copyToClipboard(generateTransferContent())} className="text-amber-500 hover:text-amber-400 transition-colors shrink-0"><Copy size={14} /></button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Tải lên bill thanh toán (Nếu có)</label>
                    <div className="relative h-32 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 hover:border-amber-500 hover:text-amber-400 transition-all cursor-pointer bg-slate-900/20 group">
                       {billFile ? <img src={billFile} className="h-full w-full object-contain rounded-3xl" /> : (
                         <>
                           <ImageIcon size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold uppercase">Nhấn để tải ảnh bill</span>
                         </>
                       )}
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
                    {isLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={16} /> XÁC NHẬN ĐÃ CHUYỂN KHOẢN</>}
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
