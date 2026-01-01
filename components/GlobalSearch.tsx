
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, X } from 'lucide-react';
import { NAV_ITEMS } from '../constants.tsx';
import { AppView } from '../types.ts';

interface Props {
  onNavigate: (view: AppView) => void;
  isAdmin: boolean;
}

const GlobalSearch: React.FC<Props> = ({ onNavigate, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Phím tắt Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Xử lý tìm kiếm
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = NAV_ITEMS.filter(item => {
      const match = item.label.toLowerCase().includes(query.toLowerCase());
      const adminCheck = item.adminOnly ? isAdmin : true;
      return match && adminCheck;
    });
    setResults(filtered);
  }, [query, isAdmin]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div 
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          isOpen ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'
        }`}
      >
        <Search className={`w-4 h-4 ${isOpen ? 'text-blue-500' : 'text-slate-500'}`} />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm tính năng (Ctrl + K)..."
          className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder-slate-600 flex-1 italic"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-600 hover:text-white">
            <X size={14} />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-md border border-white/5">
          <Command size={10} className="text-slate-500" />
          <span className="text-[9px] font-black text-slate-500">K</span>
        </div>
      </div>

      {/* Kết quả dropdown */}
      {isOpen && (results.length > 0 || query) && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl border border-white/10 overflow-hidden z-[100] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-600 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                      {React.cloneElement(item.icon as any, { size: 16 })}
                    </div>
                    <span className="text-[11px] font-black text-slate-300 group-hover:text-white uppercase italic tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))
            ) : query ? (
              <div className="p-6 text-center text-slate-600">
                <p className="text-[10px] font-black uppercase italic italic">Không tìm thấy mục nào khớp!</p>
              </div>
            ) : null}
          </div>
          
          {results.length > 0 && (
            <div className="bg-white/[0.02] p-3 border-t border-white/5">
               <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center italic">Diamond Nova Command Center</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
