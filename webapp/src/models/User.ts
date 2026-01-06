// src/models/User.ts

import { UserRole, UserStatus } from '@/enums';

export interface User {
  // User identification
  userID: string;                  // PAT001, DOC001, 'admin', etc.
  AuthID: string;                  // Firebase Auth UID
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  status: UserStatus;
  isApproved: boolean;
  approvedBy?: string;              // Admin userID who approved
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // For backward compatibility (deprecated - use userID instead)
  userId?: string;
}
