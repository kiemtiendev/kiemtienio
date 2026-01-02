
import React, { useState, useEffect } from 'react';
import { User, AdBanner } from '../types.ts';
import { dbService } from '../services/dbService.ts';
import { SLOGAN, COPYRIGHT } from '../constants.tsx';
import { 
  Sparkles, Loader2, LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User as UserIcon
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
  const [ads, setAds] = useState<AdBanner[]>([]);

  useEffect(() => {
    dbService.getAds().then(setAds);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = isLogin 
      ? await dbService.login(email, password)
      : await dbService.register(fullname, email, password);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.message || 'Lỗi không xác định.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080c] p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      
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
            <p className="text-slate-500 text-sm font-medium italic">{SLOGAN}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">Tài trợ</p>
             {ads.length > 0 ? (
               <img src={ads[0].imageUrl} className="w-full h-24 object-cover rounded-xl" alt="Ads" />
             ) : (
               <div className="h-24 bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-[10px] uppercase font-black">Quảng cáo trống</div>
             )}
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">{COPYRIGHT}</p>
        </div>

        <div className="w-full lg:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-slate-950/20">
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
              </h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Truy cập hệ thống Diamond Nova</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
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
              
              {error && <p className="text-red-500 text-[10px] font-black text-center uppercase italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

              <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? <><LogIn size={18} /> ĐĂNG NHẬP</> : <><UserPlus size={18} /> ĐĂNG KÝ</>)}
              </button>
            </form>

            <div className="text-center pt-4">
              <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 text-[10px] font-black uppercase italic hover:text-blue-400">
                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
