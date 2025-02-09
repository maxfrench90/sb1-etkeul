interface ConflictResolutionStrategy<T> {
  resolve: (local: T, server: T) => T;
  shouldResolve: (local: T, server: T) => boolean;
}

export class ConflictResolver<T extends { id: string; updated_at: string }> {
  private strategies: ConflictResolutionStrategy<T>[] = [];

  addStrategy(strategy: ConflictResolutionStrategy<T>) {
    this.strategies.push(strategy);
  }

  resolve(local: T, server: T): T {
    // Find the first applicable strategy
    const strategy = this.strategies.find(s => s.shouldResolve(local, server));
    
    if (!strategy) {
      // Default to server wins if no strategy matches
      return server;
    }

    return strategy.resolve(local, server);
  }
}

// Built-in strategies
export const serverWins = <T extends { id: string; updated_at: string }>(): ConflictResolutionStrategy<T> => ({
  resolve: (_, server) => server,
  shouldResolve: () => true
});

export const clientWins = <T extends { id: string; updated_at: string }>(): ConflictResolutionStrategy<T> => ({
  resolve: (local) => local,
  shouldResolve: () => true
});

export const lastWriteWins = <T extends { id: string; updated_at: string }>(): ConflictResolutionStrategy<T> => ({
  resolve: (local, server) => {
    const localDate = new Date(local.updated_at);
    const serverDate = new Date(server.updated_at);
    return localDate > serverDate ? local : server;
  },
  shouldResolve: () => true
});

export const mergeStrategy = <T extends { id: string; updated_at: string }>(
  mergeFn: (local: T, server: T) => T
): ConflictResolutionStrategy<T> => ({
  resolve: mergeFn,
  shouldResolve: () => true
});