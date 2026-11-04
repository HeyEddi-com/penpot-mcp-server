# Contributing to Penpot MCP Server

Thank you for your interest in contributing! This guide will help you set up your development environment and test your changes locally before pushing to GitHub.

## Prerequisites

- Node.js 18 or higher

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/zcube/penpot-mcp-server.git
   cd penpot-mcp-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```

## Testing Your Changes

### 1. Run Unit Tests

```bash
# Set environment variables
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-token-here"

# Run tests
npm test
```

See [TESTING.md](./TESTING.md) for more details on setting up test environment.

## GitHub Actions in Forks

The repository is fork-friendly. CI/CD workflows will run on your fork, but deployment steps (Docker push, NPM publish) are disabled by default to prevent accidents.

### Integration Tests in Forks

To enable integration tests against a Penpot server in your fork:

1. **Create the `penpot-test` environment** in your fork:
   - Go to your fork's Settings → Environments
   - Click "New environment"
   - Name it exactly: `penpot-test`

2. **Add Penpot secrets** to the environment:
   - `PENPOT_API_URL`: Your Penpot server URL (e.g., `https://design.penpot.app`)
   - `PENPOT_ACCESS_TOKEN`: Your Penpot access token

Without this environment, integration tests will skip gracefully and the workflow will pass.

### Optional: Enable Docker Push in Forks

To push Docker images from your fork:

1. Go to Settings → Secrets and variables → Actions
2. Add repository secret:
   - Name: `DOCKER_PUSH_ENABLED`
   - Value: `true`

This enables pushing to your fork's GitHub Container Registry.

## Local Testing Before Push

Before pushing your changes to GitHub, test them locally to catch issues early:

```bash
# Build the project
npm run build

# Run tests (requires Penpot credentials)
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-token"
npm test
```

## Common Issues

### Tests fail with "Missing credentials"

Make sure you have set the required environment variables:

```bash
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-token"
```

See [TESTING.md](./TESTING.md) for how to get your access token.

## Making a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. **Test locally**: Run build and tests (see above)
5. Commit your changes: `git commit -am 'Add my feature'`
6. Push to your fork: `git push origin feature/my-feature`
7. Create a Pull Request

## Code Style

- Follow existing TypeScript conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

## Commit Messages

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example:

```
feat: Add support for component variants

- Implement component variant creation
- Add tests for variant operations
- Update documentation
```

## Questions?

- Open an issue for bugs or feature requests
- Join discussions for questions
- Check existing issues before creating new ones

Thank you for contributing! 🎉
