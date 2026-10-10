import React from 'react';
import { Star, Download, ArrowRight } from 'lucide-react';
import { AppItem } from '../types/app';
import { AppIcon } from './AppIcon';
import { useLanguage } from '../context/LanguageContext';

interface AppCardProps {
  app: AppItem;
  onSelect: (app: AppItem) => void;
  onQuickDownload?: (app: AppItem) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onSelect,
  onQuickDownload,
}) => {
  const { lang, t } = useLanguage();
  const hasApk = Boolean(app.apk_url);
  const hasPlay = Boolean(app.play_store_url);
  const hasApple = Boolean(app.app_store_url);

  const tagline = lang === 'bn' ? (app.tagline_bn || app.tagline_en) : app.tagline_en;

  return (
    <div
      onClick={() => onSelect(app)}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-[#0b0c12]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-600/50 hover:bg-[#0f1118] hover:shadow-lg hover:shadow-red-950/20 cursor-pointer"
    >
      <div>
        {/* Top Header: Icon + Name + Category + Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppIcon
              iconName={app.icon_url}
              iconBg={app.icon_bg}
              className="w-11 h-11"
              size={20}
            />
            <div>
              <h3 className="text-sm font-bold text-white transition-colors group-hover:text-red-400">
                {app.name}
              </h3>
              {/* Unboxed category metadata with separator */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span>{app.category}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono tabular-nums">v{app.version}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 font-mono tabular-nums">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{app.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {tagline}
        </p>
      </div>

      {/* Card Footer: Metadata and Availability */}
      <div className="mt-3.5 pt-3 border-t border-zinc-900/90">
        <div className="flex items-center justify-between text-[11px]">
          
          {/* Unboxed metadata specs */}
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono tabular-nums">
            <span>{app.file_size}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>{app.downloads_count.toLocaleString()} dl</span>
          </div>

          {/* Platform icons with availability indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span
              title={hasApk ? "Android APK Available" : "Android APK Coming Soon"}
              className={`${hasApk ? 'text-zinc-300 font-medium' : 'text-zinc-600 line-through'}`}
            >
              APK
            </span>
            <span aria-hidden="true" className="text-zinc-800">|</span>
            <span
              title={hasPlay ? "Google Play Available" : "Google Play Coming Soon"}
              className={`${hasPlay ? 'text-zinc-300 font-medium' : 'text-zinc-600 line-through'}`}
            >
              Play
            </span>
            <span aria-hidden="true" className="text-zinc-800">|</span>
            <span
              title={hasApple ? "App Store Available" : "App Store Coming Soon"}
              className={`${hasApple ? 'text-zinc-300 font-medium' : 'text-zinc-600 line-through'}`}
            >
              iOS
            </span>
          </div>
        </div>

        {/* Card CTA Action */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-red-400/90 group-hover:text-red-300 flex items-center gap-1 font-medium transition-colors">
            <span>{t('app_view_details')}</span>
            <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
          </span>

          {hasApk && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickDownload) {
                  onQuickDownload(app);
                } else {
                  onSelect(app);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-600 text-red-200 hover:text-white border border-red-900/60 hover:border-red-500 text-[11px] font-semibold transition-all"
              title="Direct APK Download"
            >
              <Download size={11} />
              <span>{t('app_get_apk')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
