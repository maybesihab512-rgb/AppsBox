import React, { useState } from 'react';
import { Menu, X, ShieldAlert, Globe, Box } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentView: 'home' | 'all-apps' | 'details' | 'admin';
  onNavigate: (view: 'home' | 'all-apps' | 'admin', categoryFilter?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#06070a]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: AppsBox Brand Logo */}
        <button
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="group flex items-center gap-2.5 text-left text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-900 text-white shadow-sm shadow-red-600/40 border border-red-500/30">
            <Box size={16} className="text-white" />
          </span>
          <span className="flex items-center tracking-tight text-base sm:text-lg">
            Apps<span className="text-red-500 font-black">Box</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-zinc-400">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'home' ? 'text-red-500 font-semibold' : ''
            }`}
          >
            {t('nav_home')}
          </button>
          <button
            onClick={() => onNavigate('all-apps')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentView === 'all-apps' ? 'text-red-500 font-semibold' : ''
            }`}
          >
            {t('nav_all_apps')}
          </button>
          <button
            onClick={() => onNavigate('all-apps', 'Security & Privacy')}
            className="whitespace-nowrap transition-colors hover:text-white"
          >
            {t('nav_security')}
          </button>
          <button
            onClick={() => onNavigate('all-apps', 'Productivity')}
            className="whitespace-nowrap transition-colors hover:text-white"
          >
            {t('nav_productivity')}
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-red-500 font-semibold' : 'text-zinc-400'
            }`}
          >
            <ShieldAlert size={13} className="text-red-500" />
            <span>{t('nav_admin')}</span>
          </button>
        </nav>

        {/* Zone 3: Actions - Language Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:text-white transition-all shadow-sm"
            title="Toggle between Bangla and English"
          >
            <Globe size={13} className="text-red-500" />
            <span>{lang === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#090a0f] px-4 py-3 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 text-sm ${
              currentView === 'home' ? 'text-red-500 font-semibold' : 'text-zinc-300'
            }`}
          >
            {t('nav_home')}
          </button>
          <button
            onClick={() => {
              onNavigate('all-apps');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 text-sm ${
              currentView === 'all-apps' ? 'text-red-500 font-semibold' : 'text-zinc-300'
            }`}
          >
            {t('nav_all_apps')}
          </button>
          <button
            onClick={() => {
              onNavigate('all-apps', 'Security & Privacy');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-zinc-400 hover:text-white"
          >
            {t('nav_security')}
          </button>
          <button
            onClick={() => {
              onNavigate('all-apps', 'Productivity');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-zinc-400 hover:text-white"
          >
            {t('nav_productivity')}
          </button>
          <button
            onClick={() => {
              onNavigate('admin');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 text-sm flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-red-500 font-semibold' : 'text-zinc-300'
            }`}
          >
            <ShieldAlert size={14} className="text-red-500" />
            <span>{t('nav_admin')}</span>
          </button>
          
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
            >
              <Globe size={13} className="text-red-500" />
              <span>{lang === 'bn' ? 'বাংলা (বর্তমান)' : 'English (Current)'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
