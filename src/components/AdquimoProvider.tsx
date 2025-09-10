/**
 * AdquimoProvider Component
 * React context provider for Adquimo SDK
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AdquimoSDK, AdquimoConfig } from '../types';

interface AdquimoContextValue {
  sdk: AdquimoSDK | null;
  isInitialized: boolean;
  error: Error | null;
}

const AdquimoContext = createContext<AdquimoContextValue | null>(null);

export interface AdquimoProviderProps {
  config: AdquimoConfig;
  children: ReactNode;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

/**
 * AdquimoProvider component
 * Provides Adquimo SDK context to child components
 */
export function AdquimoProvider({
  config,
  children,
  onError,
  onSuccess,
}: AdquimoProviderProps): JSX.Element {
  const [sdk, setSdk] = useState<AdquimoSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSDK = async() => {
      try {
        const adquimoSDK = new AdquimoSDK(config);

        // Set up callbacks
        adquimoSDK.setCallbacks({
          onError: (error) => {
            if (mounted) {
              setError(error);
              onError?.(error);
            }
          },
          onSuccess: (message) => {
            if (mounted) {
              onSuccess?.(message);
            }
          },
        });

        await adquimoSDK.initialize();

        if (mounted) {
          setSdk(adquimoSDK);
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
        }
      }
    };

    initializeSDK();

    return () => {
      mounted = false;
      if (sdk) {
        sdk.destroy().catch(console.error);
      }
    };
  }, [config, onError, onSuccess]);

  const contextValue: AdquimoContextValue = {
    sdk,
    isInitialized,
    error,
  };

  return (
    <AdquimoContext.Provider value={contextValue}>
      {children}
    </AdquimoContext.Provider>
  );
}

/**
 * Hook to use Adquimo context
 */
export function useAdquimo(): AdquimoContextValue {
  const context = useContext(AdquimoContext);

  if (!context) {
    throw new Error('useAdquimo must be used within an AdquimoProvider');
  }

  return context;
}
