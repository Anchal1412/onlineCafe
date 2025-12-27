const logger = (req, res, next) => {
    const start = Date.now();
    
    // Log the request
    console.log('\n--- New Request ---');
    console.log(`${new Date().toISOString()}`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  
    // Capture the original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - start;
      
      console.log('\n--- Response ---');
      console.log(`Response Time: ${responseTime}ms`);
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      console.log('----------------\n');
      
      return originalJson.call(this, data);
    };
  
    next();
  };
  
  module.exports = logger;
