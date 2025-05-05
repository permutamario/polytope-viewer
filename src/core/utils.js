// src/core/utils.js
/**
 * Utility functions: platform detection, debounce, throttle, and simple event emitter.
 */

/** Detect if running on mobile device */
export function detectPlatform() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Debounce: delays invoking fn until after wait ms have elapsed since last call */
export function debounce(fn, wait = 100) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Throttle: invokes fn at most once per limit ms */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/** Simple EventEmitter for pub/sub */
export class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event, payload) {
    (this.events[event] || []).slice().forEach(l => l(payload));
  }
}
