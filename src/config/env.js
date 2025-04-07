/**
 * Environment variable validation
 * Ensures all required environment variables are set before the application starts
 */

const requiredEnvVars = [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'NODE_ENV'
  ];
  
  function validateEnv() {
    const missingVars = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }
    
    if (missingVars.length > 0) {
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}. Using defaults for testing.`);
        
        // Set default values for testing
        if (!process.env.PORT) process.env.PORT = '5000';
        if (!process.env.MONGO_URI) process.env.MONGO_URI = 'mongodb://localhost:27017/task-management-api-test';
        if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_jwt_secret';
        if (!process.env.JWT_EXPIRE) process.env.JWT_EXPIRE = '30d';
        if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';
      } else {
        throw new Error(
          `Application startup failed. Missing required environment variables: ${missingVars.join(', ')}. ` +
          'Please set these variables in your .env file or environment.'
        );
      }
    }
    
    console.log(`Environment validation passed for ${process.env.NODE_ENV} environment.`);
  }
  
  module.exports = { validateEnv };
  