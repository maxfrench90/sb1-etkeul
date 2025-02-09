# Accessibility Module Documentation

## Overview

The accessibility module provides automated accessibility testing and monitoring capabilities using axe-core. It includes features like:

- Real-time accessibility auditing
- Priority-based audit queue
- Rate limiting
- Detailed violation reporting
- Performance monitoring

## Installation

The module is included in the project by default. Make sure you have the required dependencies:

```bash
npm install axe-core @axe-core/react
```

## Usage

### Basic Usage

```typescript
import { accessibilityMonitor } from '@/lib/accessibility/monitor';

// Run an accessibility audit
const violations = await accessibilityMonitor.runAudit();

// Run with custom configuration
const violations = await accessibilityMonitor.runAudit(2, {
  rules: ['color-contrast', 'aria-roles'],
  exclude: ['.no-audit']
});
```

### Integration with React Components

```typescript
import { useEffect } from 'react';
import { accessibilityMonitor } from '@/lib/accessibility/monitor';

function MyComponent() {
  useEffect(() => {
    // Run audit when component mounts
    accessibilityMonitor.runAudit();
  }, []);

  return <div>My Accessible Component</div>;
}
```

## Configuration

### Default Rules

The module comes with sensible defaults for accessibility rules:

- Color contrast
- ARIA attributes and roles
- Button and link names
- Image alt text
- Form labels

### Custom Rules

You can extend or override the default rules:

```typescript
const customRules = [
  { id: 'custom-rule', enabled: true }
];

await accessibilityMonitor.runAudit(1, {
  rules: customRules
});
```

## Rate Limiting

The module includes built-in rate limiting to prevent performance issues:

- Default: 10 requests per minute
- Configurable via `RateLimitConfig`
- Queue-based processing for high-priority audits

## Error Handling

All errors are logged through the monitoring system:

- Initialization failures
- Audit failures
- Rate limit exceeded
- Configuration errors

## Best Practices

1. Run audits during development and testing
2. Use priority levels appropriately
3. Handle violations gracefully
4. Monitor performance impact
5. Review and act on audit results

## API Reference

### AccessibilityMonitor

The main class providing accessibility testing functionality.

#### Methods

- `runAudit(priority?: number, config?: AuditConfig): Promise<AccessibilityViolation[]>`
- `destroy(): void`

#### Types

```typescript
interface AuditConfig {
  rules?: string[];
  exclude?: string[];
  context?: Record<string, any>;
}

interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  element?: string;
  help?: string;
  helpUrl?: string;
}
```

## Contributing

1. Follow the project's coding standards
2. Add tests for new features
3. Update documentation
4. Submit pull requests

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT License