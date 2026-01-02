
import React, { useEffect } from 'react';

interface GoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const GoldModal: React.FC<GoldModalProps> = ({ isOpen, onClose, title, description, type = 'success' }) => {
  useEffect(() => {
    if (isOpen && type === 'success' && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e2b13c', '#ffffff', '#3b82f6']
      });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const configs = {
    success: { color: '#e2b13c', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01' },
    error:   { color: '#ff4d4d', icon: 'M18 6L6 18 M6 6l12 12' },
    warning: { color: '#f1c40f', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01' },
    info:    { color: '#3b82f6', icon: 'M12 16v-4 M12 8h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' }
  };

  const cfg = configs[type] || configs.info;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-[10px]" 
        onClick={onClose}
      ></div>

      {/* Container */}
      <div className="relative w-full max-w-[400px] rounded-[25px] p-[2px] overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-[#0d1117] dark:bg-[#0d1117] light:bg-white transition-colors">
        {/* Neon Border Effect */}
        <div 
          className="absolute inset-0 rounded-[25px] border-2 pointer-events-none" 
          style={{ borderColor: cfg.color, boxShadow: `0 0 15px ${cfg.color}55` }}
        ></div>

        <div className="relative p-10 text-center text-white dark:text-white light:text-[#1a1a1a]">
          <p className="text-[11px] opacity-50 tracking-[2px] uppercase mb-4">diamondnova.com</p>
          
          <div className="mb-4 flex justify-center transition-all duration-300 transform scale-110">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
              <path d={cfg.icon}></path>
            </svg>
          </div>

          <h2 className="text-[22px] font-black uppercase mb-3" style={{ color: cfg.color }}>
            {title}
          </h2>

          <p className="text-[15px] leading-relaxed opacity-85 mb-6 font-medium italic">
            {description}
          </p>

          <button 
            onClick={onClose}
            className="w-full py-4 rounded-[12px] text-white font-bold text-[16px] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-lg"
            style={{ background: cfg.color, boxShadow: `0 4px 15px ${cfg.color}66` }}
          >
            XÁC NHẬN
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoldModal;
