import { QueueItem } from './types';

/**
 * Priority queue implementation for managing accessibility audit requests
 */
export class PriorityQueue {
  private items: QueueItem[] = [];

  /**
   * Adds an item to the queue with priority sorting
   * @param {QueueItem} item - The item to add to the queue
   */
  enqueue(item: QueueItem): void {
    this.items.push(item);
    this.items.sort((a, b) => b.request.priority - a.request.priority);
  }

  /**
   * Removes and returns the highest priority item from the queue
   * @returns {QueueItem | undefined} The next item in the queue
   */
  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  /**
   * Checks if the queue is empty
   * @returns {boolean} True if the queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Gets the current size of the queue
   * @returns {number} The number of items in the queue
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Removes all items from the queue
   */
  clear(): void {
    this.items = [];
  }
}