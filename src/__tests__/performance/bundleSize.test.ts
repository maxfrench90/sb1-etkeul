import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Bundle Size', () => {
  it('stays within size budget', () => {
    const stats = JSON.parse(
      readFileSync(resolve(__dirname, '../dist/stats.json'), 'utf-8')
    );

    // Check main bundle
    expect(stats.assets.find(a => a.name.startsWith('main.')).size)
      .toBeLessThan(200 * 1024); // 200KB

    // Check vendor bundle
    expect(stats.assets.find(a => a.name.startsWith('vendor.')).size)
      .toBeLessThan(300 * 1024); // 300KB
  });

  it('optimizes images correctly', () => {
    const imageAssets = stats.assets.filter(a => 
      /\.(jpg|png|webp)$/.test(a.name)
    );

    imageAssets.forEach(asset => {
      expect(asset.size).toBeLessThan(100 * 1024); // 100KB per image
    });
  });
});