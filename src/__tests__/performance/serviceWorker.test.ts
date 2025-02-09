import { describe, it, expect, vi } from 'vitest';
import { Workbox } from 'workbox-window';

describe('Service Worker', () => {
  it('handles offline/online transitions', async () => {
    const wb = new Workbox('/service-worker.js');
    await wb.register();

    // Go offline
    await wb.controlling;
    window.dispatchEvent(new Event('offline'));
    
    // Verify offline page served
    const response = await fetch('/');
    expect(response.url).toContain('/offline.html');

    // Go online
    window.dispatchEvent(new Event('online'));
    const onlineResponse = await fetch('/');
    expect(onlineResponse.url).not.toContain('/offline.html');
  });

  it('syncs queued operations after reconnection', async () => {
    const wb = new Workbox('/service-worker.js');
    await wb.register();

    // Queue operation while offline
    window.dispatchEvent(new Event('offline'));
    await wb.messageSW({ type: 'SYNC_BOOKING', payload: { id: '123' } });

    // Go online and verify sync
    window.dispatchEvent(new Event('online'));
    const syncComplete = await new Promise(resolve => {
      wb.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          resolve(true);
        }
      });
    });

    expect(syncComplete).toBe(true);
  });
});