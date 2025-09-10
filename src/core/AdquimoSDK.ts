/**
 * Adquimo React SDK - Core SDK Class
 * Enterprise-grade tracking and analytics SDK
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AdquimoConfig,
  User,
  Event,
  UserSession,
  AdquimoError,
  BatchRequest,
  ADQUIMO_CONSTANTS,
  TrackingCallback,
  ErrorCallback,
  SuccessCallback,
  CreateEventOptions,
  CreatePageViewOptions,
  CreateClickEventOptions,
  AnalyticsOptions,
  StorageConfig,
} from '../types';
import { Logger } from '../utils/Logger';
import { StorageManager } from '../utils/StorageManager';
import { NetworkManager } from '../utils/NetworkManager';
import { EventValidator } from '../utils/EventValidator';
import { UserManager } from '../user/UserManager';
import { SessionManager } from '../user/SessionManager';
import { TrackingManager } from '../tracking/TrackingManager';
import { AnalyticsManager } from '../analytics/AnalyticsManager';

/**
 * Main Adquimo SDK class
 * Provides comprehensive tracking and analytics capabilities
 */
export class AdquimoSDK {
  private config: Required<AdquimoConfig>;
  private logger: Logger;
  private storageManager: StorageManager;
  private networkManager: NetworkManager;
  private eventValidator: EventValidator;
  private userManager: UserManager;
  private sessionManager: SessionManager;
  private trackingManager: TrackingManager;
  private analyticsManager: AnalyticsManager;
  private isInitialized = false;
  private flushTimer?: NodeJS.Timeout;
  private eventQueue: Event[] = [];
  private callbacks: {
    onEvent?: TrackingCallback | undefined;
    onError?: ErrorCallback | undefined;
    onSuccess?: SuccessCallback | undefined;
  } = {};

  constructor(config: AdquimoConfig) {
    this.config = this.mergeWithDefaults(config);
    this.logger = new Logger(this.config.debug);
    this.storageManager = new StorageManager(this.config.storageConfig as Required<StorageConfig>);
    this.networkManager = new NetworkManager(this.config);
    this.eventValidator = new EventValidator();
    this.userManager = new UserManager(this.storageManager, this.logger);
    this.sessionManager = new SessionManager(this.storageManager, this.logger);
    this.trackingManager = new TrackingManager(
      this.eventValidator,
      this.logger,
      this.userManager,
      this.sessionManager,
    );
    this.analyticsManager = new AnalyticsManager(
      this.networkManager,
      this.logger,
    );
  }

  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Adquimo SDK...');

      // Initialize storage
      await this.storageManager.initialize();

      // Initialize user manager
      await this.userManager.initialize();

      // Initialize session manager
      await this.sessionManager.initialize();

      // Start automatic tracking if enabled
      if (this.config.autoTrackPageViews) {
        this.startPageViewTracking();
      }

      if (this.config.autoTrackSessions) {
        this.startSessionTracking();
      }

      // Start event flushing
      this.startEventFlushing();

      this.isInitialized = true;
      this.logger.info('Adquimo SDK initialized successfully');

