import { AppUser, UserRole } from '../types';

export interface StoredAccount extends AppUser {
  passwordHash: string; // simple encoded password
}

const DEFAULT_USERS: StoredAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'المشرف العام / الإدارة',
    role: 'ADMIN',
    roleLabel: 'مدير النظام والمشرف العام',
    passwordHash: 'admin123',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'user-teacher-1',
    username: 'cheikh1',
    name: 'الشيخ المقرئ (حلقة الفجر)',
    role: 'TEACHER',
    roleLabel: 'أستاذ مقرئ ومحفظ',
    passwordHash: '123456',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'user-teacher-2',
    username: 'cheikh2',
    name: 'الشيخ المشرف (حلقة الحفظ المكثف)',
    role: 'TEACHER',
    roleLabel: 'أستاذ مقرئ ومحفظ',
    passwordHash: '123456',
    avatarColor: 'bg-teal-600'
  }
];

const AUTH_CURRENT_USER_KEY = 'quran_app_current_user_v2';
const AUTH_ACTIVE_SESSIONS_KEY = 'quran_app_active_sessions_v2';
const ACCOUNTS_KEY = 'quran_app_accounts_v2';

export function getStoredAccounts(): StoredAccount[] {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

/**
 * Gets all currently logged-in active user profiles (Multi-session support)
 */
export function getActiveProfiles(): AppUser[] {
  try {
    const data = localStorage.getItem(AUTH_ACTIVE_SESSIONS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveActiveProfiles(profiles: AppUser[]): void {
  localStorage.setItem(AUTH_ACTIVE_SESSIONS_KEY, JSON.stringify(profiles));
}

/**
 * Gets the current active profile
 */
export function getCurrentUser(): AppUser | null {
  try {
    const data = localStorage.getItem(AUTH_CURRENT_USER_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // If there's an active profile in list, select the first one
    const active = getActiveProfiles();
    if (active.length > 0) {
      setCurrentUser(active[0]);
      return active[0];
    }
    return null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AppUser | null): void {
  if (!user) {
    localStorage.removeItem(AUTH_CURRENT_USER_KEY);
  } else {
    localStorage.setItem(AUTH_CURRENT_USER_KEY, JSON.stringify(user));
    // Also ensure user is registered in active profiles list
    const active = getActiveProfiles();
    if (!active.some((p) => p.id === user.id)) {
      saveActiveProfiles([...active, user]);
    }
  }
}

/**
 * Switch active user profile instantaneously
 */
export function switchActiveProfile(userId: string): AppUser | null {
  const active = getActiveProfiles();
  const target = active.find((u) => u.id === userId);
  if (target) {
    setCurrentUser(target);
    return target;
  }
  return null;
}

/**
 * Log out a specific profile from active sessions
 */
export function logoutProfile(userId: string): AppUser | null {
  const active = getActiveProfiles().filter((u) => u.id !== userId);
  saveActiveProfiles(active);
  
  const current = getCurrentUser();
  if (current?.id === userId) {
    const nextUser = active[0] || null;
    setCurrentUser(nextUser);
    return nextUser;
  }
  return current;
}

export function verifyLogin(username: string, password: string): { success: boolean; user?: AppUser; message?: string } {
  const accounts = getStoredAccounts();
  const trimmedUser = username.trim().toLowerCase();
  
  const account = accounts.find(
    (acc) => acc.username.toLowerCase() === trimmedUser || acc.id.toLowerCase() === trimmedUser
  );

  if (!account) {
    return { success: false, message: 'اسم المستخدم غير موجود' };
  }

  if (account.passwordHash !== password) {
    return { success: false, message: 'كلمة المرور غير صحيحة' };
  }

  const { passwordHash: _, ...safeUser } = account;
  
  // Register in active profiles
  const active = getActiveProfiles();
  if (!active.some((p) => p.id === safeUser.id)) {
    saveActiveProfiles([...active, safeUser]);
  }
  setCurrentUser(safeUser);

  return { success: true, user: safeUser };
}

export const getActiveSessions = getActiveProfiles;
export const switchActiveSession = switchActiveProfile;
export const removeActiveSession = logoutProfile;

export function createNewAccount(
  username: string,
  name: string,
  role: UserRole,
  password: string
): { success: boolean; message?: string; user?: AppUser } {
  const accounts = getStoredAccounts();
  const trimmedUser = username.trim().toLowerCase();

  if (accounts.some((acc) => acc.username.toLowerCase() === trimmedUser)) {
    return { success: false, message: 'اسم المستخدم مستعمل بالفعل، يرجى اختيار اسم آخر' };
  }

  const newAccount: StoredAccount = {
    id: `user-${Date.now()}`,
    username: trimmedUser,
    name: name.trim(),
    role,
    roleLabel: role === 'ADMIN' ? 'مدير النظام والمشرف العام' : 'أستاذ مقرئ ومحفظ',
    passwordHash: password,
    avatarColor: role === 'ADMIN' ? 'bg-emerald-600' : 'bg-teal-600'
  };

  const updated = [...accounts, newAccount];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));

  const { passwordHash: _, ...safeUser } = newAccount;
  return { success: true, user: safeUser };
}
