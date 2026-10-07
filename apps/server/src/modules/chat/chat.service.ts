import type { ChatEventType,Message } from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { chatRepository } from './chat.repository';
import { realtimePublisher } from './realtime.publisher';
import type { FastifyBaseLogger } from 'fastify';
import { userRepository } from '@/repositories/user.repository';
import { notificationService } from '@/modules/notification/notification.service';

type PersistedMessage = Omit<Message,'senderId'|'assistantId'|'createdAt'|'editedAt'|'deletedAt'> & { senderId:string|null; assistantId:string|null; createdAt:Date|string; editedAt:Date|string|null; deletedAt:Date|string|null };
const toMessage=(message:PersistedMessage):Message=>({id:message.id,conversationId:message.conversationId,...(message.senderId?{senderId:message.senderId}:{}),...(message.assistantId?{assistantId:message.assistantId}:{}),clientMessageId:message.clientMessageId,sequence:message.sequence,body:message.body,createdAt:message.createdAt instanceof Date?message.createdAt.toISOString():message.createdAt,...(message.editedAt?{editedAt:message.editedAt instanceof Date?message.editedAt.toISOString():message.editedAt}:{}),...(message.deletedAt?{deletedAt:message.deletedAt instanceof Date?message.deletedAt.toISOString():message.deletedAt}:{})});

class ChatService {
  private logger:FastifyBaseLogger|undefined;
  setLogger(logger:FastifyBaseLogger){this.logger=logger;}
  async getMessageForRealtime(conversationId:string,messageId:string){const message=await chatRepository.getMessage(conversationId,messageId);return message?toMessage(message):undefined;}
  async createConversation(userId:string,participantUserIds:string[],type:'direct'|'group',title?:string){
    const participants=[...new Set(participantUserIds)];
    if(participants.includes(userId))throw new AppError(400,'INVALID_PARTICIPANTS','Do not include yourself as a participant');
    if(type==='direct'&&participants.length!==1)throw new AppError(400,'INVALID_DIRECT_PARTICIPANTS','A direct conversation requires exactly one other participant');
    if(!(await chatRepository.usersExist(participants)))throw new AppError(400,'INVALID_PARTICIPANTS','One or more participants do not exist');
    const conversation=await chatRepository.createConversation(userId,participants,type,title);
    void realtimePublisher.publish([userId,...participants],{type:'conversation.updated',conversationId:conversation.id,payload:{}}).catch(error=>this.logger?.error({error,operation:'chat.realtime.conversation',conversationId:conversation.id},'conversation realtime publish failed'));
    return conversation;
  }

  async listConversations(userId:string){
    return chatRepository.listConversations(userId);
  }

  async getConversation(userId:string,conversationId:string){
    await this.requireMembership(userId,conversationId);
    return {conversation:await chatRepository.getConversation(conversationId),members:await chatRepository.listMembers(conversationId)};
  }

  async updateConversation(userId:string,conversationId:string,title:string){
    const membership=await this.requireMembership(userId,conversationId);
    const conversation=await chatRepository.getConversation(conversationId);
    if(conversation?.type!=='group')throw new AppError(400,'DIRECT_CONVERSATION_IMMUTABLE','Direct conversations cannot be renamed');
    if(!['owner','admin'].includes(membership.role))throw new AppError(403,'FORBIDDEN','Only conversation owners or admins can rename this conversation');
    return chatRepository.updateTitle(conversationId,title);
  }

  async addMember(actorId:string,conversationId:string,newUserId:string){
    if(!(await chatRepository.usersExist([newUserId])))throw new AppError(404,'USER_NOT_FOUND','User not found');
    this.assertMembershipMutation(await chatRepository.addMember(conversationId,actorId,newUserId));
    return this.getConversation(actorId,conversationId);
  }

  async updateMemberRole(actorId:string,conversationId:string,targetId:string,role:'admin'|'member'){
    const result=await chatRepository.updateMemberRole(conversationId,actorId,targetId,role);
    if(result==='member-not-found')throw new AppError(404,'MEMBER_NOT_FOUND','Member not found');
    if(result==='owner')throw new AppError(409,'OWNER_ROLE_IMMUTABLE','Ownership changes require the ownership transfer/leave path');
    this.assertMembershipMutation(result);
    return this.getConversation(actorId,conversationId);
  }

  async removeMember(actorId:string,conversationId:string,targetId:string){
    const result=await chatRepository.removeMember(conversationId,actorId,targetId);
    if(result==='self')return this.leaveConversation(actorId,conversationId);
    if(result==='owner')throw new AppError(409,'OWNER_CANNOT_BE_REMOVED','The owner must leave through the ownership-transfer path');
    this.assertMembershipMutation(result);
  }

