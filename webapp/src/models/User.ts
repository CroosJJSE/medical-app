// src/models/User.ts

import { UserRole, UserStatus } from '@/enums';

export interface User {
  userId: string;
  email: string;
  role: UserRole;

  displayName: string;
  photoURL?: string;

  status: UserStatus;

  isApproved: boolean;
  approvedBy?: string;      // admin userId
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
