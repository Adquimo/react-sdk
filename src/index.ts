/**
 * Adquimo React SDK - Main Entry Point
 * Enterprise-grade tracking and analytics SDK for React applications
 */

// Core SDK
export { AdquimoSDK } from './core/AdquimoSDK';

// Types
export * from './types';

// Hooks
export { useTracking } from './hooks/useTracking';
export { useAnalytics } from './hooks/useAnalytics';

// Components
export { AdquimoProvider } from './components/AdquimoProvider';
export { AdquimoTracker } from './components/AdquimoTracker';

// Utilities
export { Logger } from './utils/Logger';
export { StorageManager } from './utils/StorageManager';
export { NetworkManager } from './utils/NetworkManager';
export { EventValidator } from './utils/EventValidator';

// Managers
export { UserManager } from './user/UserManager';
export { SessionManager } from './user/SessionManager';
export { TrackingManager } from './tracking/TrackingManager';
export { AnalyticsManager } from './analytics/AnalyticsManager';

// Constants
export { ADQUIMO_CONSTANTS } from './types';

// Default export
export { AdquimoSDK as default } from './core/AdquimoSDK';
