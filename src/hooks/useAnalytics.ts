/**
 * useAnalytics Hook for Adquimo SDK
 * Provides React integration for analytics functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdquimoSDK } from '../core/AdquimoSDK';
import { UseAnalyticsOptions, AnalyticsData } from '../types';

export interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getFunnelAnalysis: (funnelName: string, steps: Array<{ name: string; event: string; properties?: Record<string, unknown> }>) => Promise<any>;
  getConversionMetrics: () => Promise<any>;
  getUserBehaviorMetrics: () => Promise<any>;
  getTrafficSources: () => Promise<any>;
  getDeviceAnalytics: () => Promise<any>;
  getGeographicAnalytics: () => Promise<any>;
}

/**
 * Hook for analytics functionality
 */
export function useAnalytics(
  sdk: AdquimoSDK | null,
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const { timeRange, refreshInterval, realTime = false } = options;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    if (!sdk) return;

    setLoading(true);
    setError(null);

    try {
      const analyticsData = await sdk.getAnalytics(timeRange);
      setData(analyticsData as AnalyticsData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [sdk, timeRange]);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Get funnel analysis
  const getFunnelAnalysis = useCallback(async (
    funnelName: string,
    steps: Array<{ name: string; event: string; properties?: Record<string, unknown> }>
  ) => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific funnel analysis method
      // For now, return mock data
      return {
        name: funnelName,
        steps: steps.map((step, index) => ({
          name: step.name,
          order: index + 1,
          conversionRate: Math.random() * 100,
          dropOffRate: Math.random() * 50,
        })),
        totalConversionRate: Math.random() * 100,
        totalDropOffRate: Math.random() * 50,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Get conversion metrics
  const getConversionMetrics = useCallback(async () => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific conversion metrics method
      // For now, return mock data
      return {
        conversionRate: Math.random() * 100,
        totalConversions: Math.floor(Math.random() * 1000),
        conversionValue: Math.random() * 10000,
        costPerConversion: Math.random() * 100,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Get user behavior metrics
  const getUserBehaviorMetrics = useCallback(async () => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific user behavior metrics method
      // For now, return mock data
      return {
        averageSessionDuration: Math.random() * 600000,
        bounceRate: Math.random() * 100,
        pagesPerSession: Math.random() * 10,
        returnVisitorRate: Math.random() * 100,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Get traffic sources
  const getTrafficSources = useCallback(async () => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific traffic sources method
      // For now, return mock data
      return [
        {
          source: 'google',
          medium: 'organic',
          visits: Math.floor(Math.random() * 10000),
          conversions: Math.floor(Math.random() * 1000),
          conversionRate: Math.random() * 100,
        },
        {
          source: 'facebook',
          medium: 'social',
          visits: Math.floor(Math.random() * 5000),
          conversions: Math.floor(Math.random() * 500),
          conversionRate: Math.random() * 100,
        },
      ];
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Get device analytics
  const getDeviceAnalytics = useCallback(async () => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific device analytics method
      // For now, return mock data
      return {
        desktop: {
          visits: Math.floor(Math.random() * 10000),
          conversions: Math.floor(Math.random() * 1000),
          conversionRate: Math.random() * 100,
        },
        mobile: {
          visits: Math.floor(Math.random() * 8000),
          conversions: Math.floor(Math.random() * 800),
          conversionRate: Math.random() * 100,
        },
        tablet: {
          visits: Math.floor(Math.random() * 2000),
          conversions: Math.floor(Math.random() * 200),
          conversionRate: Math.random() * 100,
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Get geographic analytics
  const getGeographicAnalytics = useCallback(async () => {
    if (!sdk) throw new Error('SDK not available');

    try {
      // This would typically call a specific geographic analytics method
      // For now, return mock data
      return [
        {
          country: 'United States',
          region: 'California',
          city: 'San Francisco',
          visits: Math.floor(Math.random() * 5000),
          conversions: Math.floor(Math.random() * 500),
          conversionRate: Math.random() * 100,
        },
        {
          country: 'United Kingdom',
          region: 'England',
          city: 'London',
          visits: Math.floor(Math.random() * 3000),
          conversions: Math.floor(Math.random() * 300),
          conversionRate: Math.random() * 100,
        },
      ];
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [sdk]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    if (realTime && refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [realTime, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    getFunnelAnalysis,
    getConversionMetrics,
    getUserBehaviorMetrics,
    getTrafficSources,
    getDeviceAnalytics,
    getGeographicAnalytics,
  };
}
