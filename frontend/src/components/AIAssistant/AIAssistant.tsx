import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon,
  BeakerIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/axiosConfig';

// Get saved position from localStorage or use default
const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem('ai_assistant_position');
    if (saved) {
      const pos = JSON.parse(saved);
      // Validate position is within viewport
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      return {
        x: Math.min(Math.max(0, pos.x), maxX),
        y: Math.min(Math.max(0, pos.y), maxY)
      };
    }
  } catch (e) {}
  return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  links?: { label: string; href: string }[];
  data?: any;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  query: string;
  icon: React.ElementType;
}

const quickActions: QuickAction[] = [
  { label: 'Stok Rendah', query: 'stok rendah', icon: CubeIcon },
  { label: 'Invoice Belum Lunas', query: 'invoice belum lunas', icon: BanknotesIcon },
  { label: 'OEE Hari Ini', query: 'OEE hari ini', icon: ChartBarIcon },
  { label: 'QC Hari Ini', query: 'QC hari ini', icon: BeakerIcon },
  { label: 'Absensi', query: 'absensi hari ini', icon: UserGroupIcon },
  { label: 'Pengiriman', query: 'pengiriman hari ini', icon: TruckIcon },
];

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Halo boss! 👋 Aku AI Assistant ERP kamu.\n\nAku terintegrasi dengan SEMUA modul:\n\n📦 Inventory & BOM\n🛒 Purchasing & Sales\n🏭 Production & OEE\n📊 Quality Control\n💰 Finance & Invoice\n👥 HR & Attendance\n🚚 Shipping & Delivery\n🔬 R&D Projects\n\nContoh:\n• "stok rendah"\n• "invoice belum lunas"\n• "OEE hari ini"\n• "QC hari ini"\n• "absensi hari ini"\n• "pengiriman hari ini"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Draggable state - use refs for real-time updates without re-render
  const [position, setPosition] = useState(getSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef(position);

  // Keep positionRef in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      offsetX: positionRef.current.x,
      offsetY: positionRef.current.y
    };
    
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Update React state with final position
    setPosition(positionRef.current);
    setIsDragging(false);
    
    // Save to localStorage
    localStorage.setItem('ai_assistant_position', JSON.stringify(positionRef.current));
  }, []);


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 56),
        y: Math.min(prev.y, window.innerHeight - 56)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/ai-assistant/query', {
        query: userMessage.content
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.message,
        links: response.data.links,
        data: response.data.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  // Track if we actually moved (to differentiate click vs drag)
  const hasMoved = useRef(false);
  
  // Handle click vs drag - only open if not dragged
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    // Only open if we didn't drag
    if (!hasMoved.current) {
      setIsOpen(true);
    }
    hasMoved.current = false;
  }, []);

  // Update handleDragStart to reset hasMoved
  const handleDragStartWithTrack = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    hasMoved.current = false;
    handleDragStart(e);
  }, [handleDragStart]);

  // Update handleDrag to track movement
  const handleDragWithTrack = useCallback((e: MouseEvent | TouchEvent) => {
    if (!buttonRef.current) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    
    // Mark as moved if we moved more than 5px
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }
    
    let newX = dragRef.current.offsetX + deltaX;
    let newY = dragRef.current.offsetY + deltaY;
    
    // Clamp to viewport bounds
    newX = Math.max(0, Math.min(newX, window.innerWidth - 56));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 56));
    
    // Direct DOM update for smooth movement (no React re-render)
    buttonRef.current.style.left = `${newX}px`;
    buttonRef.current.style.top = `${newY}px`;
    
    // Store for final position
    positionRef.current = { x: newX, y: newY };
  }, []);

  // Override the effect to use tracked version
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false };
      window.addEventListener('mousemove', handleDragWithTrack, options);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragWithTrack, options);
      window.addEventListener('touchend', handleDragEnd);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragWithTrack);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragWithTrack);
      window.removeEventListener('touchend', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleDragWithTrack, handleDragEnd]);

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onMouseDown={handleDragStartWithTrack}
        onTouchStart={handleDragStartWithTrack}
        onClick={handleButtonClick}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          // No transition on position for smooth dragging
          transition: isDragging ? 'none' : 'transform 0.15s, box-shadow 0.15s'
        }}
        className={`fixed z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl group select-none touch-none ${
          isDragging ? 'scale-105' : 'hover:scale-110'
        }`}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6 pointer-events-none" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse pointer-events-none"></span>
        {!isDragging && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant (drag to move)
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      style={{
        left: Math.min(position.x, window.innerWidth - (isMinimized ? 288 : 384) - 16),
        top: Math.min(position.y - (isMinimized ? 60 : 500), window.innerHeight - (isMinimized ? 60 : 550))
      }}
      className={`fixed z-50 ${isMinimized ? 'w-72' : 'w-96'} transition-all duration-300`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              {!isMinimized && (
                <p className="text-xs text-blue-100">Tanya apa saja tentang ERP</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <MinusIcon className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{formatContent(msg.content)}</p>
                    
                    {/* Data Table */}
                    {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              {Object.keys(msg.data[0]).slice(0, 4).map((key) => (
                                <th key={key} className="text-left py-1 px-2 font-medium text-slate-600 dark:text-slate-400">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.slice(0, 5).map((row: any, i: number) => (
                              <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                                {Object.values(row).slice(0, 4).map((val: any, j: number) => (
                                  <td key={j} className="py-1 px-2 text-slate-700 dark:text-slate-300">
                                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {msg.data.length > 5 && (
                          <p className="text-xs text-slate-500 mt-1">...dan {msg.data.length - 5} lainnya</p>
                        )}
                      </div>
                    )}

                    {/* Links */}
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.links.map((link, i) => (
                          <Link
                            key={i}
                            to={link.href}
                            onClick={() => setIsMinimized(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-slate-500">Mencari data...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Pertanyaan cepat:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.query)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tanya sesuatu..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
