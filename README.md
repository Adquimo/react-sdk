# Adquimo React SDK

[![npm version](https://badge.fury.io/js/%40adquimo%2Freact-sdk.svg)](https://badge.fury.io/js/%40adquimo%2Freact-sdk)
[![Build Status](https://github.com/adquimo/react-sdk/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/adquimo/react-sdk/actions)
[![Coverage Status](https://codecov.io/gh/adquimo/react-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/adquimo/react-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise-grade tracking and analytics SDK for React applications. Built with TypeScript for type safety and scalability.

## Features

- 🚀 **High Performance** - Optimized for minimal impact on your application
- 🔒 **Type Safe** - Full TypeScript support with comprehensive type definitions
- 📊 **Rich Analytics** - Track events, page views, user behavior, and conversions
- 👤 **User Management** - Identify users, manage sessions, and track user journeys
- 🎯 **Event Tracking** - Custom events, clicks, form submissions, and more
- 📱 **React Integration** - Hooks and components for seamless React integration
- 🛡️ **Enterprise Ready** - Built for scalability, reliability, and long-term maintenance
- 🔧 **Configurable** - Extensive configuration options for different environments
- 📈 **Real-time Analytics** - Get insights as they happen
- 🧪 **Well Tested** - Comprehensive test coverage and CI/CD pipeline

## Installation

```bash
npm install @adquimo/react-sdk
```

or

```bash
yarn add @adquimo/react-sdk
```

## Quick Start

### 1. Basic Setup

```typescript
import React from 'react';
import { AdquimoProvider, AdquimoTracker } from '@adquimo/react-sdk';

function App() {
  return (
    <AdquimoProvider
      config={{
        apiKey: 'your-api-key',
        environment: 'production',
        debug: false,
      }}
    >
      <AdquimoTracker>
        <YourApp />
      </AdquimoTracker>
    </AdquimoProvider>
  );
}
```

### 2. Using Hooks

```typescript
import React from 'react';
import { useTracking, useAnalytics } from '@adquimo/react-sdk';

function MyComponent() {
  const { track, trackPageView, identify } = useTracking();
  const { data: analytics, loading } = useAnalytics();

  const handleClick = () => {
    track('button_clicked', { button: 'cta' });
  };

  const handleUserLogin = (userId: string) => {
    identify(userId, { plan: 'premium' });
  };

  return (
    <div>
      <button onClick={handleClick}>Track Click</button>
      {loading ? <div>Loading analytics...</div> : <div>Events: {analytics?.totalEvents}</div>}
    </div>
  );
}
```

### 3. Direct SDK Usage

```typescript
import { AdquimoSDK } from '@adquimo/react-sdk';

const sdk = new AdquimoSDK({
  apiKey: 'your-api-key',
  environment: 'production',
  debug: false,
});

// Initialize
await sdk.initialize();

// Track events
await sdk.track('purchase', { 
  value: 99.99, 
  currency: 'USD',
  product: 'premium-plan' 
});

// Identify users
await sdk.identify('user-123', {
  name: 'John Doe',
  email: 'john@example.com',
  plan: 'premium'
});

// Track page views
await sdk.trackPageView('https://example.com/products', 'Products Page');
```

## Configuration

### Basic Configuration

```typescript
interface AdquimoConfig {
  apiKey: string;                    // Required: Your Adquimo API key
  baseUrl?: string;                  // Optional: API base URL
  environment?: 'development' | 'staging' | 'production';
  debug?: boolean;                   // Enable debug logging
  autoTrackPageViews?: boolean;      // Auto-track page views
  autoTrackSessions?: boolean;       // Auto-track user sessions
  userProperties?: Record<string, unknown>;
  eventProperties?: Record<string, unknown>;
  batchSize?: number;                // Events per batch
  flushInterval?: number;            // Flush interval in ms
  retryConfig?: RetryConfig;         // Retry configuration
  storageConfig?: StorageConfig;     // Storage configuration
}
```

### Advanced Configuration

```typescript
const config: AdquimoConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.adquimo.com',
  environment: 'production',
  debug: false,
  autoTrackPageViews: true,
  autoTrackSessions: true,
  userProperties: {
    appVersion: '1.0.0',
    platform: 'web',
  },
  eventProperties: {
    source: 'react-app',
  },
  batchSize: 50,
  flushInterval: 10000,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  storageConfig: {
    type: 'localStorage',
    keyPrefix: 'adquimo_',
    maxSize: 1024 * 1024, // 1MB
  },
};
```

## API Reference

### Core SDK

#### `AdquimoSDK`

Main SDK class for tracking and analytics.

```typescript
const sdk = new AdquimoSDK(config);
await sdk.initialize();
```

#### Methods

- `track(name, properties?, category?, action?, label?, value?)` - Track custom events
- `trackPageView(url, title?, referrer?, properties?)` - Track page views
- `trackClick(element, selector?, text?, properties?)` - Track click events
- `identify(userId, properties?)` - Identify users
- `alias(anonymousId, userId)` - Alias anonymous users
- `reset()` - Reset user data
- `flush()` - Flush pending events
- `destroy()` - Destroy SDK instance

### React Hooks

#### `useTracking(sdk, options?)`

Hook for tracking functionality.

```typescript
const { track, trackPageView, trackClick, identify, alias, reset } = useTracking(sdk, {
  enabled: true,
  properties: {},
  debounceDelay: 0,
});
```

#### `useAnalytics(sdk, options?)`

Hook for analytics functionality.

```typescript
const { data, loading, error, refresh } = useAnalytics(sdk, {
  timeRange: { start: new Date(), end: new Date() },
  refreshInterval: 30000,
  realTime: true,
});
```

### React Components

#### `AdquimoProvider`

Context provider for the SDK.

```typescript
<AdquimoProvider
  config={config}
  onError={(error) => console.error(error)}
  onSuccess={(message) => console.log(message)}
>
  {children}
</AdquimoProvider>
```

#### `AdquimoTracker`

Automatic tracking component.

```typescript
<AdquimoTracker
  trackPageViews={true}
  trackClicks={true}
  trackScrolls={false}
  trackFormSubmissions={true}
  pageViewProperties={{}}
  clickProperties={{}}
  scrollThreshold={50}
  debounceDelay={0}
>
  {children}
</AdquimoTracker>
```

## Event Types

### Custom Events

```typescript
// Basic event
await sdk.track('button_clicked');

// Event with properties
await sdk.track('purchase', {
  value: 99.99,
  currency: 'USD',
  product: 'premium-plan',
  quantity: 1,
});

// Event with category and action
await sdk.track('video_play', { videoId: 'abc123' }, 'video', 'play');
```

### Page Views

```typescript
await sdk.trackPageView(
  'https://example.com/products',
  'Products Page',
  'https://google.com',
  { section: 'ecommerce' }
);
```

### Click Events

```typescript
await sdk.trackClick(
  'button',
  '#cta-button',
  'Get Started',
  { position: 'header' }
);
```

## User Management

### Identify Users

```typescript
await sdk.identify('user-123', {
  name: 'John Doe',
  email: 'john@example.com',
  plan: 'premium',
  company: 'Acme Corp',
  role: 'admin',
});
```

### Alias Users

```typescript
// Link anonymous user to identified user
await sdk.alias('anonymous-456', 'user-123');
```

### Reset User Data

```typescript
await sdk.reset();
```

## Analytics

### Get Analytics Data

```typescript
const analytics = await sdk.getAnalytics({
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  },
});

console.log(analytics.totalEvents);
console.log(analytics.totalUsers);
console.log(analytics.conversionRate);
```

### Real-time Analytics

```typescript
const { data, loading, refresh } = useAnalytics(sdk, {
  realTime: true,
  refreshInterval: 30000, // 30 seconds
});
```

## Error Handling

```typescript
const sdk = new AdquimoSDK(config);

sdk.setCallbacks({
  onError: (error) => {
    console.error('Adquimo Error:', error);
    // Handle error (e.g., send to error tracking service)
  },
  onSuccess: (message) => {
    console.log('Adquimo Success:', message);
  },
});

await sdk.initialize();
```

## TypeScript Support

The SDK is built with TypeScript and provides comprehensive type definitions:

```typescript
import { 
  AdquimoConfig, 
  Event, 
  User, 
  UserSession, 
  AnalyticsData 
} from '@adquimo/react-sdk';

const config: AdquimoConfig = {
  apiKey: 'your-api-key',
  // ... other config
};

const event: Event = {
  id: 'event-123',
  name: 'purchase',
  properties: { value: 99.99 },
  timestamp: new Date(),
  // ... other properties
};
```

## Development

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/adquimo/react-sdk.git
cd react-sdk

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build the package
npm run build
```

### Scripts

- `npm run build` - Build the package
- `npm run dev` - Build in watch mode
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@adquimo.com
- 📚 Documentation: https://docs.adquimo.com
- 🐛 Issues: https://github.com/adquimo/react-sdk/issues
- 💬 Discussions: https://github.com/adquimo/react-sdk/discussions

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

Made with ❤️ by the Adquimo team
