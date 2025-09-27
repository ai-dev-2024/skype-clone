#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates required environment variables and their formats
 */

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY'
];

const optionalVars = [
  'REDIS_URL',
  'WEBRTC_ICE_SERVERS',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'MAX_FILE_SIZE',
  'UPLOAD_PATH',
  'LOG_LEVEL',
  'LOG_FORMAT',
  'CORS_ORIGIN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'SESSION_SECRET',
  'METRICS_ENABLED',
  'HEALTH_CHECK_ENABLED'
];

const validations = {
  NODE_ENV: (value) => ['development', 'production', 'test'].includes(value),
  PORT: (value) => {
    const port = parseInt(value);
    return port >= 1 && port <= 65535;
  },
  MONGODB_URI: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
  JWT_SECRET: (value) => value.length >= 32,
  JWT_REFRESH_SECRET: (value) => value.length >= 32,
  STRIPE_SECRET_KEY: (value) => value.startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_'),
  REDIS_URL: (value) => value.startsWith('redis://'),
  EMAIL_PORT: (value) => {
    const port = parseInt(value);
    return port === 587 || port === 465 || port === 25;
  },
  MAX_FILE_SIZE: (value) => {
    const size = parseInt(value);
    return size > 0 && size <= 100 * 1024 * 1024; // Max 100MB
  },
  LOG_LEVEL: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
  LOG_FORMAT: (value) => ['json', 'simple'].includes(value),
  RATE_LIMIT_WINDOW_MS: (value) => parseInt(value) > 0,
  RATE_LIMIT_MAX_REQUESTS: (value) => parseInt(value) > 0
};

function validateEnvironment() {
  const errors = [];
  const warnings = [];

  console.log('🔍 Validating environment variables...\n');

  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`❌ Required environment variable ${varName} is not set`);
      return;
    }

    const validator = validations[varName];
    if (validator && !validator(value)) {
      errors.push(`❌ Environment variable ${varName} has invalid value: ${value}`);
    } else {
      console.log(`✅ ${varName}: ${value ? 'set' : 'not set'}`);
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const validator = validations[varName];
      if (validator && !validator(value)) {
        warnings.push(`⚠️  Environment variable ${varName} has invalid value: ${value}`);
      } else {
        console.log(`✅ ${varName}: set (optional)`);
      }
    } else {
      console.log(`ℹ️  ${varName}: not set (optional)`);
    }
  });

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Critical Errors:');
    errors.forEach(error => console.log(`   ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n💥 Environment validation failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 Environment validation passed!');
    if (warnings.length > 0) {
      console.log('Please review the warnings above.');
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment, requiredVars, optionalVars, validations };
