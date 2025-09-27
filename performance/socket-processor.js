// Artillery processor for WebSocket testing
module.exports = {
  // Custom variables and functions
  generateUserId: function(context, events, done) {
    // Generate a mock user ID for testing
    context.vars.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    return done();
  },

  // Before request hook
  beforeRequest: function(requestParams, context, ee, next) {
    // Add custom headers or modify request
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Test-ID'] = context.vars.$uuid || 'test-id';
    return next();
  },

  // After response hook
  afterResponse: function(requestParams, response, context, ee, next) {
    // Log response for debugging
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} - ${response.body}`);
    }
    return next();
  }
};
