
import React, { useState, useRef, useEffect } from 'react';
import { askGeminiSupport } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  RefreshCcw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

const Support: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Chào bạn! Tôi là trợ lý ảo Diamond Dash. Bạn có câu hỏi nào về việc làm nhiệm vụ hay rút kim cương không?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const result = await askGeminiSupport(input);
    const aiMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      sender: 'ai', 
      text: result.text, 
      timestamp: new Date(),
      sources: result.sources
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const reportToAdmin = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg) return;

    // Fix: dbService.getCurrentUser is async.
    const user = await dbService.getCurrentUser();
    // Safety check: ensure user is logged in
    if (!user) return;

    await dbService.addNotification({
      type: 'feedback',
      title: 'Phản hồi từ người dùng',
      content: `Người dùng ${user.fullname} cần hỗ trợ: "${lastUserMsg.text}"`,
      userId: user.id,
      userName: user.fullname
    });

    alert("Cảm ơn bạn! Yêu cầu của bạn đã được gửi trực tiếp tới quản trị viên.");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-card rounded-3xl overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hỗ trợ AI 24/7</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Đang trực tuyến</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={reportToAdmin}
            title="Gửi phản hồi cho Admin"
            className="p-2 hover:bg-slate-800 rounded-lg transition-all text-amber-400 border border-amber-400/20"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setMessages([{ id: '1', sender: 'ai', text: 'Hệ thống đã được làm mới. Tôi có thể giúp gì thêm cho bạn?', timestamp: new Date() }])}
            className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#0b0e14]/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
              </div>
              <div className={`p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nguồn tham khảo:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[11px] text-blue-400 border border-slate-700/50 hover:border-blue-500/30 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[120px] sm:max-w-[200px] font-medium">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <p className={`text-[10px] mt-2 opacity-40 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/50 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs font-medium text-slate-400">Đang tìm kiếm thông tin...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-slate-900/80 border-t border-slate-800">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Đặt câu hỏi cho AI (Hệ thống có kết nối Google Search)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 pr-16 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center items-center gap-4 mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Trợ lý AI được cung cấp bởi Gemini 3.0</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Google Search Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
