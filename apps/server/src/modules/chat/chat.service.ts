import type { ChatEventType,Message } from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { chatRepository } from './chat.repository';
import { realtimePublisher } from './realtime.publisher';
import type { FastifyBaseLogger } from 'fastify';

class ChatService {
  private logger:FastifyBaseLogger|undefined;
  setLogger(logger:FastifyBaseLogger){this.logger=logger;}
  getMessageForRealtime(conversationId:string,messageId:string){return chatRepository.getMessage(conversationId,messageId);}
  async createConversation(userId:string,participantUserIds:string[],type:'direct'|'group',title?:string){
    const participants=[...new Set(participantUserIds)];
    if(participants.includes(userId))throw new AppError(400,'INVALID_PARTICIPANTS','Do not include yourself as a participant');
    if(type==='direct'&&participants.length!==1)throw new AppError(400,'INVALID_DIRECT_PARTICIPANTS','A direct conversation requires exactly one other participant');
    if(!(await chatRepository.usersExist(participants)))throw new AppError(400,'INVALID_PARTICIPANTS','One or more participants do not exist');
    return chatRepository.createConversation(userId,participants,type,title);
  }

  async listConversations(userId:string){
    return (await chatRepository.listConversations(userId)).map(({conversation})=>conversation);
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
    if(result.created)void this.publish(conversationId,'message.created',result.message);
    return result;
  }

  async editMessage(userId:string,conversationId:string,messageId:string,body:string){
    const result=await chatRepository.editMessage(conversationId,userId,messageId,body);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='message-not-found')throw new AppError(404,'MESSAGE_NOT_FOUND','Message not found');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only the sender can edit this message');
    if(result.kind==='deleted')throw new AppError(409,'MESSAGE_DELETED','Deleted messages cannot be edited');
    void this.publish(conversationId,'message.updated',result.message);
    return result.message;
  }

  async deleteMessage(userId:string,conversationId:string,messageId:string){
    const result=await chatRepository.deleteMessage(conversationId,userId,messageId);
    if(result.kind==='not-found')throw new AppError(404,'CONVERSATION_NOT_FOUND','Conversation not found');
    if(result.kind==='message-not-found')throw new AppError(404,'MESSAGE_NOT_FOUND','Message not found');
    if(result.kind==='forbidden')throw new AppError(403,'FORBIDDEN','Only the sender can delete this message');
    void this.publish(conversationId,'message.deleted',result.message);
    return result.message;
  }

  async publishPersistedMessage(conversationId:string,message:Message){await this.publish(conversationId,'message.created',message);}

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
