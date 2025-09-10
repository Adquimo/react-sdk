/**
 * useTracking Hook for Adquimo SDK
 * Provides React integration for tracking functionality
 */

import { useCallback, useRef, useEffect } from 'react';
import { AdquimoSDK } from '../core/AdquimoSDK';
import { UseTrackingOptions, ErrorCallback } from '../types';

export interface UseTrackingReturn {
  track: (name: string, properties?: Record<string, unknown>) => Promise<void>;
  trackPageView: (url: string, title?: string, referrer?: string, properties?: Record<string, unknown>) => Promise<void>;
  trackClick: (element: string, selector?: string, text?: string, properties?: Record<string, unknown>) => Promise<void>;
  identify: (userId: string, properties?: Record<string, unknown>) => Promise<void>;
  alias: (anonymousId: string, userId: string) => Promise<void>;
  reset: () => Promise<void>;
  isReady: boolean;
  error: Error | null;
}

/**
 * Hook for tracking functionality
 */
export function useTracking(
  sdk: AdquimoSDK | null,
  options: UseTrackingOptions = {},
): UseTrackingReturn {
  const { enabled = true, properties = {}, debounceDelay = 0 } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorRef = useRef<Error | null>(null);

  // Set up callbacks
  useEffect(() => {
    if (!sdk) return;

    const onError: ErrorCallback = (error) => {
      errorRef.current = error;
    };

    sdk.setCallbacks({ onError });

    return () => {
      sdk.setCallbacks({});
    };
  }, [sdk]);

  // Track event with debouncing
  const track = useCallback(async(
    name: string,
    eventProperties?: Record<string, unknown>,
  ) => {
    if (!sdk || !enabled) return;

    const debouncedTrack = () => {
      const mergedProperties = { ...properties, ...eventProperties };
      sdk.track(name, mergedProperties).catch((error) => {
        errorRef.current = error;
      });
    };

    if (debounceDelay > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(debouncedTrack, debounceDelay);
    } else {
      debouncedTrack();
    }
  }, [sdk, enabled, properties, debounceDelay]);

  // Track page view
  const trackPageView = useCallback(async(
    url: string,
    title?: string,
    referrer?: string,
    eventProperties?: Record<string, unknown>,
  ) => {
    if (!sdk || !enabled) return;

    try {
      const mergedProperties = { ...properties, ...eventProperties };
      await sdk.trackPageView(url, title, referrer, mergedProperties);
    } catch (error) {
      errorRef.current = error instanceof Error ? error : new Error(String(error));
    }
  }, [sdk, enabled, properties]);

  // Track click event
  const trackClick = useCallback(async(
    element: string,
    selector?: string,
    text?: string,
    eventProperties?: Record<string, unknown>,
  ) => {
    if (!sdk || !enabled) return;

    try {
      const mergedProperties = { ...properties, ...eventProperties };
      await sdk.trackClick(element, selector, text, mergedProperties);
    } catch (error) {
      errorRef.current = error instanceof Error ? error : new Error(String(error));
    }
  }, [sdk, enabled, properties]);

  // Identify user
  const identify = useCallback(async(
    userId: string,
    userProperties?: Record<string, unknown>,
  ) => {
    if (!sdk || !enabled) return;

    try {
      await sdk.identify(userId, userProperties);
    } catch (error) {
      errorRef.current = error instanceof Error ? error : new Error(String(error));
    }
  }, [sdk, enabled]);

  // Alias user
  const alias = useCallback(async(
    anonymousId: string,
    userId: string,
  ) => {
    if (!sdk || !enabled) return;

    try {
      await sdk.alias(anonymousId, userId);
    } catch (error) {
      errorRef.current = error instanceof Error ? error : new Error(String(error));
    }
  }, [sdk, enabled]);

  // Reset user data
  const reset = useCallback(async() => {
    if (!sdk || !enabled) return;

    try {
      await sdk.reset();
    } catch (error) {
      errorRef.current = error instanceof Error ? error : new Error(String(error));
    }
  }, [sdk, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    track,
    trackPageView,
    trackClick,
    identify,
    alias,
    reset,
    isReady: sdk !== null,
    error: errorRef.current,
  };
}
