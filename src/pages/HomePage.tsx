import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Terminal, 
  Headphones, 
  HelpCircle,
  Sparkles,
  X
} from 'lucide-react';
import { AppItem, AppCategory } from '../types/app';
import { AppCard } from '../components/AppCard';
import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  apps: AppItem[];
  onSelectApp: (app: AppItem) => void;
  onNavigateAll: (category?: string) => void;
  onQuickDownload: (app: AppItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  apps,
  onSelectApp,
  onNavigateAll,
  onQuickDownload,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'featured' | AppCategory>('featured');
  const [showGuide, setShowGuide] = useState(false);

  // Search filtered results for instant lookup inside hero
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return apps.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.tagline_en && a.tagline_en.toLowerCase().includes(q)) ||
      (a.tagline_bn && a.tagline_bn.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  // Displayed apps based on active tab
  const displayedApps = useMemo(() => {
    if (selectedFilter === 'featured') {
      const feat = apps.filter((a) => a.is_featured);
      return feat.length > 0 ? feat : apps.slice(0, 6);
    }
    if (selectedFilter === 'All') {
      return apps;
    }
    return apps.filter((a) => a.category === selectedFilter);
  }, [apps, selectedFilter]);

  const categories: { label: string; value: 'featured' | AppCategory }[] = [
    { label: lang === 'bn' ? 'ফিচার্ড অ্যাপস' : 'Featured Flagships', value: 'featured' },
    { label: t('cat_all'), value: 'All' },
    { label: t('cat_security'), value: 'Security & Privacy' },
    { label: t('cat_productivity'), value: 'Productivity' },
    { label: t('cat_dev_tools'), value: 'Developer Tools' },
    { label: t('cat_audio_media'), value: 'Audio & Media' },
    { label: t('cat_utilities'), value: 'Utilities' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      
      {/* Compact Hero Section */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 ambient-glow pointer-events-none opacity-80" />
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          {/* Subtle Kicker */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-950/80 bg-red-950/30 px-3 py-1 text-xs font-mono text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>AppsBox · {t('hero_tag')}</span>
          </div>

          {/* Compact Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance max-w-3xl mx-auto">
            {t('hero_title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>

          {/* Integrated Compact Search Bar */}
          <div className="relative max-w-lg mx-auto pt-1">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero_search_placeholder')}
                className="w-full rounded-xl border border-zinc-800 bg-[#0b0c12]/95 pl-10 pr-20 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 shadow-xl focus:border-red-600 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-16 p-1 text-zinc-400 hover:text-white"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => onNavigateAll()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors"
              >
                {t('hero_browse_all')}
              </button>
            </div>

            {/* Live Autocomplete Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border border-zinc-800 bg-[#0d0f17] p-2 shadow-2xl max-h-64 overflow-y-auto space-y-1 text-left">
                {searchResults.length > 0 ? (
                  searchResults.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        onSelectApp(app);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{app.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{app.category} · v{app.version}</div>
                      </div>
                      <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                        <span>{t('app_view_details')}</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-zinc-400">
                    "{searchQuery}" দিয়ে কোনো অ্যাপ পাওয়া যায়নি।
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Platform Proof Strip (No personal phone) */}
          <div className="pt-2 flex items-center justify-center gap-6 sm:gap-8 text-xs text-zinc-400 font-mono tabular-nums">
            <div>
              <span className="font-bold text-white">{apps.length}</span> {lang === 'bn' ? 'টি অ্যাপ' : 'Verified Apps'}
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div>
              <span className="font-bold text-white">100%</span> {lang === 'bn' ? 'জিরো ট্র্যাকিং' : 'Zero Telemetry'}
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div>
              <span className="font-bold text-emerald-400">Direct</span> {lang === 'bn' ? 'এপিকে ও স্টোর লিংক' : 'APK & Stores'}
            </div>
          </div>

        </div>
      </section>

      {/* Compact Quick Install Tip Strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-zinc-800/90 bg-[#090a0f] p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-zinc-300">
            <HelpCircle size={15} className="text-red-500 shrink-0" />
            <span>
              <strong className="text-white font-semibold">সহজ টিপস: </strong>
              APK ডাউনলোড করার পর ফোনে "Install unknown apps" অপশন চালু করে সহজেই ইনস্টল করুন।
            </span>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-red-400 hover:text-red-300 text-xs font-semibold underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            {showGuide ? 'সংক্ষেপ করুন' : 'বিস্তারিত নির্দেশিকা'}
          </button>
        </div>

        {showGuide && (
          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border border-red-950/60 bg-red-950/20 text-xs text-zinc-300">
            <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
              <span className="font-bold text-red-400 block mb-0.5">ধাপ ১: ডাউনলোড</span>
              <span>{t('guide_step1')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
              <span className="font-bold text-red-400 block mb-0.5">ধাপ ২: অনুমতি সক্রিয়</span>
              <span>{t('guide_step2')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
              <span className="font-bold text-red-400 block mb-0.5">ধাপ ৩: সম্পূর্ণ</span>
              <span>{t('guide_step3')}</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Apps Showcase: Single Cohesive Grid with Category Tabs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {selectedFilter === 'featured' ? t('apps_featured_title') : selectedFilter}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {displayedApps.length} {lang === 'bn' ? 'টি অ্যাপ্লিকেশন উপলব্ধ' : 'applications available'}
            </p>
          </div>

          <button
            onClick={() => onNavigateAll()}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{t('apps_all_title')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Category & Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedFilter(cat.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedFilter === cat.value
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Compact App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onSelect={onSelectApp}
              onQuickDownload={onQuickDownload}
            />
          ))}
        </div>

      </section>

    </div>
  );
};