  async leaveConversation(userId:string,conversationId:string){
    const result=await chatRepository.leaveConversation(conversationId,userId);
    if(result==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result==='direct')throw new AppError(400,'DIRECT_CONVERSATION_LEAVE_UNSUPPORTED','Direct conversations cannot be left');
  }

  async listMessages(userId:string,conversationId:string,before:number|undefined,after:number|undefined,limit:number){
    const rows=await chatRepository.listMessages(conversationId,userId,before,after,limit);
    if(!rows)throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    return after===undefined?rows.reverse():rows;
  }

  async sendMessage(userId:string,conversationId:string,clientMessageId:string,body:string){
    const result=await chatRepository.sendMessage(conversationId,userId,clientMessageId,body);
    if(!result||'forbidden' in result)throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.created){void this.publish(conversationId,'message.created',toMessage(result.message));void this.notifyMessage(userId,conversationId,result.message.sequence,body);}
    return result;
  }

  async editMessage(userId:string,conversationId:string,messageId:string,body:string){
    const result=await chatRepository.editMessage(conversationId,userId,messageId,body);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='message-not-found')throw new AppError(404,'MESSAGE_NOT_FOUND','Message not found');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only the sender can edit this message');
    if(result.kind==='deleted')throw new AppError(409,'MESSAGE_DELETED','Deleted messages cannot be edited');
    void this.publish(conversationId,'message.updated',toMessage(result.message));
    return result.message;
  }

  async deleteMessage(userId:string,conversationId:string,messageId:string,scope:'me'|'everyone'){
    const result=scope==='me'?await chatRepository.deleteMessageForUser(conversationId,userId,messageId):await chatRepository.deleteMessageForEveryone(conversationId,userId,messageId);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='message-not-found')throw new AppError(404,'MESSAGE_NOT_FOUND','Message not found');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only the sender can delete this message for everyone');
    if(scope==='everyone')void this.publish(conversationId,'message.deleted',toMessage(result.message));
    return result.message;
  }

  async updateReceipt(userId:string,conversationId:string,deliveredSequence:number,readSequence:number){const receipt=await chatRepository.updateReceipt(conversationId,userId,deliveredSequence,readSequence);if(!receipt)throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');const ids=(await chatRepository.listMessageRecipientIds(conversationId,2_147_483_647)).map(x=>x.userId);void realtimePublisher.publish(ids,{type:'receipt.updated',conversationId,payload:{userId,deliveredSequence:receipt.deliveredSequence,readSequence:receipt.readSequence}}).catch(()=>undefined);return receipt;}

  async touchPresence(userId:string){const presence=await chatRepository.touchPresence(userId);const peers=(await chatRepository.listConversationPeerIds(userId)).map(x=>x.userId);for(const conversation of await chatRepository.listConversations(userId))void realtimePublisher.publish(peers,{type:'presence.updated',conversationId:conversation.id,payload:{userId,lastSeenAt:presence!.lastSeenAt.toISOString()}}).catch(()=>undefined);return presence;}

  async publishPersistedMessage(conversationId:string,message:PersistedMessage){await this.publish(conversationId,'message.created',toMessage(message));}

  private async notifyMessage(senderId:string,conversationId:string,sequence:number,body:string){try{const [sender,recipients]=await Promise.all([userRepository.findById(senderId),chatRepository.listMessageRecipientIds(conversationId,sequence)]);const preview=body.length>120?`${body.slice(0,117)}…`:body;for(const recipient of recipients)if(recipient.userId!==senderId)void notificationService.notify(recipient.userId,'message',{title:sender?.displayName??'New message',body:preview,url:`/chat?conversation=${conversationId}`,tag:`conversation:${conversationId}`,conversationId});}catch(error){this.logger?.error({error,operation:'push.message',conversationId},'message notification scheduling failed');}}

  private assertMembershipMutation(result:'ok'|'not-found'|'direct'|'forbidden'){
    if(result==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result==='direct')throw new AppError(400,'DIRECT_MEMBERS_IMMUTABLE','Direct conversation membership cannot change');
    if(result==='forbidden')throw new AppError(403,'FORBIDDEN','Insufficient permission for this membership operation');
  }

  private async requireMembership(userId:string,conversationId:string){
    const membership=await chatRepository.getMembership(conversationId,userId);
    if(!membership)throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    return membership;
  }

  private async publish(conversationId:string,type:ChatEventType,payload:Message){
    try{const memberIds=(await chatRepository.listMessageRecipientIds(conversationId,payload.sequence)).map(member=>member.userId);await realtimePublisher.publish(memberIds,{type,conversationId,payload});}
    catch(error){this.logger?.error({error,operation:'chat.realtime.publish',conversationId,messageId:payload?.id},'realtime publish failed; committed state remains authoritative');}
  }
}

export const chatService=new ChatService();
