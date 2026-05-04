import type { Storage } from '../../src/storage/storage';

export class FakeStorage implements Storage {
  private readonly store = new Map<string, string>();

  async get<T>(key: string): Promise<T | undefined> {
    const raw = this.store.get(key);
    if (raw === undefined) return undefined;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}
