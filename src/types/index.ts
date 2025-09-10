/**
 * Core types for Adquimo React SDK
 * Enterprise-grade type definitions for tracking and analytics
 */

// ============================================================================
// CORE SDK TYPES
// ============================================================================

export interface AdquimoConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the Adquimo API */
  baseUrl?: string;
  /** Environment (development, staging, production) */
  environment?: 'development' | 'staging' | 'production';
  /** Enable debug mode for detailed logging */
  debug?: boolean;
  /** Enable automatic page view tracking */
  autoTrackPageViews?: boolean;
  /** Enable automatic user session tracking */
  autoTrackSessions?: boolean;
  /** Custom user properties */
  userProperties?: Record<string, unknown>;
  /** Custom event properties */
  eventProperties?: Record<string, unknown>;
  /** Batch size for sending events */
  batchSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Retry configuration */
  retryConfig?: RetryConfig;
  /** Storage configuration */
  storageConfig?: StorageConfig;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

export interface StorageConfig {
  /** Storage type (localStorage, sessionStorage, memory) */
  type: 'localStorage' | 'sessionStorage' | 'memory';
  /** Storage key prefix */
  keyPrefix: string;
  /** Maximum storage size in bytes */
  maxSize?: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email?: string;
  /** User's name */
  name?: string;
  /** User's phone number */
  phone?: string;
  /** User's avatar URL */
  avatar?: string;
  /** User's company */
  company?: string;
  /** User's role */
  role?: string;
  /** Custom user properties */
  properties?: Record<string, unknown>;
  /** User creation timestamp */
  createdAt: Date;
  /** User last seen timestamp */
  lastSeenAt: Date;
}

export interface UserSession {
  /** Unique session identifier */
  id: string;
  /** User ID associated with this session */
  userId: string;
  /** Session start timestamp */
  startTime: Date;
  /** Session end timestamp */
  endTime?: Date;
  /** Session duration in milliseconds */
  duration?: number;
  /** Session properties */
  properties?: Record<string, unknown>;
  /** Device information */
  device?: DeviceInfo;
  /** Browser information */
  browser?: BrowserInfo;
  /** Location information */
  location?: LocationInfo;
}

// ============================================================================
// TRACKING TYPES
// ============================================================================

export interface Event {
  /** Unique event identifier */
  id: string;
  /** Event name */
  name: string;
  /** Event category */
  category?: string | undefined;
  /** Event action */
  action?: string | undefined;
  /** Event label */
  label?: string | undefined;
  /** Event value */
  value?: number | undefined;
  /** Event properties */
  properties?: Record<string, unknown> | undefined;
  /** User ID associated with the event */
  userId?: string | undefined;
  /** Session ID associated with the event */
  sessionId?: string | undefined;
  /** Event timestamp */
  timestamp: Date;
  /** Event source */
  source?: string | undefined;
  /** Event version */
  version?: string | undefined;
}

export interface PageView {
  /** Unique page view identifier */
  id: string;
  /** Page URL */
  url: string;
  /** Page title */
  title?: string | undefined;
  /** Referrer URL */
  referrer?: string | undefined;
  /** Page properties */
  properties?: Record<string, unknown> | undefined;
  /** User ID associated with the page view */
  userId?: string | undefined;
  /** Session ID associated with the page view */
  sessionId?: string | undefined;
  /** Page view timestamp */
  timestamp: Date;
  /** Time spent on page in milliseconds */
  timeOnPage?: number | undefined;
}

export interface ClickEvent {
  /** Unique click event identifier */
  id: string;
  /** Element that was clicked */
  element: string;
  /** Element selector */
  selector?: string | undefined;
  /** Element text content */
  text?: string | undefined;
  /** Element properties */
  properties?: Record<string, unknown> | undefined;
  /** User ID associated with the click */
  userId?: string | undefined;
  /** Session ID associated with the click */
  sessionId?: string | undefined;
  /** Click timestamp */
  timestamp: Date;
  /** Mouse coordinates */
  coordinates?: {
    x: number;
    y: number;
  } | undefined;
}

// ============================================================================
// DEVICE & BROWSER TYPES
// ============================================================================

export interface DeviceInfo {
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  /** Device model */
  model?: string;
  /** Device manufacturer */
  manufacturer?: string;
  /** Operating system */
  os: string;
  /** Operating system version */
  osVersion: string;
  /** Screen resolution */
  screenResolution?: {
    width: number;
    height: number;
  };
  /** Screen density */
  screenDensity?: number;
  /** Device orientation */
  orientation?: 'portrait' | 'landscape';
}

export interface BrowserInfo {
  /** Browser name */
  name: string;
  /** Browser version */
  version: string;
  /** User agent string */
  userAgent: string;
  /** Language */
  language: string;
  /** Timezone */
  timezone: string;
  /** Viewport size */
  viewport?: {
    width: number;
    height: number;
  };
  /** Color depth */
  colorDepth?: number;
  /** Cookie enabled */
  cookieEnabled: boolean;
  /** JavaScript enabled */
  javascriptEnabled: boolean;
}

