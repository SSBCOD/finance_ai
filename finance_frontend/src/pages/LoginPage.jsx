import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, BarChart3, Bot, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher compact />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white font-bold text-xl">₸</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white">Finance AI</h1>
              <p className="text-xs text-dark-500">{t('dashboard.aiPromo.title')}</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">{t('auth.welcomeBack')}</h2>
          <p className="text-dark-400 mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@example.com" className="input-field pl-12" required />
              </div>
            </div>

            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="input-field pl-12 pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>{t('auth.login')}</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center mt-8 text-dark-400">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">{t('auth.register')}</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-dark-900/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-primary-400" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-display font-bold text-white mb-4">{t('dashboard.aiPromo.title')}</h2>
          <p className="text-dark-400 text-lg max-w-md mx-auto">{t('dashboard.aiPromo.description')}</p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { icon: BarChart3, label: t('nav.dashboard') }, 
              { icon: Bot, label: t('nav.aiAssistant') }, 
              { icon: Wallet, label: t('nav.budget') }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="glass-card p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-dark-800 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary-400" />
                </div>
                <p className="text-sm text-dark-300">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
