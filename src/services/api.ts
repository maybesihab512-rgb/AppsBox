import { AppItem } from '../types/app';

const TOKEN_KEY = 'ms_apps_admin_token';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

// Public API Calls
export async function fetchApps(params?: {
  category?: string;
  search?: string;
  platform?: string;
  featured?: boolean;
}): Promise<AppItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.platform && params.platform !== 'all') query.set('platform', params.platform);
  if (params?.featured) query.set('featured', 'true');

  const res = await fetch(`/api/apps?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load apps from server');
  }
  const data = await res.json();
  return data.apps || [];
}

export async function fetchAppById(id: string): Promise<AppItem> {
  const res = await fetch(`/api/apps/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch app details');
  }
  const data = await res.json();
  return data.app;
}

export async function recordDownload(
  appId: string,
  channel: 'apk' | 'play_store' | 'app_store'
): Promise<{ success: boolean; targetUrl: string; downloadsCount: number }> {
  const res = await fetch(`/api/apps/${encodeURIComponent(appId)}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initiate download');
  }

  return await res.json();
}

// Admin API Calls
export async function fetchAdminStatus(): Promise<{ configured: boolean; adminEmail: string | null; hasPassword: boolean }> {
  try {
    const res = await fetch('/api/admin/status');
    if (!res.ok) {
      return { configured: false, adminEmail: null, hasPassword: false };
    }
    return await res.json();
  } catch {
    return { configured: false, adminEmail: null, hasPassword: false };
  }
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Authentication failed. Please verify credentials.');
  }

  const result = await res.json();
  setAuthToken(result.token);
  return result;
}

export async function setupAdminPassword(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch('/api/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to initialize administrator password.');
  }

  const result = await res.json();
  if (result.token) {
    setAuthToken(result.token);
  }
  return result;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update administrator password');
  }

  // Password change revokes tokens on server
  clearAuthToken();
  return await res.json();
}

export async function logoutAdmin(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  clearAuthToken();
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearAuthToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchAdminApps(): Promise<AppItem[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/admin/apps', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Failed to load apps list');
  }

  const data = await res.json();
  return data.apps || [];
}

export async function createAdminApp(appData: Partial<AppItem>): Promise<AppItem> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/admin/apps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create application');
  }

  const data = await res.json();
  return data.app;
}

export async function updateAdminApp(id: string, appData: Partial<AppItem>): Promise<AppItem> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update application');
  }

  const data = await res.json();
  return data.app;
}

export async function togglePublishApp(id: string): Promise<boolean> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to change publish status');
  }

  const data = await res.json();
  return data.is_published === 1;
}

export async function deleteAdminApp(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to delete application');
  }
}

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'File upload failed');
  }

  return await res.json();
}
