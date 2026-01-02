
import React from 'react';
import { Check, X } from 'lucide-react';

interface GoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const GoldModal: React.FC<GoldModalProps> = ({ isOpen, onClose, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop with heavy blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[12px]" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md glass-gold-card rounded-[2.5rem] border border-[#d4af37]/40 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* URL Header (Trust building) */}
        <div className="pt-6 px-8 text-center">
           <span className="text-[9px] font-medium text-[#d4af37]/50 tracking-widest uppercase opacity-70">
             https://www.google.com/search?q=diamondnova.com
           </span>
        </div>

        {/* Main Content */}
        <div className="p-10 flex flex-col items-center text-center">
          
          {/* Checkmark in Gold Circle */}
          <div className="mb-8 relative">
            <div className="w-20 h-20 rounded-full border-2 border-[#d4af37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-b from-[#d4af37]/10 to-transparent">
              <Check className="w-10 h-10 text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" strokeWidth={3} />
            </div>
            <div className="absolute -inset-2 rounded-full border border-[#d4af37]/20 animate-ping opacity-20"></div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none gold-text-shimmer">
            {title}
          </h2>

          {/* Description */}
          <p className="text-[#c0c0c0] text-sm font-light leading-relaxed italic mb-10 max-w-[80%] mx-auto">
            {description}
          </p>

          {/* Luxury Pill Button */}
          <button 
            onClick={onClose}
            className="w-full py-4 px-10 rounded-full bg-gradient-to-b from-[#f9d976] via-[#d4af37] to-[#b08d26] text-white font-black uppercase italic text-[11px] tracking-[0.2em] shadow-[0_8px_25px_rgba(176,141,38,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            XÁC NHẬN HOÀN TẤT
          </button>
        </div>

        {/* Decorative corner light */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#d4af37]/10 blur-3xl rounded-full"></div>
      </div>

      <style>{`
        .glass-gold-card {
          background: linear-gradient(145deg, rgba(15, 15, 15, 0.95) 0%, rgba(5, 5, 5, 1) 100%);
        }
        .gold-text-shimmer {
          background: linear-gradient(90deg, #ffffff 0%, #d4af37 50%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gold-shimmer 3s linear infinite;
        }
        @keyframes gold-shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default GoldModal;
