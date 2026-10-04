import type { UpdateProfileRequest } from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { userRepository, toPublicUser } from '@/repositories/user.repository';

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
    if (query.trim().length < 2) return [];
    return userRepository.search(query.trim(), userId);
  }
}

export const userService = new UserService();
