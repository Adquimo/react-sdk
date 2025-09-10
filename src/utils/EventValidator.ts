/**
 * Event Validator for Adquimo SDK
 * Validates events before sending to ensure data quality
 */

import { Event, AdquimoError, ADQUIMO_CONSTANTS } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: AdquimoError[];
}

export class EventValidator {
  /**
   * Validate an event
   */
  validate(event: Event): ValidationResult {
    const errors: AdquimoError[] = [];

    // Validate required fields
    if (!event.id || typeof event.id !== 'string' || event.id.trim() === '') {
      errors.push(this.createValidationError('id', 'required', 'Event ID is required', event.id));
    }

    if (!event.name || typeof event.name !== 'string' || event.name.trim() === '') {
      errors.push(this.createValidationError('name', 'required', 'Event name is required', event.name));
    }

    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      errors.push(this.createValidationError('timestamp', 'required', 'Event timestamp is required', event.timestamp));
    }

    // Validate event name format
    if (event.name && !this.isValidEventName(event.name)) {
      errors.push(this.createValidationError('name', 'format', 'Event name must be alphanumeric with underscores and hyphens', event.name));
    }

    // Validate properties
    if (event.properties) {
      const propertyErrors = this.validateProperties(event.properties, 'properties');
      errors.push(...propertyErrors);
    }

    // Validate category
    if (event.category && !this.isValidEventName(event.category)) {
      errors.push(this.createValidationError('category', 'format', 'Event category must be alphanumeric with underscores and hyphens', event.category));
    }

    // Validate action
    if (event.action && !this.isValidEventName(event.action)) {
      errors.push(this.createValidationError('action', 'format', 'Event action must be alphanumeric with underscores and hyphens', event.action));
    }

    // Validate label
    if (event.label && typeof event.label !== 'string') {
      errors.push(this.createValidationError('label', 'type', 'Event label must be a string', event.label));
    }

    // Validate value
    if (event.value !== undefined && (typeof event.value !== 'number' || isNaN(event.value))) {
      errors.push(this.createValidationError('value', 'type', 'Event value must be a number', event.value));
    }

    // Validate user ID
    if (event.userId && !this.isValidUserId(event.userId)) {
      errors.push(this.createValidationError('userId', 'format', 'User ID must be a valid string', event.userId));
    }

    // Validate session ID
    if (event.sessionId && !this.isValidSessionId(event.sessionId)) {
      errors.push(this.createValidationError('sessionId', 'format', 'Session ID must be a valid string', event.sessionId));
    }

    // Validate source
    if (event.source && !this.isValidEventName(event.source)) {
      errors.push(this.createValidationError('source', 'format', 'Event source must be alphanumeric with underscores and hyphens', event.source));
    }

    // Validate version
    if (event.version && !this.isValidVersion(event.version)) {
      errors.push(this.createValidationError('version', 'format', 'Event version must be a valid semantic version', event.version));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate event properties
   */
  private validateProperties(properties: Record<string, unknown>, fieldName: string): AdquimoError[] {
    const errors: AdquimoError[] = [];

    // Check property count limit
    const propertyCount = Object.keys(properties).length;
    if (propertyCount > ADQUIMO_CONSTANTS.MAX_EVENT_PROPERTIES) {
      errors.push(this.createValidationError(
        fieldName,
        'limit',
        `Properties exceed maximum limit of ${ADQUIMO_CONSTANTS.MAX_EVENT_PROPERTIES}`,
        propertyCount,
        ADQUIMO_CONSTANTS.MAX_EVENT_PROPERTIES,
      ));
    }

    // Validate each property
    for (const [key, value] of Object.entries(properties)) {
      // Validate property key
      if (!this.isValidPropertyKey(key)) {
        errors.push(this.createValidationError(
          `${fieldName}.${key}`,
          'format',
          'Property key must be alphanumeric with underscores and hyphens',
          key,
        ));
      }

      // Validate property value
      if (!this.isValidPropertyValue(value)) {
        errors.push(this.createValidationError(
          `${fieldName}.${key}`,
          'type',
          'Property value must be a string, number, boolean, or null',
          value,
        ));
      }
    }

    return errors;
  }

  /**
   * Check if event name is valid
   */
  private isValidEventName(name: string): boolean {
    // Event names should be alphanumeric with underscores and hyphens
    return /^[a-zA-Z0-9_-]+$/.test(name);
  }

  /**
   * Check if property key is valid
   */
  private isValidPropertyKey(key: string): boolean {
    // Property keys should be alphanumeric with underscores and hyphens
    return /^[a-zA-Z0-9_-]+$/.test(key);
  }

  /**
   * Check if property value is valid
   */
  private isValidPropertyValue(value: unknown): boolean {
    // Allow strings, numbers, booleans, and null
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    );
  }

  /**
   * Check if user ID is valid
   */
  private isValidUserId(userId: string): boolean {
    return typeof userId === 'string' && userId.trim().length > 0;
  }

  /**
   * Check if session ID is valid
   */
  private isValidSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.trim().length > 0;
  }

  /**
   * Check if version is valid
   */
  private isValidVersion(version: string): boolean {
    // Basic semantic version validation
    return /^\d+\.\d+\.\d+/.test(version);
  }

  /**
   * Create validation error
   */
  private createValidationError(
    field: string,
    rule: string,
    message: string,
    actual?: unknown,
    expected?: unknown,
  ): AdquimoError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      timestamp: new Date(),
      details: {
        field,
        rule,
        actual,
        expected,
      },
    };
  }
}
