const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/fhir',
    createProxyMiddleware({
      target: 'https://hapi.fhir.org',
      changeOrigin: true,
      pathRewrite: {
        '^/fhir': '/baseR4', // Rewrite /fhir to /baseR4
      },
      onProxyReq: (proxyReq) => {
        // Remove the 'withCredentials' header if it exists
        proxyReq.removeHeader('withCredentials');
      },
      onProxyRes: function(proxyRes) {
        // Add CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
      logLevel: 'debug',
      secure: false, // Allow self-signed certificates if needed
    })
  );
};
