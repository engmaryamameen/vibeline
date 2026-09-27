import { z } from 'zod';

export const createConversationSchema = z.object({
  participantUserIds: z.array(z.string().uuid()).min(1).max(49),
  title: z.string().trim().min(1).max(120).optional(),
  type: z.enum(['direct', 'group']).default('group')
}).superRefine((value, ctx) => {
  if (value.type === 'direct' && value.participantUserIds.length !== 1) {
    ctx.addIssue({ code: 'custom', path: ['participantUserIds'], message: 'Direct conversations require exactly one other participant' });
  }
  if (value.type === 'direct' && value.title) {
    ctx.addIssue({ code: 'custom', path: ['title'], message: 'Direct conversations cannot be renamed' });
  }
});
export const updateConversationSchema = z.object({ title: z.string().trim().min(1).max(120) });
export const memberSchema = z.object({ userId: z.string().uuid() });
export const sendMessageSchema = z.object({ clientMessageId: z.string().uuid(), body: z.string().trim().min(1).max(10_000) });
export const editMessageSchema = z.object({ body: z.string().trim().min(1).max(10_000) });
export const listMessagesQuerySchema = z.object({ beforeSequence: z.coerce.number().int().positive().optional(), afterSequence: z.coerce.number().int().nonnegative().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });

export const memberRoleSchema = z.object({ role: z.enum(['admin','member']) });
