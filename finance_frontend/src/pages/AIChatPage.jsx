import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AIChatPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const response = await aiAPI.getHistory(50);
      const history = response.data.results || response.data;
      setMessages(history.reverse());
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const tempUserMsg = { id: Date.now(), role: 'user', content: userMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await aiAPI.chat(userMessage);
      const { success, user_message, ai_message } = response.data;

      if (success && ai_message) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, user_message, ai_message];
        });
      } else {
        toast.error(t('errors.serverError'));
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (error) {
      toast.error(t('errors.networkError'));
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(t('confirmations.clearHistory'))) return;
    try {
      await aiAPI.clearHistory();
      setMessages([]);
      toast.success(t('ai.historyCleared'));
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const suggestedQuestions = [
    t('ai.suggestions.optimize'),
    t('ai.suggestions.topExpenses'),
    t('ai.suggestions.planBudget'),
    t('ai.suggestions.savingTips'),
  ];

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              {t('ai.title')}
              <Sparkles className="w-5 h-5 text-accent-400" />
            </h1>
            <p className="text-sm text-dark-500">{t('ai.subtitle')}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClearHistory} className="btn-ghost text-dark-500 hover:text-expense-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('ai.clearHistory')}</span>
          </button>
        )}
      </motion.div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">{t('ai.greeting.title')}</h2>
              <p className="text-dark-400 mb-6 max-w-md">{t('ai.greeting.description')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} onClick={() => setInput(q)} className="text-left p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700 hover:border-primary-500/50 text-dark-300 hover:text-white transition-all text-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div key={msg.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-dark-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble-ai">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-dark-800">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('ai.placeholder')} className="flex-1 input-field" disabled={loading} />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 disabled:opacity-50">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <p className="text-xs text-dark-600 mt-2 text-center">{t('ai.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
