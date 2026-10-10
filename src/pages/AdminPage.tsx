import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  LogOut, 
  Check, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  FileText, 
  Image, 
  Sparkles,
  RefreshCw,
  Search,
  X,
  KeyRound
} from 'lucide-react';
import { AppItem, AppCategory } from '../types/app';
import { 
  loginAdmin, 
  logoutAdmin, 
  verifyAdminSession, 
  fetchAdminApps, 
  createAdminApp, 
  updateAdminApp, 
  togglePublishApp, 
  deleteAdminApp, 
  uploadFile,
  fetchAdminStatus,
  setupAdminPassword,
  changeAdminPassword
} from '../services/api';
import { AppIcon } from '../components/AppIcon';
import { useLanguage } from '../context/LanguageContext';

interface AdminPageProps {
  onBackToStore: () => void;
  onAppModified?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToStore,
  onAppModified,
}) => {
  const { lang, t } = useLanguage();

  // Auth & Configuration State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [adminStatus, setAdminStatus] = useState<{ configured: boolean; adminEmail: string | null; hasPassword: boolean }>({
    configured: false,
    adminEmail: null,
    hasPassword: false,
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Initial Master Password Setup State
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // App Management State
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Security & Privacy' as Exclude<AppCategory, 'All'>,
    version: '1.0.0',
    file_size: '24.0 MB',
    release_date: 'Oct 2026',
    tagline_bn: '',
    tagline_en: '',
    description_bn: '',
    description_en: '',
    icon_url: 'Shield',
    icon_bg: 'from-red-600 to-rose-950',
    apk_url: '',
    play_store_url: '',
    app_store_url: '',
    min_android: 'Android 8.0+',
    min_ios: 'iOS 15.0+',
    is_published: true,
    is_featured: false,
  });

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingApk, setUploadingApk] = useState(false);

  // Check initial admin session and configuration status
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setCheckingAuth(true);
    try {
      const status = await fetchAdminStatus();
      setAdminStatus(status);

      const valid = await verifyAdminSession();
      setIsAuthenticated(valid);
      if (valid) {
        loadApps();
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const data = await fetchAdminApps();
      setApps(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch apps.' });
    } finally {
      setLoadingApps(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError(null);

    try {
      await loginAdmin(loginEmail, loginPassword);
      setIsAuthenticated(true);
      setLoginEmail('');
      setLoginPassword('');
      loadApps();
      setStatusMessage({ type: 'success', text: 'Admin authenticated successfully.' });
    } catch (err: any) {
      setAuthError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminStatus.adminEmail) return;

    if (setupPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setSetupLoading(true);
    setAuthError(null);

    try {
      await setupAdminPassword(adminStatus.adminEmail, setupPassword);
      setIsAuthenticated(true);
      setSetupPassword('');
      setSetupConfirmPassword('');
      const status = await fetchAdminStatus();
      setAdminStatus(status);
      loadApps();
      setStatusMessage({ type: 'success', text: 'Master password configured. Welcome, Administrator.' });
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize administrator password');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeMsg(null);

    try {
      await changeAdminPassword(currentPassword, newPassword);
      setPasswordChangeMsg({ type: 'success', text: 'Password updated. Please log in with your new credentials.' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setIsAuthenticated(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } catch (err: any) {
      setPasswordChangeMsg({ type: 'error', text: err.message || 'Failed to update administrator password' });
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setApps([]);
  };

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      category: 'Security & Privacy',
      version: '1.0.0',
      file_size: '25.0 MB',
      release_date: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      tagline_bn: '',
      tagline_en: '',
      description_bn: '',
      description_en: '',
      icon_url: 'Shield',
      icon_bg: 'from-red-600 to-rose-950',
      apk_url: '',
      play_store_url: '',
      app_store_url: '',
      min_android: 'Android 8.0+',
      min_ios: 'iOS 15.0+',
      is_published: true,
      is_featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app: AppItem) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      category: app.category,
      version: app.version,
      file_size: app.file_size,
      release_date: app.release_date,
      tagline_bn: app.tagline_bn || '',
      tagline_en: app.tagline_en || '',
      description_bn: app.description_bn || '',
      description_en: app.description_en || '',
      icon_url: app.icon_url || 'Shield',
      icon_bg: app.icon_bg || 'from-red-600 to-rose-950',
      apk_url: app.apk_url || '',
      play_store_url: app.play_store_url || '',
      app_store_url: app.app_store_url || '',
      min_android: app.min_android || 'Android 8.0+',
      min_ios: app.min_ios || 'iOS 15.0+',
      is_published: app.is_published,
      is_featured: app.is_featured,
    });
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const nextState = await togglePublishApp(id);
      setApps((prev) =>
        prev.map((app) => (app.id === id ? { ...app, is_published: nextState } : app))
      );
      setStatusMessage({
        type: 'success',
        text: `App ${nextState ? 'published' : 'unpublished'} successfully.`,
      });
      if (onAppModified) onAppModified();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to toggle status' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }

    try {
      await deleteAdminApp(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
      setStatusMessage({ type: 'success', text: `App "${name}" deleted.` });
      if (onAppModified) onAppModified();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete app' });
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    try {
      const uploaded = await uploadFile(file);
      setFormData((prev) => ({ ...prev, icon_url: uploaded.url }));
      setStatusMessage({ type: 'success', text: 'Icon uploaded successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Icon upload failed' });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingApk(true);
    try {
      const uploaded = await uploadFile(file);
      setFormData((prev) => ({
        ...prev,
        apk_url: uploaded.url,
        file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      }));
      setStatusMessage({ type: 'success', text: 'APK binary uploaded.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'APK upload failed' });
    } finally {
      setUploadingApk(false);
    }
  };

  const handleSubmitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload: Partial<AppItem> = {
        name: formData.name.trim(),
        category: formData.category,
        version: formData.version.trim(),
        file_size: formData.file_size.trim(),
        release_date: formData.release_date.trim(),
        tagline_bn: formData.tagline_bn.trim() || formData.tagline_en.trim(),
        tagline_en: formData.tagline_en.trim(),
        description_bn: formData.description_bn.trim() || formData.description_en.trim(),
        description_en: formData.description_en.trim(),
        icon_url: formData.icon_url.trim(),
        icon_bg: formData.icon_bg,
        apk_url: formData.apk_url.trim() || null,
        play_store_url: formData.play_store_url.trim() || null,
        app_store_url: formData.app_store_url.trim() || null,
        min_android: formData.min_android.trim(),
        min_ios: formData.min_ios.trim(),
        is_published: formData.is_published,
        is_featured: formData.is_featured,
      };

      if (editingApp) {
        const updated = await updateAdminApp(editingApp.id, payload);
        setApps((prev) => prev.map((a) => (a.id === editingApp.id ? updated : a)));
        setStatusMessage({ type: 'success', text: `"${updated.name}" updated successfully.` });
      } else {
        const created = await createAdminApp(payload);
        setApps((prev) => [created, ...prev]);
        setStatusMessage({ type: 'success', text: `"${created.name}" created and added.` });
      }

      setIsModalOpen(false);
      if (onAppModified) onAppModified();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = apps.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingAuth) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <RefreshCw size={18} className="animate-spin text-red-500" />
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  // Login / Setup View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0d14] p-6 sm:p-8 shadow-2xl shadow-red-950/40 space-y-6">
          
          {/* 1. SETUP REQUIRED STATE (Neither env var nor DB account configured) */}
          {!adminStatus.configured ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-500">
                <Lock size={26} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Admin Setup Required
                </h1>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No administrator credentials are configured on this server. AppsBox restricts access exclusively to a single preconfigured Gmail address.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-black/60 p-4 text-left space-y-2 text-xs">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-red-500" />
                  <span>How to configure authorized admin:</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Set the following in your server environment variables or <code className="text-red-400">.env</code> file:
                </p>
                <pre className="rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800/80 overflow-x-auto">
{`ADMIN_EMAIL="your-admin@gmail.com"
ADMIN_PASSWORD="YourSecureMasterPassword"`}
                </pre>
                <p className="text-[10px] text-zinc-500 pt-1">
                  Once set, restart the server. Only this single Gmail address will have access. Public registration is disabled.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onBackToStore}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                >
                  Back to Public Store
                </button>
              </div>
            </div>
          ) : !adminStatus.hasPassword ? (
            /* 2. INITIAL MASTER PASSWORD CREATION (ADMIN_EMAIL is preconfigured, awaiting first password) */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/80 border border-red-800/80 text-red-500">
                  <KeyRound size={26} />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Set Master Password
                </h1>
                <p className="text-xs text-zinc-400">
                  Initial administrator setup for authorized account:
                </p>
                <div className="inline-block rounded-lg bg-zinc-900/80 border border-zinc-800 px-3 py-1 font-mono text-xs text-red-400">
                  {adminStatus.adminEmail}
                </div>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleInitialSetup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Set Master Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Confirm Master Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-red-950/50 flex items-center justify-center gap-2"
                >
                  {setupLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Configuring Master Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Initialize Administrator Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={onBackToStore}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                >
                  Back to Public Store
                </button>
              </div>
            </div>
          ) : (
            /* 3. NORMAL SECURE LOGIN VIA PRECONFIGURED GMAIL & PASSWORD */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/80 border border-red-800/80 text-red-500">
                  <Lock size={26} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {t('admin_login_title')}
                </h1>
                <p className="text-xs text-zinc-400">
                  Sign in exclusively with your authorized Gmail address.
                </p>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Authorized Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your-admin@gmail.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-red-950/50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Enter Admin Dashboard</span>
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Server-Enforced Single Tenant</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  Secured with PBKDF2-HMAC-SHA512 (100k rounds) & timing-safe equality. All other accounts and public registrations are strictly denied.
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={onBackToStore}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                >
                  Back to Public Store
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-500">
            <ShieldCheck size={14} />
            <span>SECURE ADMINISTRATOR CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('admin_title')}
          </h1>
          <p className="text-xs text-zinc-400">
            Manage live applications, upload APK files, configure store links, and toggle publication status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPasswordModalOpen(true);
              setPasswordChangeMsg(null);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <KeyRound size={13} className="text-red-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={onBackToStore}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            View Storefront
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-950 bg-red-950/30 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            <span>{t('admin_logout')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-red-900/60 bg-red-950/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4 space-y-1">
          <div className="text-[11px] text-zinc-400 font-mono">TOTAL APPS</div>
          <div className="text-2xl font-bold text-white font-mono">{apps.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4 space-y-1">
          <div className="text-[11px] text-zinc-400 font-mono">PUBLISHED</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {apps.filter((a) => a.is_published).length}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4 space-y-1">
          <div className="text-[11px] text-zinc-400 font-mono">DRAFTS</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {apps.filter((a) => !a.is_published).length}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4 space-y-1">
          <div className="text-[11px] text-zinc-400 font-mono">RECORDED DOWNLOADS</div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {apps.reduce((sum, a) => sum + (a.downloads_count || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Add App Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search apps by title or category..."
            className="w-full rounded-xl border border-zinc-800 bg-[#06070a] pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-red-950/40"
        >
          <Plus size={15} />
          <span>{t('admin_add_app')}</span>
        </button>
      </div>

      {/* Apps Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0a0b10] overflow-hidden">
        {loadingApps ? (
          <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-red-500" />
            <span>Loading app database records...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No applications found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3">Downloads</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-900/40 transition-colors">
                    
                    {/* App Name & Version */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <AppIcon iconName={app.icon_url} iconBg={app.icon_bg} className="w-9 h-9" size={18} />
                        <div>
                          <div className="font-bold text-white">{app.name}</div>
                          <div className="text-[11px] font-mono text-zinc-400">v{app.version} · {app.file_size}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-zinc-300">
                      {app.category}
                    </td>

                    {/* Channels Availability */}
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={app.apk_url ? 'text-emerald-400' : 'text-zinc-600 line-through'}>
                          APK
                        </span>
                        <span>·</span>
                        <span className={app.play_store_url ? 'text-emerald-400' : 'text-zinc-600 line-through'}>
                          Play
                        </span>
                        <span>·</span>
                        <span className={app.app_store_url ? 'text-emerald-400' : 'text-zinc-600 line-through'}>
                          iOS
                        </span>
                      </div>
                    </td>

                    {/* Downloads count */}
                    <td className="px-4 py-3.5 font-mono text-white tabular-nums">
                      {app.downloads_count.toLocaleString()}
                    </td>

                    {/* Published status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(app.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          app.is_published
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/60'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {app.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{app.is_published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(app)}
                          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                          title="Edit application"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id, app.name)}
                          className="p-1.5 rounded-lg border border-red-950 bg-red-950/30 text-red-400 hover:text-white hover:bg-red-900 transition-colors"
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit App Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#0d0e15] p-6 shadow-2xl my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-base font-bold text-white">
                {editingApp ? t('admin_edit_app') : t('admin_add_app')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitApp} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              
              {/* App Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">App Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex VPN Pro"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="Security & Privacy">Security & Privacy</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="Audio & Media">Audio & Media</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
              </div>

              {/* Version & File Size & Release Date */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Version</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">File Size</label>
                  <input
                    type="text"
                    required
                    value={formData.file_size}
                    onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                    placeholder="25.4 MB"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Release Date</label>
                  <input
                    type="text"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    placeholder="Oct 2026"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Taglines (Bangla & English) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Bangla Tagline (বাংলা বিবরণ সারসংক্ষেপ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagline_bn}
                    onChange={(e) => setFormData({ ...formData, tagline_bn: e.target.value })}
                    placeholder="যেমন: দ্রুততম সুরক্ষিত ইন্টারনেট ব্রাউজিং এবং প্রাইভেসি ভল্ট"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    English Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagline_en}
                    onChange={(e) => setFormData({ ...formData, tagline_en: e.target.value })}
                    placeholder="e.g. Next-gen zero-log WireGuard tunnel"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Descriptions (Bangla & English) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Bangla Full Description (বাংলা বিস্তারিত বর্ণনা) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description_bn}
                    onChange={(e) => setFormData({ ...formData, description_bn: e.target.value })}
                    placeholder="অ্যাপটির মূল কাজ, সুবিধা ও নিরাপত্তা সম্পর্কে বাংলায় বিস্তারিত লিখুন..."
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    English Full Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Comprehensive description of the application in English..."
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Icon Configuration */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
                <label className="block text-xs font-semibold text-white">App Icon</label>
                <div className="flex items-center gap-3">
                  <AppIcon iconName={formData.icon_url} iconBg={formData.icon_bg} className="w-12 h-12" size={24} />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                      placeholder="Icon name (Shield, Terminal, Zap, Cpu) or uploaded file URL"
                      className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-1.5 text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:text-white">
                        <Upload size={12} />
                        <span>{uploadingIcon ? 'Uploading...' : 'Upload Icon Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          disabled={uploadingIcon}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-zinc-400">PNG, JPG, or SVG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download URLs & Channels */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3">
                <div className="text-xs font-bold text-white">Download Channels Configuration</div>
                
                {/* APK */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-zinc-300">Android APK URL</span>
                    <label className="cursor-pointer text-[11px] text-red-400 hover:underline inline-flex items-center gap-1">
                      <Upload size={11} />
                      <span>{uploadingApk ? 'Uploading...' : 'Direct Upload APK'}</span>
                      <input
                        type="file"
                        accept=".apk,application/vnd.android.package-archive"
                        onChange={handleApkUpload}
                        disabled={uploadingApk}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.apk_url}
                    onChange={(e) => setFormData({ ...formData, apk_url: e.target.value })}
                    placeholder="/api/download/sample-app.apk or uploaded path"
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Leave blank to mark APK as "Coming Soon".
                  </p>
                </div>

                {/* Google Play */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Google Play Store URL
                  </label>
                  <input
                    type="url"
                    value={formData.play_store_url}
                    onChange={(e) => setFormData({ ...formData, play_store_url: e.target.value })}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Leave empty if pending store review (will display "Coming Soon").
                  </p>
                </div>

                {/* Apple App Store */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Apple App Store URL
                  </label>
                  <input
                    type="url"
                    value={formData.app_store_url}
                    onChange={(e) => setFormData({ ...formData, app_store_url: e.target.value })}
                    placeholder="https://apps.apple.com/app/id..."
                    className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Leave empty if not yet on iOS App Store (will display "Coming Soon").
                  </p>
                </div>
              </div>

              {/* Publication Flags */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-zinc-700 text-red-600 focus:ring-0"
                  />
                  <span>Published to Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-zinc-700 text-red-600 focus:ring-0"
                  />
                  <span>Featured Flagship App</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  {t('admin_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md shadow-red-950/50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{t('admin_save')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0d14] p-6 shadow-2xl shadow-red-950/40 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <KeyRound size={16} className="text-red-500" />
                <span>Change Administrator Password</span>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {passwordChangeMsg && (
              <div
                className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
                  passwordChangeMsg.type === 'success'
                    ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
                    : 'border-red-900/60 bg-red-950/30 text-red-300'
                }`}
              >
                {passwordChangeMsg.type === 'success' ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                )}
                <span>{passwordChangeMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md shadow-red-950/50 flex items-center gap-2"
                >
                  {passwordChangeLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
