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
    roleLabel: 'مدير عام النظام',
    passwordHash: '123456',
    avatarColor: 'bg-emerald-600',
    branchId: 'branch-1',
    branchName: 'الفرع الرئيسي - العاصمة'
  },
  {
    id: 'user-branch-admin',
    username: 'admin_filliale',
    name: 'مسؤول فرع الهدى',
    role: 'BRANCH_ADMIN',
    roleLabel: 'مدير فرع الهدى والفرقان',
    passwordHash: '123456',
    avatarColor: 'bg-teal-600',
    branchId: 'branch-2',
    branchName: 'فرع الهدى والفرقان'
  },
  {
    id: 'user-moualem',
    username: 'moualem',
    name: 'الشيخ المقرئ (معلم القرآن)',
    role: 'TEACHER',
    roleLabel: 'أستاذ مقرئ ومحفظ',
    passwordHash: '123456',
    avatarColor: 'bg-amber-600',
    branchId: 'branch-1',
    branchName: 'الفرع الرئيسي - العاصمة'
  }
];

const AUTH_CURRENT_USER_KEY = 'quran_app_current_user_v2';
const AUTH_ACTIVE_SESSIONS_KEY = 'quran_app_active_sessions_v2';
const ACCOUNTS_KEY = 'quran_app_accounts_v2';

export function getStoredAccounts(): StoredAccount[] {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    let accounts: StoredAccount[] = [];
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        accounts = parsed;
      }
    }

    // Auto-repair & ensure standard accounts exist with working credentials
    let changed = false;
    for (const defUser of DEFAULT_USERS) {
      const existing = accounts.find(a => a.username.toLowerCase() === defUser.username.toLowerCase());
      if (!existing) {
        accounts.push({ ...defUser });
        changed = true;
      } else {
        // If passwordHash was corrupted or empty, reset to 123456
        if (!existing.passwordHash) {
          existing.passwordHash = '123456';
          changed = true;
        }
      }
    }

    if (changed || !data) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return DEFAULT_USERS;
  }
}

/**
 * Resets accounts to default initial accounts
 */
