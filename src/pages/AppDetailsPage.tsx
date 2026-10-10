import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Star, 
  ShieldCheck, 
  CheckCircle, 
  ExternalLink, 
  Smartphone, 
  Apple, 
  FileCode, 
  Share2, 
  Bell, 
  Check,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { AppItem } from '../types/app';
import { AppIcon } from '../components/AppIcon';
import { ScreenshotsViewer } from '../components/ScreenshotsViewer';
import { AppCard } from '../components/AppCard';
import { useLanguage } from '../context/LanguageContext';

interface AppDetailsPageProps {
  app: AppItem;
  allApps: AppItem[];
  onBack: () => void;
  onSelectRelatedApp: (app: AppItem) => void;
  onOpenDownloadModal: (app: AppItem, mode: 'apk' | 'playStore' | 'appStore' | 'comingSoon') => void;
}

export const AppDetailsPage: React.FC<AppDetailsPageProps> = ({
  app,
  allApps,
  onBack,
  onSelectRelatedApp,
  onOpenDownloadModal,
}) => {
  const { lang, t } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);

  const hasApk = Boolean(app.apk_url);
  const hasPlayStore = Boolean(app.play_store_url);
  const hasAppStore = Boolean(app.app_store_url);

  const tagline = lang === 'bn' ? (app.tagline_bn || app.tagline_en) : app.tagline_en;
  const description = lang === 'bn' ? (app.description_bn || app.description_en) : app.description_en;
  const features = lang === 'bn' ? (app.features_bn && app.features_bn.length > 0 ? app.features_bn : app.features_en) : app.features_en;

  const relatedApps = allApps.filter(
    (a) => a.category === app.category && a.id !== app.id
  ).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${app.name} on AppsBox`,
        text: tagline,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-16">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span>{lang === 'bn' ? 'সকল অ্যাপে ফিরে যান' : 'Back to Applications'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>AppsBox</span>
          <span aria-hidden="true" className="text-zinc-700">/</span>
          <span>{app.category}</span>
          <span aria-hidden="true" className="text-zinc-700">/</span>
          <span className="text-zinc-200">{app.name}</span>
        </div>
      </div>

      {/* Hero Overview Block */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0a0b10] p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 h-44 w-44 bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* App Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <AppIcon
              iconName={app.icon_url}
              iconBg={app.icon_bg}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl"
              size={34}
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {app.name}
                </h1>
                <span className="flex items-center gap-1 rounded bg-red-950/70 border border-red-900/60 px-2 py-0.5 text-xs font-mono text-red-300">
                  <ShieldCheck size={12} className="text-red-400" />
                  {t('app_verified')}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
                {tagline}
              </p>

              {/* Unboxed specs strip */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-400 font-mono tabular-nums">
                <span className="text-zinc-300">{app.category}</span>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="text-zinc-300">v{app.version}</span>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{app.rating.toFixed(1)}</span>
                </div>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="text-zinc-300">{app.downloads_count.toLocaleString()} dl</span>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="text-zinc-300">{app.file_size}</span>
              </div>
            </div>
          </div>

          {/* Quick Share Action */}
          <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors"
            >
              {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copiedLink ? 'লিংক কপি হয়েছে' : 'শেয়ার করুন'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* DOWNLOAD OPTIONS HUB */}
      <section className="space-y-3.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{t('download_channels_title')}</span>
            <span className="text-xs font-mono text-red-500 font-normal">· v{app.version}</span>
          </h2>
          <p className="text-xs text-zinc-400">
            {t('download_channels_subtitle')}
          </p>
        </div>

        {/* 3 Download Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option 1: Android APK */}
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d13] p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/50 text-red-400 border border-red-900/40">
                    <Smartphone size={16} />
                  </div>
                  <span className="font-bold text-white text-sm">{t('dl_apk')}</span>
                </div>

                {hasApk ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded font-semibold">
                    {t('dl_direct_build')}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    {t('dl_coming_soon')}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('dl_apk_sub')}
              </p>

              <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1">
                <div>Size: <span className="text-zinc-200">{app.file_size}</span></div>
                <div>Min OS: <span className="text-zinc-200">{app.min_android}</span></div>
              </div>
            </div>

            {hasApk ? (
              <button
                onClick={() => onOpenDownloadModal(app, 'apk')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-red-950/40"
              >
                <Download size={14} />
                <span>{t('dl_download_now')} ({app.file_size})</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenDownloadModal(app, 'comingSoon')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Bell size={13} />
                <span>{t('dl_coming_soon')} · {t('dl_notify_me')}</span>
              </button>
            )}
          </div>

          {/* Option 2: Google Play Store */}
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d13] p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                    <FileCode size={16} className="text-zinc-300" />
                  </div>
                  <span className="font-bold text-white text-sm">{t('dl_play_store')}</span>
                </div>

                {hasPlayStore ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded font-semibold">
                    স্টোর রিলিজ
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    {t('dl_coming_soon')}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('dl_play_sub')}
              </p>

              <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1">
                <div>চ্যানেল: <span className="text-zinc-200">{hasPlayStore ? 'Live' : 'Review'}</span></div>
                <div>কম্প্যাটিবিলিটি: <span className="text-zinc-200">{app.min_android}</span></div>
              </div>
            </div>

            {hasPlayStore ? (
              <button
                onClick={() => onOpenDownloadModal(app, 'playStore')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white py-2.5 text-xs font-bold text-zinc-200 transition-all"
              >
                <ExternalLink size={13} />
                <span>{t('dl_open_store')}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenDownloadModal(app, 'comingSoon')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Bell size={13} />
                <span>{t('dl_coming_soon')} · {t('dl_notify_me')}</span>
              </button>
            )}
          </div>

          {/* Option 3: Apple App Store */}
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0d13] p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                    <Apple size={16} className="text-zinc-300" />
                  </div>
                  <span className="font-bold text-white text-sm">{t('dl_app_store')}</span>
                </div>

                {hasAppStore ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded font-semibold">
                    আইওএস রিলিজ
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    {t('dl_coming_soon')}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('dl_app_sub')}
              </p>

              <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1">
                <div>চ্যানেল: <span className="text-zinc-200">{hasAppStore ? 'Live' : 'Review'}</span></div>
                <div>কম্প্যাটিবিলিটি: <span className="text-zinc-200">{app.min_ios}</span></div>
              </div>
            </div>

            {hasAppStore ? (
              <button
                onClick={() => onOpenDownloadModal(app, 'appStore')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white py-2.5 text-xs font-bold text-zinc-200 transition-all"
              >
                <ExternalLink size={13} />
                <span>{t('dl_open_store')}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenDownloadModal(app, 'comingSoon')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Bell size={13} />
                <span>{t('dl_coming_soon')} · {t('dl_notify_me')}</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Screenshots Showcase (if configured) */}
      {app.screenshots && app.screenshots.length > 0 && (
        <ScreenshotsViewer screenshots={app.screenshots} appName={app.name} />
      )}

      {/* Description & Technical Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Description & Capabilities */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="rounded-xl border border-zinc-800/80 bg-[#0a0b10] p-5 sm:p-6 space-y-3.5">
            <h3 className="text-base font-bold text-white">
              {lang === 'bn' ? 'অ্যাপ্লিকেশন পরিচিতি ও বিবরণ' : 'About the Application'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {description}
            </p>

            {features && features.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 font-mono">
                  {t('app_features')}
                </h4>
                <ul className="space-y-2">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                      <CheckCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Technical Metadata Matrix */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="rounded-xl border border-zinc-800/80 bg-[#0a0b10] p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {t('app_specs')}
            </h3>

            <dl className="divide-y divide-zinc-800/80 text-xs font-mono">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Version</dt>
                <dd className="text-zinc-200 font-semibold">{app.version}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Package Size</dt>
                <dd className="text-zinc-200">{app.file_size}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Android Min</dt>
                <dd className="text-zinc-200">{app.min_android}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">iOS Min</dt>
                <dd className="text-zinc-200">{app.min_ios}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Total Downloads</dt>
                <dd className="text-white font-bold">{app.downloads_count.toLocaleString()}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Release Date</dt>
                <dd className="text-zinc-200">{app.release_date}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Security Check</dt>
                <dd className="text-emerald-400 font-semibold">Clean & Verified</dd>
              </div>
            </dl>
          </div>

          {/* Security & Verification Card (replaces personal hotline) */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck size={15} />
              <span>AppsBox Security Guarantee</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every package is cryptographically signed and checked against known malware and telemetry trackers.
            </p>
          </div>

        </div>

      </div>

      {/* Related Applications */}
      {relatedApps.length > 0 && (
        <section className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
            More from {app.category}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedApps.map((relApp) => (
              <AppCard
                key={relApp.id}
                app={relApp}
                onSelect={onSelectRelatedApp}
                onQuickDownload={(a) => onOpenDownloadModal(a, 'apk')}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
