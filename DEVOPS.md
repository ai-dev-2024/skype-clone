# DevOps Setup Guide

This document provides comprehensive information about the DevOps infrastructure for the Skype Clone project.

## 🚀 Quick Start

### Development Environment
```bash
# Start full development stack
npm run docker:dev

# Or start services individually
npm run dev:backend
npm run dev:web
```

### Production Deployment
```bash
# Full release process
node scripts/release-checklist.js full v1.0.0 production

# Or step by step
node scripts/release-checklist.js check v1.0.0
node scripts/release-checklist.js deploy v1.0.0 production
```

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Docker Configuration](#docker-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Testing Strategy](#testing-strategy)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Testing](#performance-testing)
- [Release Management](#release-management)
- [Troubleshooting](#troubleshooting)

## 🔧 Environment Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (local or Docker)
- Redis (optional, for session storage)

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key

### Validation
```bash
npm run validate:env
```

## 🐳 Docker Configuration

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose --profile production up --build -d
```

### Services
- **MongoDB**: Database (port 27017)
- **Redis**: Session storage (port 6379)
- **Backend**: API server (port 5000)
- **Web**: Frontend application (port 3000)
- **Nginx**: Reverse proxy (port 80/443)

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows
- `ci.yml` - Main CI pipeline (build, test, deploy)
- `nightly.yml` - Nightly builds and maintenance
- `release.yml` - Release automation

### Pipeline Stages
1. **Validate** - Environment and code validation
2. **Test** - Unit and integration tests
3. **Security** - Security scanning
4. **Build** - Docker image creation
5. **Deploy** - Environment deployment

### Manual Triggers
```bash
# Run CI checks locally
npm run validate:env
npm run lint
npm run test:orchestrate

# Build images
docker build -f Dockerfile.backend -t skype-clone-backend .
docker build -f Dockerfile.web -t skype-clone-web .
```

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing

### Running Tests
```bash
# All tests
npm run test:orchestrate

# Backend unit tests
cd packages/backend && npm test

# Web tests
cd packages/web && npm test

# Performance tests
npm run perf:test

# Load testing
npm run perf:auth
npm run perf:messaging
```

### Coverage Reports
```bash
npm run test:coverage
# Reports generated in coverage/ directory
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Basic health
curl http://localhost:5000/health

# Detailed health
curl http://localhost:5000/health/detailed

# Metrics
curl http://localhost:5000/metrics
```

### Log Files
- `packages/backend/logs/error.log` - Error logs
- `packages/backend/logs/combined.log` - All logs
- `packages/backend/logs/http.log` - HTTP request logs

### Monitoring Endpoints
- `/health` - Basic health status
- `/health/detailed` - Comprehensive health check
- `/metrics` - Application metrics

## ⚡ Performance Testing

### Load Testing
```bash
# Authentication load test
artillery run performance/auth-load-test.yml

# Messaging load test
artillery run performance/messaging-load-test.yml

# Full performance suite
npm run perf:test
```

### Performance Metrics
- Response times < 100ms (API)
- Memory usage monitoring
- Database query performance
- WebSocket connection handling

## 📦 Release Management

### Release Process
1. **Pre-release checks**: `node scripts/release-checklist.js check v1.0.0`
2. **Deploy**: `node scripts/release-checklist.js deploy v1.0.0 production`
3. **Verify**: Automatic post-deployment checks
4. **Rollback**: `node scripts/release-checklist.js rollback` (if needed)

### Version Tagging
```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will handle release creation
```

### Rollback Strategy
- Docker image rollback
- Database backup restoration
- Service restart procedures

## 🔧 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Clean up containers and volumes
docker-compose down -v
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Database Issues
```bash
# Check MongoDB connection
docker-compose exec mongodb mongo --eval "db.stats()"

# Reset database
docker-compose down -v
docker-compose up mongodb -d
```

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Test Failures
```bash
# Run tests with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="User registration"
```

### Logs and Debugging
```bash
# View application logs
docker-compose logs backend
docker-compose logs web

# Follow logs in real-time
docker-compose logs -f backend

# Check container status
docker-compose ps
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Profile application
npm run perf:test

# Memory leak detection
node --inspect packages/backend/dist/index.js
```

## 📈 Metrics and KPIs

### Application Metrics
- API response times
- Error rates
- User session duration
- Database query performance

### Infrastructure Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

### Business Metrics
- User registration rate
- Message throughput
- Video call duration
- Payment success rate

## 🔐 Security

### Security Scanning
```bash
# NPM audit
npm audit

# Snyk security scan
npx snyk test

# Container security
docker scan skype-clone-backend
```

### Security Best Practices
- Regular dependency updates
- Container image scanning
- Secret management
- Network segmentation
- Access control

## 📚 Additional Resources

- [AGENTS.md](../AGENTS.md) - Agent coordination guide
- [COORDINATION.md](../COORDINATION.md) - Multi-agent development strategy
- [README.md](../README.md) - Project overview
- [package.json](../package.json) - Available scripts

## 🤝 Support

For DevOps-related issues:
1. Check this documentation
2. Review logs and monitoring data
3. Run diagnostic commands
4. Check CI/CD pipeline status
5. Contact the DevOps-Lead agent

---

*This DevOps setup provides a production-ready infrastructure with comprehensive testing, monitoring, and deployment automation.*
