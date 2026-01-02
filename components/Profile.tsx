
import React, { useState, useRef, useEffect } from 'react';
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
  Diamond,
  Crown,
  Zap,
  Star,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Activity,
  Camera,
  X,
  RotateCcw,
  Aperture,
  UserX
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [bank, setBank] = useState(user.bankInfo);
  const [gameId, setGameId] = useState(user.idGame);
  const [saved, setSaved] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, bankInfo: bank, idGame: gameId });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN? Hành động này không thể hoàn tác và toàn bộ số dư của bạn sẽ bị mất.")) {
      const res = await dbService.deleteAccount(user.id);
      if (res.success) {
        window.location.reload();
      } else {
        alert("Lỗi khi xóa tài khoản: " + res.message);
      }
    }
  };

  const score = user.securityScore ?? 100;
  
  const getSecurityStatus = () => {
    if (score > 80) return { 
      label: 'TIN CẬY TUYỆT ĐỐI', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      icon: <ShieldCheck className="w-6 h-6" />,
      desc: 'Tài khoản an toàn. Ưu tiên rút tiền siêu tốc.'
    };
    if (score >= 50) return { 
      label: 'CẦN THEO DÕI', 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20',
      icon: <ShieldAlert className="w-6 h-6" />,
      desc: 'Phát hiện hành vi nghi vấn nhẹ. Rút tiền sẽ được duyệt thủ công.'
    };
    return { 
      label: 'NGUY HIỂM', 
      color: 'text-red-500', 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/20',
      icon: <ShieldOff className="w-6 h-6" />,
      desc: 'Rủi ro cao. Tài khoản bị hạn chế rút tiền.'
    };
  };

  const security = getSecurityStatus();

  const openCamera = async () => {
    setIsCameraOpen(true);
    setIsCameraLoading(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 500, height: 500, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Lỗi truy cập camera:", err);
      alert("Không thể truy cập camera. Vui lòng cấp quyền.");
      setIsCameraOpen(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = 500;
        canvasRef.current.height = 500;
        context.drawImage(videoRef.current, 0, 0, 500, 500);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  };

  const updateAvatar = () => {
    if (capturedImage) {
      onUpdateUser({ ...user, avatarUrl: capturedImage });
      setIsCameraOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div 
            onClick={openCamera}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border-2 border-white/10 overflow-hidden group cursor-pointer relative"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <Fingerprint className="w-10 h-10 text-white" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{user.fullname}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VIP MEMBER • #{user.id.toUpperCase()}</span>
              {user.isAdmin && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">ADMIN</span>}
            </div>
          </div>
        </div>

        <div className={`glass-card px-6 py-4 rounded-2xl border ${security.border} ${security.bg} flex items-center gap-4`}>
          <div className={`${security.color} animate-pulse`}>
            {security.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${security.color}`}>{security.label}</span>
              <span className="text-white font-black text-lg italic">{score} Pts</span>
            </div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Nova Sentinel AI Analysis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className={`glass-card p-6 rounded-[2rem] border transition-all flex items-center gap-4 ${security.bg} ${security.border}`}>
          <div className={`p-4 rounded-2xl ${security.bg} ${security.color}`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Độ an toàn</p>
            <p className={`font-black text-xs uppercase italic ${security.color}`}>{score}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={`glass-card p-8 md:p-10 rounded-[3rem] border-2 ${security.border} relative overflow-hidden animate-in slide-in-from-left-4`}>
             <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
               <Shield className="w-64 h-64 text-white" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="relative">
                   <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * score) / 100}
                        className={`${security.color} transition-all duration-1000 ease-out`}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white italic">{score}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">SCORE</span>
                   </div>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                   <div>
                      <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${security.color}`}>NOVA SENTINEL AUDIT</h3>
                      <p className="text-white font-bold text-sm mt-1">{security.label}</p>
                   </div>
                   <p className="text-slate-400 text-xs font-medium italic leading-relaxed">
                     {security.desc} Hệ thống tự động phân tích hành vi nạp, rút và làm nhiệm vụ để bảo vệ cộng đồng Diamond Nova.
                   </p>
                </div>
             </div>
          </div>

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
                </div>
                <div className="flex justify-end gap-4">
                   <button onClick={handleDeleteAccount} className="px-6 py-5 rounded-2xl bg-red-600/10 text-red-500 font-black uppercase text-[10px] italic border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                      <UserX className="w-4 h-4" />
                   </button>
                   <button onClick={handleSave} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs italic transition-all active:scale-95">
                      {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{saved ? 'ĐÃ CẬP NHẬT' : 'LƯU THAY ĐỔI'}</span>
                   </button>
                </div>
             </div>
          </div>
        </div>

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
                 </div>
              </div>
           </div>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={closeCamera}></div>
           <div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white italic uppercase">CHỤP ẢNH ĐẠI DIỆN</h2>
                <button onClick={closeCamera} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="relative aspect-square bg-black rounded-[2rem] overflow-hidden">
                 {!capturedImage ? (
                   <>
                     <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" />
                     {isCameraLoading && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80">
                         <Aperture className="w-10 h-10 text-blue-500 animate-spin" />
                         <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">Đang khởi tạo Camera...</span>
                       </div>
                     )}
                   </>
                 ) : (
                   <img src={capturedImage} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                 )}
              </div>
              <div className="flex flex-col gap-4">
                 {!capturedImage ? (
                   <button onClick={capturePhoto} className="w-full py-6 bg-white text-black font-black rounded-2xl italic uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">
                     <Aperture size={24} /> CHỤP ẢNH NGAY
                   </button>
                 ) : (
                   <div className="flex gap-4">
                      <button onClick={() => { setCapturedImage(null); openCamera(); }} className="flex-1 py-5 bg-slate-900 border border-white/5 text-slate-400 font-black rounded-2xl italic uppercase text-xs flex items-center justify-center gap-2"><RotateCcw size={18} /> CHỤP LẠI</button>
                      <button onClick={updateAvatar} className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl italic uppercase text-xs flex items-center justify-center gap-2"><CheckCircle2 size={18} /> CẬP NHẬT ẢNH</button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Profile;
