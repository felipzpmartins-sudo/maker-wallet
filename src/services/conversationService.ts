import { ConversationType, UserRole } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { createAuditLog } from "./auditLogService";

const contactSelect = {
  id: true,
  name: true,
  role: true,
  avatarUrl: true,
  avatarPreset: true
} as const;

const conversationInclude = {
  participants: {
    include: { user: { select: contactSelect } }
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: { select: contactSelect } }
  },
  accessRequest: true
};

function ensureChatEligible(user: Express.User) {
  if (user.role === UserRole.RESTRICTED) {
    throw new AppError(403, "Seu perfil ainda não tem acesso à Central de Conversas.");
  }
}

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) throw new AppError(404, "Conversa não encontrada.");
  return participant;
}

export async function listContacts(currentUser: Express.User) {
  ensureChatEligible(currentUser);
  return prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      role: { in: [UserRole.ADMIN, UserRole.USER] }
    },
    select: contactSelect,
    orderBy: { name: "asc" }
  });
}

async function serializeConversation(conversation: Awaited<ReturnType<typeof prisma.conversation.findFirst>> extends never ? never : any, currentUserId: string) {
  const participant = conversation.participants.find((item: { userId: string }) => item.userId === currentUserId);
  const unreadCount = participant?.lastReadAt
    ? await prisma.chatMessage.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: currentUserId },
          createdAt: { gt: participant.lastReadAt }
        }
      })
    : await prisma.chatMessage.count({
        where: { conversationId: conversation.id, senderId: { not: currentUserId } }
      });

  return {
    ...conversation,
    unreadCount
  };
}

export async function listConversations(currentUser: Express.User) {
  ensureChatEligible(currentUser);
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: currentUser.id } } },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" }
  });

  return Promise.all(conversations.map((conversation) => serializeConversation(conversation, currentUser.id)));
}

export async function createDirectConversation(participantId: string, currentUser: Express.User, ipAddress?: string) {
  ensureChatEligible(currentUser);
  if (participantId === currentUser.id) throw new AppError(400, "Escolha outra pessoa para iniciar uma conversa.");

  const contact = await prisma.user.findFirst({
    where: { id: participantId, role: { in: [UserRole.ADMIN, UserRole.USER] } },
    select: { id: true }
  });
  if (!contact) throw new AppError(404, "Usuário não disponível para conversa.");

  const existing = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { participants: { some: { userId: currentUser.id } } },
        { participants: { some: { userId: participantId } } },
        { participants: { every: { userId: { in: [currentUser.id, participantId] } } } }
      ]
    },
    include: conversationInclude
  });

  const conversation = existing ?? await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      createdById: currentUser.id,
      participants: { create: [{ userId: currentUser.id }, { userId: participantId }] }
    },
    include: conversationInclude
  });

  if (!existing) {
    await createAuditLog({ userId: currentUser.id, action: "CHAT_DIRECT_CONVERSATION_CREATED", ipAddress });
  }
  return serializeConversation(conversation, currentUser.id);
}

async function adminParticipantIds() {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true }
  });
  return admins.map((admin) => admin.id);
}

export async function createSupportConversation(currentUser: Express.User, ipAddress?: string) {
  ensureChatEligible(currentUser);
  const adminIds = await adminParticipantIds();
  if (!adminIds.length) throw new AppError(422, "Nenhum administrador está disponível no momento.");

  const participantIds = [...new Set([currentUser.id, ...adminIds])];
  const existing = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.ADMIN_SUPPORT,
      createdById: currentUser.id,
      participants: { some: { userId: currentUser.id } }
    },
    select: { id: true }
  });

  if (existing) {
    await Promise.all(
      participantIds.map((userId) =>
        prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: existing.id, userId } },
          create: { conversationId: existing.id, userId },
          update: {}
        })
      )
    );
  }

  const conversation = existing
    ? await prisma.conversation.findUniqueOrThrow({ where: { id: existing.id }, include: conversationInclude })
    : await prisma.conversation.create({
        data: {
          type: ConversationType.ADMIN_SUPPORT,
          createdById: currentUser.id,
          participants: { create: participantIds.map((userId) => ({ userId })) }
        },
        include: conversationInclude
      });

  if (!existing) {
    await createAuditLog({ userId: currentUser.id, action: "CHAT_ADMIN_SUPPORT_CREATED", ipAddress });
  }
  return serializeConversation(conversation, currentUser.id);
}

export async function createAccessRequest(
  data: { category: string; subject: string; details?: string },
  currentUser: Express.User,
  ipAddress?: string
) {
  ensureChatEligible(currentUser);
  const adminIds = await adminParticipantIds();
  if (!adminIds.length) throw new AppError(422, "Nenhum administrador está disponível no momento.");

  const participantIds = [...new Set([currentUser.id, ...adminIds])];
  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.ACCESS_REQUEST,
      createdById: currentUser.id,
      participants: { create: participantIds.map((userId) => ({ userId })) },
      accessRequest: {
        create: {
          requesterId: currentUser.id,
          category: data.category,
          subject: data.subject,
          details: data.details
        }
      }
    },
    include: conversationInclude
  });

  await createAuditLog({ userId: currentUser.id, action: "CHAT_ACCESS_REQUEST_CREATED", ipAddress });
  return serializeConversation(conversation, currentUser.id);
}

export async function listMessages(conversationId: string, currentUser: Express.User) {
  ensureChatEligible(currentUser);
  await assertParticipant(conversationId, currentUser.id);
  const [messages, conversation] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { conversationId },
      include: { sender: { select: contactSelect } },
      orderBy: { createdAt: "asc" }
    }),
    prisma.conversation.findUnique({ where: { id: conversationId }, include: conversationInclude })
  ]);
  if (!conversation) throw new AppError(404, "Conversa não encontrada.");
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: currentUser.id } },
    data: { lastReadAt: new Date() }
  });
  return { conversation: await serializeConversation(conversation, currentUser.id), messages };
}

export async function createMessage(conversationId: string, content: string, currentUser: Express.User, ipAddress?: string) {
  ensureChatEligible(currentUser);
  await assertParticipant(conversationId, currentUser.id);
  const message = await prisma.chatMessage.create({
    data: { conversationId, senderId: currentUser.id, content },
    include: { sender: { select: contactSelect } }
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: currentUser.id } },
    data: { lastReadAt: new Date() }
  });
  await createAuditLog({ userId: currentUser.id, action: "CHAT_MESSAGE_SENT", ipAddress });
  return message;
}

export async function updateAccessRequestStatus(
  conversationId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
  currentUser: Express.User,
  ipAddress?: string
) {
  ensureChatEligible(currentUser);
  if (currentUser.role !== UserRole.ADMIN) throw new AppError(403, "Apenas administradores podem atualizar solicitações.");
  await assertParticipant(conversationId, currentUser.id);
  const request = await prisma.accessRequest.findUnique({ where: { conversationId } });
  if (!request) throw new AppError(404, "Solicitação de acesso não encontrada.");
  const updated = await prisma.accessRequest.update({ where: { conversationId }, data: { status } });
  await createAuditLog({ userId: currentUser.id, action: "CHAT_ACCESS_REQUEST_STATUS_UPDATED", ipAddress });
  return updated;
}
