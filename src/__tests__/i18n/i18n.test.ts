import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useI18n } from '../../hooks/useI18n';
import i18n from '../../i18n';
import { errorMonitor } from '../../lib/monitoring';

describe('i18n System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('changes language successfully', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
  });

  it('formats numbers correctly', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.formatNumber(1234.56)).toBe('1,234.56');
    
    i18n.changeLanguage('es');
    expect(result.current.formatNumber(1234.56)).toBe('1.234,56');
  });

  it('formats dates correctly', () => {
    const { result } = renderHook(() => useI18n());
    const date = new Date('2024-03-01');
    
    expect(result.current.formatDate(date)).toMatch(/3\/1\/2024|March 1, 2024/);
    
    i18n.changeLanguage('es');
    expect(result.current.formatDate(date)).toMatch(/1\/3\/2024|1 de marzo de 2024/);
  });

  it('formats currency correctly', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.formatCurrency(1234.56)).toBe('$1,234.56');
    
    i18n.changeLanguage('es');
    expect(result.current.formatCurrency(1234.56)).toMatch(/1.234,56/);
  });

  it('handles missing translations', () => {
    const { result } = renderHook(() => useI18n());
    const key = 'nonexistent.key';
    
    expect(result.current.t(key)).toBe(key);
    expect(errorMonitor.logError).toHaveBeenCalled();
  });

  it('supports RTL languages', async () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.isRTL).toBe(false);
    
    await i18n.changeLanguage('ar');
    expect(result.current.isRTL).toBe(true);
  });
});