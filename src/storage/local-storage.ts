import type { Storage } from './storage';

const PREFIX = 'snake:';

export class LocalStorage implements Storage {
  async get<T>(key: string): Promise<T | undefined> {
    const raw = globalThis.localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    globalThis.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  }
}
