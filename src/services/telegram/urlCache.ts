/**
 * Keyed object-URL cache shared by avatars and media: in-flight dedupe, ref counting
 * (URLs in use are never revoked), LRU eviction of unused entries, per-key
 * subscriptions for `useSyncExternalStore` (entries are immutable snapshots).
 */
export interface UrlEntry {
  url?: string;
  /** Known to have no content (e.g. peer without photo). */
  none?: boolean;
  loading?: boolean;
  error?: boolean;
  /** When the content was fetched from the network (ms epoch). */
  fetchedAt?: number;
}

export class ObjectUrlCache {
  private entries = new Map<string, UrlEntry>();
  private refs = new Map<string, number>();
  private lastUsed = new Map<string, number>();
  private listeners = new Map<string, Set<() => void>>();
  private inflight = new Map<string, Promise<void>>();

  constructor(private readonly maxUnused: number) {}

  get(key: string): UrlEntry | undefined {
    return this.entries.get(key);
  }

  subscribe(key: string, listener: () => void): () => void {
    let set = this.listeners.get(key);
    if (!set) this.listeners.set(key, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
      if (!set.size) this.listeners.delete(key);
    };
  }

  retain(key: string): () => void {
    this.refs.set(key, (this.refs.get(key) ?? 0) + 1);
    this.lastUsed.set(key, Date.now());
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const n = (this.refs.get(key) ?? 1) - 1;
      if (n > 0) this.refs.set(key, n);
      else this.refs.delete(key);
      this.lastUsed.set(key, Date.now());
      this.evict();
    };
  }

  /** Runs `task` once per key at a time. */
  dedupe(key: string, task: () => Promise<void>): Promise<void> {
    let running = this.inflight.get(key);
    if (!running) {
      running = task().finally(() => this.inflight.delete(key));
      this.inflight.set(key, running);
    }
    return running;
  }

  /** Replaces the content of `key`: a new object URL is created and the old one revoked. */
  setBlob(key: string, blob: Blob | null, fetchedAt?: number): void {
    const old = this.entries.get(key)?.url;
    this.entries.set(key, { url: blob ? URL.createObjectURL(blob) : undefined, none: !blob, fetchedAt });
    if (old) URL.revokeObjectURL(old);
    this.notify(key);
  }

  patch(key: string, patch: Partial<UrlEntry>): void {
    this.entries.set(key, { ...this.entries.get(key), ...patch });
    this.notify(key);
  }

  /** Keys currently displayed somewhere. */
  retainedKeys(): string[] {
    return [...this.refs.keys()];
  }

  clear(): void {
    for (const entry of this.entries.values()) if (entry.url) URL.revokeObjectURL(entry.url);
    const keys = [...this.entries.keys()];
    this.entries.clear();
    this.inflight.clear();
    for (const key of keys) this.notify(key);
  }

  private notify(key: string): void {
    for (const listener of this.listeners.get(key) ?? []) listener();
  }

  private evict(): void {
    const unused = [...this.entries.keys()].filter((k) => !this.refs.has(k));
    if (unused.length <= this.maxUnused) return;
    unused.sort((a, b) => (this.lastUsed.get(a) ?? 0) - (this.lastUsed.get(b) ?? 0));
    for (const key of unused.slice(0, unused.length - this.maxUnused)) {
      const url = this.entries.get(key)?.url;
      if (url) URL.revokeObjectURL(url);
      this.entries.delete(key);
      this.lastUsed.delete(key);
    }
  }
}
