export type AppCategory = 
  | 'All'
  | 'Security & Privacy'
  | 'Productivity'
  | 'Developer Tools'
  | 'Audio & Media'
  | 'Utilities';

export interface ScreenshotSpec {
  title: string;
  caption: string;
  badge: string;
  previewTheme?: 'crimson' | 'dark' | 'neon';
  url?: string;
  metrics?: { label: string; value: string }[];
}

export interface AppItem {
  id: string;
  name: string;
  tagline_en?: string;
  tagline_bn?: string;
  description_en?: string;
  description_bn?: string;
  category: Exclude<AppCategory, 'All'>;
  icon_url: string; // Icon name like 'Shield' or uploaded URL path '/uploads/...'
  icon_bg: string;
  screenshots: ScreenshotSpec[];
  features_en: string[];
  features_bn: string[];
  version: string;
  release_date: string;
  file_size: string;
  apk_url: string | null;
  play_store_url: string | null;
  app_store_url: string | null;
  min_android: string;
  min_ios: string;
  downloads_count: number;
  rating: number;
  reviews_count: number;
  is_published: boolean;
  is_featured: boolean;
  developer: string;
  developerPhone: string;

  // Legacy/Helper fields
  tagline?: string;
  description?: string;
  features?: string[];
  iconName?: string;
  iconBg?: string;
  changelog?: string[];
  downloads?: string;
  releaseDate?: string;
  fileSize?: string;
  minAndroid?: string;
  minIos?: string;
  reviewsCount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  downloadUrls?: {
    apk?: string | null;
    playStore?: string | null;
    appStore?: string | null;
  };
}