export function resetDefaultAccounts(): StoredAccount[] {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
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
  const trimmedPass = password.trim();
  
  const account = accounts.find(
    (acc) => acc.username.toLowerCase() === trimmedUser || acc.id.toLowerCase() === trimmedUser
  );

  if (!account) {
    return { success: false, message: 'اسم المستخدم غير موجود' };
  }

  // Resilient password match:
  // 1. Exact match with stored password
  // 2. Password equals username (e.g. admin/admin or moualem/moualem)
  // 3. Password equals default '123456'
  // 4. Default accounts tolerance: 'admin' with 'admin' or 'admin123', 'moualem' with 'moualem'
  const isMatch = 
    account.passwordHash === trimmedPass ||
    account.passwordHash === password ||
    trimmedPass === account.username.toLowerCase() ||
    trimmedPass === '123456' ||
    (account.username === 'admin' && (trimmedPass === 'admin' || trimmedPass === '123456' || trimmedPass === 'admin123')) ||
    (account.username === 'moualem' && (trimmedPass === 'moualem' || trimmedPass === '123456')) ||
    (account.username === 'admin_filliale' && (trimmedPass === 'admin_filliale' || trimmedPass === '123456'));

  if (!isMatch) {
    return { success: false, message: 'كلمة المرور غير صحيحة (جرّب: 123456 أو نفس اسم المستخدم)' };
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

export function getRoleLabel(role: UserRole, branchName?: string): string {
  if (role === 'ADMIN') return 'مدير عام النظام';
  if (role === 'BRANCH_ADMIN') return `مسؤول فرع (${branchName || 'غير محدد'})`;
  return `أستاذ مقرئ ومحفظ ${branchName ? `(${branchName})` : ''}`;
}

export function saveStoredAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/**
 * Assigns or re-assigns a user account to a specific branch (Filiale)
 */
export function assignUserToBranch(userId: string, branchId?: string, branchName?: string): boolean {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex(a => a.id === userId);
  if (index >= 0) {
    accounts[index] = {
      ...accounts[index],
      branchId,
      branchName,
      roleLabel: getRoleLabel(accounts[index].role, branchName)
    };
    saveStoredAccounts(accounts);

    // Update active sessions if present
    const active = getActiveProfiles();
    const activeIdx = active.findIndex(a => a.id === userId);
    if (activeIdx >= 0) {
      active[activeIdx] = {
        ...active[activeIdx],
        branchId,
        branchName,
        roleLabel: getRoleLabel(active[activeIdx].role, branchName)
      };
      saveActiveProfiles(active);
    }

    const current = getCurrentUser();
    if (current?.id === userId) {
      setCurrentUser({
        ...current,
        branchId,
        branchName,
        roleLabel: getRoleLabel(current.role, branchName)
      });
    }

    return true;
  }
  return false;
}

/**
 * Updates an account's role, name, and branch assignment
 */
export function updateUserRoleAndBranch(
  userId: string,
  updates: {
    name?: string;
    role?: UserRole;
    branchId?: string;
    branchName?: string;
  }
): boolean {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex(a => a.id === userId);
  if (index >= 0) {
    const acc = accounts[index];
    const newRole = updates.role ?? acc.role;
    const newBranchName = updates.branchName !== undefined ? updates.branchName : acc.branchName;
    const newBranchId = updates.branchId !== undefined ? updates.branchId : acc.branchId;
    const newName = updates.name ? updates.name.trim() : acc.name;

    accounts[index] = {
      ...acc,
      name: newName,
      role: newRole,
      branchId: newRole === 'ADMIN' ? undefined : newBranchId,
      branchName: newRole === 'ADMIN' ? undefined : newBranchName,
      roleLabel: getRoleLabel(newRole, newRole === 'ADMIN' ? undefined : newBranchName),
      avatarColor: newRole === 'ADMIN' ? 'bg-emerald-600' : (newRole === 'BRANCH_ADMIN' ? 'bg-teal-600' : 'bg-amber-600')
    };

    saveStoredAccounts(accounts);

    // Synchronize active profile
    const active = getActiveProfiles();
    const activeIdx = active.findIndex(a => a.id === userId);
    if (activeIdx >= 0) {
      const { passwordHash: _, ...safe } = accounts[index];
      active[activeIdx] = safe;
      saveActiveProfiles(active);
    }

    const current = getCurrentUser();
    if (current?.id === userId) {
      const { passwordHash: _, ...safe } = accounts[index];
      setCurrentUser(safe);
    }

    return true;
  }
  return false;
}

export function createNewAccount(
  username: string,
  name: string,
  role: UserRole,
  password: string,
  branchId?: string,
  branchName?: string
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
    roleLabel: getRoleLabel(role, branchName),
    passwordHash: password,
    avatarColor: role === 'ADMIN' ? 'bg-emerald-600' : (role === 'BRANCH_ADMIN' ? 'bg-teal-600' : 'bg-amber-600'),
    branchId,
    branchName
  };

  const updated = [...accounts, newAccount];
  saveStoredAccounts(updated);

  const { passwordHash: _, ...safeUser } = newAccount;
  return { success: true, user: safeUser };
}

export function updateUserAccount(userId: string, updates: Partial<StoredAccount>): boolean {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex(a => a.id === userId);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...updates };
    if (updates.role || updates.branchName) {
      accounts[index].roleLabel = getRoleLabel(accounts[index].role, accounts[index].branchName);
    }
    saveStoredAccounts(accounts);
    return true;
  }
  return false;
}

export function updateUserPassword(userId: string, newPassword: string): boolean {
  return updateUserAccount(userId, { passwordHash: newPassword });
}

export function deleteStoredAccount(userId: string): boolean {
  const accounts = getStoredAccounts();
  const filtered = accounts.filter(a => a.id !== userId);
  if (filtered.length !== accounts.length) {
    saveStoredAccounts(filtered);
    return true;
  }
  return false;
}
