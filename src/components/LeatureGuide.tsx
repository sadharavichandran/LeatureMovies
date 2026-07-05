import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { guideService } from '../services/api';
import { UserProfile, Movie, Theatre, Show, Booking } from '../types';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface LeatureGuideProps {
  currentUser?: UserProfile | null;
  currentView?: string;
  movies?: Movie[];
  theatres?: Theatre[];
  shows?: Show[];
  userBookings?: Booking[];
  onNavigate?: (view: string) => void;
  onInitiateBooking?: (movie: Movie) => void;
}

const LeatureGuide: React.FC<LeatureGuideProps> = ({ 
  currentUser, 
  currentView = 'home', 
  movies = [], 
  theatres = [],
  shows = [],
  userBookings = [],
  onNavigate,
  onInitiateBooking
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hi there! I am your AI Leature Guide. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendText(transcript, true);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [currentUser, currentView, movies, theatres]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition start error", e);
      }
    }
  };

  const handleSendText = async (text: string, usedVoice: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = {
        userName: currentUser?.fullName,
        role: currentUser?.role,
        currentView,
        moviesCount: movies.length,
        theatres: theatres.map(t => ({ name: t.name, location: t.location })),
        userBookings,
      };
      
      const history = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await guideService.askQuestion(text, history, context);
      
      let replyText = response.answer;
      
      if (usedVoice && 'speechSynthesis' in window) {
        const plainText = replyText.replace(/\[ACTION:[^\]]+\]/g, '').replace(/[#*]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        window.speechSynthesis.speak(utterance);
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting right now. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendText(inputValue);
  };

  const getQuickPrompts = () => {
    if (currentView === 'watch-room') return ['How do I invite friends?', 'Leave watch room'];
    if (currentView === 'home') return ['Show upcoming blockbusters', 'How do I book tickets?'];
    if (currentView === 'theatres') return ['Where are the theatres?', 'What food do they serve?'];
    return ['How do I book tickets?', 'What is a watch room?'];
  };

  const renderMessageContent = (text: string) => {
    const actionRegex = /\[ACTION:([A-Z_]+)(?::([^\]]+))?\]/g;
    const mediaRegex = /\[MEDIA:([A-Z_]+)(?::([^\]]+))\]/g;
    let match;
    const actions = [];
    const media = [];
    let cleanText = text;

    while ((match = actionRegex.exec(text)) !== null) {
      actions.push({ type: match[1], target: match[2] });
      cleanText = cleanText.replace(match[0], '');
    }
    
    while ((match = mediaRegex.exec(cleanText)) !== null) {
      media.push({ type: match[1], url: match[2] });
      cleanText = cleanText.replace(match[0], '');
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#333] font-sans break-words text-stone-200">
          <ReactMarkdown>{cleanText}</ReactMarkdown>
        </div>
        
        {media.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {media.map((item, i) => {
              if (item.type === 'POSTER') {
                return (
                  <img key={i} src={item.url} alt="Poster" className="w-full max-w-[200px] rounded-xl border border-stone-800 shadow-md" />
                );
              }
              if (item.type === 'TRAILER') {
                return (
                  <div key={i} className="aspect-video w-full rounded-xl overflow-hidden border border-stone-800">
                     <iframe
                        src={item.url}
                        title="Trailer"
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {actions.map((action, i) => {
              let label = `Action: ${action.type}`;
              let onClick = () => {};
              
              if (action.type === 'NAVIGATE' && onNavigate && action.target) {
                label = `Go to ${action.target}`;
                onClick = () => {
                  onNavigate(action.target.toLowerCase().trim());
                  setIsOpen(false);
                };
              }
              
              if (action.type === 'BOOK' && onInitiateBooking && action.target) {
                 const m = movies.find(movie => movie.id === action.target.trim());
                 label = m ? `Book ${m.title}` : 'Book Movie';
                 onClick = () => {
                    if (m) {
                      onInitiateBooking(m);
                      setIsOpen(false);
                    }
                 };
              }
              
              if (action.type === 'ORDER_FOOD') {
                 label = 'Send Food Order to Seat';
                 onClick = () => {
                    alert('🍔 Food order dispatched to your seat!');
                 };
              }

              return (
                <button
                  key={i}
                  onClick={onClick}
                  className="text-[10px] uppercase tracking-wider font-bold bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#F1D299] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 text-left"
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-[#C5A059] to-[#8C6D31] text-black shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:shadow-[0_0_30px_rgba(197,160,89,0.5)] z-50 transition-shadow"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-[#0a0a0a] border border-[#C5A059]/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
          >
            <div className="bg-gradient-to-r from-[#C5A059]/20 to-transparent border-b border-[#C5A059]/20 p-4 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 blur-[50px] rounded-full" />
              <div className="flex items-center gap-2 relative z-10">
                <div className="p-1.5 bg-[#C5A059]/20 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#F1D299] text-sm">Leature Guide</h3>
                  <p className="text-[10px] text-stone-400 font-mono">AI ASSISTANT</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition-colors relative z-10 p-1 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#111] to-[#0a0a0a]">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {getQuickPrompts().map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendText(prompt)}
                      className="text-xs border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#C5A059]/30 text-stone-300 px-3 py-1.5 rounded-full transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-[#C5A059] to-[#8C6D31] text-black rounded-tr-sm'
                        : 'bg-white/5 border border-white/10 text-stone-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.sender === 'bot' ? (
                       renderMessageContent(msg.text)
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />
                    <span className="text-xs text-stone-400 font-mono">Processing query...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#050505]">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-full border transition-all ${
                    isListening 
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                      : 'bg-white/5 border-white/10 text-stone-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask a question..."}
                  className="w-full bg-[#111] border border-white/10 text-white rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                  disabled={isLoading || isListening}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1 top-1 bottom-1 aspect-square bg-[#C5A059] text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F1D299] transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeatureGuide;
