import { describe, it, expect } from 'vitest';
import { createTypeValidator } from '../../utils/typeValidator';

describe('TypeScript Configuration', () => {
  it('enforces strict mode', () => {
    const validator = createTypeValidator();
    
    // Test null checks
    expect(() => validator.validateNullChecks(null)).toThrow();
    expect(() => validator.validateNullChecks(undefined)).toThrow();
    
    // Test strict property initialization
    class TestClass {
      private uninitialized!: string; // Should require initialization
    }
    expect(() => new TestClass()).toThrow();
  });

  it('validates type definitions', () => {
    interface TestInterface {
      id: string;
      name: string;
    }

    const validObject = { id: '123', name: 'Test' };
    const invalidObject = { id: 123, name: 'Test' };

    expect(() => validateType<TestInterface>(validObject)).not.toThrow();
    expect(() => validateType<TestInterface>(invalidObject)).toThrow();
  });
});