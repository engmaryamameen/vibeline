import { AppError } from '@/common/errors/app-error';
import { userRepository } from '@/repositories/user.repository';

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt)
    };
  }
  async searchUsers(userId: string, query: string) { if (query.trim().length < 2) return []; return userRepository.search(query.trim(), userId); }

}

export const userService = new UserService();
