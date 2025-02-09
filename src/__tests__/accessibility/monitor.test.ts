import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accessibilityMonitor } from '../../lib/accessibility/monitor';
import { errorMonitor } from '../../lib/monitoring';

describe('AccessibilityMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('handles already running axe instance', async () => {
      // Simulate axe already running
      window.axe = { isRunning: true } as any;

      const violations = await accessibilityMonitor.runAudit();
      
      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'accessibility.audit',
          error: 'Concurrent audit attempted'
        })
      );
      expect(violations).toEqual([]);
    });

    it('retries initialization on failure', async () => {
      const error = new Error('Init failed');
      vi.spyOn(window, 'setTimeout');
      vi.spyOn(global, 'import').mockRejectedValueOnce(error);

      await accessibilityMonitor.runAudit();

      expect(setTimeout).toHaveBeenCalled();
      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'accessibility.init',
          error: error.message
        })
      );
    });
  });

  describe('Audit Processing', () => {
    it('handles audit timeouts', async () => {
      // Create a slow component
      const div = document.createElement('div');
      div.innerHTML = `
        <div id="slow-component">
          ${Array(1000).fill('<div>Content</div>').join('')}
        </div>
      `;
      document.body.appendChild(div);

      const violations = await accessibilityMonitor.runAudit(1, {
        rules: ['color-contrast']
      });

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'accessibility.audit',
          error: 'Audit timeout'
        })
      );
      expect(violations).toEqual([]);
    });

    it('validates audit configuration', async () => {
      await expect(
        accessibilityMonitor.runAudit(0)
      ).rejects.toThrow('Priority must be between 1 and 10');

      await expect(
        accessibilityMonitor.runAudit(1, { rules: [] })
      ).rejects.toThrow('Rules array cannot be empty');
    });

    it('handles document not ready state', async () => {
      // Mock document readyState
      Object.defineProperty(document, 'readyState', {
        value: 'loading'
      });

      const violations = await accessibilityMonitor.runAudit();

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'accessibility.audit',
          error: 'Document not ready'
        })
      );
      expect(violations).toEqual([]);
    });
  });

  describe('Error Reporting', () => {
    it('provides detailed violation context', async () => {
      // Create inaccessible content
      const div = document.createElement('div');
      div.innerHTML = `
        <button></button>
        <img src="test.jpg" />
        <div role="button"></div>
      `;
      document.body.appendChild(div);

      const violations = await accessibilityMonitor.runAudit();

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toHaveProperty('target');
      expect(violations[0]).toHaveProperty('failureSummary');
      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'accessibility.violation',
          context: expect.objectContaining({
            target: expect.any(String),
            failureSummary: expect.any(String)
          })
        })
      );
    });

    it('groups similar violations', async () => {
      // Create multiple similar accessibility issues
      const div = document.createElement('div');
      div.innerHTML = Array(5)
        .fill('<img src="test.jpg" />')
        .join('');
      document.body.appendChild(div);

      const violations = await accessibilityMonitor.runAudit();

      // Should group similar violations
      expect(violations.length).toBe(1);
      expect(violations[0].element).toContain('Similar issues found');
    });
  });

  describe('Performance', () => {
    it('handles large DOM trees efficiently', async () => {
      // Create large DOM tree
      const div = document.createElement('div');
      div.innerHTML = Array(1000)
        .fill('<div><p>Content</p><button>Click</button></div>')
        .join('');
      document.body.appendChild(div);

      const startTime = performance.now();
      await accessibilityMonitor.runAudit();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('processes queue efficiently', async () => {
      // Queue multiple audits
      const audits = Array(10).fill(null).map(() => 
        accessibilityMonitor.runAudit(1)
      );

      const results = await Promise.all(audits);
      
      // Should process all audits
      expect(results).toHaveLength(10);
      // Should respect rate limits
      expect(errorMonitor.logError).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('rate limit')
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      accessibilityMonitor.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});