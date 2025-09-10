/**
 * Storage Manager for Adquimo SDK
 * Handles data persistence across different storage types
 */

import { StorageConfig, AdquimoError } from '../types';

export interface StorageItem {
  key: string;
  value: unknown;
  timestamp: Date;
  ttl?: number | undefined; // Time to live in milliseconds
}

export class StorageManager {
  private config: Required<StorageConfig>;
  private storage: Storage | Map<string, string>;
  private isLocalStorage: boolean;

  constructor(config: Required<StorageConfig>) {
    this.config = config;
    this.isLocalStorage = config.type === 'localStorage' || config.type === 'sessionStorage';

    if (this.isLocalStorage) {
      this.storage = config.type === 'localStorage' ? localStorage : sessionStorage;
    } else {
      this.storage = new Map<string, string>();
    }
  }

  /**
   * Initialize storage manager
   */
  async initialize(): Promise<void> {
    try {
      // Test storage availability
      await this.testStorage();
    } catch (error) {
      throw this.createError('STORAGE_INIT_ERROR', error);
    }
  }

  /**
   * Set a value in storage
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const item: StorageItem = {
        key: fullKey,
        value,
        timestamp: new Date(),
        ttl: ttl || undefined,
      };

      const serializedValue = JSON.stringify(item);

      // Check storage size limit
      if (this.config.maxSize && serializedValue.length > this.config.maxSize) {
        throw new Error('Value exceeds maximum storage size');
      }

      if (this.isLocalStorage) {
        (this.storage as Storage).setItem(fullKey, serializedValue);
      } else {
        (this.storage as Map<string, string>).set(fullKey, serializedValue);
      }
    } catch (error) {
      throw this.createError('STORAGE_SET_ERROR', error);
    }
  }

  /**
   * Get a value from storage
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const serializedValue = this.isLocalStorage
        ? (this.storage as Storage).getItem(fullKey)
        : (this.storage as Map<string, string>).get(fullKey) || null;

      if (!serializedValue) {
        return null;
      }

      const item: StorageItem = JSON.parse(serializedValue);

      // Check TTL
      if (item.ttl && Date.now() - item.timestamp.getTime() > item.ttl) {
        await this.remove(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      throw this.createError('STORAGE_GET_ERROR', error);
    }
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      if (this.isLocalStorage) {
        (this.storage as Storage).removeItem(fullKey);
      } else {
        (this.storage as Map<string, string>).delete(fullKey);
      }
    } catch (error) {
      throw this.createError('STORAGE_REMOVE_ERROR', error);
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      if (this.isLocalStorage) {
        const keys = Object.keys(this.storage);
        keys.forEach(key => {
          if (key.startsWith(this.config.keyPrefix)) {
            if (this.isLocalStorage) {
              (this.storage as Storage).removeItem(key);
            } else {
              (this.storage as Map<string, string>).delete(key);
            }
          }
        });
      } else {
        (this.storage as Map<string, string>).clear();
      }
    } catch (error) {
      throw this.createError('STORAGE_CLEAR_ERROR', error);
    }
  }

  /**
   * Get all keys with the configured prefix
   */
  async getKeys(): Promise<string[]> {
    try {
      if (this.isLocalStorage) {
        const keys = Object.keys(this.storage);
        return keys
          .filter(key => key.startsWith(this.config.keyPrefix))
          .map(key => key.substring(this.config.keyPrefix.length));
      } else {
        return Array.from((this.storage as Map<string, string>).keys())
          .filter(key => key.startsWith(this.config.keyPrefix))
          .map(key => key.substring(this.config.keyPrefix.length));
      }
    } catch (error) {
      throw this.createError('STORAGE_KEYS_ERROR', error);
    }
  }

  /**
   * Get storage size in bytes
   */
  async getSize(): Promise<number> {
    try {
      if (this.isLocalStorage) {
        let size = 0;
        const keys = Object.keys(this.storage);
        keys.forEach(key => {
          if (key.startsWith(this.config.keyPrefix)) {
            const value = (this.storage as Storage).getItem(key);
            if (value) {
              size += key.length + value.length;
            }
          }
        });
        return size;
      } else {
        let size = 0;
        (this.storage as Map<string, string>).forEach((value, key) => {
          if (key.startsWith(this.config.keyPrefix)) {
            size += key.length + value.length;
          }
        });
        return size;
      }
    } catch (error) {
      throw this.createError('STORAGE_SIZE_ERROR', error);
    }
  }

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.getKeys();
      const now = Date.now();

      for (const key of keys) {
        const fullKey = this.getFullKey(key);
        const serializedValue = this.isLocalStorage
          ? (this.storage as Storage).getItem(fullKey)
          : (this.storage as Map<string, string>).get(fullKey) || null;

        if (serializedValue) {
          const item: StorageItem = JSON.parse(serializedValue);

          if (item.ttl && now - item.timestamp.getTime() > item.ttl) {
            await this.remove(key);
          }
        }
      }
    } catch (error) {
      throw this.createError('STORAGE_CLEANUP_ERROR', error);
    }
  }

  /**
   * Test storage availability
   */
  private async testStorage(): Promise<void> {
    try {
      const testKey = this.getFullKey('test');
      const testValue = 'test';

      if (this.isLocalStorage) {
        (this.storage as Storage).setItem(testKey, testValue);
        const retrievedValue = (this.storage as Storage).getItem(testKey);

        if (retrievedValue !== testValue) {
          throw new Error('Storage test failed');
        }

        (this.storage as Storage).removeItem(testKey);
      } else {
        (this.storage as Map<string, string>).set(testKey, testValue);
        const retrievedValue = (this.storage as Map<string, string>).get(testKey);

        if (retrievedValue !== testValue) {
          throw new Error('Storage test failed');
        }

        (this.storage as Map<string, string>).delete(testKey);
      }
    } catch (error) {
      throw new Error(`Storage not available: ${error}`);
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Create storage error
   */
  private createError(code: string, error: unknown): AdquimoError {
    const message = error instanceof Error ? error.message : String(error);

    return {
      code,
      message,
      timestamp: new Date(),
      details: {
        storageType: this.config.type,
        keyPrefix: this.config.keyPrefix,
      },
    };
  }
}
