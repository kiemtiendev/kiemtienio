
import React, { useState } from 'react';
import { User } from '../types.ts';
import { 
  Shield, 
  Save, 
  Gamepad, 
  Building2, 
  Fingerprint,
  Calendar,
  CheckCircle2,
  BookOpen,
  Mail,
  Diamond
} from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [bank, setBank] = useState(user.bankInfo);
  const [gameId, setGameId] = useState(user.idGame);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateUser({ ...user, bankInfo: bank, idGame: gameId });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border-2 border-white/10">
          <Fingerprint className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{user.fullname}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VIP MEMBER • #{user.id.toUpperCase()}</span>
            {user.isAdmin && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">ADMIN</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4 hover:border-blue-500/30 transition-all">
          <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Liên kết email</p>
            <p className="text-white font-bold text-xs truncate">{user.email}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="p-4 bg-emerald-600/10 rounded-2xl text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ngày gia nhập</p>
            <p className="text-white font-bold text-xs">{user.joinDate}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] flex items-center gap-4 hover:border-purple-500/30 transition-all">
          <div className="p-4 bg-purple-600/10 rounded-2xl text-purple-400">
            <Diamond className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Rank hội viên</p>
            <p className="text-white font-bold text-xs uppercase italic">{user.isAdmin ? 'MASTER NOVA' : 'DIAMOND ELITE'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 className="w-32 h-32" /></div>
             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Thông tin thanh toán</h3>
             <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Thông tin ATM (STK - Ngân hàng - Chủ TK)</label>
                   <textarea value={bank} onChange={(e) => setBank(e.target.value)} placeholder="VD: 1900110022 - MB BANK - NGUYEN VAN A" rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-600 transition-all resize-none shadow-inner" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">ID Game (Free Fire / LQ)</label>
                   <input type="text" value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder="VD: 2029384756" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-600 transition-all shadow-inner" />
                   <p className="text-[9px] text-slate-600 font-bold italic ml-2">Mẹo: Nhập chính xác ID để nhận KC tự động qua cổng nạp.</p>
                </div>
                <div className="flex justify-end">
                   <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center gap-3 uppercase tracking-widest text-xs italic transition-all active:scale-95">
                      {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{saved ? 'ĐÃ CẬP NHẬT' : 'LƯU THAY ĐỔI'}</span>
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="space-y-8">
           <div className="glass-card p-8 rounded-[3rem] border border-white/5 relative overflow-hidden bg-blue-600/5">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                 <BookOpen className="w-6 h-6 text-blue-500" /> GIỚI THIỆU
              </h3>
              <div className="space-y-4">
                 <p className="text-slate-400 text-xs font-medium leading-relaxed italic">
                    Diamond Nova là nền tảng kiếm thưởng uy tín số 1 Việt Nam. Chúng tôi cung cấp giải pháp cày nhiệm vụ vượt link rút gọn để quy đổi thành giá trị thực.
                 </p>
                 <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-300 uppercase italic">Thanh toán minh bạch</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-300 uppercase italic">Hỗ trợ 24/7 qua AI</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-300 uppercase italic">Cộng đồng 10.000+ member</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
