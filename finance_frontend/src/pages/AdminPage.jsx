import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, Shield, UserCheck, Search, MoreVertical, Trash2, UserCog, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Компонент выпадающего меню через портал
function DropdownMenu({ isOpen, onClose, position, children }) {
  if (!isOpen) return null;
  
  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[101] w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, activeToday: 0 });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/admin/users/');
      const userList = response.data.results || response.data;
      setUsers(userList);
      
      // Считаем статистику
      const admins = userList.filter(u => u.role === 'ADMIN').length;
      const today = new Date().toDateString();
      const activeToday = userList.filter(u => {
        if (!u.last_login) return false;
        return new Date(u.last_login).toDateString() === today;
      }).length;
      
      setStats({ total: userList.length, admins, activeToday });
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (userId === currentUser.id) {
      toast.error(t('admin.cannotChangeOwnRole'));
      return;
    }
    
    try {
      await api.patch(`/users/admin/users/${userId}/`, { role: newRole });
      toast.success(t('admin.roleChanged'));
      loadUsers();
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    }
    setMenuOpenId(null);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      toast.error(t('admin.cannotDeleteSelf'));
      return;
    }
    
    try {
      await api.delete(`/users/admin/users/${userId}/`);
      toast.success(t('admin.userDeleted'));
      loadUsers();
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
    }
    setConfirmDelete(null);
    setMenuOpenId(null);
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{t('admin.title')}</h1>
        <p className="text-dark-400 mt-1">{t('admin.subtitle')}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-dark-400">{t('admin.totalUsers')}</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.total}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-400" />
            </div>
            <span className="text-dark-400">{t('admin.admins')}</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.admins}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-income-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-income-400" />
            </div>
            <span className="text-dark-400">{t('admin.activeToday')}</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.activeToday}</p>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-display font-semibold text-white">{t('admin.userManagement')}</h3>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder={t('admin.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-2 w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-dark-500">
            {t('common.noData')}
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userName')}</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userEmail')}</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userRole')}</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userLanguage')}</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userCurrency')}</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium text-sm">{t('admin.userCreated')}</th>
                  <th className="text-right py-3 px-4 text-dark-400 font-medium text-sm">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-dark-800 hover:bg-dark-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.username}</span>
                        {user.id === currentUser.id && (
                          <span className="text-xs text-primary-400">({t('common.you') || 'вы'})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-dark-300">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`badge ${user.role === 'ADMIN' ? 'bg-accent-500/20 text-accent-400' : 'bg-dark-700 text-dark-300'}`}>
                        {user.role === 'ADMIN' ? t('settings.admin') : t('settings.user')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-dark-300">
                      {user.language === 'kz' ? '🇰🇿 KZ' : '🇷🇺 RU'}
                    </td>
                    <td className="py-4 px-4 text-dark-300">{user.currency}</td>
                    <td className="py-4 px-4 text-dark-400 text-sm">{formatDate(user.date_joined)}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (menuOpenId === user.id) {
                            setMenuOpenId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.left - 200,
                            });
                            setMenuOpenId(user.id);
                          }
                        }}
                        className="p-2 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700 transition-colors ml-auto block"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <DropdownMenu
                        isOpen={menuOpenId === user.id}
                        onClose={() => setMenuOpenId(null)}
                        position={menuPosition}
                      >
                        <button
                          onClick={() => handleChangeRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                          disabled={user.id === currentUser.id}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserCog className="w-4 h-4" />
                          <span>
                            {user.role === 'ADMIN' ? t('admin.changeRole') + ' → User' : t('admin.changeRole') + ' → Admin'}
                          </span>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user)}
                          disabled={user.id === currentUser.id}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-expense-400 hover:bg-dark-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('admin.deleteUser')}</span>
                        </button>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-expense-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-expense-400" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">{t('admin.deleteUser')}</h3>
                <p className="text-dark-400 text-sm">{confirmDelete.email}</p>
              </div>
            </div>
            <p className="text-dark-300 mb-6">{t('admin.confirmDeleteUser')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => handleDeleteUser(confirmDelete.id)} className="flex-1 btn-primary bg-expense-600 hover:bg-expense-500 shadow-expense-500/25">
                {t('common.delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
