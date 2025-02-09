import { describe, it, expect } from 'vitest';
import { build } from 'vite';
import { readFileSync } from 'fs';

describe('Vite Build Output', () => {
  it('optimizes bundle size', async () => {
    const stats = await build();
    const mainBundle = stats.output.find(o => o.name === 'main');
    
    expect(mainBundle?.size).toBeLessThan(500 * 1024); // 500KB limit
  });

  it('generates source maps', async () => {
    const stats = await build();
    const mainBundle = stats.output.find(o => o.name === 'main');
    
    expect(mainBundle?.map).toBeTruthy();
  });

  it('handles dynamic imports correctly', async () => {
    const stats = await build();
    const chunks = stats.output.filter(o => o.type === 'chunk');
    
    expect(chunks.length).toBeGreaterThan(1); // Ensure code splitting
  });
});