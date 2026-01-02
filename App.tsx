
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types.ts';
import { dbService, supabase } from './services/dbService.ts';
import { NAV_ITEMS, formatK, SOCIAL_LINKS } from './constants.tsx';
import { 
  Menu, 
  LogOut, 
  Sparkles,
  Bot,
  Wifi,
  WifiOff,
  Bell,
  Activity,
  X,
  Star,
  Sun,
  Moon,
  Youtube,
  MessageCircle,
  ExternalLink,
  PhoneCall,
  SendHorizontal
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('nova_theme') as 'light' | 'dark') || 'dark'
  );

  const loadSession = async () => {
    const sessionUser = await dbService.getCurrentUser();
    setUser(sessionUser);
    setIsLoading(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nova_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  useEffect(() => {
    loadSession();

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // REAL-TIME: Lắng nghe thay đổi Database từ Supabase
    const userSubscription = supabase
      .channel('public:users_data')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users_data' }, (payload) => {
        if (user && payload.new.id === user.id) {
          loadSession();
        }
      })
      .subscribe();

    const notifSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (user && (payload.new.user_id === user.id || payload.new.user_id === 'all')) {
          setHasNewNotif(true);
          // Auto clear after 5s
          setTimeout(() => setHasNewNotif(false), 5000);
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(notifSubscription);
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
          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Đang kết nối hệ thống Nova Cloud...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    if (user.isBanned) return (
      <div className="min-h-[60vh] flex items-center justify-center p-10">
        <div className="glass-card p-16 rounded-[3.5rem] border-2 border-red-500/30 text-center space-y-6">
          <WifiOff className="w-20 h-20 text-red-500 mx-auto" />
          <h2 className="text-3xl font-black text-white uppercase italic">TRUY CẬP BỊ TỪ CHỐI</h2>
          <p className="text-slate-500 italic text-sm">Tài khoản này đã bị đình chỉ do vi phạm.</p>
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
      default: return <Dashboard user={user} setView={setCurrentView} />;
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#06080c]' : 'bg-slate-50'} text-slate-200 transition-colors duration-500`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 glass-card border-r border-white/5 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12 px-2">
             <div className="flex items-center gap-4">
                <Sparkles className="w-10 h-10 text-blue-500" />
                <div>
                  <h2 className="font-black text-xl text-white italic">NOVA</h2>
                  <span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">CLOUD SYNC v1</span>
                </div>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500"><X size={20} /></button>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map(item => {
              if (item.adminOnly && !user?.isAdmin) return null;
              const active = currentView === item.id;
              return (
                <button key={item.id} onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                  {React.cloneElement(item.icon as any, { className: 'w-5 h-5' })}
                  <span className="font-black text-[11px] uppercase tracking-widest italic">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
             <div className="flex items-center gap-4 px-3 mb-8">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">{user?.fullname.charAt(0)}</div>
               <div className="flex flex-col">
                 <span className="text-xs font-black text-white uppercase truncate">{user?.fullname}</span>
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[8px] text-slate-500 uppercase">{isOnline ? 'Connected' : 'Offline'}</span>
                 </div>
               </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-black hover:bg-red-500/10 transition-all uppercase text-[10px] italic">
               <LogOut className="w-5 h-5" /> THOÁT
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        {/* Universal Header with GlobalSearch & ThemeToggle */}
        <header className="flex items-center justify-between gap-6 mb-10 glass-card p-4 rounded-3xl border border-white/5">
           <div className="flex items-center gap-4 md:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-900 rounded-xl text-white">
                <Menu className="w-6 h-6" />
              </button>
              <Sparkles className="w-7 h-7 text-blue-500" />
           </div>

           <div className="flex-1 max-w-xl mx-auto md:mx-0">
              <GlobalSearch onNavigate={setCurrentView} isAdmin={user?.isAdmin || false} />
           </div>

           <div className="flex items-center gap-3 md:gap-6 px-2 md:px-4">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center text-slate-400 hover:text-blue-400 group"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun size={20} className="group-hover:rotate-45 transition-transform" />
                ) : (
                  <Moon size={20} className="group-hover:-rotate-12 transition-transform" />
                )}
              </button>

              <div className="hidden lg:flex flex-col items-end">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Số dư hiện tại</span>
                 <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span className="text-lg font-black text-emerald-500 italic tracking-tighter">{formatK(user.balance)} P</span>
                 </div>
              </div>
              <button 
                onClick={() => setCurrentView(AppView.NOTIFICATIONS)}
                className="relative p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
              >
                 <Bell size={20} className="text-slate-400" />
                 {hasNewNotif && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
              </button>
           </div>
        </header>
        
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>

        {/* Floating Actions & Online Status Badge */}
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
          {/* Floating Social & Support Icons */}
          <div className="flex flex-col gap-3 pointer-events-auto">
            <a 
              href={SOCIAL_LINKS.YOUTUBE} 
              target="_blank" 
              className="w-12 h-12 bg-red-600/20 backdrop-blur-xl border border-red-500/30 rounded-full flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10 hover:bg-red-600 hover:text-white transition-all hover:scale-110 group relative"
              title="Xem hướng dẫn Video"
            >
              <Youtube size={20} />
              <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 rounded-lg text-[9px] font-black text-white uppercase italic tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5">HƯỚNG DẪN VIDEO</div>
            </a>
            <a 
              href={SOCIAL_LINKS.TELEGRAM_GROUP} 
              target="_blank" 
              className="w-12 h-12 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center justify-center text-blue-500 shadow-lg shadow-blue-600/10 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 group relative"
              title="Tham gia cộng đồng"
            >
              <MessageCircle size={20} />
              <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 rounded-lg text-[9px] font-black text-white uppercase italic tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5">CỘNG ĐỒNG NOVA</div>
            </a>
            <div className="h-px w-8 bg-white/10 mx-auto my-1"></div>
            <a 
              href={SOCIAL_LINKS.ZALO_ADMIN} 
              target="_blank" 
              className="w-10 h-10 bg-blue-400/20 backdrop-blur-xl border border-blue-400/30 rounded-full flex items-center justify-center text-blue-400 shadow-lg hover:bg-blue-400 hover:text-white transition-all group relative"
              title="Zalo Admin 0337117930"
            >
              <PhoneCall size={16} />
              <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 rounded-lg text-[8px] font-black text-white uppercase italic tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5">ZALO ADMIN</div>
            </a>
            <a 
              href={SOCIAL_LINKS.TELEGRAM_ADMIN} 
              target="_blank" 
              className="w-10 h-10 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center justify-center text-blue-500 shadow-lg hover:bg-blue-600 hover:text-white transition-all group relative"
              title="Telegram Admin @VanhTRUM"
            >
              <SendHorizontal size={16} />
              <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 rounded-lg text-[8px] font-black text-white uppercase italic tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5">TELE ADMIN</div>
            </a>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-3xl shadow-2xl transition-all duration-500 pointer-events-auto ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse' : 'bg-red-500'}`}></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Hệ thống</span>
              <span className="text-[11px] font-black uppercase italic tracking-tighter leading-none">{isOnline ? 'Trực tuyến' : 'Mất kết nối'}</span>
            </div>
            <div className="ml-2 pl-3 border-l border-white/10">
              {isOnline ? <Wifi className="w-4 h-4 opacity-50" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Global Alert for New Notifs */}
        {hasNewNotif && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest italic shadow-2xl flex items-center gap-4 animate-bounce border border-white/20">
            <Bell className="w-5 h-5" /> CÓ THÔNG BÁO MỚI TỪ HỆ THỐNG!
          </div>
        )}

        {/* Offline Overlay */}
        {!isOnline && (
          <div className="fixed inset-x-0 bottom-0 z-[70] p-4 animate-in slide-in-from-bottom-full duration-500">
            <div className="max-w-4xl mx-auto bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/20">
               <div className="flex items-center gap-5">
                 <div className="p-3 bg-white/20 rounded-xl">
                   <WifiOff className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-black text-sm uppercase italic tracking-tight">KẾT NỐI BỊ GIÁN ĐOẠN</h4>
                   <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Đang chờ tín hiệu internet để đồng bộ dữ liệu với Nova Cloud...</p>
                 </div>
               </div>
               <div className="hidden md:block">
                 <Activity className="w-6 h-6 animate-pulse opacity-50" />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
