# ADR-001: Monorepo Structure with NPM Workspaces

## Status
Accepted

## Context
We need to structure our codebase to support multiple platforms (web, mobile, desktop) while maintaining code sharing and consistent tooling. The team considered several options:

1. **Separate repositories**: Each platform in its own repo
2. **Monorepo with Lerna**: Traditional monorepo management
3. **Monorepo with NPM workspaces**: Modern approach using native NPM features
4. **Single repository with platform folders**: Simple but inflexible

## Decision
We will use a **monorepo structure with NPM workspaces** for the following reasons:

- **Native NPM support**: No additional tooling required
- **Faster development**: Shared dependencies and tooling
- **Code sharing**: Common types, utilities, and components
- **Simplified CI/CD**: Single pipeline for all packages
- **Atomic changes**: Related changes across packages in single commit

## Implementation

### Structure
```
packages/
├── backend/          # Node.js/Express API server
├── web/             # React web application
├── mobile/          # React Native mobile app
├── desktop/         # Electron desktop app
└── shared/          # Shared TypeScript types and utilities
```

### Workspace Configuration
```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces",
    "test": "npm run test --workspaces"
  }
}
```

## Consequences

### Positive
- Simplified dependency management
- Consistent tooling across platforms
- Easier refactoring across packages
- Single source of truth for shared code

### Negative
- Larger repository size
- Potential for tight coupling between packages
- CI/CD complexity for selective deployments

### Mitigation
- Use `npm workspaces` for selective operations
- Implement clear package boundaries with shared interfaces
- Use CI/CD matrix builds for platform-specific deployments

## Alternatives Considered

### Separate Repositories
**Pros**: Clear boundaries, independent deployment
**Cons**: Code duplication, complex coordination, version drift

### Lerna Monorepo
**Pros**: Mature tooling, advanced features
**Cons**: Additional complexity, learning curve, maintenance overhead

## References
- [NPM Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Patterns](https://monorepo.tools/)

---

*Date: September 27, 2025*
*Authors: Backend-Lead, Frontend-Lead, DevOps-Lead*
