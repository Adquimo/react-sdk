/**
 * Basic Usage Example for Adquimo React SDK
 */

import React, { useState } from 'react';
import { AdquimoProvider, AdquimoTracker, useTracking, useAnalytics } from '@adquimo/react-sdk';

// Example component using the tracking hook
function TrackingExample() {
  const { track, trackPageView, identify } = useTracking();
  const { data: analytics, loading } = useAnalytics();
  const [userId, setUserId] = useState('');

  const handleButtonClick = () => {
    track('button_clicked', { 
      button: 'example-button',
      timestamp: new Date().toISOString() 
    });
  };

  const handleUserLogin = () => {
    if (userId) {
      identify(userId, { 
        loginMethod: 'email',
        timestamp: new Date().toISOString() 
      });
    }
  };

  const handlePageView = () => {
    trackPageView(
      window.location.href,
      document.title,
      document.referrer,
      { section: 'example' }
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Adquimo SDK Example</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>User Identification</h2>
        <input
          type="text"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleUserLogin} style={{ padding: '5px 10px' }}>
          Identify User
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Event Tracking</h2>
        <button onClick={handleButtonClick} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Track Button Click
        </button>
        <button onClick={handlePageView} style={{ padding: '10px 20px' }}>
          Track Page View
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Analytics</h2>
        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <div>
            <p>Total Events: {analytics?.totalEvents || 0}</p>
            <p>Total Users: {analytics?.totalUsers || 0}</p>
            <p>Total Sessions: {analytics?.totalSessions || 0}</p>
            <p>Conversion Rate: {analytics?.conversionRate || 0}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App component
function App() {
  const config = {
    apiKey: 'your-api-key-here',
    environment: 'development' as const,
    debug: true,
    autoTrackPageViews: true,
    autoTrackSessions: true,
  };

  return (
    <AdquimoProvider
      config={config}
      onError={(error) => console.error('Adquimo Error:', error)}
      onSuccess={(message) => console.log('Adquimo Success:', message)}
    >
      <AdquimoTracker
        trackPageViews={true}
        trackClicks={true}
        trackScrolls={true}
        trackFormSubmissions={true}
        pageViewProperties={{ source: 'example-app' }}
        clickProperties={{ source: 'example-app' }}
        scrollThreshold={50}
        debounceDelay={100}
      >
        <TrackingExample />
      </AdquimoTracker>
    </AdquimoProvider>
  );
}

export default App;
