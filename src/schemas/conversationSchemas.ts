import { z } from "zod";

export const createDirectConversationSchema = z.object({
  participantId: z.string().uuid()
});

export const createSupportConversationSchema = z.object({});

export const createAccessRequestSchema = z.object({
  category: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(3).max(120),
  details: z.string().trim().max(2_000).optional()
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4_000)
});

export const updateAccessRequestSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"])
});
