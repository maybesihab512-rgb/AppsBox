import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation
  nav_home: { bn: 'হোম', en: 'Home' },
  nav_all_apps: { bn: 'সকল অ্যাপ', en: 'All Apps' },
  nav_security: { bn: 'সিকিউরিটি', en: 'Security' },
  nav_productivity: { bn: 'প্রোডাক্টিভিটি', en: 'Productivity' },
  nav_admin: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' },
  nav_developer: { bn: 'ডেভেলপার', en: 'Developer' },
  nav_contact_btn: { bn: 'যোগাযোগ করুন', en: 'Contact Dev' },

  // Hero Section
  hero_tag: { bn: 'ভেরিফাইড সফটওয়্যার হাব · সরাসরি ডাউনলোড', en: 'Verified Software Hub · Direct Distribution' },
  hero_title: { bn: 'গতি ও নিরাপত্তার নিশ্চয়তা সহ আধুনিক অ্যাপস', en: 'High-Octane Apps. Built for Speed & Privacy.' },
  hero_subtitle: {
    bn: 'AppsBox-এ অ্যান্ড্রয়েড এপিকে, আইওএস এবং ওয়েব অ্যাপ্লিকেশনের সরাসরি ও নিরাপদ সংগ্রহশালা। জিরো-ট্র্যাকিং এবং সর্বোচ্চ পারফরম্যান্স।',
    en: 'AppsBox is a direct platform for verified Android APK releases, iOS packages, and high-performance desktop utilities with zero tracking.',
  },
  hero_search_placeholder: { bn: 'নাম, ক্যাটাগরি বা ফিচার দিয়ে অ্যাপ খুঁজুন...', en: 'Search apps by name, category, or features...' },
  hero_browse_all: { bn: 'সব অ্যাপ দেখুন', en: 'Browse All' },
  hero_stats_apps: { bn: 'বিশ্বস্ত অ্যাপ্লিকেশন', en: 'Crafted Apps' },
  hero_stats_zero: { bn: 'জিরো ট্র্যাকিং / জিরো লগ', en: 'Zero Telemetry' },
  hero_stats_line: { bn: 'সরাসরি সাপোর্ট লাইন', en: 'Direct Line' },

  // Spotlight
  spotlight_badge: { bn: 'স্পটলাইট ফ্ল্যাগশিপ অ্যাপ', en: 'Spotlight Flagship' },
  spotlight_inspect: { bn: 'বিস্তারিত দেখুন', en: 'Inspect App Specs' },
  spotlight_download_apk: { bn: 'APK ডাউনলোড', en: 'Download APK' },

  // Categories
  categories_title: { bn: 'ক্যাটাগরি অনুযায়ী খুঁজুন', en: 'Browse by Category' },
  categories_subtitle: { bn: 'আপনার প্রয়োজন অনুযায়ী উপযুক্ত টুল বেছে নিন', en: 'Explore tailored tools by technical application' },
  categories_view_all: { bn: 'সব ক্যাটাগরি দেখুন', en: 'View All Categories' },
  cat_all: { bn: 'সব অ্যাপ', en: 'All' },
  cat_security: { bn: 'সিকিউরিটি ও প্রাইভেসি', en: 'Security & Privacy' },
  cat_productivity: { bn: 'প্রোডাক্টিভিটি', en: 'Productivity' },
  cat_dev_tools: { bn: 'ডেভেলপার টুলস', en: 'Developer Tools' },
  cat_audio_media: { bn: 'অডিও ও মিডিয়া', en: 'Audio & Media' },
  cat_utilities: { bn: 'ইউটিলিটিস', en: 'Utilities' },

  // App Cards & Details
  apps_featured_title: { bn: 'নির্বাচিত প্রধান অ্যাপসমূহ', en: 'Featured Flagship Applications' },
  apps_trending_title: { bn: 'জনপ্রিয় ও ট্রেন্ডিং অ্যাপ', en: 'Popular Utilities This Month' },
  apps_all_title: { bn: 'অ্যাপ্লিকেশন ক্যাটালগ', en: 'All Applications' },
  apps_all_subtitle: { bn: 'সরাসরি ডাউনলোড করুন বা স্টোর থেকে সংগ্রহ করুন', en: 'Search, filter, and download verified Android APKs and store releases.' },
  app_view_details: { bn: 'বিস্তারিত বিবরণ', en: 'View Details' },
  app_get_apk: { bn: 'APK নিন', en: 'Get APK' },
  app_downloads: { bn: 'ডাউনলোড', en: 'downloads' },
  app_rating: { bn: 'রেটিং', en: 'Rating' },
  app_verified: { bn: 'ভেরিফাইড বিল্ড', en: 'Verified Build' },
  app_specs: { bn: 'প্রযুক্তিগত স্পেসিফিকেশন', en: 'Technical Specifications' },
  app_features: { bn: 'প্রধান বৈশিষ্ট্যসমূহ', en: 'Engineered Capabilities' },
  app_changelog: { bn: 'ভার্সন আপডেট ও পরিবর্তন', en: 'Release Notes & Changelog' },
  app_screenshots: { bn: 'ইন্টারফেস প্রিভিউ ও স্ক্রিনশট', en: 'Interface Previews & HUD' },

  // Download channels
  download_channels_title: { bn: 'অফিসিয়াল ডাউনলোড চ্যানেল', en: 'Official Download Channels' },
  download_channels_subtitle: { bn: 'নিরাপদ এবং সরাসরি ভেরিফাইড প্যাকেজসমূহ', en: 'Only verified distributions with authentic binary manifests are enabled.' },
  dl_apk: { bn: 'অ্যান্ড্রয়েড APK', en: 'Android APK' },
  dl_apk_sub: { bn: 'সরাসরি ডিভাইসে ইনস্টলযোগ্য ফাইল', en: 'Direct signed package for Android devices.' },
  dl_play_store: { bn: 'গুগল প্লে স্টোর', en: 'Google Play Store' },
  dl_play_sub: { bn: 'অফিসিয়াল গুগল প্লে স্টোর লিংক', en: 'Official Google Play Store release.' },
  dl_app_store: { bn: 'অ্যাপল অ্যাপ স্টোর', en: 'Apple App Store' },
  dl_app_sub: { bn: 'আইফোন ও আইপ্যাডের জন্য অফিসিয়াল রিলিজ', en: 'Native iOS IPA binary compiled for iPhone/iPad.' },
  dl_download_now: { bn: 'ডাউনলোড করুন', en: 'Download Now' },
  dl_open_store: { bn: 'স্টোরে দেখুন', en: 'Get on Store' },
  dl_coming_soon: { bn: 'শীঘ্রই আসছে', en: 'Coming Soon' },
  dl_notify_me: { bn: 'রিলিজ হলে জানান', en: 'Notify Me' },
  dl_direct_build: { bn: 'সরাসরি এপিকে প্রস্তুত', en: 'Direct Build Ready' },

  // Beginner Help Guide
  guide_title: { bn: 'সহজ নির্দেশিকা: কীভাবে APK ইনস্টল করবেন?', en: 'Beginner Guide: How to install Android APK?' },
  guide_step1: { bn: '১. "ডাউনলোড APK" বাটনে ট্যাপ করুন এবং ফাইলটি ডাউনলোড হতে দিন।', en: '1. Tap "Download APK" button and let the file download.' },
  guide_step2: { bn: '২. ফোন সেটিংসে গিয়ে "Install Unknown Apps" বা অজানা উৎস থেকে ইনস্টল করার অনুমতি চালু করুন।', en: '2. Open device Settings and allow "Install Unknown Apps" for your browser.' },
  guide_step3: { bn: '৩. ডাউনলোড করা ফাইলে ট্যাপ করে "Install" চাপুন এবং ব্যবহার শুরু করুন।', en: '3. Tap the downloaded file, click "Install", and enjoy the app!' },


  // Admin
  admin_title: { bn: 'অ্যাপ ম্যানেজমেন্ট প্যানেল', en: 'App Management Dashboard' },
  admin_login_title: { bn: 'প্রশাসক লগইন', en: 'Administrator Login' },
  admin_add_app: { bn: 'নতুন অ্যাপ যোগ করুন', en: 'Add New Application' },
  admin_edit_app: { bn: 'অ্যাপ এডিট করুন', en: 'Edit Application' },
  admin_publish: { bn: 'প্রকাশ করুন', en: 'Publish' },
  admin_unpublish: { bn: 'অপ্রকাশিত রাখুন', en: 'Unpublish' },
  admin_delete: { bn: 'মুছে ফেলুন', en: 'Delete' },
  admin_save: { bn: 'সংরক্ষণ করুন', en: 'Save App' },
  admin_cancel: { bn: 'বাতিল', en: 'Cancel' },
  admin_logout: { bn: 'লগআউট', en: 'Logout' },

  // Common
  loading: { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  no_apps_found: { bn: 'কোনো অ্যাপ্লিকেশন পাওয়া যায়নি', en: 'No applications found' },
  clear_filters: { bn: 'ফিল্টার রিসেট করুন', en: 'Reset Filters' },
  demo_disclaimer: {
    bn: 'AppsBox নোটিশ: প্রদর্শিত অ্যাপ্লিকেশনগুলো পরীক্ষিত সফটওয়্যার সংস্করণ। এপিকে ডাউনলোড বাটনে ক্লিক করলে নিরাপদ প্যাকেজ সংরক্ষিত হবে।',
    en: 'AppsBox Notice: Applications displayed are verified software packages for testing and distribution.',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is 'bn' (Bangla) as explicitly requested
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_lang');
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {}
    return 'bn';
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_lang', lang);
    } catch {}
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key].en || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage: setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
