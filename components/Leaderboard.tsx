
import React, { useMemo } from 'react';
import { dbService } from '../services/dbService.ts';
import { formatK } from '../constants.tsx';
import { 
  Trophy, 
  Medal, 
  Crown, 
  ArrowUp,
  TrendingUp
} from 'lucide-react';

const Leaderboard: React.FC = () => {
  const users = useMemo(() => {
    return dbService.getAllUsers()
      .filter(u => !u.isBanned)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
  }, []);

  const displayUsers = users.length > 0 ? users : [
    { fullname: 'NGUYỄN MINH QUÂN', balance: 1250000 },
    { fullname: 'LÊ THỊ THẢO', balance: 980000 },
    { fullname: 'TRẦN ANH ĐỨC', balance: 845000 },
    { fullname: 'PHẠM HOÀNG LONG', balance: 720000 },
    { fullname: 'VŨ TRUNG KIÊN', balance: 680000 },
    { fullname: 'ĐẶNG MINH TUẤN', balance: 540000 },
    { fullname: 'HÀ THỊ LAN', balance: 420000 },
    { fullname: 'BÙI QUỐC ANH', balance: 310000 }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bảng Xếp Hạng</h1>
          <p className="text-slate-400">Tôn vinh những cày thủ kim cương xuất sắc nhất tuần này.</p>
        </div>
        <div className="p-3 bg-amber-500/20 rounded-2xl">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
        {/* Silver */}
        <div className="order-2 md:order-1 glass-card p-8 rounded-3xl flex flex-col items-center text-center relative mt-4">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 bg-slate-300 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl">
              <Medal className="w-10 h-10 text-slate-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-slate-900">2</div>
          </div>
          <h3 className="mt-8 font-bold text-lg text-white mb-1">{displayUsers[1]?.fullname}</h3>
          <p className="text-slate-400 font-bold text-xl">{formatK(displayUsers[1]?.balance)}</p>
        </div>

        {/* Gold */}
        <div className="order-1 md:order-2 glass-card p-10 rounded-3xl flex flex-col items-center text-center relative transform scale-110 border-amber-500/30 bg-amber-500/5">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center border-4 border-amber-300 shadow-2xl animate-pulse">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-black border-2 border-slate-900 shadow-lg">1</div>
          </div>
          <h3 className="mt-10 font-black text-2xl text-white mb-1 uppercase tracking-tight">{displayUsers[0]?.fullname}</h3>
          <p className="text-amber-400 font-black text-3xl">{formatK(displayUsers[0]?.balance)}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-400/10 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>HUYỀN THOẠI</span>
          </div>
        </div>

        {/* Bronze */}
        <div className="order-3 md:order-3 glass-card p-8 rounded-3xl flex flex-col items-center text-center relative mt-4">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 bg-amber-700/80 rounded-full flex items-center justify-center border-4 border-amber-900 shadow-xl">
              <Medal className="w-10 h-10 text-amber-100" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-amber-950">3</div>
          </div>
          <h3 className="mt-8 font-bold text-lg text-white mb-1">{displayUsers[2]?.fullname}</h3>
          <p className="text-slate-400 font-bold text-xl">{formatK(displayUsers[2]?.balance)}</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden mt-8">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 text-left border-b border-slate-700/50">
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Hạng</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Thành viên</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-right">Số dư</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.slice(3).map((user, i) => (
              <tr key={i} className="border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition-all">
                <td className="px-8 py-5">
                  <span className="font-bold text-slate-500">#{i + 4}</span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                      {user.fullname.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-200">{user.fullname}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-bold text-white">{formatK(user.balance)}</span>
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
