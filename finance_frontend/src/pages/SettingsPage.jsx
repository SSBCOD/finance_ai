import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Banknote, Lock, Save, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { t, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    language: user?.language || 'ru',
    currency: user?.currency || 'KZT',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  // Обновляем язык интерфейса при изменении в форме
  useEffect(() => {
    if (profileData.language !== user?.language) {
      setLanguage(profileData.language);
    }
  }, [profileData.language]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileData);
    if (result?.success) {
      toast.success(t('settings.profileUpdated'));
      // Обновляем язык после успешного сохранения
      setLanguage(profileData.language);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      toast.error(t('settings.passwordsDoNotMatch'));
      return;
    }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData);
      toast.success(t('settings.passwordChanged'));
      setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{t('settings.title')}</h1>
        <p className="text-dark-400 mt-1">{t('settings.subtitle')}</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-400" />
          </div>
          <h2 className="text-lg font-display font-semibold text-white">{t('settings.profile')}</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="input-label">{t('auth.email')}</label>
            <input type="email" value={user?.email || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
            <p className="text-xs text-dark-500 mt-1">{t('settings.emailCannotChange')}</p>
          </div>

          <div>
            <label className="input-label">{t('auth.username')}</label>
            <input type="text" value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label flex items-center gap-2"><Globe className="w-4 h-4" />{t('auth.language')}</label>
              <select value={profileData.language} onChange={(e) => setProfileData({ ...profileData, language: e.target.value })} className="input-field">
                <option value="ru">{t('languages.ru')}</option>
                <option value="kz">{t('languages.kz')}</option>
              </select>
            </div>
            <div>
              <label className="input-label flex items-center gap-2"><Banknote className="w-4 h-4" />{t('auth.currency')}</label>
              <select value={profileData.currency} onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })} className="input-field">
                <option value="KZT">₸ {t('currencies.KZT')}</option>
                <option value="RUB">₽ {t('currencies.RUB')}</option>
                <option value="USD">$ {t('currencies.USD')}</option>
                <option value="EUR">€ {t('currencies.EUR')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-dark-400" />
            </div>
            <div>
              <p className="text-sm text-white">{t('settings.role')}: <span className="text-primary-400">{user?.role === 'ADMIN' ? t('settings.admin') : t('settings.user')}</span></p>
              <p className="text-xs text-dark-500">{t('settings.roleAssignedBySystem')}</p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /><span>{t('common.save')}</span></>}
          </button>
        </form>
      </motion.div>

      {/* Password Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent-400" />
          </div>
          <h2 className="text-lg font-display font-semibold text-white">{t('settings.security')}</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="input-label">{t('settings.currentPassword')}</label>
            <input type="password" value={passwordData.old_password} onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="input-label">{t('settings.newPassword')}</label>
            <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} className="input-field" required minLength={8} />
          </div>
          <div>
            <label className="input-label">{t('settings.confirmNewPassword')}</label>
            <input type="password" value={passwordData.new_password_confirm} onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })} className="input-field" required />
          </div>
          <button type="submit" disabled={passwordLoading} className="btn-secondary flex items-center gap-2">
            {passwordLoading ? <div className="w-5 h-5 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" /> : <><Lock className="w-4 h-4" /><span>{t('settings.changePassword')}</span></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
