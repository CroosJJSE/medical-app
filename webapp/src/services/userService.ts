// src/services/userService.ts

import type { User } from '@/models/User';
import { UserStatus } from '@/enums';
import { create, getById, update, getPendingUsers as getPendingUsersRepo } from '@/repositories/userRepository';

/**
 * Create a new user
 * @param userData - User object to create
 * @returns Created User
 */
export const createUser = async (userData: User): Promise<User> => {
  await create(userData.userId, userData);
  return userData;
};

/**
 * Get user by ID
 * @param userId - ID of the user
 * @returns User or null
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const user = await getById(userId);
  return user;
};

/**
 * Update user fields
 * @param userId - ID of the user
 * @param updates - Partial fields to update
 */
export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  await update(userId, updates);
};

/**
 * Approve a pending user
 * @param userId - ID of the user to approve
 * @param adminId - ID of the admin approving
 */
export const approveUser = async (
  userId: string,
  adminId: string
): Promise<void> => {
  await update(userId, {
    isApproved: true,
    approvedBy: adminId,
    approvedAt: new Date(),
    status: UserStatus.ACTIVE,
    updatedAt: new Date(),
  });
};

/**
 * Reject a user
 * @param userId - ID of the user to reject
 * @param reason - Optional reason for rejection
 */
export const rejectUser = async (
  userId: string,
  reason?: string
): Promise<void> => {
  await update(userId, {
    isApproved: false,
    status: UserStatus.SUSPENDED,
    updatedAt: new Date(),
    // optional: store rejection reason in Firestore if schema supports
    // rejectionReason: reason,
  });
};

/**
 * Get all pending users
 * @returns Array of pending Users
 */
export const getPendingUsers = async (): Promise<User[]> => {
  return await getPendingUsersRepo();
};

// Default export
const userService = {
  createUser,
  getUserById,
  updateUser,
  approveUser,
  rejectUser,
  getPendingUsers,
};

export default userService;
