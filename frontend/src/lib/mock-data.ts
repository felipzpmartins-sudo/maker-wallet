// Mock data layer for Maker Wallet.
// Structured to be swapped for a real backend later.

import {
  Banknote,
  Megaphone,
  Video,
  TrendingUp,
  Headphones,
  ShoppingCart,
  Wifi,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "ceo" | "admin" | "user" | "pending";

export type AccessType = "ssh_ftp" | "email" | "platform" | "keystore" | "wifi" | "sankhya";

export type RenewalServiceType =
  | "email"
  | "domain"
  | "hosting"
  | "developer_account"
  | "software"
  | "certificate"
  | "other";

export type RenewalInterval = "monthly" | "quarterly" | "semiannual" | "yearly" | "biennial" | "custom";

export interface Department {
  id: string;
  name: string;
  iconKey: string;
  description: string;
}

export interface AccessEntry {
  id: string;
  departmentId: string;
  departmentIds?: string[];
  type: AccessType;
  name: string;
  // optional fields depending on type
  host?: string;
  port?: string;
  username?: string;
  email?: string;
  link?: string;
  appName?: string;
  keystoreFile?: string;
  networkName?: string;
  location?: string;
  credentialId?: string;
  credentialSecret?: string;
  credentialToken?: string;
  password: string;
  notes?: string;
}

export const getAccessDepartmentIds = (access: AccessEntry) =>
  access.departmentIds?.length ? access.departmentIds : [access.departmentId];

export interface RenewalService {
  id: string;
  name: string;
  type: RenewalServiceType;
  provider?: string;
  description?: string;
  renewalUrl?: string;
  amount?: string;
  currency: string;
  renewalInterval: RenewalInterval;
  expiresAt: string;
  notifyDaysBefore: number;
  notes?: string;
  isActive: boolean;
  accessId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // department ids the user can see ("all" handled via role ceo/admin-total)
  allowedDepartments: string[];
  totalAccess?: boolean;
  canManagePermissions?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
}

export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  ssh_ftp: "SSH / FTP",
  email: "E-mail",
  platform: "Plataforma / Sistema",
  keystore: "Keystore",
  wifi: "Wi-Fi",
  sankhya: "Sankhya",
};

export const RENEWAL_TYPE_LABELS: Record<RenewalServiceType, string> = {
  email: "E-mail",
  domain: "Dominio",
  hosting: "Hospedagem",
  developer_account: "Conta dev",
  software: "Software",
  certificate: "Certificado",
  other: "Outro",
};

export const RENEWAL_INTERVAL_LABELS: Record<RenewalInterval, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  yearly: "Anual",
  biennial: "Bienal",
  custom: "Personalizado",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: "CEO",
  admin: "Admin",
  user: "Usuário comum",
  pending: "Pendente",
};

export const departmentIcons: Record<string, LucideIcon> = {
  financeiro: Banknote,
  marketing: Megaphone,
  video: Video,
  expansao: TrendingUp,
  suporte: Headphones,
  ecommerce: ShoppingCart,
  wifi: Wifi,
  outros: Boxes,
};

export const mockDepartments: Department[] = [
  {
    id: "financeiro",
    name: "Financeiro",
    iconKey: "financeiro",
    description: "Contas bancárias, ERPs e sistemas fiscais",
  },
  {
    id: "marketing",
    name: "Marketing",
    iconKey: "marketing",
    description: "Redes sociais, anúncios e ferramentas",
  },
  {
    id: "video",
    name: "Vídeo",
    iconKey: "video",
    description: "Plataformas de edição e streaming",
  },
  {
    id: "expansao",
    name: "Expansão",
    iconKey: "expansao",
    description: "Sistemas de novas unidades e franquias",
  },
  {
    id: "suporte",
    name: "Suporte",
    iconKey: "suporte",
    description: "Helpdesk, tickets e atendimento",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    iconKey: "ecommerce",
    description: "Lojas online, gateways e logística",
  },
  { id: "wifi", name: "Wi-Fi", iconKey: "wifi", description: "Redes e senhas das unidades" },
  { id: "outros", name: "Outros", iconKey: "outros", description: "Acessos diversos" },
];

