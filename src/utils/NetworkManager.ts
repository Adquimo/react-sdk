/**
 * Network Manager for Adquimo SDK
 * Handles HTTP requests with retry logic and error handling
 */

import { v4 as uuidv4 } from 'uuid';
import { AdquimoConfig, ApiResponse, BatchRequest, BatchResponse, AdquimoError, RetryConfig } from '../types';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retryConfig?: RetryConfig;
}

export class NetworkManager {
  private config: Required<AdquimoConfig>;
  private baseUrl: string;

  constructor(config: Required<AdquimoConfig>) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Send a batch of events
   */
  async sendBatch(batch: BatchRequest): Promise<ApiResponse<BatchResponse>> {
    const url = `${this.baseUrl}/api/${this.config.apiKey}/events/batch`;
    
    const options: RequestOptions = {
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Request-ID': uuidv4(),
        'X-SDK-Version': '1.0.0',
      },
      body: batch,
      retryConfig: this.config.retryConfig,
    };

    return this.request<BatchResponse>(options);
  }

  /**
   * Send a single event
   */
  async sendEvent(event: unknown): Promise<ApiResponse> {
    const url = `${this.baseUrl}/api/${this.config.apiKey}/events`;
    
    const options: RequestOptions = {
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Request-ID': uuidv4(),
        'X-SDK-Version': '1.0.0',
      },
      body: event,
      retryConfig: this.config.retryConfig,
    };

    return this.request(options);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }): Promise<ApiResponse> {
    const url = `${this.baseUrl}/api/${this.config.apiKey}/analytics`;
    const queryParams = new URLSearchParams();
    
    if (timeRange) {
      queryParams.append('start', timeRange.start.toISOString());
      queryParams.append('end', timeRange.end.toISOString());
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
    
    const options: RequestOptions = {
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Request-ID': uuidv4(),
        'X-SDK-Version': '1.0.0',
      },
      retryConfig: this.config.retryConfig,
    };

    return this.request(options);
  }

  /**
   * Make a generic HTTP request
   */
  async request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    const retryConfig = options.retryConfig || this.config.retryConfig;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(options);
        return this.handleResponse<T>(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryConfig);
        await this.sleep(delay);
      }
    }

    return this.createErrorResponse(lastError || new Error('Unknown error'));
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(options: RequestOptions): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const requestId = response.headers.get('X-Request-ID') || uuidv4();
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: unknown;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      const error: AdquimoError = {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
          statusText: response.statusText,
          response: errorData,
        },
      };

      return {
        success: false,
        error,
        metadata: {
          timestamp: new Date(),
          requestId,
          version: '1.0.0',
        },
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data as T,
      metadata: {
        timestamp: new Date(),
        requestId,
        version: '1.0.0',
      },
    };
  }

  /**
   * Calculate delay for retry attempts
   */
  private calculateDelay(attempt: number, retryConfig: RetryConfig): number {
    const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, retryConfig.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: Error): ApiResponse {
    const adquimoError: AdquimoError = {
      code: 'NETWORK_ERROR',
      message: error.message,
      timestamp: new Date(),
      details: {
        error: error.name,
        stack: error.stack,
      },
    };

    return {
      success: false,
      error: adquimoError,
      metadata: {
        timestamp: new Date(),
        requestId: uuidv4(),
        version: '1.0.0',
      },
    };
  }
}
