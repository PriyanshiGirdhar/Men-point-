import { User } from '@prisma/client';

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    onboarded: user.onboarded,
  };
}
