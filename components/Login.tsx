
import React, { useState, useEffect } from 'react';
import { User, AdBanner } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { SLOGAN, COPYRIGHT, SOCIAL_LINKS } from '../constants.tsx';
import { 
  Sparkles, Loader2, LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User as UserIcon,
  RefreshCw, Send, CheckCircle2, ChevronLeft
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // States for Forgot Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  // Ads Logic
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    dbService.getAds().then(setAds);
  }, []);

  // Auto cycle ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let res;
    if (view === 'login') {
      res = await dbService.login(email, password, rememberMe);
    } else if (view === 'register') {
      res = await dbService.register(fullname, email, password);
    }

    if (res && res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res?.message || 'Lỗi không xác định.');
    }
    setIsLoading(false);
  };

  const handleRequestReset = () => {
    if (!email.trim()) return setError("Vui lòng nhập email trước.");
    // Chuyển hướng sang Telegram Bot để lấy mã
    window.open(SOCIAL_LINKS.telegramBot, '_blank');
    setView('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 6) return setError("Mã OTP phải có 6 chữ số.");
    if (!newPassword.trim()) return setError("Vui lòng nhập mật khẩu mới.");

    setIsLoading(true);
    const res = await dbService.resetPasswordWithCode(email, resetCode, newPassword);
    setIsLoading(false);

    if (res.success) {
      alert(res.message);
      setView('login');
      setResetCode('');
      setNewPassword('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080c] p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[100px] rounded-full"></div>
      
      <div className="w-full max-w-5xl flex flex-col lg:flex-row glass-card rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative z-10">
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900/40 p-16 flex-col justify-between border-r border-white/5">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20"><Sparkles className="w-6 h-6 text-white" /></div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">DIAMOND NOVA</h1>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight uppercase italic tracking-tighter">
              HỆ THỐNG <br /> <span className="nova-gradient">KIẾM TIỀN ONLINE</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium italic leading-relaxed">{SLOGAN}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">Tài trợ Nova</p>
             <div className="relative w-full h-24 rounded-xl overflow-hidden group cursor-pointer bg-slate-800 shadow-inner">
               {ads.length > 0 ? (
                 ads.map((ad, idx) => (
                   <a 
                      key={ad.id}
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                   >
                     <img 
                        src={ad.imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                        alt={ad.title} 
                     />
                     {/* Overlay gradient similar to dashboard */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   </a>
                 ))
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-600 text-[10px] uppercase font-black italic">
                   <Loader2 className="animate-spin mr-2 w-4 h-4" /> Đang tải quảng cáo...
                 </div>
               )}
             </div>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">{COPYRIGHT}</p>
        </div>

        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-slate-950/20">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    {view === 'login' ? 'ĐĂNG NHẬP' : view === 'register' ? 'ĐĂNG KÝ' : view === 'forgot' ? 'QUÊN MẬT KHẨU' : 'ĐẶT LẠI MẬT KHẨU'}
                  </h3>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Truy cập hệ thống Diamond Nova</p>
               </div>
               {(view === 'forgot' || view === 'reset') && (
                 <button onClick={() => setView('login')} className="p-2 text-slate-500 hover:text-white transition-colors"><ChevronLeft size={24} /></button>
               )}
            </div>

            {view === 'reset' ? (
               <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4">
                  <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-200/80 font-medium italic leading-relaxed">
                      Mã xác nhận 6 chữ số đã được gửi tới tài khoản Telegram của bạn. Hãy kiểm tra tin nhắn từ Bot.
                    </p>
                  </div>
                  <div className="relative">
                    <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" maxLength={6} placeholder="MÃ XÁC NHẬN 6 SỐ" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-black tracking-[0.5em] text-center outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="password" placeholder="MẬT KHẨU MỚI" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs" />
                  </div>
                  {error && <p className="text-red-500 text-[10px] font-black text-center uppercase italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
                  <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'XÁC NHẬN THAY ĐỔI'}
                  </button>
               </form>
            ) : view === 'forgot' ? (
               <div className="space-y-5 animate-in slide-in-from-bottom-4">
                  <p className="text-slate-400 text-xs font-medium italic">Vui lòng nhập email tài khoản của bạn. Chúng tôi sẽ chuyển hướng bạn sang Telegram Bot để nhận mã OTP xác thực.</p>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" placeholder="NHẬP EMAIL CỦA BẠN" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs" />
                  </div>
                  {error && <p className="text-red-500 text-[10px] font-black text-center uppercase italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
                  <button onClick={handleRequestReset} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95">
                    LẤY MÃ QUA TELEGRAM <Send size={18} />
                  </button>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                  {view === 'register' && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" placeholder="HỌ TÊN" value={fullname} onChange={e => setFullname(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs" />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" placeholder="GMAIL" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPass ? "text" : "password"} 
                      placeholder="MẬT KHẨU" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-14 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs" 
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {view === 'login' && (
                    <div className="flex items-center justify-between px-2 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="peer sr-only" />
                          <div className={`w-5 h-5 rounded-md border border-slate-800 bg-slate-950 flex items-center justify-center transition-all peer-checked:bg-blue-600 peer-checked:border-blue-500`}>
                            {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase italic group-hover:text-slate-400">Ghi nhớ đăng nhập</span>
                      </label>
                      <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase italic">Quên mật khẩu?</button>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-[10px] font-black text-center uppercase italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

                  <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 mt-4">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? <><LogIn size={18} /> ĐĂNG NHẬP</> : <><UserPlus size={18} /> ĐĂNG KÝ</>)}
                  </button>
               </form>
            )}

            {(view === 'login' || view === 'register') && (
              <div className="text-center pt-4">
                <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-slate-500 text-[10px] font-black uppercase italic hover:text-blue-400">
                  {view === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
