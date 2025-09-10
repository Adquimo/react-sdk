/**
 * Session Manager for Adquimo SDK
 * Handles user session tracking and management
 */

import { v4 as uuidv4 } from 'uuid';
import { UserSession, SessionProperties, AdquimoError, ADQUIMO_CONSTANTS } from '../types';
import { StorageManager } from '../utils/StorageManager';
import { Logger } from '../utils/Logger';

export class SessionManager {
  private storageManager: StorageManager;
  private logger: Logger;
  private currentSession: UserSession | null = null;
  private sessionStartTime: Date | null = null;

  constructor(storageManager: StorageManager, logger: Logger) {
    this.storageManager = storageManager;
    this.logger = logger;
  }

  /**
   * Initialize session manager
   */
  async initialize(): Promise<void> {
    try {
      // Load existing session from storage
      const storedSession = await this.storageManager.get<UserSession>(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_ID);

      if (storedSession) {
        // Check if session is still valid (not expired)
        if (this.isSessionValid(storedSession)) {
          this.currentSession = storedSession;
          this.sessionStartTime = storedSession.startTime;
          this.logger.debug('Session loaded from storage', { sessionId: storedSession.id });
        } else {
          // Session expired, create new one
          await this.createNewSession();
        }
      } else {
        // No existing session, create new one
        await this.createNewSession();
      }
    } catch (error) {
      this.logger.error('Failed to initialize session manager', error);
      throw this.createError('SESSION_INIT_ERROR', error);
    }
  }

  /**
   * Start a new session
   */
  async startSession(userId?: string, properties?: SessionProperties): Promise<UserSession> {
    try {
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }

      // Create new session
      const session = await this.createNewSession(userId, properties);

      this.logger.info('New session started', {
        sessionId: session.id,
        userId: session.userId,
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to start session', error);
      throw this.createError('SESSION_START_ERROR', error);
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      const now = new Date();
      const duration = this.sessionStartTime ? now.getTime() - this.sessionStartTime.getTime() : 0;

      // Update session with end time and duration
      const endedSession: UserSession = {
        ...this.currentSession,
        endTime: now,
        duration,
      };

      // Save ended session
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_ID, endedSession);

      this.logger.info('Session ended', {
        sessionId: endedSession.id,
        duration,
      });

      // Clear current session
      this.currentSession = null;
      this.sessionStartTime = null;
    } catch (error) {
      this.logger.error('Failed to end session', error);
      throw this.createError('SESSION_END_ERROR', error);
    }
  }

  /**
   * Update session properties
   */
  async updateSessionProperties(properties: SessionProperties): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new Error('No active session');
      }

      // Validate properties
      this.validateSessionProperties(properties);

      // Update session properties
      const updatedSession: UserSession = {
        ...this.currentSession,
        properties: {
          ...this.currentSession.properties,
          ...properties,
        },
      };

      // Save updated session
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_ID, updatedSession);
      this.currentSession = updatedSession;

      this.logger.debug('Session properties updated', {
        sessionId: this.currentSession.id,
        propertiesCount: Object.keys(updatedSession.properties || {}).length,
      });
    } catch (error) {
      this.logger.error('Failed to update session properties', error);
      throw this.createError('SESSION_UPDATE_ERROR', error);
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.currentSession?.id || null;
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    if (!this.sessionStartTime) {
      return 0;
    }

    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.currentSession !== null && this.currentSession.endTime === undefined;
  }

  /**
   * Reset session data
   */
  async reset(): Promise<void> {
    try {
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }

      // Clear session data from storage
      await this.storageManager.remove(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_ID);
      await this.storageManager.remove(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_PROPERTIES);

      // Reset state
      this.currentSession = null;
      this.sessionStartTime = null;

      this.logger.info('Session data reset');
    } catch (error) {
      this.logger.error('Failed to reset session data', error);
      throw this.createError('SESSION_RESET_ERROR', error);
    }
  }

  /**
   * Create new session
   */
  private async createNewSession(userId?: string, properties?: SessionProperties): Promise<UserSession> {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const session: UserSession = {
        id: sessionId,
        userId: userId || 'anonymous',
        startTime: now,
        properties: properties || {},
        device: await this.getDeviceInfo(),
        browser: await this.getBrowserInfo(),
        location: await this.getLocationInfo(),
      };

      // Save session
      await this.storageManager.set(ADQUIMO_CONSTANTS.STORAGE_KEYS.SESSION_ID, session);
      this.currentSession = session;
      this.sessionStartTime = now;

      this.logger.debug('New session created', { sessionId, userId });

      return session;
    } catch (error) {
      this.logger.error('Failed to create new session', error);
      throw this.createError('SESSION_CREATE_ERROR', error);
    }
  }

  /**
   * Check if session is valid (not expired)
   */
  private isSessionValid(session: UserSession): boolean {
    if (!session.startTime) {
      return false;
    }

    // Session is valid for 30 minutes of inactivity
    const maxInactivity = 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    const timeSinceStart = now.getTime() - session.startTime.getTime();

    return timeSinceStart < maxInactivity;
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // This would typically use a device detection library
      // For now, return basic information
      return {
        type: this.getDeviceType(),
        os: navigator.platform || 'unknown',
        osVersion: 'unknown',
        screenResolution: {
          width: screen.width,
          height: screen.height,
        },
        screenDensity: window.devicePixelRatio || 1,
        orientation: screen.orientation?.type || 'unknown',
      };
    } catch (error) {
      this.logger.warn('Failed to get device info', error);
      return undefined;
    }
  }

  /**
   * Get browser information
   */
  private async getBrowserInfo(): Promise<any> {
    try {
      return {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        colorDepth: screen.colorDepth,
        cookieEnabled: navigator.cookieEnabled,
        javascriptEnabled: true,
      };
    } catch (error) {
      this.logger.warn('Failed to get browser info', error);
      return undefined;
    }
  }

  /**
   * Get location information
   */
  private async getLocationInfo(): Promise<any> {
    try {
      // This would typically use a geolocation service
      // For now, return undefined
      return undefined;
    } catch (error) {
      this.logger.warn('Failed to get location info', error);
      return undefined;
    }
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';

    return 'Unknown';
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;

    // Extract version number (simplified)
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Validate session properties
   */
  private validateSessionProperties(properties: SessionProperties): void {
    if (!properties || typeof properties !== 'object') {
      throw new Error('Session properties must be an object');
    }

    const propertyCount = Object.keys(properties).length;
    if (propertyCount > ADQUIMO_CONSTANTS.MAX_SESSION_PROPERTIES) {
      throw new Error(`Session properties exceed maximum limit of ${ADQUIMO_CONSTANTS.MAX_SESSION_PROPERTIES}`);
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
   * Create session error
   */
  private createError(code: string, error: unknown): AdquimoError {
    const message = error instanceof Error ? error.message : String(error);

    return {
      code,
      message,
      timestamp: new Date(),
      details: {
        sessionId: this.currentSession?.id,
      },
    };
  }
}
