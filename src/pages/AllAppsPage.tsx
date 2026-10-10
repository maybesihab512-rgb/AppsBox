import React, { useState, useMemo } from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { AppItem, AppCategory } from '../types/app';
import { AppCard } from '../components/AppCard';
import { useLanguage } from '../context/LanguageContext';

interface AllAppsPageProps {
  apps: AppItem[];
  initialCategory?: string;
  onSelectApp: (app: AppItem) => void;
  onQuickDownload: (app: AppItem) => void;
}

type SortOption = 'rating' | 'downloads' | 'name' | 'size';
type PlatformFilter = 'all' | 'apk' | 'play' | 'ios';

export const AllAppsPage: React.FC<AllAppsPageProps> = ({
  apps,
  initialCategory,
  onSelectApp,
  onQuickDownload,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>(
    (initialCategory as AppCategory) || 'All'
  );
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  const categories: AppCategory[] = [
    'All',
    'Security & Privacy',
    'Productivity',
    'Developer Tools',
    'Audio & Media',
    'Utilities',
  ];

  // Filtering and sorting logic
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search query filter (matches english and bangla fields)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        app.name.toLowerCase().includes(q) ||
        (app.tagline_en && app.tagline_en.toLowerCase().includes(q)) ||
        (app.tagline_bn && app.tagline_bn.toLowerCase().includes(q)) ||
        (app.description_en && app.description_en.toLowerCase().includes(q)) ||
        (app.description_bn && app.description_bn.toLowerCase().includes(q));

      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || app.category === selectedCategory;

      // Platform filter
      const matchesPlatform =
        selectedPlatform === 'all' ||
        (selectedPlatform === 'apk' && Boolean(app.apk_url)) ||
        (selectedPlatform === 'play' && Boolean(app.play_store_url)) ||
        (selectedPlatform === 'ios' && Boolean(app.app_store_url));

      return matchesSearch && matchesCategory && matchesPlatform;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'downloads') return b.downloads_count - a.downloads_count;
      if (sortBy === 'size') {
        const sizeA = parseFloat(a.file_size) || 0;
        const sizeB = parseFloat(b.file_size) || 0;
        return sizeA - sizeB;
      }
      return 0;
    });
  }, [apps, searchQuery, selectedCategory, selectedPlatform, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPlatform('all');
    setSortBy('rating');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header and Title */}
      <div className="space-y-2">
        <div className="text-xs uppercase font-mono tracking-wider text-red-500 font-semibold">
          Complete Software Registry
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t('apps_all_title')}
        </h1>
        <p className="text-sm text-zinc-300 max-w-2xl">
          {t('apps_all_subtitle')}
        </p>
      </div>

      {/* Control Toolbar: Search + Category Buttons + Filter Settings */}
      <div className="space-y-4 rounded-2xl border border-zinc-800/80 bg-[#0a0b10] p-4 sm:p-5">
        
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('hero_search_placeholder')}
              className="w-full rounded-xl border border-zinc-800 bg-[#06070a] pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none transition-all min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center w-full sm:w-auto">
              <ArrowUpDown size={14} className="absolute left-3 text-zinc-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-zinc-800 bg-[#06070a] pl-8 pr-8 py-3 text-xs font-semibold text-zinc-200 focus:border-red-600 focus:outline-none cursor-pointer min-h-[44px]"
              >
                <option value="rating">সর্বোচ্চ রেটিং (Highest Rated)</option>
                <option value="downloads">সর্বাধিক ডাউনলোড (Most Downloaded)</option>
                <option value="size">ফাইল সাইজ (Smallest Size)</option>
                <option value="name">বর্ণানুক্রমিক (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons (Functional Segmented Control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all min-h-[38px] ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat === 'All' ? t('cat_all') : cat}
            </button>
          ))}
        </div>

        {/* Platform Availability Sub-Filter */}
        <div className="pt-2 border-t border-zinc-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              প্ল্যাটফর্ম ফিল্টার:
            </span>
            <div className="flex items-center gap-1 bg-[#06070a] p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedPlatform === 'all'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setSelectedPlatform('apk')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedPlatform === 'apk'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Direct APK
              </button>
              <button
                onClick={() => setSelectedPlatform('play')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedPlatform === 'play'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Google Play
              </button>
              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedPlatform === 'ios'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                App Store
              </button>
            </div>
          </div>

          {/* Counts & Clear Filters */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 font-mono tabular-nums text-xs">
              {filteredApps.length} টি অ্যাপ প্রদর্শিত হচ্ছে (মোট {apps.length})
            </span>
            {(searchQuery || selectedCategory !== 'All' || selectedPlatform !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 font-semibold"
              >
                {t('clear_filters')}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Apps Grid or Empty State */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onSelect={onSelectApp}
              onQuickDownload={onQuickDownload}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#0a0b10] p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-red-400">
            <Search size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{t('no_apps_found')}</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো অ্যাপ্লিকেশন পাওয়া যায়নি।
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-xs font-bold text-white transition-colors"
          >
            {t('clear_filters')}
          </button>
        </div>
      )}

    </div>
  );
};