export const mockAccesses: AccessEntry[] = [
  {
    id: "a1",
    departmentId: "financeiro",
    type: "platform",
    name: "Conta Granito ERP",
    username: "maker.financeiro",
    email: "financeiro@maker.com",
    link: "https://erp.granito.com",
    password: "Gr@n1to2024!",
    notes: "Acesso master do setor financeiro.",
  },
  {
    id: "a2",
    departmentId: "financeiro",
    type: "email",
    name: "E-mail Financeiro",
    email: "financeiro@maker.com",
    password: "Fin@nce#789",
    notes: "Caixa principal de notas fiscais.",
  },
  {
    id: "a3",
    departmentId: "marketing",
    type: "platform",
    name: "Meta Business Suite",
    email: "social@maker.com",
    link: "https://business.facebook.com",
    password: "M3taM@ker22",
    notes: "Gerenciador de anúncios.",
  },
  {
    id: "a4",
    departmentId: "video",
    type: "ssh_ftp",
    name: "Servidor de Renders",
    host: "render.maker.com",
    port: "22",
    username: "render",
    password: "Rnd!serv90",
    notes: "FTP para upload de masters.",
  },
  {
    id: "a5",
    departmentId: "ecommerce",
    type: "keystore",
    name: "App Maker Store (Android)",
    appName: "br.com.maker.store",
    keystoreFile: "maker-store-release.keystore",
    password: "K3yst0re$$",
    notes: "Usar somente em builds de produção.",
  },
  {
    id: "a6",
    departmentId: "wifi",
    type: "wifi",
    name: "Maker Matriz 5G",
    networkName: "MAKER_CORP",
    location: "Recepção - 2º andar",
    password: "Maker@Wifi2024",
    notes: "Rede exclusiva para colaboradores.",
  },
  {
    id: "a7",
    departmentId: "suporte",
    type: "platform",
    name: "Zendesk Suporte",
    email: "suporte@maker.com",
    link: "https://maker.zendesk.com",
    password: "Supp0rt!Zen",
    notes: "",
  },
];

export const mockRenewalServices: RenewalService[] = [
  {
    id: "r1",
    name: "E-mails Hostinger",
    type: "email",
    provider: "Hostinger",
    description: "Plano de e-mails corporativos",
    renewalUrl: "https://hpanel.hostinger.com",
    amount: "299.90",
    currency: "BRL",
    renewalInterval: "yearly",
    expiresAt: "2026-06-18",
    notifyDaysBefore: 30,
    notes: "Renovar antes do vencimento para evitar interrupcao das caixas principais.",
    isActive: true,
    accessId: "a2",
  },
  {
    id: "r2",
    name: "Apple Developer Program",
    type: "developer_account",
    provider: "Apple",
    renewalUrl: "https://developer.apple.com/account",
    amount: "99.00",
    currency: "USD",
    renewalInterval: "yearly",
    expiresAt: "2026-07-09",
    notifyDaysBefore: 45,
    notes: "Conta usada para publicar e manter apps na App Store.",
    isActive: true,
    accessId: "a5",
  },
  {
    id: "r3",
    name: "Certificado SSL principal",
    type: "certificate",
    provider: "Cloudflare",
    currency: "BRL",
    renewalInterval: "yearly",
    expiresAt: "2026-05-20",
    notifyDaysBefore: 15,
    notes: "Conferir automacao de renovacao.",
    isActive: true,
  },
];

export const mockUsers: AppUser[] = [
  {
    id: "u1",
    name: "Administrador Maker",
    email: "admin@maker.com",
    role: "ceo",
    allowedDepartments: mockDepartments.map((d) => d.id),
    totalAccess: true,
    mfaEnabled: false,
  },
  {
    id: "u2",
    name: "Ana Souza",
    email: "ana@maker.com",
    role: "admin",
    allowedDepartments: ["financeiro", "marketing", "suporte"],
    canManagePermissions: true,
  },
  {
    id: "u3",
    name: "Bruno Lima",
    email: "bruno@maker.com",
    role: "user",
    allowedDepartments: ["video", "ecommerce"],
  },
  {
    id: "u4",
    name: "Carla Dias",
    email: "carla@maker.com",
    role: "pending",
    allowedDepartments: [],
  },
];
