/**
 * Authentication Service
 * Business logic for authentication and user management
 */

import { prisma } from "../config";
import { logger } from "../config";
import bcrypt from "bcrypt";
import validator from "validator";
import { 
  AUTH_CONSTANTS, 
  ERROR_MESSAGES, 
  LOG_EVENTS 
} from "../constants";

// ============================================================================
// Types
// ============================================================================

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

// ============================================================================
// Auth Service Class
// ============================================================================

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<SessionUser | { error: string }> {
    try {
      const { email, password, name } = data;

      // Validate email format
      if (!validator.isEmail(email)) {
        return { error: ERROR_MESSAGES.INVALID_EMAIL };
      }

      // Validate password length
      if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
        return { error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Generic message to prevent email enumeration
        return { error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split("@")[0],
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      logger.info({ 
        event: LOG_EVENTS.REGISTER_SUCCESS, 
        userId: user.id, 
        email: user.email 
      });

      return user;
    } catch (error) {
      logger.error({ err: error, email: data.email }, "Registration failed");
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(
    data: LoginData,
    ip?: string
  ): Promise<{ user: SessionUser; rememberMe?: boolean } | { error: string; locked?: boolean }> {
    try {
      const { email, password, rememberMe } = data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        logger.warn({ 
          event: LOG_EVENTS.LOGIN_FAILURE, 
          email, 
          ip,
          reason: 'user_not_found'
        });
        return { error: ERROR_MESSAGES.INVALID_CREDENTIALS };
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const remainingTime = Math.ceil(
          (user.accountLockedUntil.getTime() - Date.now()) / 60000
        );
        
        logger.warn({ 
          event: LOG_EVENTS.LOGIN_FAILURE, 
          userId: user.id, 
          email, 
          ip,
          reason: 'account_locked',
          remainingMinutes: remainingTime
        });

        return {
          error: `${ERROR_MESSAGES.ACCOUNT_LOCKED}. Try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
          locked: true,
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Increment failed login attempts
        const updatedAttempts = user.failedLoginAttempts + 1;
        const shouldLock = updatedAttempts >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: updatedAttempts,
            accountLockedUntil: shouldLock
              ? new Date(Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION)
              : null,
          },
        });

        logger.warn({ 
          event: LOG_EVENTS.LOGIN_FAILURE, 
          userId: user.id, 
          email, 
          ip,
          reason: 'invalid_password',
          attemptCount: updatedAttempts,
          locked: shouldLock
        });

        if (shouldLock) {
          logger.warn({ 
            event: LOG_EVENTS.ACCOUNT_LOCKED, 
            userId: user.id, 
            email 
          });

          return {
            error: `${ERROR_MESSAGES.ACCOUNT_LOCKED}. Try again in 15 minutes.`,
            locked: true,
          };
        }

        return { error: ERROR_MESSAGES.INVALID_CREDENTIALS };
      }

      // Reset failed attempts and update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      logger.info({ 
        event: LOG_EVENTS.LOGIN_SUCCESS, 
        userId: user.id, 
        email, 
        ip,
        rememberMe
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        rememberMe,
      };
    } catch (error) {
      logger.error({ err: error, email: data.email }, "Login failed");
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              notes: { where: { isTrashed: false } },
              folders: true,
              templates: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to get user profile");
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string }
  ) {
    try {
      // If updating email, check if it's already taken
      if (data.email) {
        if (!validator.isEmail(data.email)) {
          return { error: ERROR_MESSAGES.INVALID_EMAIL };
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser && existingUser.id !== userId) {
          return { error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS };
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      logger.info({ userId, updatedFields: Object.keys(data) }, "User profile updated");

      return user;
    } catch (error) {
      logger.error({ err: error, userId, data }, "Failed to update user profile");
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { error: ERROR_MESSAGES.USER_NOT_FOUND };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return { error: ERROR_MESSAGES.INVALID_CREDENTIALS };
      }

      // Validate new password
      if (newPassword.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
        return { error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info({ userId }, "Password changed successfully");

      return { success: true };
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to change password");
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string, password: string) {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { error: ERROR_MESSAGES.USER_NOT_FOUND };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return { error: ERROR_MESSAGES.INVALID_CREDENTIALS };
      }

      // Delete user (cascade will delete all related data)
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info({ userId, email: user.email }, "User account deleted");

      return { success: true };
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to delete account");
      throw error;
    }
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !user;
    } catch (error) {
      logger.error({ err: error, email }, "Failed to check email availability");
      throw error;
    }
  }

  /**
   * Get account security status
   */
  static async getSecurityStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        isLocked: user.accountLockedUntil ? user.accountLockedUntil > new Date() : false,
        failedAttempts: user.failedLoginAttempts,
        lockExpiresAt: user.accountLockedUntil,
        lastLoginAt: user.lastLoginAt,
        accountAge: Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to get security status");
      throw error;
    }
  }
}
