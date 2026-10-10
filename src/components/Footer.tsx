import React from 'react';
import { Phone, Mail, MapPin, Box, ShieldAlert } from 'lucide-react';
import { DEVELOPER_INFO } from '../data/appsData';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (view: 'home' | 'all-apps' | 'admin', categoryFilter?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
}) => {
  const { lang, t } = useLanguage();

  return (
    <footer className="border-t border-zinc-800/80 bg-[#050608] text-zinc-400">
      {/* Notice banner */}
      <div className="border-b border-zinc-900 bg-red-950/20 px-4 py-2.5 text-center">
        <p className="mx-auto max-w-4xl text-xs text-red-300/80 leading-relaxed">
          <strong className="text-red-300 font-semibold">{lang === 'bn' ? 'AppsBox নোটিশ: ' : 'AppsBox Notice: '}</strong>
          {t('demo_disclaimer')}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
          
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-900 text-white shadow-sm shadow-red-600/40 border border-red-500/30">
                <Box size={16} />
              </span>
              <span className="text-base font-extrabold text-white tracking-tight">
                Apps<span className="text-red-500">Box</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              {lang === 'bn' 
                ? 'উচ্চ-গতির পারফরম্যান্স, নিরাপত্তা এবং জিরো-ট্র্যাকিং সুবিধাসহ আধুনিক মোবাইল ও ওয়েব অ্যাপ্লিকেশনের সরাসরি হাব।'
                : 'Direct distribution hub for verified, high-performance Android APKs, iOS packages, and web applications.'}
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              {lang === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  {t('nav_home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-apps')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  {t('nav_all_apps')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-apps', 'Security & Privacy')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  {t('cat_security')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-apps', 'Productivity')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  {t('cat_productivity')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-red-400 transition-colors text-left flex items-center gap-1.5 text-zinc-400"
                >
                  <ShieldAlert size={12} className="text-red-500" />
                  <span>{t('nav_admin')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Single Contact Section at Bottom */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              {lang === 'bn' ? 'যোগাযোগ' : 'Developer Contact'}
            </h4>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-white">
                {DEVELOPER_INFO.name}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone size={13} className="text-red-500 shrink-0" />
                <span className="font-mono">{DEVELOPER_INFO.formattedPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail size={13} className="text-red-500 shrink-0" />
                <span className="truncate">{DEVELOPER_INFO.email}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin size={13} className="text-red-500 shrink-0" />
                <span>{DEVELOPER_INFO.location}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom hairline row */}
        <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} AppsBox. All rights reserved.</p>
          <p className="font-mono text-[11px] text-zinc-400">Verified Software Hub</p>
        </div>
      </div>
    </footer>
  );
};
