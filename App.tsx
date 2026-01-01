
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types.ts';
import { dbService } from './services/dbService.ts';
import { NAV_ITEMS } from './constants.tsx';
import { 
  Menu, 
  LogOut, 
  Sparkles,
  Bot,
  MessageSquareText
} from 'lucide-react';

// Components - Tất cả import từ thư mục gốc/components
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

  useEffect(() => {
    const sessionUser = dbService.getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setCurrentView(AppView.DASHBOARD);
  };

  const logout = () => { 
    dbService.logout(); 
    setUser(null); 
    setCurrentView(AppView.DASHBOARD);
  };

  const updateUser = (updated: User) => { 
    setUser(updated); 
    dbService.updateCurrentUser(updated); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Đang khởi tạo Nova Core...</span>
        </div>
      </div>
    );
  }

  // Luồng ưu tiên: Render Login nếu chưa có session
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    if (user.isBanned) return <div className="p-20 text-center text-red-500 font-black uppercase tracking-[0.2em] glass-card rounded-3xl m-6">Tài khoản đã bị đình chỉ.</div>;
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
    <div className="min-h-screen flex bg-[#06080c] text-slate-200 selection:bg-blue-600/20">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-card border-r border-white/5 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center gap-4 mb-12 px-2">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center shadow-xl shadow-blue-600/20">
                <Sparkles className="w-7 h-7 text-white" />
             </div>
             <div>
               <h2 className="font-black text-xl text-white italic leading-none">NOVA</h2>
               <span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">VISION 1.0</span>
             </div>
          </div>
          
          <nav className="flex-1 space-y-2 no-scrollbar overflow-y-auto">
            {NAV_ITEMS.map(item => {
              if (item.adminOnly && !user?.isAdmin) return null;
              const active = currentView === item.id;
              return (
                <button key={item.id} onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border ${active ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-500/20 shadow-xl shadow-blue-600/10' : 'text-slate-500 hover:text-white hover:bg-white/5 border-transparent'}`}>
                  <div className={active ? 'text-white' : ''}>{React.cloneElement(item.icon as any, { className: 'w-5 h-5' })}</div>
                  <span className="font-black text-[11px] uppercase tracking-widest italic">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
             <div className="flex items-center gap-4 px-3 mb-8">
               <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-red-600 to-purple-800 rounded-2xl flex items-center justify-center font-black text-white border border-white/10 shadow-inner text-lg drop-shadow-md">
                 {user?.fullname.charAt(0)}
               </div>
               <div className="flex flex-col overflow-hidden">
                 <span className="text-xs font-black text-white uppercase italic truncate">{user?.fullname}</span>
                 <span className={`text-[8px] font-bold ${user?.isAdmin ? 'text-amber-500 animate-pulse' : 'text-blue-500'}`}>{user?.isAdmin ? 'MASTER ADMIN' : 'ELITE MEMBER'}</span>
               </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-black hover:bg-red-500/10 transition-all uppercase text-[10px] tracking-widest italic border border-transparent hover:border-red-500/20">
               <LogOut className="w-5 h-5" /> THOÁT RA
             </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="md:hidden flex items-center justify-between mb-10 glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-lg">
           <div className="flex items-center gap-4">
             <Sparkles className="w-7 h-7 text-blue-500" />
             <span className="font-black text-lg italic text-white uppercase tracking-tighter">DIAMOND NOVA</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-900 rounded-2xl text-white"><Menu className="w-6 h-6" /></button>
        </div>
        
        <div className="max-w-6xl mx-auto pb-20 relative">
          {renderView()}
          
          <div className="absolute bottom-[-4rem] right-0 text-[9px] font-black text-slate-700 uppercase tracking-widest italic">
            © 2025 DIAMOND NOVA • VISION 1.0
          </div>
        </div>

        {/* Floating AI Bubble */}
        <button 
          onClick={() => setCurrentView(AppView.SUPPORT)}
          className={`fixed bottom-10 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-800 text-white flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] border-2 border-white/20 transition-all hover:scale-110 active:scale-90 group z-[60] ${currentView === AppView.SUPPORT ? 'hidden' : 'flex'}`}
        >
          <Bot className="w-8 h-8 group-hover:animate-bounce" />
          <div className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-2xl">
             Hỏi AI Gemini ✨
          </div>
        </button>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
};

export default App;
