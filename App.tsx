
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types.ts';
import { dbService, supabase } from './services/dbService.ts';
import { NAV_ITEMS, formatK, SOCIAL_LINKS } from './constants.tsx';
import { 
  Menu, LogOut, Sparkles, Bot, WifiOff, Bell, Activity, X, Star, Sun, Moon, 
  Crown 
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('nova_theme') as 'light' | 'dark') || 'dark');

  const loadSession = async () => {
    const sessionUser = await dbService.getCurrentUser();
    setUser(sessionUser);
    setIsLoading(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nova_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  useEffect(() => {
    loadSession();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const userChannel = supabase.channel('user-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users_data' }, (payload) => {
        if (user && payload.new.id === user.id) loadSession();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users_data' }, (payload) => {
        if (user && payload.old.id === user.id) logout();
      })
      .subscribe();

    const notifChannel = supabase.channel('notif-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (user && (payload.new.user_id === user.id || payload.new.user_id === 'all')) {
          setHasNewNotif(true);
          setTimeout(() => setHasNewNotif(false), 8000);
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(userChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setCurrentView(AppView.DASHBOARD);
  };

  const logout = () => { 
    dbService.logout(); 
    setUser(null); 
    setCurrentView(AppView.DASHBOARD);
  };

  const updateUser = async (updated: User) => { 
    setUser(updated); 
    await dbService.updateUser(updated.id, updated); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Đang đồng bộ Nova Cloud...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  const renderView = () => {
    if (user.isBanned) return (
      <div className="min-h-[60vh] flex items-center justify-center p-10">
        <div className="glass-card p-16 rounded-[3.5rem] border-2 border-red-500/30 text-center space-y-6">
          <WifiOff className="w-20 h-20 text-red-500 mx-auto" />
          <h2 className="text-3xl font-black text-white uppercase italic">TRUY CẬP BỊ TỪ CHỐI</h2>
          <p className="text-slate-500 italic text-sm">Lý do: {user.banReason || 'Vi phạm chính sách'}</p>
        </div>
      </div>
    );

    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard user={user} setView={setCurrentView} />;
      case AppView.TASKS: return <Tasks user={user} onUpdateUser={updateUser} />;
      case AppView.WITHDRAW: return <Withdraw user={user} onUpdateUser={updateUser} />;
      case AppView.HISTORY: return <Withdraw user={user} onUpdateUser={updateUser} initialHistory={true} />;
      case AppView.LEADERBOARD: return <Leaderboard />;
      case AppView.PROFILE: return <Profile user={user} onUpdateUser={updateUser} />;
      case AppView.GIFTCODE: return <Giftcode user={user} onUpdateUser={updateUser} />;
      case AppView.REFERRAL: return <Referral user={user} />;
      case AppView.ADMIN: return user.isAdmin ? <Admin user={user} onUpdateUser={updateUser} /> : <Dashboard user={user} setView={setCurrentView} />;
      case AppView.GUIDE: return <Guide />;
      case AppView.NOTIFICATIONS: return <UserNotifications user={user} />;
      case AppView.SUPPORT: return <Support />;
      case AppView.VIP: return <Vip user={user} onUpdateUser={updateUser} />;
      default: return <Dashboard user={user} setView={setCurrentView} />;
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#06080c]' : 'bg-slate-50'} text-slate-200 transition-colors duration-500`}>
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 glass-card border-r border-white/5 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12 px-2">
             <div className="flex items-center gap-4">
                <Sparkles className="w-10 h-10 text-blue-500" />
                <div><h2 className="font-black text-xl text-white italic">NOVA</h2><span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">REAL-TIME SYNC</span></div>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map(item => {
              if (item.adminOnly && !user?.isAdmin) return null;
              return (
                <button key={item.id} onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                  {React.cloneElement(item.icon as any, { className: 'w-5 h-5' })}
                  <span className="font-black text-[11px] uppercase tracking-widest italic">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-8 border-t border-white/5">
             <div className="flex items-center gap-4 px-3 mb-8">
               <div className={`w-10 h-10 ${user.isVip ? 'bg-amber-500' : 'bg-blue-600'} rounded-xl flex items-center justify-center font-black text-white relative`}>
                 {user?.fullname.charAt(0)}
                 {user.isVip && <Crown className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 fill-amber-400" />}
               </div>
               <div className="flex flex-col">
                 <span className={`text-xs font-black uppercase truncate ${user.isVip ? 'text-amber-400' : 'text-white'}`}>{user?.fullname}</span>
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[8px] text-slate-500 uppercase">Hội viên {user.isVip ? 'VIP' : 'Elite'}</span>
                 </div>
               </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-black hover:bg-red-500/10 transition-all uppercase text-[10px] italic"><LogOut className="w-5 h-5" /> THOÁT</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        <header className="flex items-center justify-between gap-6 mb-10 glass-card p-4 rounded-3xl border border-white/5">
           <div className="flex items-center gap-4 md:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-900 rounded-xl text-white"><Menu className="w-6 h-6" /></button>
              <Sparkles className="w-7 h-7 text-blue-500" />
           </div>
           <div className="flex-1 max-w-xl mx-auto md:mx-0"><GlobalSearch onNavigate={setCurrentView} isAdmin={user?.isAdmin || false} /></div>
           <div className="flex items-center gap-3 md:gap-6 px-2 md:px-4">
              <button onClick={toggleTheme} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-slate-400 hover:text-blue-400 group">
                {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-45 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
              </button>
              <div className="hidden lg:flex flex-col items-end">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Số dư</span>
                 <div className="flex items-center gap-2"><Star className={`w-3 h-3 animate-pulse ${user.isVip ? 'text-amber-400' : 'text-emerald-500'}`} /><span className={`text-lg font-black italic tracking-tighter ${user.isVip ? 'text-amber-400' : 'text-emerald-500'}`}>{formatK(user.balance)} P</span></div>
              </div>
              <button onClick={() => setCurrentView(AppView.NOTIFICATIONS)} className="relative p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                 <Bell size={20} className="text-slate-400" />
                 {hasNewNotif && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
              </button>
           </div>
        </header>
        <div className="max-w-6xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
