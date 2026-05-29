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
import { ApiError, apiRequest } from "./api";

interface AuthContextValue {
  currentUser: AppUser | null;
  users: AppUser[];
  departments: Department[];
  accesses: AccessEntry[];
  renewalServices: RenewalService[];
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    invite?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  // admin actions
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  addDepartment: (dep: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
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
  token: "maker-wallet:token",
};

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER" | "RESTRICTED";
  allowedDepartments?: string[];
  totalAccess?: boolean;
  canManagePermissions?: boolean;
  mfaEnabled?: boolean;
}

interface LoginResponse {
  token: string;
  user: ApiUser;
}

type ApiDepartment = Department;

function mapApiUser(user: ApiUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role:
      user.role === "ADMIN"
        ? user.totalAccess
          ? "ceo"
          : "admin"
        : user.role === "RESTRICTED"
          ? "pending"
          : "user",
    allowedDepartments: user.allowedDepartments ?? [],
    totalAccess: user.totalAccess,
    canManagePermissions: user.canManagePermissions,
    mfaEnabled: user.mfaEnabled,
  };
}

function mapRoleToApi(role: AppUser["role"]) {
  if (role === "ceo" || role === "admin") return "ADMIN";
  if (role === "pending") return "RESTRICTED";
  return "USER";
}

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
  const [token, setToken] = useState<string | null>(() => loadStored(storageKeys.token, null));

  useEffect(() => storeValue(storageKeys.users, users), [users]);
  useEffect(() => storeValue(storageKeys.departments, departments), [departments]);
  useEffect(() => storeValue(storageKeys.accesses, accesses), [accesses]);
  useEffect(() => storeValue(storageKeys.renewalServices, renewalServices), [renewalServices]);
  useEffect(() => storeValue(storageKeys.passwords, passwords), [passwords]);
  useEffect(() => storeValue(storageKeys.currentUser, currentUser), [currentUser]);
  useEffect(() => storeValue(storageKeys.token, token), [token]);

  const syncUsersFromApi = useCallback(async (authToken: string) => {
    const apiUsers = await apiRequest<ApiUser[]>("/users", { token: authToken });
    setUsers(apiUsers.map(mapApiUser));
  }, []);

  const syncDepartmentsFromApi = useCallback(async (authToken: string) => {
    const apiDepartments = await apiRequest<ApiDepartment[]>("/departments", { token: authToken });
    setDepartments(apiDepartments);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await apiRequest<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const mappedUser = mapApiUser(result.user);
        setToken(result.token);
        setCurrentUser(mappedUser);
        await syncDepartmentsFromApi(result.token);
        if (mappedUser.role === "ceo" || mappedUser.role === "admin") {
          await syncUsersFromApi(result.token);
        }
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) {
          return { ok: false, error: error.message };
        }
        // Keep local development usable when the backend is not running.
      }

      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { ok: false, error: "Usuário não encontrado." };
      if (passwords[email.toLowerCase()] !== password)
        return { ok: false, error: "Senha incorreta." };
      setToken(null);
      setCurrentUser(user);
      return { ok: true };
    },
    [users, passwords, syncDepartmentsFromApi, syncUsersFromApi],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, invite?: string) => {
      try {
        await apiRequest<ApiUser>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, invite }),
        });
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) {
          return { ok: false, error: error.message };
        }
        // Local fallback only; production writes to the API above.
      }

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

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<AppUser>) => {
    if (token) {
      void apiRequest<ApiUser>(`/users/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: patch.name,
          email: patch.email,
          role: patch.role ? mapRoleToApi(patch.role) : undefined,
          allowedDepartments: patch.allowedDepartments,
          totalAccess: patch.role === "ceo" ? true : patch.totalAccess,
          canManagePermissions:
            patch.role === "ceo" ? true : patch.canManagePermissions,
        }),
      }).then(() => syncUsersFromApi(token));
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setCurrentUser((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  }, [syncUsersFromApi, token]);

  const deleteUser = useCallback((id: string) => {
    if (token) {
      void apiRequest<null>(`/users/${id}`, { method: "DELETE", token }).then(() =>
        syncUsersFromApi(token),
      );
    }
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, [syncUsersFromApi, token]);

  const resetUserMfa = useCallback((id: string) => {
    if (token) {
      void apiRequest<ApiUser>(`/users/${id}/reset-mfa`, { method: "POST", token }).then(() =>
        syncUsersFromApi(token),
      );
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, mfaEnabled: false, mfaSecret: undefined } : user,
      ),
    );
  }, [syncUsersFromApi, token]);

  const addDepartment = useCallback(async (dep: Department) => {
    if (token) {
      await apiRequest<ApiDepartment>("/departments", {
        method: "POST",
        token,
        body: JSON.stringify(dep),
      });
      await syncDepartmentsFromApi(token);
      return;
    }
    setDepartments((prev) => [...prev, dep]);
  }, [syncDepartmentsFromApi, token]);

  const deleteDepartment = useCallback(async (id: string) => {
    if (token) {
      await apiRequest<null>(`/departments/${id}`, { method: "DELETE", token });
      await syncDepartmentsFromApi(token);
      await syncUsersFromApi(token);
      setAccesses((prev) => prev.filter((access) => access.departmentId !== id));
      return;
    }
    setDepartments((prev) => prev.filter((department) => department.id !== id));
    setUsers((prev) =>
      prev.map((user) => ({
        ...user,
        allowedDepartments: user.allowedDepartments.filter((departmentId) => departmentId !== id),
      })),
    );
    setAccesses((prev) => prev.filter((access) => access.departmentId !== id));
  }, [syncDepartmentsFromApi, syncUsersFromApi, token]);

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

  useEffect(() => {
    if (!token || !isAdmin) return;
    void syncDepartmentsFromApi(token);
    void syncUsersFromApi(token);
    const interval = window.setInterval(() => {
      void syncDepartmentsFromApi(token);
      void syncUsersFromApi(token);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [isAdmin, syncDepartmentsFromApi, syncUsersFromApi, token]);

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
        deleteDepartment,
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
