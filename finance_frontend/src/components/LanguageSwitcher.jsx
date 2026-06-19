import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ className = '', compact = false }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const languages = [
    { code: 'kz', label: 'Қазақша', short: 'Қаз', flag: '🇰🇿' },
    { code: 'ru', label: 'Русский', short: 'Рус', flag: '🇷🇺' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[1];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-xl border border-dark-700 transition-all
          hover:bg-dark-800 hover:border-dark-600
          ${compact ? 'px-2 py-1.5' : 'px-3 py-2.5 w-full justify-between'}
          ${isOpen ? 'bg-dark-800 border-dark-600' : 'bg-dark-800/50'}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{currentLang.flag}</span>
          <span className="text-sm text-dark-200">{compact ? currentLang.short : currentLang.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute top-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50
              ${compact ? 'right-0 min-w-[140px]' : 'left-0 right-0'}
            `}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors
                  ${language === lang.code 
                    ? 'bg-primary-500/10 text-primary-400' 
                    : 'text-dark-300 hover:bg-dark-700/50 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-primary-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
