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
  await create(userData.userID, userData);
  return userData;
};

/**
 * Get user by ID
 * @param userID - ID of the user (PAT001, DOC001, 'admin', etc.)
 * @returns User or null
 */
export const getUserById = async (userID: string): Promise<User | null> => {
  const user = await getById(userID);
  return user;
};

/**
 * Update user fields
 * @param userID - ID of the user
 * @param updates - Partial fields to update
 */
export const updateUser = async (
  userID: string,
  updates: Partial<User>
): Promise<void> => {
  await update(userID, updates);
};

/**
 * Approve a pending user
 * @param userID - ID of the user to approve (PAT001, DOC001, etc.)
 * @param adminID - ID of the admin approving ('admin')
 */
export const approveUser = async (
  userID: string,
  adminID: string
): Promise<void> => {
  await update(userID, {
    isApproved: true,
    approvedBy: adminID,
    approvedAt: new Date(),
    status: UserStatus.ACTIVE,
    updatedAt: new Date(),
  });
};

/**
 * Reject a user
 * @param userID - ID of the user to reject
 * @param reason - Optional reason for rejection
 */
export const rejectUser = async (
  userID: string,
  reason?: string
): Promise<void> => {
  await update(userID, {
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
