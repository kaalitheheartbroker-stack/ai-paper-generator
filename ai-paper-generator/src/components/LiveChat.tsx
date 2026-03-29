import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Users, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  message: string;
  userName: string;
  examCategory: string;
  timestamp: any;
}

export const LiveChat = ({ currentUser, category }: { currentUser: any, category: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!category || category === 'all') return;

    const q = query(
      collection(db, 'chat'),
      where('examCategory', '==', category),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs.reverse());
    });

    return () => unsubscribe();
  }, [category]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isExpanded]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || category === 'all') return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chat'), {
        message: msgText,
        userName: currentUser.displayName || 'Anonymous Student',
        examCategory: category,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (category === 'all') return null; // Chat only active in specific categories

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 flex flex-col items-end ${isExpanded ? 'w-[350px]' : 'w-auto'}`}>
      
      {/* Chat Window */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-full bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col mb-4 h-[500px]"
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex items-center justify-between shadow-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">{category.toUpperCase()} Live Study</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50 custom-scrollbar relative">
              {messages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
                  <MessageSquare size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">Be the first to say hello in the {category.toUpperCase()} channel!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.userName === (currentUser?.displayName || 'Anonymous Student');
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] font-bold text-zinc-400 ml-2 mb-1">{msg.userName}</span>}
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                      isMe 
                        ? 'bg-brand-primary text-white rounded-br-sm' 
                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Chat with aspirants..."
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-zinc-900 dark:text-white"
                />
                <button 
                  type="submit" 
                  title="Send Message"
                  aria-label="Send Message"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-brand-primary text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Close live chat" : "Open live chat"}
        className="w-16 h-16 bg-brand-primary text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-105 transition-transform relative z-50 shadow-brand-primary/30"
      >
        {isExpanded ? <X size={28} /> : <MessageSquare size={28} />}
        {!isExpanded && messages.length > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 animate-bounce">
            !
          </span>
        )}
      </button>

    </div>
  );
};
