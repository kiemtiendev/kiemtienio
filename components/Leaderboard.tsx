
import React, { useMemo } from 'react';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Trophy, 
  Medal, 
  Crown, 
  ArrowUp,
  ShieldCheck,
  Star,
  Users,
  Sparkles
} from 'lucide-react';

const Leaderboard: React.FC = () => {
  const users = useMemo(() => {
    const all = dbService.getAllUsers()
      .filter(u => !u.isBanned)
      .sort((a, b) => (b.balance || 0) - (a.balance || 0));
    
    if (all.length === 0) {
      return [
        { fullname: 'NOVA MASTER', balance: 5000000 },
        { fullname: 'ELITE WARRIOR', balance: 3500000 },
        { fullname: 'DIAMOND KING', balance: 2800000 },
        { fullname: 'CRYPTO MINER', balance: 1200000 },
        { fullname: 'TASK HUNTER', balance: 950000 },
      ];
    }
    return all.slice(0, 10);
  }, []);

  const top1 = users[0] || { fullname: 'Chưa có', balance: 0 };
  const top2 = users[1] || { fullname: 'Chưa có', balance: 0 };
  const top3 = users[2] || { fullname: 'Chưa có', balance: 0 };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="relative overflow-hidden glass-card p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-3xl bg-[#0a0f18] group text-center md:text-left">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <Trophy className="w-80 h-80 text-amber-500" />
        </div>
        <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-xs font-black uppercase tracking-[0.4em] italic shadow-glow-amber">
              <ShieldCheck className="w-4 h-4" /> HALL OF FAME
            </div>
            <div>
               <h1 className="text-6xl md:text-8xl font-black text-white leading-none uppercase tracking-tighter italic drop-shadow-2xl">
                VINH <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">QUANG</span>
               </h1>
               <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.5em] italic mt-4 ml-1">hoangmaianhvu-dev-bot-web</p>
            </div>
        </div>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 px-4">
        {/* Silver */}
        <div className="order-2 md:order-1 glass-card p-10 rounded-[3.5rem] flex flex-col items-center text-center relative mt-12 border-slate-400/20 bg-gradient-to-b from-slate-400/5 to-transparent hover:scale-105 transition-all">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-300 to-slate-500 rounded-[2rem] flex items-center justify-center border-4 border-slate-700 shadow-xl">
              <Medal className="w-12 h-12 text-slate-100" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black border-2 border-slate-600 text-lg">2</div>
          </div>
          <h3 className="mt-12 font-black text-2xl text-white mb-2 uppercase italic truncate w-full px-4">{top2.fullname}</h3>
          <div className="flex items-center gap-2 mb-4">
             <Star className="w-4 h-4 text-slate-400" />
             <p className="text-slate-200 font-black text-3xl italic tracking-tighter">{formatK(top2.balance)}</p>
             <span className="text-slate-500 font-black text-xs uppercase">P</span>
          </div>
        </div>

        {/* Gold */}
        <div className="order-1 md:order-2 glass-card p-12 rounded-[4rem] flex flex-col items-center text-center relative transform scale-110 border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-[0_0_60px_rgba(245,158,11,0.15)]">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="w-28 h-28 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-[2.5rem] flex items-center justify-center border-4 border-amber-300 shadow-glow-amber animate-pulse">
              <Crown className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 border-slate-950 text-xl shadow-2xl">1</div>
          </div>
          <h3 className="mt-14 font-black text-3xl text-white mb-2 uppercase italic truncate w-full px-4">{top1.fullname}</h3>
          <div className="flex items-center gap-2 mb-6">
             <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
             <p className="text-amber-400 font-black text-5xl italic tracking-tighter">{formatK(top1.balance)}</p>
             <span className="text-amber-600 font-black text-lg uppercase">P</span>
          </div>
        </div>

        {/* Bronze */}
        <div className="order-3 md:order-3 glass-card p-10 rounded-[3.5rem] flex flex-col items-center text-center relative mt-12 border-orange-700/20 bg-gradient-to-b from-orange-700/5 to-transparent hover:scale-105 transition-all">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-800 rounded-[2rem] flex items-center justify-center border-4 border-orange-900 shadow-xl">
              <Medal className="w-12 h-12 text-orange-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-orange-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black border-2 border-orange-700 text-lg">3</div>
          </div>
          <h3 className="mt-12 font-black text-2xl text-white mb-2 uppercase italic truncate w-full px-4">{top3.fullname}</h3>
          <div className="flex items-center gap-2 mb-4">
             <Star className="w-4 h-4 text-orange-500" />
             <p className="text-slate-200 font-black text-3xl italic tracking-tighter">{formatK(top3.balance)}</p>
             <span className="text-slate-500 font-black text-xs uppercase">P</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[4rem] overflow-hidden border border-white/5 bg-slate-900/10 shadow-3xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
               <Users className="w-6 h-6 text-blue-400" />
             </div>
             <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">BẢNG XẾP HẠNG</h4>
           </div>
           <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">hoangmaianhvu-dev-bot-web • Vision 1.0</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20 text-left">
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Hạng</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Thành viên</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">Tích lũy</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(3).map((user, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all group">
                  <td className="px-10 py-8">
                    <span className="font-black text-slate-500 text-lg italic group-hover:text-blue-400 transition-colors">#{i + 4}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-sm font-black text-white italic border border-white/10">{user.fullname.charAt(0)}</div>
                      <span className="font-black text-slate-200 uppercase italic text-base group-hover:text-white transition-colors">{user.fullname}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-black text-2xl text-white italic tracking-tighter">{formatK(user.balance)}</span>
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                        <ArrowUp className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .shadow-glow-amber { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
      `}</style>
    </div>
  );
};

export default Leaderboard;
