import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  ChevronDown,
  Sparkles,
  Shield,
  Globe,
  CreditCard,
  Repeat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Синхронизация языка с профилем пользователя
  useEffect(() => {
    if (user?.language && user.language !== language) {
      setLanguage(user.language);
    }
  }, [user?.language]);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/account', icon: CreditCard, label: t('nav.account') },
    { path: '/income', icon: TrendingUp, label: t('nav.income') },
    { path: '/expenses', icon: TrendingDown, label: t('nav.expenses') },
    { path: '/scheduled', icon: Repeat, label: t('nav.scheduled') },
    { path: '/budget', icon: Wallet, label: t('nav.budget') },
    { path: '/ai-chat', icon: MessageSquare, label: t('nav.aiAssistant'), highlight: true },
  ];

  // Добавляем админ-панель если пользователь админ
  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: t('nav.admin'), isAdmin: true });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-dark-900/80 backdrop-blur-xl border-r border-dark-800
        transform lg:transform-none transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">₸</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">Finance AI</h1>
                <p className="text-xs text-dark-500">
                  {user?.language === 'kz' ? 'Ақылды қаржы' : 'Умные финансы'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  nav-item relative
                  ${isActive ? 'active' : ''}
                  ${item.highlight ? 'group' : ''}
                  ${item.isAdmin ? 'mt-4 border-t border-dark-800 pt-4' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 ${item.highlight ? 'text-primary-400' : ''} ${item.isAdmin ? 'text-accent-400' : ''}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-4 h-4 text-accent-400 animate-pulse-slow" />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Language Switcher */}
          <div className="px-4 pb-2">
            <LanguageSwitcher className="w-full" />
          </div>

          {/* User menu */}
          <div className="p-4 border-t border-dark-800">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-dark-500">
                    {user?.role === 'ADMIN' ? t('settings.admin') : t('settings.user')}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-dark-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <NavLink
                      to="/settings"
                      onClick={() => { setSidebarOpen(false); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('nav.settings')}</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-expense-400 hover:bg-dark-700/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="btn-icon">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold">₸</span>
              </div>
              <span className="font-display font-bold text-white">Finance AI</span>
            </div>

            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
