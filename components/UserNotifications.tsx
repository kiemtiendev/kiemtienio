
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService.ts';
import { User, AdminNotification, Announcement } from '../types.ts';
import { Bell, Info, Megaphone, Zap, CreditCard, Users, History } from 'lucide-react';

interface Props {
  user: User;
}

const UserNotifications: React.FC<Props> = ({ user }) => {
  // Use state to hold combined items since dbService methods are asynchronous
  const [allItems, setAllItems] = useState<any[]>([]);

  // Fetch announcements and notifications on component mount and when user.id changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [announcements, personalNotifications] = await Promise.all([
          dbService.getAnnouncements(),
          dbService.getNotifications(user.id)
        ]);

        const combined = [
          ...announcements.map(a => ({ ...a, itemType: 'announcement' as const })),
          ...personalNotifications.map(n => ({ ...n, itemType: 'personal' as const }))
        ];

        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllItems(combined);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchData();
  }, [user.id]);

  const getIcon = (type: string, itemType: 'announcement' | 'personal') => {
    if (itemType === 'announcement') return <Megaphone className="w-6 h-6 text-blue-500" />;
    switch (type) {
      case 'withdrawal': return <CreditCard className="w-6 h-6 text-emerald-500" />;
      case 'referral': return <Users className="w-6 h-6 text-purple-500" />;
      case 'auth': return <Zap className="w-6 h-6 text-amber-500" />;
      default: return <Info className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-6">
        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-600/30">
          <Bell className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">HỘP THƯ HỆ THỐNG</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-3 italic">Cập nhật tin tức & Trạng thái tài khoản</p>
        </div>
      </div>

      <div className="space-y-6">
        {allItems.length === 0 ? (
          <div className="glass-card p-24 text-center rounded-[4rem] border border-white/5 bg-slate-900/10 shadow-inner">
             <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-10 h-10 text-slate-600" />
             </div>
             <p className="text-slate-600 font-black uppercase italic tracking-widest">Hộp thư hiện đang trống.</p>
          </div>
        ) : (
          allItems.map((item: any, idx) => (
            <div 
              key={item.id} 
              className={`glass-card p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 group hover:bg-white/[0.05] transition-all shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`p-5 rounded-2xl shrink-0 border border-white/5 shadow-inner ${item.itemType === 'announcement' ? 'bg-blue-600/10' : 'bg-slate-800/30'}`}>
                {getIcon(item.type, item.itemType)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-black uppercase italic tracking-widest px-2 py-0.5 rounded ${item.itemType === 'announcement' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                    {item.itemType === 'announcement' ? 'TIN HỆ THỐNG' : 'THÔNG BÁO RIÊNG'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold italic">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                <p className="text-slate-400 text-sm font-medium italic leading-relaxed">{item.content}</p>
              </div>
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Zap className="w-6 h-6 text-blue-500/50" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
