import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LoadingSpinner } from './LoadingSpinner';
import { performance } from '../../lib/performance';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  itemHeight?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  isLoading?: boolean;
  className?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  height = 400,
  itemHeight = 50,
  onEndReached,
  endReachedThreshold = 0.8,
  isLoading,
  className = ''
}: VirtualListProps<T>) {
  const startTime = React.useRef(performance.now());
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
    onChange: (instance) => {
      // Track virtualization performance
      const duration = performance.now() - startTime.current;
      if (duration > 16.67) { // Frame drop threshold (60fps)
        metricsCollector.recordEvent({
          type: 'performance',
          subtype: 'virtualization',
          success: false,
          duration,
          metadata: {
            visibleRange: instance.range,
            totalItems: items.length
          }
        });
      }
      startTime.current = performance.now();
    }
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onEndReached) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage > endReachedThreshold) {
      onEndReached();
    }
  };

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
      {isLoading && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}