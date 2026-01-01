
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types.ts';
import { dbService, supabase } from './services/dbService.ts';
import { NAV_ITEMS } from './constants.tsx';
import { 
  Menu, 
  LogOut, 
  Sparkles,
  Bot,
  Wifi,
  WifiOff,
  Bell
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const loadSession = async () => {
    const sessionUser = await dbService.getCurrentUser();
    setUser(sessionUser);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();

    // REAL-TIME: Lắng nghe thay đổi Database từ Supabase
    const userSubscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
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

    const onlineInterval = setInterval(() => setIsOnline(navigator.onLine), 5000);

    return () => {
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(notifSubscription);
      clearInterval(onlineInterval);
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
    // Fix: Property 'is_banned' does not exist on type 'User'. Did you mean 'isBanned'?
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
      // Fix: Property 'is_admin' does not exist on type 'User'. Did you mean 'isAdmin'?
      case AppView.ADMIN: return user.isAdmin ? <Admin user={user} onUpdateUser={updateUser} /> : <Dashboard user={user} setView={setCurrentView} />;
      case AppView.GUIDE: return <Guide />;
      case AppView.NOTIFICATIONS: return <UserNotifications user={user} />;
      case AppView.SUPPORT: return <Support />;
      default: return <Dashboard user={user} setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#06080c] text-slate-200">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-card border-r border-white/5 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center gap-4 mb-12 px-2">
             <Sparkles className="w-10 h-10 text-blue-500" />
             <div>
               <h2 className="font-black text-xl text-white italic">NOVA</h2>
               <span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">CLOUD SYNC v1</span>
             </div>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map(item => {
              // Fix: Property 'is_admin' does not exist on type 'User'. Did you mean 'isAdmin'?
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
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
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
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="md:hidden flex items-center justify-between mb-8 glass-card p-4 rounded-2xl">
           <Sparkles className="w-7 h-7 text-blue-500" />
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-900 rounded-xl text-white"><Menu className="w-6 h-6" /></button>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>

        {/* Global Alert for New Notifs */}
        {hasNewNotif && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest italic shadow-2xl flex items-center gap-4 animate-bounce">
            <Bell className="w-5 h-5" /> CÓ THÔNG BÁO MỚI TỪ HỆ THỐNG!
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