export interface LocationInfo {
  /** Country code */
  country?: string;
  /** Region/State */
  region?: string;
  /** City */
  city?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** IP address */
  ipAddress?: string;
  /** ISP */
  isp?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsData {
  /** Total events tracked */
  totalEvents: number;
  /** Total page views */
  totalPageViews: number;
  /** Total users */
  totalUsers: number;
  /** Total sessions */
  totalSessions: number;
  /** Average session duration */
  averageSessionDuration: number;
  /** Bounce rate */
  bounceRate: number;
  /** Conversion rate */
  conversionRate: number;
  /** Top events */
  topEvents: Array<{
    name: string;
    count: number;
  }>;
  /** Top pages */
  topPages: Array<{
    url: string;
    views: number;
  }>;
}

export interface FunnelStep {
  /** Step name */
  name: string;
  /** Step order */
  order: number;
  /** Step properties */
  properties?: Record<string, unknown> | undefined;
  /** Conversion rate to next step */
  conversionRate?: number | undefined;
  /** Drop-off rate */
  dropOffRate?: number | undefined;
}

export interface Funnel {
  /** Funnel name */
  name: string;
  /** Funnel steps */
  steps: FunnelStep[];
  /** Total conversion rate */
  totalConversionRate: number;
  /** Total drop-off rate */
  totalDropOffRate: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AdquimoError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: Record<string, unknown> | undefined;
  /** Error timestamp */
  timestamp: Date;
  /** Error stack trace */
  stack?: string | undefined;
  /** User ID associated with the error */
  userId?: string | undefined;
  /** Session ID associated with the error */
  sessionId?: string | undefined;
}

export interface ValidationError extends AdquimoError {
  code: 'VALIDATION_ERROR';
  /** Field that failed validation */
  field: string;
  /** Validation rule that failed */
  rule: string;
  /** Expected value */
  expected?: unknown;
  /** Actual value */
  actual?: unknown;
}

export interface NetworkError extends AdquimoError {
  code: 'NETWORK_ERROR';
  /** HTTP status code */
  statusCode?: number;
  /** Request URL */
  url?: string;
  /** Request method */
  method?: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseTrackingOptions {
  /** Enable automatic tracking */
  enabled?: boolean;
  /** Custom event properties */
  properties?: Record<string, unknown>;
  /** Event debounce delay in milliseconds */
  debounceDelay?: number;
}

export interface UseAnalyticsOptions {
  /** Time range for analytics data */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Analytics data refresh interval */
  refreshInterval?: number;
  /** Enable real-time updates */
  realTime?: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  /** Response success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information */
  error?: AdquimoError;
  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface BatchRequest {
  /** Batch identifier */
  id: string;
  /** Events in the batch */
  events: Event[];
  /** Batch timestamp */
  timestamp: Date;
  /** Batch size */
  size: number;
}

export interface BatchResponse {
  /** Batch identifier */
  id: string;
  /** Processing status */
  status: 'success' | 'partial' | 'failed';
  /** Processed events count */
  processedCount: number;
  /** Failed events count */
  failedCount: number;
  /** Error details for failed events */
  errors?: AdquimoError[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EventName = string;
export type EventCategory = string;
export type EventAction = string;
export type EventLabel = string;
export type UserId = string;
export type SessionId = string;
export type EventId = string;

export type EventProperties = Record<string, unknown>;
export type UserProperties = Record<string, unknown>;
export type SessionProperties = Record<string, unknown>;

export type TrackingCallback = (event: Event) => void;
export type ErrorCallback = (error: AdquimoError) => void;
export type SuccessCallback = (data: unknown) => void;

// ============================================================================
// INTERFACE OPTIONS
// ============================================================================

export interface CreateEventOptions {
  name: string;
  properties?: Record<string, unknown> | undefined;
  category?: string | undefined;
  action?: string | undefined;
  label?: string | undefined;
  value?: number | undefined;
}

export interface CreatePageViewOptions {
  url: string;
  title?: string | undefined;
  referrer?: string | undefined;
  properties?: Record<string, unknown> | undefined;
}

export interface CreateClickEventOptions {
  element: string;
  selector?: string | undefined;
  text?: string | undefined;
  properties?: Record<string, unknown> | undefined;
}

export interface AnalyticsOptions {
  timeRange?: {
    start: Date;
    end: Date;
  } | undefined;
  metrics?: string[] | undefined;
  dimensions?: string[] | undefined;
  filters?: Record<string, unknown> | undefined;
  groupBy?: string[] | undefined;
  orderBy?: string | undefined;
  limit?: number | undefined;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ADQUIMO_CONSTANTS = {
  VERSION: '1.0.0',
  API_VERSION: 'v1',
  DEFAULT_BASE_URL: 'https://api.adquimo.com',
  DEFAULT_BATCH_SIZE: 50,
  DEFAULT_FLUSH_INTERVAL: 10000, // 10 seconds
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000, // 1 second
  MAX_EVENT_PROPERTIES: 100,
  MAX_USER_PROPERTIES: 50,
  MAX_SESSION_PROPERTIES: 25,
  STORAGE_KEYS: {
    USER_ID: 'adquimo_user_id',
    SESSION_ID: 'adquimo_session_id',
    EVENTS: 'adquimo_events',
    USER_PROPERTIES: 'adquimo_user_properties',
    SESSION_PROPERTIES: 'adquimo_session_properties',
  },
  EVENT_TYPES: {
    PAGE_VIEW: 'page_view',
    CLICK: 'click',
    CUSTOM: 'custom',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    USER_IDENTIFY: 'user_identify',
    USER_ALIAS: 'user_alias',
    USER_RESET: 'user_reset',
  },
} as const;

export type AdquimoEventType = typeof ADQUIMO_CONSTANTS.EVENT_TYPES[keyof typeof ADQUIMO_CONSTANTS.EVENT_TYPES];
