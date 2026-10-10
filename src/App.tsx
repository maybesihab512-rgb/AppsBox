/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AllAppsPage } from './pages/AllAppsPage';
import { AppDetailsPage } from './pages/AppDetailsPage';
import { AdminPage } from './pages/AdminPage';
import { DownloadModal } from './components/DownloadModal';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppItem } from './types/app';
import { fetchApps, fetchAppById } from './services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

function AppContent() {
  const { lang } = useLanguage();
  const [currentView, setCurrentView] = useState<'home' | 'all-apps' | 'details' | 'admin'>('home');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | undefined>(undefined);

  // Download Modal state
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    app: AppItem | null;
    mode: 'apk' | 'playStore' | 'appStore' | 'comingSoon';
  }>({
    isOpen: false,
    app: null,
    mode: 'apk',
  });

  // Load published applications from database API
  const loadPublishedApps = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await fetchApps();
      setApps(data);
    } catch (err: any) {
      console.error('Failed to load apps:', err);
      setFetchError('Unable to connect to app server. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublishedApps();
  }, [loadPublishedApps]);

  // Sync hash routing on mount and change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'home') {
        setCurrentView('home');
      } else if (hash === 'admin') {
        setCurrentView('admin');
      } else if (hash.startsWith('app/')) {
        const appId = hash.replace('app/', '');
        const found = apps.find((a) => a.id === appId);
        if (found) {
          setSelectedApp(found);
          setCurrentView('details');
        } else {
          fetchAppById(appId)
            .then((app) => {
              setSelectedApp(app);
              setCurrentView('details');
            })
            .catch(() => {
              setCurrentView('all-apps');
            });
        }
      } else if (hash === 'all-apps' || hash.startsWith('category/')) {
        const cat = hash.startsWith('category/') ? decodeURIComponent(hash.replace('category/', '')) : undefined;
        setSelectedCategoryFilter(cat);
        setCurrentView('all-apps');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [apps]);

  // Scroll to top upon view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedApp]);

  const handleNavigate = (view: 'home' | 'all-apps' | 'admin', categoryFilter?: string) => {
    if (view === 'home') {
      window.location.hash = 'home';
      setCurrentView('home');
    } else if (view === 'admin') {
      window.location.hash = 'admin';
      setCurrentView('admin');
    } else {
      if (categoryFilter) {
        window.location.hash = `category/${encodeURIComponent(categoryFilter)}`;
        setSelectedCategoryFilter(categoryFilter);
      } else {
        window.location.hash = 'all-apps';
        setSelectedCategoryFilter(undefined);
      }
      setCurrentView('all-apps');
    }
  };

  const handleSelectApp = (app: AppItem) => {
    setSelectedApp(app);
    window.location.hash = `app/${app.id}`;
    setCurrentView('details');
  };

  const handleOpenDownloadModal = (
    app: AppItem,
    mode: 'apk' | 'playStore' | 'appStore' | 'comingSoon'
  ) => {
    setDownloadModal({
      isOpen: true,
      app,
      mode,
    });
  };

  const handleDownloadCompleted = (newCount: number) => {
    if (downloadModal.app) {
      const updatedId = downloadModal.app.id;
      setApps((prev) =>
        prev.map((a) => (a.id === updatedId ? { ...a, downloads_count: newCount } : a))
      );
      if (selectedApp && selectedApp.id === updatedId) {
        setSelectedApp({ ...selectedApp, downloads_count: newCount });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading && apps.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <RefreshCw size={18} className="animate-spin text-red-500" />
              <span>{lang === 'bn' ? 'অ্যাপ্লিকেশন ক্যাটালগ লোড হচ্ছে...' : 'Loading application catalog...'}</span>
            </div>
          </div>
        ) : fetchError && apps.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center p-8">
            <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 text-center space-y-3 max-w-md">
              <AlertCircle size={28} className="mx-auto text-red-500" />
              <h3 className="text-base font-bold text-white">সংযোগ সমস্যা (Connection Notice)</h3>
              <p className="text-xs text-zinc-300">{fetchError}</p>
              <button
                onClick={loadPublishedApps}
                className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-colors"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomePage
                apps={apps}
                onSelectApp={handleSelectApp}
                onNavigateAll={(cat) => handleNavigate('all-apps', cat)}
                onQuickDownload={(app) => handleOpenDownloadModal(app, 'apk')}
              />
            )}

            {currentView === 'all-apps' && (
              <AllAppsPage
                apps={apps}
                initialCategory={selectedCategoryFilter}
                onSelectApp={handleSelectApp}
                onQuickDownload={(app) => handleOpenDownloadModal(app, 'apk')}
              />
            )}

            {currentView === 'details' && selectedApp && (
              <AppDetailsPage
                app={selectedApp}
                allApps={apps}
                onBack={() => handleNavigate('all-apps')}
                onSelectRelatedApp={handleSelectApp}
                onOpenDownloadModal={handleOpenDownloadModal}
              />
            )}

            {currentView === 'admin' && (
              <AdminPage
                onBackToStore={() => handleNavigate('home')}
                onAppModified={loadPublishedApps}
              />
            )}
          </>
        )}
      </main>

      {/* Clean Footer with Single Bottom Contact Section */}
      <Footer
        onNavigate={handleNavigate}
      />

      {/* Download & Verification Modal */}
      {downloadModal.isOpen && (
        <DownloadModal
          app={downloadModal.app}
          mode={downloadModal.mode}
          onClose={() => setDownloadModal({ ...downloadModal, isOpen: false })}
          onDownloadCompleted={handleDownloadCompleted}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
