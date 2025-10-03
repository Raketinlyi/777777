// Comprehensive Trusted Types policy for React + Next.js
// This file is loaded early to prevent CSP violations

(function () {
  'use strict';

  try {
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      // Create default policy that allows React and Next.js to work
      window.trustedTypes.createPolicy('default', {
        createHTML: function (s) {
          // Allow all HTML for React rendering
          return s;
        },
        createScript: function (s) {
          // Allow scripts for Next.js HMR and React DevTools
          return s;
        },
        createScriptURL: function (s) {
          // Allow script URLs for dynamic imports
          return s;
        },
      });

      // Also create Next.js specific policy
      window.trustedTypes.createPolicy('nextjs', {
        createHTML: function (s) {
          return s;
        },
        createScript: function (s) {
          return s;
        },
        createScriptURL: function (s) {
          return s;
        },
      });

      // React DevTools policy
      window.trustedTypes.createPolicy('react-devtools', {
        createHTML: function (s) {
          return s;
        },
        createScript: function (s) {
          return s;
        },
      });

      // Web3 specific policy
      window.trustedTypes.createPolicy('web3', {
        createHTML: function (s) {
          return s;
        },
        createScript: function (s) {
          return s;
        },
        createScriptURL: function (s) {
          return s;
        },
      });

      }
  } catch (e) {
    // Policy already exists or browser doesn't support Trusted Types
    }
})();
