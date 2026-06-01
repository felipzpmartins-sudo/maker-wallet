import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  type AppUser,
  type Department,
  type AccessEntry,
  type AccessType,
  type RenewalService,
  getAccessDepartmentIds,
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
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
  addDepartment: (dep: Department) => Promise<void>;
  updateDepartment: (id: string, patch: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  saveAccess: (access: AccessEntry) => Promise<void>;
  deleteAccess: (id: string) => Promise<void>;
  revealAccessPassword: (id: string, mfaCode: string) => Promise<string>;
  setupMfa: () => Promise<{ secret: string; otpauthUrl: string }>;
  confirmMfa: (code: string) => Promise<void>;
  disableMfa: (code: string) => Promise<void>;
  saveRenewalService: (service: RenewalService) => Promise<void>;
  deleteRenewalService: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetUserMfa: (id: string) => Promise<void>;
  // helpers
  isAdmin: boolean;
  isCeo: boolean;
  canManagePermissions: boolean;
  canAccessDepartment: (departmentId: string) => boolean;
  visibleDepartments: Department[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

const storageKeys = {
  users: "maker-wallet:users",
  departments: "maker-wallet:departments",
  accesses: "maker-wallet:accesses",
  renewalServices: "maker-wallet:renewal-services",
  passwords: "maker-wallet:passwords",
  currentUser: "maker-wallet:current-user",
  token: "maker-wallet:token",
  migratedToApi: "maker-wallet:migrated-to-api",
};

const legacyStorageKeys = Object.values(storageKeys);

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

interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
}

type ApiDepartment = Department;

interface ApiPaginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApiAccess {
  id: string;
  type: "SSH" | "FTP" | "EMAIL" | "PLATFORM" | "KEYSTORE" | "WIFI";
  title: string;
  description?: string | null;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  email?: string | null;
  loginUrl?: string | null;
  observation?: string | null;
  appName?: string | null;
  keystoreFilePath?: string | null;
  departmentIds?: string[];
}

interface ApiRenewalService {
  id: string;
  name: string;
  type: "EMAIL" | "DOMAIN" | "HOSTING" | "DEVELOPER_ACCOUNT" | "SOFTWARE" | "CERTIFICATE" | "OTHER";
  provider?: string | null;
  description?: string | null;
  renewalUrl?: string | null;
  amount?: number | null;
  currency: string;
  renewalInterval: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY" | "BIENNIAL" | "CUSTOM";
  expiresAt: string;
  notifyDaysBefore: number;
  notes?: string | null;
  isActive: boolean;
  accessItemId?: string | null;
}

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

function mapApiAccessType(type: ApiAccess["type"]): AccessType {
  if (type === "EMAIL") return "email";
  if (type === "PLATFORM") return "platform";
  if (type === "KEYSTORE") return "keystore";
  if (type === "WIFI") return "wifi";
  return "ssh_ftp";
}

function mapAccessTypeToApi(type: AccessType): ApiAccess["type"] {
  if (type === "email") return "EMAIL";
  if (type === "platform") return "PLATFORM";
  if (type === "keystore") return "KEYSTORE";
  if (type === "wifi") return "WIFI";
  return "SSH";
}

function mapApiRenewalType(type: ApiRenewalService["type"]): RenewalService["type"] {
  return type.toLowerCase() as RenewalService["type"];
}

function mapRenewalTypeToApi(type: RenewalService["type"]): ApiRenewalService["type"] {
  return type.toUpperCase() as ApiRenewalService["type"];
}

function mapApiRenewalInterval(interval: ApiRenewalService["renewalInterval"]): RenewalService["renewalInterval"] {
  return interval.toLowerCase() as RenewalService["renewalInterval"];
}

function mapRenewalIntervalToApi(interval: RenewalService["renewalInterval"]): ApiRenewalService["renewalInterval"] {
  return interval.toUpperCase() as ApiRenewalService["renewalInterval"];
}

function mapApiAccess(access: ApiAccess): AccessEntry {
  const departmentIds = access.departmentIds?.length ? access.departmentIds : ["outros"];
  const type = mapApiAccessType(access.type);

  return {
    id: access.id,
    departmentId: departmentIds[0],
    departmentIds,
    type,
    name: access.title,
    host: access.host ?? undefined,
    port: access.port ? String(access.port) : undefined,
    username: access.username ?? undefined,
    email: access.email ?? undefined,
    link: access.loginUrl ?? undefined,
    appName: type === "keystore" || type === "platform" ? (access.appName ?? undefined) : undefined,
    keystoreFile: access.keystoreFilePath ?? undefined,
    networkName: type === "wifi" ? access.title : undefined,
    location: type === "wifi" ? (access.observation ?? undefined) : undefined,
    password: "",
    notes: type === "wifi" ? undefined : (access.observation ?? undefined),
  };
}

function mapAccessToApi(access: AccessEntry) {
  const type = mapAccessTypeToApi(access.type);
  const port = access.port ? Number(access.port) : undefined;
  const body: Record<string, unknown> = {
    type,
    title: access.name,
    description: undefined,
    host: access.host || undefined,
    port: Number.isFinite(port) ? port : undefined,
    username: access.username || undefined,
    email: access.email || undefined,
    password: access.password?.trim() || undefined,
    loginUrl: access.link || undefined,
    observation: access.type === "wifi" ? access.location || undefined : access.notes || undefined,
    appName: access.appName || undefined,
    keystoreFilePath: access.keystoreFile || undefined,
    departmentIds: getAccessDepartmentIds(access),
  };

  if (type === "WIFI") {
    body.title = access.networkName || access.name;
  }

  return body;
}

function mapApiRenewalService(service: ApiRenewalService): RenewalService {
  return {
    id: service.id,
    name: service.name,
    type: mapApiRenewalType(service.type),
    provider: service.provider ?? undefined,
    description: service.description ?? undefined,
    renewalUrl: service.renewalUrl ?? undefined,
    amount: service.amount === null || service.amount === undefined ? undefined : String(service.amount),
    currency: service.currency,
    renewalInterval: mapApiRenewalInterval(service.renewalInterval),
    expiresAt: service.expiresAt.slice(0, 10),
    notifyDaysBefore: service.notifyDaysBefore,
    notes: service.notes ?? undefined,
    isActive: service.isActive,
    accessId: service.accessItemId ?? undefined,
  };
}

function mapRenewalServiceToApi(service: RenewalService) {
  return {
    name: service.name,
    type: mapRenewalTypeToApi(service.type),
    provider: service.provider || undefined,
    description: service.description || undefined,
    renewalUrl: service.renewalUrl || undefined,
    amount: service.amount ? Number(service.amount) : undefined,
    currency: service.currency || "BRL",
    renewalInterval: mapRenewalIntervalToApi(service.renewalInterval),
    expiresAt: service.expiresAt,
    notifyDaysBefore: service.notifyDaysBefore,
    notes: service.notes || undefined,
    isActive: service.isActive,
    accessItemId: service.accessId || undefined,
  };
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

function clearLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [accesses, setAccesses] = useState<AccessEntry[]>([]);
  const [renewalServices, setRenewalServices] = useState<RenewalService[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const syncUsersFromApi = useCallback(async (authToken: string) => {
    const apiUsers = await apiRequest<ApiUser[]>("/users", { token: authToken });
    setUsers(apiUsers.map(mapApiUser));
  }, []);

  const syncDepartmentsFromApi = useCallback(async (authToken: string) => {
    const apiDepartments = await apiRequest<ApiDepartment[]>("/departments", { token: authToken });
    setDepartments(apiDepartments);
  }, []);

  const syncAccessesFromApi = useCallback(async (authToken: string) => {
    const result = await apiRequest<ApiPaginated<ApiAccess>>("/access?limit=100", {
      token: authToken,
    });
    setAccesses(result.items.map(mapApiAccess));
  }, []);

  const syncRenewalServicesFromApi = useCallback(async (authToken: string) => {
    const result = await apiRequest<ApiPaginated<ApiRenewalService>>("/renewal-services?limit=100", {
      token: authToken,
    });
    setRenewalServices(result.items.map(mapApiRenewalService));
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
        clearLegacyLocalStorage();
        await syncDepartmentsFromApi(result.token);
        await syncAccessesFromApi(result.token);
        await syncRenewalServicesFromApi(result.token);
        if (mappedUser.role === "ceo" || mappedUser.role === "admin") {
          await syncUsersFromApi(result.token);
        }
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) {
          return { ok: false, error: error.message };
        }
        return { ok: false, error: "Nao foi possivel conectar ao servidor." };
      }

    },
    [syncAccessesFromApi, syncDepartmentsFromApi, syncRenewalServicesFromApi, syncUsersFromApi],
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
        return { ok: false, error: "Nao foi possivel conectar ao servidor." };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback(async (id: string, patch: Partial<AppUser>) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }
    await apiRequest<ApiUser>(`/users/${id}`, {
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
    });
    await syncUsersFromApi(token);
  }, [syncUsersFromApi, token]);

  const deleteUser = useCallback(async (id: string) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }
    await apiRequest<null>(`/users/${id}`, { method: "DELETE", token });
    await syncUsersFromApi(token);
  }, [syncUsersFromApi, token]);

  const resetUserMfa = useCallback(async (id: string) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }
    await apiRequest<ApiUser>(`/users/${id}/reset-mfa`, { method: "POST", token });
    await syncUsersFromApi(token);
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
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [syncDepartmentsFromApi, token]);

  const updateDepartment = useCallback(async (id: string, patch: Partial<Department>) => {
    if (token) {
      await apiRequest<ApiDepartment>(`/departments/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: patch.name,
          iconKey: patch.iconKey,
          description: patch.description,
        }),
      });
      await syncDepartmentsFromApi(token);
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [syncDepartmentsFromApi, token]);

  const deleteDepartment = useCallback(async (id: string) => {
    if (token) {
      await apiRequest<null>(`/departments/${id}`, { method: "DELETE", token });
      await syncDepartmentsFromApi(token);
      await syncUsersFromApi(token);
      setAccesses((prev) =>
        prev
          .map((access) => ({
            ...access,
            departmentIds: getAccessDepartmentIds(access).filter((departmentId) => departmentId !== id),
          }))
          .filter((access) => access.departmentIds?.length),
      );
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [syncDepartmentsFromApi, syncUsersFromApi, token]);

  const saveAccess = useCallback(async (access: AccessEntry) => {
    const exists = accesses.some((item) => item.id === access.id);
    if (token) {
      await apiRequest<ApiAccess>(exists ? `/access/${access.id}` : "/access", {
        method: exists ? "PATCH" : "POST",
        token,
        body: JSON.stringify(mapAccessToApi(access)),
      });
      await syncAccessesFromApi(token);
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [accesses, syncAccessesFromApi, token]);

  const deleteAccess = useCallback(async (id: string) => {
    if (token) {
      await apiRequest<null>(`/access/${id}`, { method: "DELETE", token });
      await syncAccessesFromApi(token);
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [syncAccessesFromApi, token]);

  const revealAccessPassword = useCallback(async (id: string, mfaCode: string) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    const result = await apiRequest<{ password: string }>(`/access/${id}/reveal-password`, {
      method: "POST",
      token,
      body: JSON.stringify({ mfaCode }),
    });

    return result.password;
  }, [token]);

  const isCeo = currentUser?.role === "ceo";
  const isAdmin = isCeo || currentUser?.role === "admin";
  const canManagePermissions = isCeo || !!currentUser?.canManagePermissions;

  const setupMfa = useCallback(async () => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    return apiRequest<MfaSetupResponse>("/auth/mfa/setup", {
      method: "POST",
      token,
    });
  }, [token]);

  const confirmMfa = useCallback(async (code: string) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    await apiRequest<{ mfaEnabled: boolean }>("/auth/mfa/confirm", {
      method: "POST",
      token,
      body: JSON.stringify({ code }),
    });
    setCurrentUser((user) => (user ? { ...user, mfaEnabled: true } : user));
    if (isAdmin) await syncUsersFromApi(token);
  }, [isAdmin, syncUsersFromApi, token]);

  const disableMfa = useCallback(async (code: string) => {
    if (!token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    await apiRequest<{ mfaEnabled: boolean }>("/auth/mfa/disable", {
      method: "POST",
      token,
      body: JSON.stringify({ code }),
    });
    setCurrentUser((user) => (user ? { ...user, mfaEnabled: false } : user));
    if (isAdmin) await syncUsersFromApi(token);
  }, [isAdmin, syncUsersFromApi, token]);

  const saveRenewalService = useCallback(async (service: RenewalService) => {
    const exists = renewalServices.some((item) => item.id === service.id);
    if (token) {
      await apiRequest<ApiRenewalService>(exists ? `/renewal-services/${service.id}` : "/renewal-services", {
        method: exists ? "PATCH" : "POST",
        token,
        body: JSON.stringify(mapRenewalServiceToApi(service)),
      });
      await syncRenewalServicesFromApi(token);
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [renewalServices, syncRenewalServicesFromApi, token]);

  const deleteRenewalService = useCallback(async (id: string) => {
    if (token) {
      await apiRequest<null>(`/renewal-services/${id}`, { method: "DELETE", token });
      await syncRenewalServicesFromApi(token);
      return;
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }, [syncRenewalServicesFromApi, token]);

  useEffect(() => {
    if (!token) return;
    void syncDepartmentsFromApi(token);
    void syncAccessesFromApi(token);
    void syncRenewalServicesFromApi(token);
    if (isAdmin) void syncUsersFromApi(token);
    const interval = window.setInterval(() => {
      void syncDepartmentsFromApi(token);
      void syncAccessesFromApi(token);
      void syncRenewalServicesFromApi(token);
      if (isAdmin) void syncUsersFromApi(token);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [
    isAdmin,
    syncAccessesFromApi,
    syncDepartmentsFromApi,
    syncRenewalServicesFromApi,
    syncUsersFromApi,
    token,
  ]);

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
        updateDepartment,
        deleteDepartment,
        saveAccess,
        deleteAccess,
        revealAccessPassword,
        setupMfa,
        confirmMfa,
        disableMfa,
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
