# useAccessibilityAudit Hook

A React hook for running accessibility audits on components using axe-core.

## Features

- Automatic accessibility testing
- Priority-based auditing
- Automatic fixes for common issues
- Performance monitoring
- Detailed violation reporting

## Installation

The hook is included in the project by default. Make sure you have the required dependencies:

```bash
npm install axe-core @axe-core/react
```

## Usage

### Basic Usage

```tsx
import { useAccessibilityAudit } from '@/hooks/useAccessibilityAudit';

function MyComponent() {
  const { violations, loading, error, runAudit } = useAccessibilityAudit();

  return (
    <div>
      {violations.length > 0 && (
        <div role="alert">
          Found {violations.length} accessibility issues
        </div>
      )}
      <button onClick={runAudit}>
        Check Accessibility
      </button>
    </div>
  );
}
```

### With Configuration

```tsx
function MyComponent() {
  const { violations } = useAccessibilityAudit({
    enabled: true,
    priority: 2,
    config: {
      rules: ['color-contrast', 'aria-roles'],
      exclude: ['.no-audit']
    },
    autoFix: true,
    onViolation: (violations) => {
      console.warn('Accessibility issues found:', violations);
    }
  });

  return <div>My Accessible Component</div>;
}
```

## API Reference

### Options

```typescript
interface UseAccessibilityAuditOptions {
  enabled?: boolean;      // Enable/disable auditing (default: true in development)
  priority?: number;      // Audit priority (1-10, default: 1)
  config?: AuditConfig;   // Audit configuration
  autoFix?: boolean;      // Apply automatic fixes (default: false)
  onViolation?: (violations: AccessibilityViolation[]) => void;
}

interface AuditConfig {
  rules?: string[];       // Rules to check
  exclude?: string[];     // Selectors to exclude
  context?: Record<string, any>;
}
```

### Return Value

```typescript
{
  violations: AccessibilityViolation[];  // Current violations
  loading: boolean;                      // Audit in progress
  error: Error | null;                   // Last error if any
  runAudit: () => Promise<void>;        // Manually run audit
  clearViolations: () => void;          // Clear current violations
}
```

## Automatic Fixes

The hook can automatically fix common accessibility issues when `autoFix` is enabled:

- Missing image alt text
- Empty button labels
- Color contrast issues

## Best Practices

1. Run audits during development
2. Handle violations gracefully
3. Monitor performance impact
4. Review and fix issues promptly
5. Test with screen readers

## Examples

### With Error Handling

```tsx
function MyComponent() {
  const { violations, error, runAudit } = useAccessibilityAudit({
    onViolation: (violations) => {
      // Log to error monitoring
      violations.forEach(v => {
        errorMonitor.logError({
          operation: 'accessibility.violation',
          error: v.description,
          severity: v.impact === 'critical' ? 'high' : 'medium'
        });
      });
    }
  });

  if (error) {
    return <div role="alert">Failed to check accessibility</div>;
  }

  return (
    <div>
      <button onClick={runAudit}>Check Accessibility</button>
      {violations.map((v, i) => (
        <div key={i} role="alert">
          {v.description}
        </div>
      ))}
    </div>
  );
}
```

### With Custom Rules

```tsx
function MyComponent() {
  const { violations } = useAccessibilityAudit({
    config: {
      rules: [
        { id: 'custom-rule', enabled: true },
        { id: 'color-contrast', enabled: true, options: { noScroll: true } }
      ],
      exclude: ['[aria-hidden="true"]']
    }
  });

  return <div>My Component</div>;
}
```

### With Performance Monitoring

```tsx
function MyComponent() {
  const { violations } = useAccessibilityAudit({
    priority: 1,
    onViolation: (violations) => {
      metricsCollector.recordEvent({
        type: 'accessibility',
        subtype: 'violations',
        success: violations.length === 0,
        metadata: {
          count: violations.length,
          types: violations.map(v => v.id)
        }
      });
    }
  });

  return <div>My Component</div>;
}
```

## Testing

The hook includes comprehensive tests:

```bash
npm test -- --testPathPattern=useAccessibilityAudit
```

## Contributing

1. Follow the project's coding standards
2. Add tests for new features
3. Update documentation
4. Submit pull requests