export type ChatContact = {
  id: string;
  name: string;
  role: "ADMIN" | "USER" | "RESTRICTED";
  avatarUrl?: string | null;
  avatarPreset?: string | null;
};

export type AccessRequest = {
  id: string;
  requesterId: string;
  category: string;
  subject: string;
  details?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: "TEXT" | "SYSTEM";
  content: string;
  createdAt: string;
  sender: ChatContact;
};

export type ChatConversation = {
  id: string;
  type: "DIRECT" | "ADMIN_SUPPORT" | "ACCESS_REQUEST";
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{ userId: string; lastReadAt?: string | null; user: ChatContact }>;
  messages: ChatMessage[];
  accessRequest?: AccessRequest | null;
  unreadCount: number;
};

export type ChatConversationDetail = {
  conversation: ChatConversation;
  messages: ChatMessage[];
};
