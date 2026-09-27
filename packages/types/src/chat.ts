export type ConversationType = 'direct' | 'group';
export type ConversationMemberRole = 'owner' | 'admin' | 'member';
export interface ConversationSummary { id:string; type:ConversationType; title?:string; createdAt:string; updatedAt:string; archivedAt?:string; }
export interface ConversationMember { userId:string; displayName:string; avatarUrl?:string; role:ConversationMemberRole; joinedAt:string; }
export interface Message { id:string; conversationId:string; senderId:string; clientMessageId:string; sequence:number; body:string; createdAt:string; editedAt?:string; deletedAt?:string; }
export type ChatEventType='message.created'|'message.updated'|'message.deleted'|'conversation.updated';
export interface ChatEvent { type:ChatEventType; conversationId:string; payload:unknown; }
