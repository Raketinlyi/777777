import DOMPurify from 'dompurify';

// Enhanced Trusted Types 2.0 for maximum XSS protection
if (
  typeof window !== 'undefined' &&
  window.trustedTypes &&
  window.trustedTypes.createPolicy
) {
  // Create a comprehensive security policy
  window.trustedTypes.createPolicy('crazycube-security', {
    createHTML: string => {
      // Enhanced HTML sanitization with strict rules
      return DOMPurify.sanitize(string, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
          'div',
          'span',
          'p',
          'br',
          'strong',
          'em',
          'b',
          'i',
          'u',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'a',
          'img',
          'table',
          'tr',
          'td',
          'th',
          'thead',
          'tbody',
          'tfoot',
          'blockquote',
          'code',
          'pre',
          'mark',
          'small',
          'sub',
          'sup',
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'id',
          'style',
          'width',
          'height',
          'target',
          'rel',
          'data-*',
        ],
        FORBID_TAGS: [
          'script',
          'object',
          'embed',
          'form',
          'input',
          'textarea',
          'select',
          'button',
        ],
        FORBID_ATTR: ['on*', 'javascript:', 'vbscript:', 'data:'],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: false,
      }) as string;
    },

    createScript: string => {
      // Block all script creation - only allow from trusted sources
      throw new TypeError(
        'Script creation is not allowed for security reasons'
      );
    },

    createScriptURL: url => {
      // Strict URL validation for scripts
      const allowedOrigins = [
        window.location.origin,
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://api.web3modal.org',
        'https://pulse.walletconnect.org',
        'https://relay.walletconnect.org',
        'https://registry.walletconnect.org',
      ];

      try {
        const scriptUrl = new URL(url, window.location.origin);

        // Block dangerous protocols
        if (
          scriptUrl.protocol === 'javascript:' ||
          scriptUrl.protocol === 'data:' ||
          scriptUrl.protocol === 'vbscript:'
        ) {
          throw new TypeError(`Dangerous protocol: ${scriptUrl.protocol}`);
        }

        // Only allow from trusted origins
        if (allowedOrigins.includes(scriptUrl.origin)) {
          return url;
        }

        throw new TypeError(`Untrusted script URL: ${url}`);
      } catch (error) {
        throw new TypeError(`Invalid script URL: ${url}`);
      }
    },
  });

  // Create a more permissive policy for React/Next.js compatibility
  window.trustedTypes.createPolicy('nextjs-compat', {
    createHTML: string => {
      // Allow React to work while still sanitizing
      return DOMPurify.sanitize(string, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'object', 'embed'],
        FORBID_ATTR: ['on*', 'javascript:', 'vbscript:'],
        KEEP_CONTENT: true,
      });
    },
    createScript: string => {
      // Allow scripts for Next.js HMR and React DevTools
      if (
        string.includes('__NEXT_DATA__') ||
        string.includes('webpack') ||
        string.includes('react')
      ) {
        return string;
      }
      throw new TypeError('Script creation restricted');
    },
    createScriptURL: url => {
      // Allow script URLs for dynamic imports
      return url;
    },
  });

  // Web3 specific policy
  window.trustedTypes.createPolicy('web3', {
    createHTML: string => {
      return DOMPurify.sanitize(string, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em'],
        FORBID_TAGS: ['script', 'object', 'embed'],
        FORBID_ATTR: ['on*', 'javascript:', 'vbscript:'],
      });
    },
    createScript: string => {
      // Allow Web3Modal scripts
      if (string.includes('web3modal') || string.includes('wagmi')) {
        return string;
      }
      throw new TypeError('Web3 script creation restricted');
    },
    createScriptURL: url => {
      return url;
    },
  });

  }

// Utility functions for safe DOM manipulation
export const safeHTML = (html: string): string => {
  if (typeof window !== 'undefined' && window.trustedTypes) {
    try {
      return window.trustedTypes
        .createPolicy('crazycube-security', {
          createHTML: string => DOMPurify.sanitize(string),
        })
        .createHTML(html);
    } catch {
      return DOMPurify.sanitize(html);
    }
  }
  return DOMPurify.sanitize(html);
};

export const safeURL = (url: string): string => {
  if (typeof window !== 'undefined' && window.trustedTypes) {
    try {
      return window.trustedTypes
        .createPolicy('crazycube-security', {
          createScriptURL: string => string,
        })
        .createScriptURL(url);
    } catch {
      return url;
    }
  }
  return url;
};

// Enhanced URL sanitization for images and resources
export const sanitizeResourceURL = (url: string): string => {
  if (!url) return '';

  const trimmedUrl = url.trim();

  // Allow only safe protocols
  const allowedProtocols = ['https://', 'data:'];
  if (allowedProtocols.some(protocol => trimmedUrl.startsWith(protocol))) {
    return trimmedUrl;
  }

  // Allow local assets
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
  if (
    dangerousProtocols.some(protocol =>
      trimmedUrl.toLowerCase().startsWith(protocol)
    )
  ) {
    return '';
  }

  return '';
};

// Safe innerHTML setter
export const setSafeInnerHTML = (element: HTMLElement, html: string): void => {
  if (typeof window !== 'undefined' && window.trustedTypes) {
    try {
      element.innerHTML = window.trustedTypes
        .createPolicy('crazycube-security', {
          createHTML: string => DOMPurify.sanitize(string),
        })
        .createHTML(html);
    } catch (error) {
      element.textContent = html; // Fallback to text content
    }
  } else {
    element.innerHTML = DOMPurify.sanitize(html);
  }
};
