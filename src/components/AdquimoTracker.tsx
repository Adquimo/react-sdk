/**
 * AdquimoTracker Component
 * Automatic tracking component for page views and user interactions
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { useAdquimo } from './AdquimoProvider';
import { useTracking } from '../hooks/useTracking';

export interface AdquimoTrackerProps {
  children: ReactNode;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScrolls?: boolean;
  trackFormSubmissions?: boolean;
  pageViewProperties?: Record<string, unknown>;
  clickProperties?: Record<string, unknown>;
  scrollThreshold?: number;
  debounceDelay?: number;
}

/**
 * AdquimoTracker component
 * Automatically tracks page views and user interactions
 */
export function AdquimoTracker({
  children,
  trackPageViews = true,
  trackClicks = true,
  trackScrolls = false,
  trackFormSubmissions = false,
  pageViewProperties = {},
  clickProperties = {},
  scrollThreshold = 50,
  debounceDelay = 0,
}: AdquimoTrackerProps): JSX.Element {
  const { sdk, isInitialized } = useAdquimo();
  const { trackPageView, trackClick } = useTracking(sdk, { debounceDelay });
  const scrollTrackedRef = useRef(false);
  const lastPageRef = useRef<string | null>(null);

  // Track page views
  useEffect(() => {
    if (!isInitialized || !trackPageViews) return;

    const currentUrl = window.location.href;
    const currentTitle = document.title;
    const referrer = document.referrer;

    // Only track if page has changed
    if (lastPageRef.current !== currentUrl) {
      trackPageView(currentUrl, currentTitle, referrer, pageViewProperties);
      lastPageRef.current = currentUrl;
    }
  }, [isInitialized, trackPageViews, trackPageView, pageViewProperties]);

  // Track clicks
  useEffect(() => {
    if (!isInitialized || !trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const element = target.tagName.toLowerCase();
      const selector = getElementSelector(target);
      const text = getElementText(target);

      trackClick(element, selector, text, clickProperties);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isInitialized, trackClicks, trackClick, clickProperties]);

  // Track scrolls
  useEffect(() => {
    if (!isInitialized || !trackScrolls) return;

    const handleScroll = () => {
      if (scrollTrackedRef.current) return;

      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercentage >= scrollThreshold) {
        trackClick('scroll', 'page', 'scroll', {
          ...clickProperties,
          scrollPercentage: Math.round(scrollPercentage),
        });
        scrollTrackedRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, trackScrolls, trackClick, clickProperties, scrollThreshold]);

  // Track form submissions
  useEffect(() => {
    if (!isInitialized || !trackFormSubmissions) return;

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;

      const formName = form.name || form.id || 'unknown';
      const formAction = form.action || 'unknown';

      trackClick('form', 'form', 'submit', {
        ...clickProperties,
        formName,
        formAction,
      });
    };

    document.addEventListener('submit', handleSubmit);
    return () => document.removeEventListener('submit', handleSubmit);
  }, [isInitialized, trackFormSubmissions, trackClick, clickProperties]);

  // Reset scroll tracking on page change
  useEffect(() => {
    scrollTrackedRef.current = false;
  }, [lastPageRef.current]);

  return <>{children}</>;
}

/**
 * Get CSS selector for an element
 */
function getElementSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }
  }

  return element.tagName.toLowerCase();
}

/**
 * Get text content from an element
 */
function getElementText(element: HTMLElement): string {
  return element.textContent?.trim() || '';
}
