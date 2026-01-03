
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppView, User, VipTier, Notification } from './types.ts';
import { dbService, supabase } from './services/dbService.ts';
import { NAV_ITEMS, formatK, SOCIAL_LINKS } from './constants.tsx';
import { 
  Menu, LogOut, Sparkles, Bot, WifiOff, Bell, Activity, X, Star, Sun, Moon, 
  Crown, MessageCircle, Youtube, Send, MessageSquare, Plus, AlertTriangle, Clock,
  Facebook, Users as UsersIcon
} from 'lucide-react';

// Components
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';
import Tasks from './components/Tasks.tsx';
import Withdraw from './components/Withdraw.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import Profile from './components/Profile.tsx';
import Giftcode from './components/Giftcode.tsx';
import Referral from './components/Referral.tsx';
import Admin from './components/Admin.tsx';
import Guide from './components/Guide.tsx';
import UserNotifications from './components/UserNotifications.tsx';
import Support from './components/Support.tsx';
import GlobalSearch from './components/GlobalSearch.tsx';
import Vip from './components/Vip.tsx';
import NovaNotification, { NovaSecurityModal } from './components/NovaNotification.tsx';
import GoldModal from './components/GoldModal.tsx';
import GlobalAlertSystem from './components/GlobalAlertSystem.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('nova_theme') as 'light' | 'dark') || 'dark');
  const [isSocialMenuOpen, setIsSocialMenuOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [securityModal, setSecurityModal] = useState<{ isOpen: boolean; score: number }>({ isOpen: false, score: 0 });
  const [goldModal, setGoldModal] = useState<{ isOpen: boolean; title: string; description: string }>({ isOpen: false, title: '', description: '' });

  const showToast = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
  }, []);

  const showGoldSuccess = useCallback((title: string, description: string) => {
    setGoldModal({ isOpen: true, title, description });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const loadSession = async () => {
    const sessionUser = await dbService.getCurrentUser();
    setUser(sessionUser);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();
    const handleOnline = () => { setIsOnline(true); showToast('ONLINE', 'Đã kết nối Nova Cloud.', 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast('OFFLINE', 'Mất kết nối Internet.', 'error'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const userChannel = supabase.channel('user-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'users_data' }, (payload) => {
      if (user && ((payload.new as any)?.id === user.id || (payload.old as any)?.id === user.id)) loadSession();
    }).subscribe();

    const notifChannel = supabase.channel('notif-sync').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as any;
        if (user && (newNotif.user_id === user.id || newNotif.user_id === 'all')) {
           setHasNewNotif(true);
           showToast(newNotif.title, newNotif.content, 'info');
        }
    }).subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(userChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);

  const logout = () => { dbService.logout(); setUser(null); setCurrentView(AppView.DASHBOARD); showToast('Hẹn gặp lại', 'Đã đăng xuất an toàn.', 'info'); };

  const updateUser = async (updated: User) => { 
    setUser(updated); 
    const res = await dbService.updateUser(updated.id, updated);
    if (!res.success) {
        showToast('LỖI CẬP NHẬT', res.message || 'Không thể lưu thay đổi.', 'error');
        loadSession(); 
    }
    return res;
  };

  const vipExpiringSoon = useMemo(() => {
    if (!user?.isVip || !user?.vipUntil) return null;
    const diff = new Date(user.vipUntil).getTime() - new Date().getTime();
    if (diff > 0 && diff < 259200000) {
      const hoursTotal = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hoursTotal / 24);
      const hours = hoursTotal % 24;
      return { days, hours };
    }
    return null;
  }, [user?.isVip, user?.vipUntil]);

  // Helper cho menu Social
  const getSocialConfig = (key: string) => {
    switch (key) {
      case 'facebook': return { icon: <Facebook size={20} />, color: 'bg-[#1877F2]', label: 'Facebook' };
      case 'youtube': return { icon: <Youtube size={20} />, color: 'bg-[#FF0000]', label: 'Youtube' };
      case 'zalo': return { icon: <MessageCircle size={20} />, color: 'bg-[#0068FF]', label: 'Zalo' };
      case 'telegram': return { icon: <Send size={20} />, color: 'bg-[#229ED9]', label: 'Telegram' };
      case 'telegramGroup': return { icon: <UsersIcon size={20} />, color: 'bg-[#229ED9]', label: 'Nhóm hỗ trợ' };
      case 'telegramBot': return { icon: <Bot size={20} />, color: 'bg-[#8E44AD]', label: 'Nova Bot' };
      default: return { icon: <Send size={20} />, color: 'bg-slate-800', label: 'Liên kết' };
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#06080c] flex items-center justify-center text-blue-500 animate-pulse font-black uppercase italic tracking-widest text-xs">Nova Syncing...</div>;
  if (!user) return <Login onLoginSuccess={(u) => { setUser(u); showToast('Chào mừng', `Xin chào ${u.fullname}!`, 'success'); }} />;

  const getVipRichStyle = () => user.vipTier === VipTier.ELITE ? 'elite-border-rich' : user.vipTier === VipTier.PRO ? 'pro-border-rich' : user.vipTier === VipTier.BASIC ? 'basic-border-rich' : 'border-white/10';
  const getVipBadgeColor = () => user.vipTier === VipTier.ELITE ? 'text-purple-400' : user.vipTier === VipTier.PRO ? 'text-amber-400' : user.vipTier === VipTier.BASIC ? 'text-blue-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#06080c]' : 'bg-slate-50'} text-slate-200 transition-colors duration-500`}>
      <GlobalAlertSystem />
      <NovaNotification notifications={notifications} removeNotification={removeNotification} />
      {securityModal.isOpen && <NovaSecurityModal score={securityModal.score} onClose={() => setSecurityModal({ isOpen: false, score: 0 })} />}
      <GoldModal 
        isOpen={goldModal.isOpen} 
        onClose={() => setGoldModal({ ...goldModal, isOpen: false })} 
        title={goldModal.title} 
        description={goldModal.description} 
      />

      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 glass-card border-r border-white/5 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-10 px-2">
             <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-500" />
                <h2 className="font-black text-xl text-white italic tracking-tighter">NOVA</h2>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map(item => {
              if (item.adminOnly && !user.isAdmin) return null;
              return (
                <button key={item.id} onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                  {React.cloneElement(item.icon as any, { size: 18 })}
                  <span className="font-black text-[10px] uppercase tracking-widest italic">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-center gap-4 px-3 mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white relative border-2 ${getVipRichStyle()}`}>
                 {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover rounded-xl" /> : user.fullname.charAt(0)}
                 {user.isVip && <Crown className="absolute -top-3 -right-3 w-6 h-6 vip-crown-float text-amber-400 fill-amber-400" />}
               </div>
               <div className="overflow-hidden">
                 <span className={`text-[10px] font-black uppercase truncate block ${getVipBadgeColor()}`}>{user.fullname}</span>
                 <span className="text-[8px] text-slate-500 font-black uppercase italic tracking-tighter">Hạng: {user.vipTier.toUpperCase()}</span>
               </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-black hover:bg-red-500/10 transition-all uppercase text-[9px] italic"><LogOut size={18} /> THOÁT</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        <header className="mb-8 space-y-4">
           {vipExpiringSoon && (
             <div className="w-full bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between animate-pulse shadow-lg">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="text-amber-500 w-5 h-5" />
                   <p className="text-[10px] font-black text-amber-500 uppercase italic">
                     Cảnh báo: VIP sẽ hết hạn trong {vipExpiringSoon.days} ngày {vipExpiringSoon.hours} giờ! Hãy gia hạn để duy trì quyền lợi.
                   </p>
                </div>
                <button onClick={() => setCurrentView(AppView.VIP)} className="bg-amber-500 text-black px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic">Gia hạn</button>
             </div>
           )}

           <div className="flex items-center justify-between gap-6 glass-card p-4 rounded-3xl border border-white/5 w-full">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-900 rounded-xl text-white"><Menu size={20} /></button>
              <div className="flex-1 max-w-xl"><GlobalSearch onNavigate={setCurrentView} isAdmin={user.isAdmin} /></div>
              <div className="flex items-center gap-4">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Số dư Nova</span>
                    <span className={`text-lg font-black italic tracking-tighter ${user.isVip ? 'text-amber-400' : 'text-emerald-500'}`}>{formatK(user.balance)} P</span>
                  </div>
                  <button onClick={() => { setCurrentView(AppView.NOTIFICATIONS); setHasNewNotif(false); }} className={`p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all ${hasNewNotif ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`}>
                    <Bell size={18} />
                    {hasNewNotif && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></span>}
                  </button>
              </div>
           </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {user.isBanned ? (
            <div className="min-h-[50vh] flex items-center justify-center glass-card p-16 rounded-[4rem] border-2 border-red-500/30 text-center">
              <div><WifiOff className="w-20 h-20 text-red-500 mx-auto mb-6" /><h2 className="text-3xl font-black text-white uppercase italic">TRUY CẬP BỊ TỪ CHỐI</h2><p className="text-slate-500 italic mt-2">Lý do: {user.banReason}</p></div>
            </div>
          ) : (
            (() => {
              switch (currentView) {
                case AppView.DASHBOARD: return <Dashboard user={user} setView={setCurrentView} />;
                case AppView.TASKS: return <Tasks user={user} onUpdateUser={updateUser} />;
                case AppView.WITHDRAW: return <Withdraw user={user} onUpdateUser={updateUser} showGoldSuccess={showGoldSuccess} />;
                case AppView.HISTORY: return <Withdraw user={user} onUpdateUser={updateUser} initialHistory={true} showGoldSuccess={showGoldSuccess} />;
                case AppView.LEADERBOARD: return <Leaderboard />;
                case AppView.PROFILE: return <Profile user={user} onUpdateUser={updateUser} />;
                case AppView.GIFTCODE: return <Giftcode user={user} onUpdateUser={updateUser} showGoldSuccess={showGoldSuccess} />;
                case AppView.REFERRAL: return <Referral user={user} />;
                case AppView.ADMIN: return <Admin user={user} onUpdateUser={updateUser} setSecurityModal={setSecurityModal} showToast={showToast} showGoldSuccess={showGoldSuccess} />;
                case AppView.GUIDE: return <Guide />;
                case AppView.NOTIFICATIONS: return <UserNotifications user={user} />;
                case AppView.SUPPORT: return <Support />;
                case AppView.VIP: return <Vip user={user} onUpdateUser={updateUser} showGoldSuccess={showGoldSuccess} />;
                default: return <Dashboard user={user} setView={setCurrentView} />;
              }
            })()
          )}
        </div>
      </main>

      {/* FIXED SOCIAL MENU */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-4">
        {isSocialMenuOpen && (
          <div className="flex flex-col gap-4 mb-2 animate-in slide-in-from-bottom-10 duration-500">
            {Object.entries(SOCIAL_LINKS).map(([key, url]) => {
              const config = getSocialConfig(key);
              return (
                <div key={key} className="flex items-center gap-3 group">
                  <span className="opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/10 transition-all pointer-events-none">
                    {config.label}
                  </span>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-12 h-12 ${config.color} rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 hover:rotate-6 transition-all border border-white/20`}
                  >
                    {config.icon}
                  </a>
                </div>
              );
            })}
          </div>
        )}
        <button 
          onClick={() => setIsSocialMenuOpen(!isSocialMenuOpen)} 
          className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-110 ${isSocialMenuOpen ? 'bg-rose-600 rotate-[135deg]' : 'bg-blue-600 shadow-blue-600/20'}`}
        >
          {isSocialMenuOpen ? <Plus size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>
    </div>
  );
};

export default App;
