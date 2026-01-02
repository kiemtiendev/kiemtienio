
import React, { useState, useEffect } from 'react';
import { User, AdBanner } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { SLOGAN, COPYRIGHT, SOCIAL_LINKS } from '../constants.tsx';
import { 
  Sparkles, Loader2, LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User as UserIcon, HelpCircle, ArrowLeft, ShieldCheck, X, MessageSquare, Send
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('nova_remember') === 'true');
  const [ads, setAds] = useState<AdBanner[]>([]);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    dbService.getAds().then(setAds);
    if (rememberMe) {
      const savedEmail = localStorage.getItem('nova_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = isLogin 
      ? await dbService.login(email, password)
      : await dbService.register(fullname, email, password);

    if (res.success && res.user) {
      if (rememberMe) {
        localStorage.setItem('nova_remember', 'true');
        localStorage.setItem('nova_email', email);
      } else {
        localStorage.removeItem('nova_remember');
        localStorage.removeItem('nova_email');
      }
      onLoginSuccess(res.user);
    } else {
      setError(res.message || 'Lỗi không xác định.');
    }
    setIsLoading(false);
  };

  const handleForgotRequest = async () => {
    if (!resetEmail) return alert("Vui lòng nhập email.");
    setIsLoading(true);
    const res = await dbService.requestPasswordReset(resetEmail);
    setIsLoading(false);
    if (res.success) {
      setForgotStep('code');
      // Tự động mở telegram bot sau khi gửi yêu cầu nếu user muốn
    } else alert(res.message);
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) return alert("Vui lòng nhập đủ mã và mật khẩu mới.");
    setIsLoading(true);
    const res = await dbService.resetPasswordWithCode(resetEmail, resetCode, newPassword);
    setIsLoading(false);
    if (res.success) {
      alert(res.message);
      setShowForgotModal(false);
      setForgotStep('email');
      setEmail(resetEmail);
    } else alert(res.message);
  };

  const openTelegramBot = () => {
    window.open(SOCIAL_LINKS.telegram, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080c] p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-5xl flex flex-col lg:flex-row glass-card rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative z-10">
        
        {/* Left: Marketing & Ads */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900/40 p-16 flex-col justify-between border-r border-white/5">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20"><Sparkles className="w-6 h-6 text-white" /></div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">DIAMOND NOVA</h1>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight uppercase italic tracking-tighter">
              HỆ THỐNG <br /> <span className="nova-gradient">NHIỆM VỤ KIẾM TIỀN</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium italic leading-relaxed">{SLOGAN}</p>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">TÀI TRỢ & QUẢNG CÁO</p>
              {ads.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-white/10 group relative h-32 bg-slate-900">
                  <img 
                    src={ads[0].imageUrl} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt="Ads"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-3">
                    <span className="text-white text-[10px] font-black uppercase italic leading-tight">{ads[0].title}</span>
                  </div>
                </div>
              ) : (
                <div className="h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-slate-600 text-[9px] font-black uppercase italic">Liên hệ đặt quảng cáo</span>
                </div>
              )}
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">{COPYRIGHT} © 2025</p>
          </div>
        </div>

        {/* Right: Auth Form */}
        <div className="w-full lg:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-slate-950/20">
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {isLogin ? 'CHÀO MỪNG TRỞ LẠI' : 'TẠO TÀI KHOẢN MỚI'}
              </h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Xác thực hệ thống Diamond Nova an toàn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="HỌ TÊN CỦA BẠN" value={fullname} onChange={e => setFullname(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all text-xs" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" placeholder="ĐỊA CHỈ GMAIL" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all text-xs" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPass ? "text" : "password"} 
                  placeholder="MẬT KHẨU" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-14 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all text-xs" 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between px-2">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="hidden" />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-700 bg-slate-900'}`}>
                         {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase italic group-hover:text-slate-400">Ghi nhớ</span>
                   </label>
                   <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black text-blue-500 uppercase italic hover:underline flex items-center gap-1">
                      <HelpCircle size={10} /> Quên mật khẩu?
                   </button>
                </div>
              )}
              
              {error && <p className="text-red-500 text-[10px] font-black text-center uppercase italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

              <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/20 active:scale-95">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? <><LogIn size={18} /> ĐĂNG NHẬP</> : <><UserPlus size={18} /> ĐĂNG KÝ</>)}
              </button>
            </form>

            <div className="text-center pt-4">
              <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 text-[10px] font-black uppercase italic hover:text-blue-400 transition-colors">
                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
            
            <p className="lg:hidden text-center text-slate-700 text-[8px] font-black uppercase italic pt-6 border-t border-white/5">{COPYRIGHT}</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in">
           <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 relative overflow-hidden shadow-3xl">
              <button onClick={() => setShowForgotModal(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-all hover:rotate-90"><X size={20} /></button>
              
              {forgotStep === 'email' ? (
                <div className="space-y-8">
                   <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                        <Mail className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">KHÔI PHỤC MẬT KHẨU</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bước 1: Gửi yêu cầu qua Email</p>
                   </div>
                   <div className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="email" 
                          placeholder="NHẬP EMAIL CỦA BẠN" 
                          value={resetEmail} 
                          onChange={e => setResetEmail(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs"
                        />
                      </div>
                      <button 
                        onClick={handleForgotRequest}
                        disabled={isLoading}
                        className="w-full bg-blue-600 py-5 rounded-2xl text-white font-black uppercase italic text-[11px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                      >
                         {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'XÁC NHẬN EMAIL'}
                      </button>
                   </div>
                   <div className="pt-4 border-t border-white/5 space-y-3">
                      <p className="text-[9px] text-slate-500 font-black uppercase text-center italic">Bạn cần lấy mã 6 số từ Bot Telegram?</p>
                      <button onClick={openTelegramBot} className="w-full bg-[#0088cc] hover:bg-[#0077b3] py-4 rounded-2xl text-white font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all">
                        <Send size={14} /> MỞ TELEGRAM BOT
                      </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">XÁC MINH DANH TÍNH</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bước 2: Nhập mã từ Bot & Đặt mật khẩu</p>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase italic ml-2">Mã xác nhận (Check Telegram)</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="0 0 0 0 0 0" 
                          value={resetCode} 
                          onChange={e => setResetCode(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-emerald-500 text-2xl tracking-[0.5em] text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase italic ml-2">Mật khẩu mới</label>
                        <input 
                          type="password" 
                          placeholder="********" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 text-xs text-center"
                        />
                      </div>
                      <button 
                        onClick={handleResetPassword}
                        disabled={isLoading}
                        className="w-full bg-emerald-600 py-5 rounded-2xl text-white font-black uppercase italic text-[11px] tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                         {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'HOÀN TẤT ĐỔI MẬT KHẨU'}
                      </button>
                      <div className="flex flex-col gap-2 pt-2">
                         <button onClick={openTelegramBot} className="w-full text-[9px] font-black text-[#0088cc] uppercase italic hover:underline flex items-center justify-center gap-2">
                           <MessageSquare size={10} /> Chưa nhận được mã? Mở lại Bot
                         </button>
                         <button onClick={() => setForgotStep('email')} className="w-full text-[9px] font-black text-slate-600 uppercase italic hover:text-white flex items-center justify-center gap-2">
                           <ArrowLeft size={10} /> Quay lại bước 1
                         </button>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;
