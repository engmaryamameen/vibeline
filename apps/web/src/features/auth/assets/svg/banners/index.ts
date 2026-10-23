import loginConversation from './login-conversation.svg';
import signupConnection from './signup-connection.svg';

// Keep static import objects for next/image. No remote URLs or SVG loader needed.
export const authBanners = {
  login: loginConversation,
  register: signupConnection,
} as const;
