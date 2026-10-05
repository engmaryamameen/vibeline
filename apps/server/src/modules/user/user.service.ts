import type { UpdateProfileRequest } from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { userRepository, toPublicUser } from '@/repositories/user.repository';
import { notificationService } from '@/modules/notification/notification.service';

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return toPublicUser(user);
  }

  async updateProfile(userId: string, payload: UpdateProfileRequest) {
    const existing = await userRepository.findById(userId);

    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const firstName = payload.firstName ?? existing.firstName;
    const lastName = payload.lastName ?? existing.lastName;
    const displayName = firstName && lastName ? `${firstName} ${lastName}`.trim() : existing.displayName;

    const updated = await userRepository.update(userId, {
      ...(payload.firstName !== undefined ? { firstName: payload.firstName } : {}),
      ...(payload.lastName !== undefined ? { lastName: payload.lastName } : {}),
      ...(payload.dateOfBirth !== undefined ? { dateOfBirth: payload.dateOfBirth } : {}),
      ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber } : {}),
      ...(displayName !== existing.displayName ? { displayName } : {})
    });

    if (!updated) {
      throw new AppError(500, 'PROFILE_UPDATE_FAILED', 'Unable to update profile');
    }

    return updated;
  }

  async searchUsers(userId: string, query: string) {
    return userRepository.search(query.trim(), userId);
  }

  async listConnectionRequests(userId: string) {
    const rows = await userRepository.listIncomingConnectionRequests(userId);
    return rows.map((row) => ({ ...row, user: { ...row.user, connectionStatus: 'incoming' as const } }));
  }

  async requestConnection(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new AppError(400, 'INVALID_CONNECTION_REQUEST', 'You cannot add yourself');
    if (!(await userRepository.findById(targetUserId))) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    const result = await userRepository.requestConnection(userId, targetUserId);
    if (result.shouldNotify) {
      const requester=await userRepository.findById(userId);
      void notificationService.notify(targetUserId,'connection',{title:'New connection request',body:`${requester?.displayName??'Someone'} wants to connect with you`,url:'/chat',tag:`connection:${userId}`});
    }
  }

  async respondConnection(userId: string, requestId: string, accept: boolean) {
    const request = await userRepository.respondConnection(userId, requestId, accept);
    if (!request) throw new AppError(404, 'CONNECTION_REQUEST_NOT_FOUND', 'Connection request not found');
  }

}

export const userService = new UserService();
