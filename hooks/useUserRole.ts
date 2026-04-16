'use client';

import { useUser } from '@clerk/nextjs';

export type UserRole = 'student' | 'lecturer' | null;

export function useUserRole() {
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata?.role as UserRole) ?? null;
  const university = (user?.publicMetadata?.university as string) ?? '';
  const department = (user?.publicMetadata?.department as string) ?? '';

  return {
    role,
    isStudent: role === 'student',
    isLecturer: role === 'lecturer',
    university,
    department,
    isLoaded,
  };
}
