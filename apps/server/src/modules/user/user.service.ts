import { AppError } from '@/common/errors/app-error';
import { userRepository } from '@/repositories/user.repository';

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const { passwordHash: _, ...profile } = user;
    return profile;
  }
}

export const userService = new UserService();
