import { queryCache } from '../../lib/cache';

describe('queryCache', () => {
  beforeEach(() => {
    queryCache.clearAll();
  });

  it('caches and retrieves data correctly', () => {
    const testData = { id: 1, name: 'Test' };
    queryCache.set('test-key', testData);
    
    const cached = queryCache.get('test-key');
    expect(cached).toEqual(testData);
  });

  it('respects TTL for cached data', () => {
    const testData = { id: 1, name: 'Test' };
    queryCache.set('test-key', testData);
    
    // Get with short TTL
    const cached = queryCache.get('test-key', { ttl: -1 });
    expect(cached).toBeNull();
  });

  it('handles cache invalidation', () => {
    const testData = { id: 1, name: 'Test' };
    queryCache.set('test-key', testData);
    queryCache.clear('test-key');
    
    const cached = queryCache.get('test-key');
    expect(cached).toBeNull();
  });

  it('clears all cache entries', () => {
    queryCache.set('key1', { id: 1 });
    queryCache.set('key2', { id: 2 });
    queryCache.clearAll();
    
    expect(queryCache.get('key1')).toBeNull();
    expect(queryCache.get('key2')).toBeNull();
  });
});