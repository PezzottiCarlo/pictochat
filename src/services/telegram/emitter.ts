/** Minimal typed event emitter; a throwing listener never breaks the others. */
export class Emitter<E> {
  private listeners = new Set<(event: E) => void>();

  on(listener: (event: E) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: E): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (err) {
        console.error('[telegram] listener failed', err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
