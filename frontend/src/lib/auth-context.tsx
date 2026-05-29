import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  mockUsers,
  mockDepartments,
  mockAccesses,
  mockRenewalServices,
  type AppUser,
  type Department,
  type AccessEntry,
  type RenewalService,
} from "./mock-data";

interface AuthContextValue {
  currentUser: AppUser | null;
  users: AppUser[];
  departments: Department[];
  accesses: AccessEntry[];
  renewalServices: RenewalService[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  // admin actions
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  addDepartment: (dep: Department) => void;
  saveAccess: (access: AccessEntry) => void;
  deleteAccess: (id: string) => void;
  saveRenewalService: (service: RenewalService) => void;
  deleteRenewalService: (id: string) => void;
  deleteUser: (id: string) => void;
  resetUserMfa: (id: string) => void;
  // helpers
  isAdmin: boolean;
  isCeo: boolean;
  canManagePermissions: boolean;
  canAccessDepartment: (departmentId: string) => boolean;
  visibleDepartments: Department[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mock credential store — replace with real backend auth later.
const seededPasswords: Record<string, string> = {
  "admin@maker.com": "Admin@123456",
  "ana@maker.com": "maker123",
  "bruno@maker.com": "maker123",
  "carla@maker.com": "maker123",
};

const storageKeys = {
  users: "maker-wallet:users",
  departments: "maker-wallet:departments",
  accesses: "maker-wallet:accesses",
  renewalServices: "maker-wallet:renewal-services",
  passwords: "maker-wallet:passwords",
  currentUser: "maker-wallet:current-user",
};

function loadStored<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function storeValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => loadStored(storageKeys.users, mockUsers));
  const [departments, setDepartments] = useState<Department[]>(() =>
    loadStored(storageKeys.departments, mockDepartments),
  );
  const [accesses, setAccesses] = useState<AccessEntry[]>(() =>
    loadStored(storageKeys.accesses, mockAccesses),
  );
  const [renewalServices, setRenewalServices] = useState<RenewalService[]>(() =>
    loadStored(storageKeys.renewalServices, mockRenewalServices),
  );
  const [passwords, setPasswords] = useState<Record<string, string>>(() =>
    loadStored(storageKeys.passwords, seededPasswords),
  );
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() =>
    loadStored(storageKeys.currentUser, null),
  );

  useEffect(() => storeValue(storageKeys.users, users), [users]);
  useEffect(() => storeValue(storageKeys.departments, departments), [departments]);
  useEffect(() => storeValue(storageKeys.accesses, accesses), [accesses]);
  useEffect(() => storeValue(storageKeys.renewalServices, renewalServices), [renewalServices]);
  useEffect(() => storeValue(storageKeys.passwords, passwords), [passwords]);
  useEffect(() => storeValue(storageKeys.currentUser, currentUser), [currentUser]);

  const login = useCallback(
    (email: string, password: string) => {
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { ok: false, error: "Usuário não encontrado." };
      if (passwords[email.toLowerCase()] !== password)
        return { ok: false, error: "Senha incorreta." };
      setCurrentUser(user);
      return { ok: true };
    },
    [users, passwords],
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return { ok: false, error: "Já existe uma conta com este e-mail." };
      const newUser: AppUser = {
        id: `u${Date.now()}`,
        name,
        email,
        role: "pending",
        allowedDepartments: [],
      };
      setUsers((prev) => [...prev, newUser]);
      setPasswords((prev) => ({ ...prev, [email.toLowerCase()]: password }));
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => setCurrentUser(null), []);

  const updateUser = useCallback((id: string, patch: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setCurrentUser((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  const resetUserMfa = useCallback((id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, mfaEnabled: false, mfaSecret: undefined } : user,
      ),
    );
  }, []);

  const addDepartment = useCallback((dep: Department) => {
    setDepartments((prev) => [...prev, dep]);
  }, []);

  const saveAccess = useCallback((access: AccessEntry) => {
    setAccesses((prev) => {
      const idx = prev.findIndex((a) => a.id === access.id);
      if (idx === -1) return [...prev, access];
      const next = [...prev];
      next[idx] = access;
      return next;
    });
  }, []);

  const deleteAccess = useCallback((id: string) => {
    setAccesses((prev) => prev.filter((a) => a.id !== id));
    setRenewalServices((prev) => prev.map((service) => (service.accessId === id ? { ...service, accessId: undefined } : service)));
  }, []);

  const saveRenewalService = useCallback((service: RenewalService) => {
    setRenewalServices((prev) => {
      const idx = prev.findIndex((item) => item.id === service.id);
      if (idx === -1) return [...prev, service];
      const next = [...prev];
      next[idx] = service;
      return next;
    });
  }, []);

  const deleteRenewalService = useCallback((id: string) => {
    setRenewalServices((prev) => prev.filter((service) => service.id !== id));
  }, []);

  const isCeo = currentUser?.role === "ceo";
  const isAdmin = isCeo || currentUser?.role === "admin";
  const canManagePermissions = isCeo || !!currentUser?.canManagePermissions;

  const canAccessDepartment = useCallback(
    (departmentId: string) => {
      if (!currentUser) return false;
      if (currentUser.role === "pending") return false;
      if (currentUser.role === "ceo" || currentUser.totalAccess) return true;
      return currentUser.allowedDepartments.includes(departmentId);
    },
    [currentUser],
  );

  const visibleDepartments = departments.filter((d) => canAccessDepartment(d.id));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        departments,
        accesses,
        renewalServices,
        login,
        register,
        logout,
        updateUser,
        addDepartment,
        saveAccess,
        deleteAccess,
        saveRenewalService,
        deleteRenewalService,
        deleteUser,
        resetUserMfa,
        isAdmin,
        isCeo,
        canManagePermissions,
        canAccessDepartment,
        visibleDepartments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
