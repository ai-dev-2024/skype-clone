# Skype Clone - AGENTS.md

## Project Overview

This is a full-featured Skype-like communication platform built with modern web technologies. The application supports real-time messaging, video/audio calling, file sharing, group chats, contact management, and payment integration.

## Architecture Overview

**Monorepo Structure:**
- `packages/backend/` - Node.js/Express API server with TypeScript
- `packages/web/` - React frontend with Vite and TypeScript
- `packages/mobile/` - React Native mobile app (placeholder)
- `packages/desktop/` - Electron desktop app (placeholder)
- `packages/shared/` - Shared TypeScript types and utilities

**Core Technologies:**
- Backend: Node.js, Express, Socket.io, MongoDB, Stripe
- Frontend: React, TypeScript, Vite, Socket.io-client
- Real-time: WebSocket-based messaging and calling
- Database: MongoDB with Mongoose ODM

## Team Roster & Agent Assignments (3-Agent Structure)

| Agent Tag | Professional Role | Ownership Scope |
|-----------|-------------------|-----------------|
| `Backend-Lead` | Lead Backend & Platform Engineer | API endpoints, database models, security, shared services, mobile/desktop API support |
| `Frontend-Lead` | Lead Product Engineer (Web & Client UX) | React web app, shared UI components, mobile+desktop front-end integration, accessibility |
| `DevOps-Lead` | Lead Infrastructure & Quality Engineer | DevOps, CI/CD, Docker, monitoring, automated testing, release coordination |

**Coordination Rules:**
- Each agent owns their scope; cross-cutting changes require a quick sync noted in the Stand-up log or TODO tracker before execution.
- Cross-cutting changes (e.g., shared types) require a quick note in the shared Stand-up log or TODO list before execution.
- All agents must read this file and `COORDINATION.md` before starting work and update the TODO tracker when tasks begin/complete.

## Build & Test Commands

### Backend
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend (Web)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Full Stack Development
```bash
# Install all dependencies
npm install

# Start both backend and frontend
npm run dev  # Backend on :5000, Frontend on :3000

# Build all packages
npm run build
```

## Development Patterns & Constraints

### Code Organization
- **Controllers**: Handle HTTP request/response logic
- **Models**: Database schemas and business logic
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation, error handling
- **Services**: External integrations (Socket.io, Stripe)

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Leverage shared types from `@skype-clone/shared`
- Avoid `any` types; use proper type definitions

### Real-time Communication
- Use Socket.io for WebSocket connections
- Implement proper room management
- Handle connection/disconnection gracefully
- Authenticate socket connections

### Security Practices
- JWT tokens with refresh rotation
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration

## Git Workflow Essentials

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `bugfix/*` - Bug fixes and hotfixes

### Commit Conventions
```
feat: add video calling functionality
fix: resolve WebRTC connection issues
refactor: optimize database queries
test: add unit tests for authentication
docs: update API documentation
```

### Pull Request Requirements
- All tests must pass
- Code must lint without errors
- Include clear description of changes
- Reference related issues/tickets
- No merge conflicts

## External Services & Configuration

### Required Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/skype-clone

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# WebRTC
WEBRTC_ICE_SERVERS=[{"urls": "stun:stun.l.google.com:19302"}]
```

### External Dependencies
- **MongoDB**: Primary database
- **Redis**: Session storage (optional)
- **Stripe**: Payment processing
- **Email Service**: Notifications (optional)

## Quality Assurance

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% test coverage

### Code Quality Gates
- TypeScript compilation without errors
- ESLint rules must pass
- No security vulnerabilities
- Performance benchmarks met

## Deployment Strategy

### Production Deployment
1. Build all packages: `npm run build`
2. Start with PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure monitoring and logging

### Docker Deployment
```bash
# Build images
docker build -f Dockerfile.backend -t skype-backend .
docker build -f Dockerfile.web -t skype-web .

# Run with docker-compose
docker-compose up -d
```

## Current Development Status

### ✅ Completed Features
- Project infrastructure and monorepo setup
- Backend API server with security middleware
- Authentication system with JWT tokens
- Database models and relationships
- Real-time messaging with Socket.io
- Basic React frontend structure
- WebRTC video/audio calling implementation
- File upload and sharing system
- Stripe payment integration
- Contact management system
- Group chat functionality

### 🚧 In Progress
- Deployment and Docker configuration
- Testing suite implementation
- Performance optimization
- Documentation updates

### ❌ Remaining Work
- Mobile app (React Native)
- Desktop app (Electron)
- Push notifications
- End-to-end encryption
- Advanced testing (E2E, load testing)

## Coordination Guidelines for Multiple Agents

### Agent Specialization
**Agent 1 (Backend Specialist)**: Focus on API development, database optimization, security enhancements
**Agent 2 (Frontend Specialist)**: UI/UX improvements, component optimization, accessibility
**Agent 3 (DevOps Specialist)**: Deployment automation, monitoring, performance optimization
**Agent 4 (Testing Specialist)**: Test coverage, quality assurance, automation

### Work Division Strategy
1. **Parallel Development**: Different agents work on independent features
2. **Feature Branching**: Each major feature gets its own branch
3. **Regular Synchronization**: Daily standups to coordinate progress
4. **Conflict Resolution**: Clear merge strategies for overlapping work

### Communication Protocol
- Use TODO system for task tracking
- Update AGENTS.md when processes change
- Document decisions in commit messages
- Use pull request reviews for coordination

## Evidence Required for Every PR

- ✅ Tests pass (unit, integration, E2E where applicable)
- ✅ Code lints without errors
- ✅ TypeScript compilation succeeds
- ✅ Changes confined to agreed scope
- ✅ Performance impact assessed
- ✅ Security implications considered
- ✅ Documentation updated
- ✅ Backward compatibility maintained

## Common Pitfalls & Solutions

### Issue: Socket Connection Problems
**Solution**: Check authentication middleware and token validation

### Issue: WebRTC Connection Failures
**Solution**: Verify STUN/TURN server configuration and network permissions

### Issue: Database Connection Issues
**Solution**: Validate MongoDB connection string and network accessibility

### Issue: Stripe Payment Failures
**Solution**: Confirm API keys and webhook endpoint configuration

### Issue: File Upload Errors
**Solution**: Check file size limits, storage permissions, and error handling

## Success Metrics

- ✅ Zero critical security vulnerabilities
- ✅ 95%+ test coverage
- ✅ <100ms API response times
- ✅ 99.9% uptime in production
- ✅ All core features functional across platforms
- ✅ Comprehensive documentation
- ✅ Automated deployment pipeline
