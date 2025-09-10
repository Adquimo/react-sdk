/**
 * Unit tests for AdquimoSDK
 */

import { AdquimoSDK } from '../../core/AdquimoSDK';
import { AdquimoConfig } from '../../types';

// Mock dependencies
jest.mock('../../utils/StorageManager');
jest.mock('../../utils/NetworkManager');
jest.mock('../../utils/EventValidator');
jest.mock('../../user/UserManager');
jest.mock('../../user/SessionManager');
jest.mock('../../tracking/TrackingManager');
jest.mock('../../analytics/AnalyticsManager');

describe('AdquimoSDK', () => {
  let sdk: AdquimoSDK;
  let config: AdquimoConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      debug: true,
    };
    sdk = new AdquimoSDK(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create SDK instance with default config', () => {
      expect(sdk).toBeInstanceOf(AdquimoSDK);
    });

    it('should merge config with defaults', () => {
      const customConfig: AdquimoConfig = {
        apiKey: 'custom-api-key',
        baseUrl: 'https://custom.api.com',
        environment: 'development',
        debug: false,
        autoTrackPageViews: false,
        autoTrackSessions: false,
        batchSize: 100,
        flushInterval: 5000,
      };

      const customSDK = new AdquimoSDK(customConfig);
      expect(customSDK).toBeInstanceOf(AdquimoSDK);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(sdk.initialize()).resolves.not.toThrow();
    });

    it('should set up callbacks', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      
      sdk.setCallbacks({ onSuccess, onError });
      await sdk.initialize();
      
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('track', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should track event successfully', async () => {
      await expect(sdk.track('test-event', { test: 'value' })).resolves.not.toThrow();
    });

    it('should throw error if SDK not initialized', async () => {
      const uninitializedSDK = new AdquimoSDK(config);
      await expect(uninitializedSDK.track('test-event')).rejects.toThrow('SDK must be initialized');
    });
  });

  describe('trackPageView', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should track page view successfully', async () => {
      await expect(sdk.trackPageView('https://example.com', 'Test Page')).resolves.not.toThrow();
    });
  });

  describe('trackClick', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should track click successfully', async () => {
      await expect(sdk.trackClick('button', '#test-button')).resolves.not.toThrow();
    });
  });

  describe('identify', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should identify user successfully', async () => {
      await expect(sdk.identify('user-123', { name: 'Test User' })).resolves.not.toThrow();
    });
  });

  describe('alias', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should alias user successfully', async () => {
      await expect(sdk.alias('anonymous-123', 'user-123')).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should reset user data successfully', async () => {
      await expect(sdk.reset()).resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should return current user', () => {
      const user = sdk.getCurrentUser();
      expect(user).toBeDefined();
    });
  });

  describe('getCurrentSession', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should return current session', () => {
      const session = sdk.getCurrentSession();
      expect(session).toBeDefined();
    });
  });

  describe('flush', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should flush events successfully', async () => {
      await expect(sdk.flush()).resolves.not.toThrow();
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await sdk.initialize();
    });

    it('should destroy SDK successfully', async () => {
      await expect(sdk.destroy()).resolves.not.toThrow();
    });
  });
});
