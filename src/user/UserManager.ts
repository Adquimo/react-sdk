/**
 * User Manager for Adquimo SDK
 * Handles user identification, properties, and state management
 */

import { v4 as uuidv4 } from 'uuid';
import { User, UserProperties, AdquimoError, ADQUIMO_CONSTANTS } from '../types';
import { StorageManager } from '../utils/StorageManager';
import { Logger } from '../utils/Logger';

export class UserManager {
  private storageManager: StorageManager;
  private logger: Logger;
  private currentUser: User | null = null;

  constructor(storageManager: StorageManager, logger: Logger) {
    this.storageManager = storageManager;
    this.logger = logger;
  }

  /**
   * Initialize user manager
   */
  async initialize(): Promise<void> {
    try {
      // Load existing user from storage
      const storedUser = await this.storageManager.get<User>(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID);

      if (storedUser) {
        this.currentUser = storedUser;
        this.logger.debug('User loaded from storage', { userId: storedUser.id });
      } else {
        // Create anonymous user
        await this.createAnonymousUser();
      }
    } catch (error) {
      this.logger.error('Failed to initialize user manager', error);
      throw this.createError('USER_INIT_ERROR', error);
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, properties?: UserProperties): Promise<void> {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('User ID is required and must be a non-empty string');
      }

      const now = new Date();
      let user: User;

      if (this.currentUser) {
        // Update existing user
        user = {
          ...this.currentUser,
          id: userId,
          properties: {
            ...this.currentUser.properties,
            ...properties,
          },
          lastSeenAt: now,
        };
      } else {
        // Create new user
        user = {
          id: userId,
          properties: properties || {},
          createdAt: now,
          lastSeenAt: now,
        };
      }

      // Validate user properties
      this.validateUserProperties(user.properties || {});

      // Save user to storage
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID, user);
      this.currentUser = user;

      this.logger.info('User identified', { userId, propertiesCount: Object.keys(user.properties || {}).length });
    } catch (error) {
      this.logger.error('Failed to identify user', error);
      throw this.createError('USER_IDENTIFY_ERROR', error);
    }
  }

  /**
   * Alias a user (link anonymous user to identified user)
   */
  async alias(anonymousId: string, userId: string): Promise<void> {
    try {
      if (!anonymousId || !userId) {
        throw new Error('Both anonymous ID and user ID are required');
      }

      // Get anonymous user data
      const anonymousUser = await this.storageManager.get<User>(`anonymous_${anonymousId}`);

      if (!anonymousUser) {
        throw new Error('Anonymous user not found');
      }

      // Create new user with anonymous user's data
      const user: User = {
        ...anonymousUser,
        id: userId,
        lastSeenAt: new Date(),
      };

      // Save user
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID, user);
      this.currentUser = user;

      // Remove anonymous user data
      await this.storageManager.remove(`anonymous_${anonymousId}`);

      this.logger.info('User aliased', { anonymousId, userId });
    } catch (error) {
      this.logger.error('Failed to alias user', error);
      throw this.createError('USER_ALIAS_ERROR', error);
    }
  }

  /**
   * Update user properties
   */
  async updateProperties(properties: UserProperties): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user identified');
      }

      // Validate properties
      this.validateUserProperties(properties);

      // Update user properties
      const updatedUser: User = {
        ...this.currentUser,
        properties: {
          ...this.currentUser.properties,
          ...(properties || {}),
        },
        lastSeenAt: new Date(),
      };

      // Save updated user
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID, updatedUser);
      this.currentUser = updatedUser;

      this.logger.debug('User properties updated', {
        userId: this.currentUser.id,
        propertiesCount: Object.keys(updatedUser.properties || {}).length,
      });
    } catch (error) {
      this.logger.error('Failed to update user properties', error);
      throw this.createError('USER_UPDATE_ERROR', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Get user properties
   */
  getUserProperties(): UserProperties {
    return this.currentUser?.properties || {};
  }

  /**
   * Check if user is identified
   */
  isIdentified(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Reset user data
   */
  async reset(): Promise<void> {
    try {
      // Clear current user
      this.currentUser = null;

      // Remove user data from storage
      await this.storageManager.remove(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID);
      await this.storageManager.remove(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_PROPERTIES);

      // Create new anonymous user
      await this.createAnonymousUser();

      this.logger.info('User data reset');
    } catch (error) {
      this.logger.error('Failed to reset user data', error);
      throw this.createError('USER_RESET_ERROR', error);
    }
  }

  /**
   * Create anonymous user
   */
  private async createAnonymousUser(): Promise<void> {
    try {
      const anonymousId = uuidv4();
      const now = new Date();

      const anonymousUser: User = {
        id: anonymousId,
        properties: {},
        createdAt: now,
        lastSeenAt: now,
      };

      // Save anonymous user
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.USER_ID, anonymousUser);
      this.currentUser = anonymousUser;

      this.logger.debug('Anonymous user created', { anonymousId });
    } catch (error) {
      this.logger.error('Failed to create anonymous user', error);
      throw this.createError('ANONYMOUS_USER_ERROR', error);
    }
  }

  /**
   * Validate user properties
   */
  private validateUserProperties(properties: UserProperties): void {
    if (!properties || typeof properties !== 'object') {
      throw new Error('User properties must be an object');
    }

    const propertyCount = Object.keys(properties).length;
    if (propertyCount > ADQUIMO_CONSTANTS.MAX_USER_PROPERTIES) {
      throw new Error(`User properties exceed maximum limit of ${ADQUIMO_CONSTANTS.MAX_USER_PROPERTIES}`);
    }

    // Validate each property
    for (const [key, value] of Object.entries(properties)) {
      if (!this.isValidPropertyKey(key)) {
        throw new Error(`Invalid property key: ${key}. Keys must be alphanumeric with underscores and hyphens`);
      }

      if (!this.isValidPropertyValue(value)) {
        throw new Error(`Invalid property value for key ${key}. Values must be strings, numbers, booleans, or null`);
      }
    }
  }

  /**
   * Check if property key is valid
   */
  private isValidPropertyKey(key: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(key);
  }

  /**
   * Check if property value is valid
   */
  private isValidPropertyValue(value: unknown): boolean {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    );
  }

  /**
   * Create user error
   */
  private createError(code: string, error: unknown): AdquimoError {
    const message = error instanceof Error ? error.message : String(error);

    return {
      code,
      message,
      timestamp: new Date(),
      details: {
        userId: this.currentUser?.id,
      },
    };
  }
}
