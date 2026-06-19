import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Banknote, TrendingUp, PieChart, Target, Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', password_confirm: '', currency: 'KZT',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Язык берём из контекста, не из формы
    const result = await register({ ...formData, language });
    if (result.success) navigate('/login');
    setLoading(false);
  };

  const features = [
    { icon: TrendingUp, text: t('budget.tips.trackExpenses.title') },
    { icon: PieChart, text: t('nav.aiAssistant') },
    { icon: Target, text: t('budget.tips.setGoals.title') },
    { icon: Banknote, text: t('nav.budget') },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-dark-900/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-income-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500/20 to-income-500/20 border border-primary-500/20 flex items-center justify-center">
              <Rocket className="w-12 h-12 text-primary-400" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-display font-bold text-white mb-4">{t('dashboard.aiPromo.title')}</h2>
          <p className="text-dark-400 text-lg max-w-md mx-auto mb-10">{t('dashboard.aiPromo.description')}</p>
          <div className="space-y-4 max-w-sm mx-auto">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-dark-800/80 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary-400" />
                </div>
                <span className="text-dark-300">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher compact />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white font-bold text-xl">₸</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white">Finance AI</h1>
              <p className="text-xs text-dark-500">{t('dashboard.aiPromo.title')}</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">{t('auth.createAccount')}</h2>
          <p className="text-dark-400 mb-8">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@example.com" className="input-field pl-12" required />
              </div>
            </div>

            <div>
              <label className="input-label">{t('auth.username')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder={t('auth.username')} className="input-field pl-12" required />
              </div>
            </div>

            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="input-field pl-12 pr-12" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password_confirm} onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })} placeholder="••••••••" className="input-field pl-12" required />
              </div>
            </div>

            <div>
              <label className="input-label flex items-center gap-2"><Banknote className="w-4 h-4" />{t('auth.currency')}</label>
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="input-field">
                <option value="KZT">₸ {t('currencies.KZT')}</option>
                <option value="RUB">₽ {t('currencies.RUB')}</option>
                <option value="USD">$ {t('currencies.USD')}</option>
                <option value="EUR">€ {t('currencies.EUR')}</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 mt-6">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>{t('auth.createAccount')}</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center mt-8 text-dark-400">
            {t('auth.haveAccount')}{' '}<Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">{t('auth.login')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
