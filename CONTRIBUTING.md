# Contributing to Pet Pathways

Thank you for your interest in contributing to Pet Pathways! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pet-pathways.git
   cd pet-pathways
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards:
   - Use TypeScript for type safety
   - Follow ESLint and Prettier rules
   - Write tests for new features
   - Update documentation as needed

3. Commit your changes:
   ```bash
   git add .
   git commit
   ```

   Follow the conventional commit format:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - style: Code style changes
   - refactor: Code refactoring
   - test: Adding tests
   - chore: Maintenance tasks

4. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a pull request

## Testing

Run different test suites:

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage

# Accessibility tests
npm run test:a11y
```

## Code Style

- Use ESLint and Prettier for consistent code style
- Run `npm run lint` to check for issues
- Run `npm run format` to format code

## Performance

- Use React.memo() for expensive components
- Lazy load routes and large components
- Optimize images and assets
- Monitor bundle size with `npm run analyze`

## Accessibility

- Follow WCAG 2.1 guidelines
- Use semantic HTML
- Include proper ARIA attributes
- Test with screen readers
- Run `npm run test:a11y` regularly

## Documentation

- Update README.md for major changes
- Document new components and hooks
- Include JSDoc comments for functions
- Update API documentation

## Review Process

1. All PRs require:
   - Passing tests
   - No lint errors
   - Updated documentation
   - Code review approval

2. Reviewers will check for:
   - Code quality
   - Test coverage
   - Performance impact
   - Accessibility
   - Documentation

## Need Help?

- Check existing issues and pull requests
- Join our Discord community
- Contact the maintainers

Thank you for contributing to Pet Pathways!