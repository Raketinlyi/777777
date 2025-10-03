// Security middleware for Netlify Functions
const crypto = require('crypto');

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

// Security middleware
function securityMiddleware(handler) {
  return async (event, context) => {
    const startTime = Date.now();
    
    // Get client IP
    const clientIP = event.headers['client-ip'] || 
                    event.headers['x-forwarded-for']?.split(',')[0] || 
                    event.headers['x-real-ip'] || 
                    'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 60,
        },
        body: JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
      };
    }
    
    // Security headers
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Request-ID': crypto.randomUUID(),
    };
    
    // Bot detection
    const userAgent = event.headers['user-agent'] || '';
    if (isBot(userAgent)) {
      return {
        statusCode: 403,
        headers: securityHeaders,
        body: JSON.stringify({
          error: 'Access denied',
          message: 'Bot access not allowed.',
        }),
      };
    }
    
    // Input validation
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        if (!validateInput(body)) {
          return {
            statusCode: 400,
            headers: securityHeaders,
            body: JSON.stringify({
              error: 'Invalid input',
              message: 'Request contains invalid data.',
            }),
          };
        }
      } catch (error) {
        return {
          statusCode: 400,
          headers: securityHeaders,
          body: JSON.stringify({
            error: 'Invalid JSON',
            message: 'Request body is not valid JSON.',
          }),
        };
      }
    }
    
    // Call the actual handler
    try {
      const result = await handler(event, context);
      
      // Add security headers to response
      if (result.headers) {
        result.headers = { ...securityHeaders, ...result.headers };
      } else {
        result.headers = securityHeaders;
      }
      
      // Add timing header
      result.headers['X-Response-Time'] = `${Date.now() - startTime}ms`;
      
      return result;
    } catch (error) {
      console.error('Function error:', error);
      
      return {
        statusCode: 500,
        headers: securityHeaders,
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'An unexpected error occurred.',
        }),
      };
    }
  };
}

// Rate limiting check
function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  
  const key = `rate_limit:${clientIP}`;
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  // Clean up old entries
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupRateLimit();
  }
  
  return true;
}

// Bot detection
function isBot(userAgent) {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /headless/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i,
    /insomnia/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Input validation
function validateInput(data) {
  // Basic validation - extend as needed
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /\.\.\//,
  ];
  
  const dataString = JSON.stringify(data);
  return !suspiciousPatterns.some(pattern => pattern.test(dataString));
}

// Cleanup old rate limit entries
function cleanupRateLimit() {
  const now = Date.now();
  const cutoff = now - 5 * 60 * 1000; // 5 minutes
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

// Export middleware
module.exports = {
  securityMiddleware,
  checkRateLimit,
  isBot,
  validateInput,
}; 