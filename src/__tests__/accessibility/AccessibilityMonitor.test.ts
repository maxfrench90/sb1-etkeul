import { describe, it, expect, vi } from 'vitest';
import { accessibilityMonitor } from '../../lib/accessibility';
import { metricsCollector } from '../../lib/monitoring';

describe('AccessibilityMonitor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    accessibilityMonitor.clearViolations();
    vi.clearAllMocks();
  });

  it('detects missing ARIA attributes', async () => {
    // Create a button with missing ARIA label
    const button = document.createElement('button');
    button.setAttribute('role', 'combobox');
    document.body.appendChild(button);

    await accessibilityMonitor.runAudit();
    const violations = accessibilityMonitor.getViolations();

    expect(violations.some(v => v.id === 'aria-required')).toBe(true);
    expect(metricsCollector.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'accessibility',
        success: false
      })
    );
  });

  it('validates heading structure', async () => {
    // Create improper heading structure
    document.body.innerHTML = `
      <h1>Title</h1>
      <h3>Skipped H2</h3>
    `;

    await accessibilityMonitor.runAudit();
    const violations = accessibilityMonitor.getViolations();

    expect(violations.some(v => v.id === 'heading-order')).toBe(true);
  });

  it('checks color contrast', async () => {
    // Create element with poor color contrast
    const div = document.createElement('div');
    div.style.color = '#999';
    div.style.backgroundColor = '#fff';
    div.textContent = 'Low contrast text';
    document.body.appendChild(div);

    await accessibilityMonitor.runAudit();
    const violations = accessibilityMonitor.getViolations();

    expect(violations.some(v => v.id === 'color-contrast')).toBe(true);
  });

  it('validates form inputs', async () => {
    // Create input without label
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    await accessibilityMonitor.runAudit();
    const violations = accessibilityMonitor.getViolations();

    expect(violations.some(v => v.id === 'label')).toBe(true);
  });

  it('checks image alt text', async () => {
    // Create image without alt text
    const img = document.createElement('img');
    img.src = 'test.jpg';
    document.body.appendChild(img);

    await accessibilityMonitor.runAudit();
    const violations = accessibilityMonitor.getViolations();

    expect(violations.some(v => v.id === 'image-alt')).toBe(true);
  });
});