      // Emit success callback
      this.callbacks.onSuccess?.('SDK initialized successfully');
    } catch (error) {
      const adquimoError = this.createError('INITIALIZATION_ERROR', error);
      this.logger.error('Failed to initialize Adquimo SDK', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Track a custom event
   */
  async track(
    name: string,
    properties?: Record<string, unknown>,
    category?: string,
    action?: string,
    label?: string,
    value?: number,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before tracking events');
    }

    try {
      const eventOptions: CreateEventOptions = {
        name,
        properties: properties || undefined,
        category: category || undefined,
        action: action || undefined,
        label: label || undefined,
        value: value || undefined,
      };
      const event = await this.trackingManager.createEvent(eventOptions);

      await this.queueEvent(event);
      this.logger.debug('Event tracked', { eventName: name, eventId: event.id });
    } catch (error) {
      const adquimoError = this.createError('TRACKING_ERROR', error);
      this.logger.error('Failed to track event', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(
    url: string,
    title?: string,
    referrer?: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before tracking page views');
    }

    try {
      const pageViewOptions: CreatePageViewOptions = {
        url,
        title: title || undefined,
        referrer: referrer || undefined,
        properties: properties || undefined,
      };
      const pageView = await this.trackingManager.createPageView(pageViewOptions);

      // Convert PageView to Event for queueing
      const event: Event = {
        id: pageView.id,
        name: 'page_view',
        category: 'page',
        action: 'view',
        properties: {
          url: pageView.url,
          title: pageView.title,
          referrer: pageView.referrer,
          ...pageView.properties,
        },
        userId: pageView.userId,
        sessionId: pageView.sessionId,
        timestamp: pageView.timestamp,
        source: 'sdk',
        version: ADQUIMO_CONSTANTS.VERSION,
      };

      await this.queueEvent(event);
      this.logger.debug('Page view tracked', { url, pageViewId: pageView.id });
    } catch (error) {
      const adquimoError = this.createError('PAGE_VIEW_ERROR', error);
      this.logger.error('Failed to track page view', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Track a click event
   */
  async trackClick(
    element: string,
    selector?: string,
    text?: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before tracking clicks');
    }

    try {
      const clickEventOptions: CreateClickEventOptions = {
        element,
        selector: selector || undefined,
        text: text || undefined,
        properties: properties || undefined,
      };
      const clickEvent = await this.trackingManager.createClickEvent(clickEventOptions);

      // Convert ClickEvent to Event for queueing
      const event: Event = {
        id: clickEvent.id,
        name: 'click',
        category: 'interaction',
        action: 'click',
        properties: {
          element: clickEvent.element,
          selector: clickEvent.selector,
          text: clickEvent.text,
          coordinates: clickEvent.coordinates,
          ...clickEvent.properties,
        },
        userId: clickEvent.userId,
        sessionId: clickEvent.sessionId,
        timestamp: clickEvent.timestamp,
        source: 'sdk',
        version: ADQUIMO_CONSTANTS.VERSION,
      };

      await this.queueEvent(event);
      this.logger.debug('Click event tracked', { element, clickId: clickEvent.id });
    } catch (error) {
      const adquimoError = this.createError('CLICK_ERROR', error);
      this.logger.error('Failed to track click event', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before identifying users');
    }

    try {
      await this.userManager.identify(userId, properties);
      this.logger.debug('User identified', { userId });
    } catch (error) {
      const adquimoError = this.createError('USER_IDENTIFICATION_ERROR', error);
      this.logger.error('Failed to identify user', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Alias a user (link anonymous user to identified user)
   */
  async alias(anonymousId: string, userId: string): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before aliasing users');
    }

    try {
      await this.userManager.alias(anonymousId, userId);
      this.logger.debug('User aliased', { anonymousId, userId });
    } catch (error) {
      const adquimoError = this.createError('USER_ALIAS_ERROR', error);
      this.logger.error('Failed to alias user', adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Reset user data
   */
  async reset(): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before resetting');
    }

    try {
      await this.userManager.reset();
      await this.sessionManager.reset();
      this.eventQueue = [];
      this.logger.debug('User data reset');
    } catch (error) {
      const adquimoError = this.createError('RESET_ERROR', error);
      this.logger.error('Failed to reset user data', adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.userManager.getCurrentUser();
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.sessionManager.getCurrentSession();
  }

  /**
   * Get analytics data
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }): Promise<unknown> {
    if (!this.isInitialized) {
      throw this.createError('SDK_NOT_INITIALIZED', 'SDK must be initialized before getting analytics');
    }

    try {
      const options: AnalyticsOptions = {
        timeRange: timeRange || undefined,
      };
      return await this.analyticsManager.getAnalytics(options);
    } catch (error) {
      const adquimoError = this.createError('ANALYTICS_ERROR', error);
      this.logger.error('Failed to get analytics', adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onEvent?: TrackingCallback | undefined;
    onError?: ErrorCallback | undefined;
    onSuccess?: SuccessCallback | undefined;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const batchRequest: BatchRequest = {
        id: uuidv4(),
        events,
        timestamp: new Date(),
        size: events.length,
      };

      const response = await this.networkManager.sendBatch(batchRequest);

      if (response.success) {
        this.logger.debug('Events flushed successfully', { count: events.length });
        this.callbacks.onSuccess?.(response.data);
      } else {
        // Re-queue failed events
        this.eventQueue.unshift(...events);
        throw response.error;
      }
    } catch (error) {
      const adquimoError = this.createError('FLUSH_ERROR', error);
      this.logger.error('Failed to flush events', adquimoError);
      this.callbacks.onError?.(adquimoError);
      throw adquimoError;
    }
  }

  /**
   * Destroy the SDK instance
   */
  async destroy(): Promise<void> {
    try {
      // Flush remaining events
      await this.flush();

      // Clear timers
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }

      // Stop tracking
      this.stopPageViewTracking();
      this.stopSessionTracking();

      // Reset state
      this.isInitialized = false;
      this.eventQueue = [];
      this.callbacks = {};

      this.logger.info('Adquimo SDK destroyed');
    } catch (error) {
      const adquimoError = this.createError('DESTROY_ERROR', error);
      this.logger.error('Failed to destroy SDK', adquimoError);
      throw adquimoError;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mergeWithDefaults(config: AdquimoConfig): Required<AdquimoConfig> {
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || ADQUIMO_CONSTANTS.DEFAULT_BASE_URL,
      environment: config.environment || 'production',
      debug: config.debug || false,
      autoTrackPageViews: config.autoTrackPageViews ?? true,
      autoTrackSessions: config.autoTrackSessions ?? true,
      userProperties: config.userProperties || {},
      eventProperties: config.eventProperties || {},
      batchSize: config.batchSize || ADQUIMO_CONSTANTS.DEFAULT_BATCH_SIZE,
      flushInterval: config.flushInterval || ADQUIMO_CONSTANTS.DEFAULT_FLUSH_INTERVAL,
      retryConfig: {
        maxRetries: config.retryConfig?.maxRetries || ADQUIMO_CONSTANTS.DEFAULT_RETRY_ATTEMPTS,
        initialDelay: config.retryConfig?.initialDelay || ADQUIMO_CONSTANTS.DEFAULT_RETRY_DELAY,
        maxDelay: config.retryConfig?.maxDelay || ADQUIMO_CONSTANTS.DEFAULT_RETRY_DELAY * 10,
        backoffMultiplier: config.retryConfig?.backoffMultiplier || 2,
      },
      storageConfig: {
        type: config.storageConfig?.type || 'localStorage',
        keyPrefix: config.storageConfig?.keyPrefix || 'adquimo_',
        maxSize: config.storageConfig?.maxSize || 1024 * 1024, // 1MB
      },
    };
  }

  private async queueEvent(event: Event): Promise<void> {
    this.eventQueue.push(event);
    this.callbacks.onEvent?.(event);

    // Flush if batch size is reached
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  private startEventFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        this.logger.error('Failed to flush events', error);
      });
    }, this.config.flushInterval);
  }

  private startPageViewTracking(): void {
    // Implementation for automatic page view tracking
    this.logger.debug('Page view tracking started');
  }

  private stopPageViewTracking(): void {
    // Implementation for stopping page view tracking
    this.logger.debug('Page view tracking stopped');
  }

  private startSessionTracking(): void {
    // Implementation for automatic session tracking
    this.logger.debug('Session tracking started');
  }

  private stopSessionTracking(): void {
    // Implementation for stopping session tracking
    this.logger.debug('Session tracking stopped');
  }

  private createError(code: string, error: unknown): AdquimoError {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      code,
      message,
      timestamp: new Date(),
      stack: stack || undefined,
      userId: this.userManager.getCurrentUser()?.id || undefined,
      sessionId: this.sessionManager.getCurrentSession()?.id || undefined,
    };
  }
}
