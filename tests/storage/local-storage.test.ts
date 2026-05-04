import { describe, expect, it, beforeEach } from 'vitest';
import { LocalStorage } from '../../src/storage/local-storage';

beforeEach(() => {
  localStorage.clear();
});

describe('LocalStorage.get', () => {
  it('returns undefined for missing key', async () => {
    const s = new LocalStorage();
    expect(await s.get('no-such-key')).toBeUndefined();
  });

  it('returns stored value after set', async () => {
    const s = new LocalStorage();
    await s.set('mykey', { x: 1 });
    expect(await s.get('mykey')).toEqual({ x: 1 });
  });

  it('returns undefined for corrupt JSON', async () => {
    localStorage.setItem('snake:bad', '{not-valid-json');
    const s = new LocalStorage();
    expect(await s.get<unknown>('bad')).toBeUndefined();
  });

  it('stores and retrieves primitive strings', async () => {
    const s = new LocalStorage();
    await s.set('str', 'hello');
    expect(await s.get<string>('str')).toBe('hello');
  });

  it('stores and retrieves arrays', async () => {
    const s = new LocalStorage();
    await s.set('arr', [1, 2, 3]);
    expect(await s.get<number[]>('arr')).toEqual([1, 2, 3]);
  });

  it('stores and retrieves nested objects', async () => {
    const s = new LocalStorage();
    const data = { a: { b: { c: 42 } } };
    await s.set('nested', data);
    expect(await s.get<typeof data>('nested')).toEqual(data);
  });

  it('different keys do not interfere', async () => {
    const s = new LocalStorage();
    await s.set('k1', 1);
    await s.set('k2', 2);
    expect(await s.get<number>('k1')).toBe(1);
    expect(await s.get<number>('k2')).toBe(2);
  });

  it('set overwrites previous value', async () => {
    const s = new LocalStorage();
    await s.set('k', 'first');
    await s.set('k', 'second');
    expect(await s.get<string>('k')).toBe('second');
  });
});

describe('LocalStorage snake: prefix', () => {
  it('stores with snake: prefix in raw localStorage', async () => {
    const s = new LocalStorage();
    await s.set('mydata', 42);
    expect(localStorage.getItem('snake:mydata')).toBe('42');
  });

  it('does not find key without prefix', async () => {
    localStorage.setItem('noprefixkey', '"value"');
    const s = new LocalStorage();
    expect(await s.get('noprefixkey')).toBeUndefined();
  });

  it('correctly reads key set with prefix', async () => {
    localStorage.setItem('snake:directset', '"direct"');
    const s = new LocalStorage();
    expect(await s.get<string>('directset')).toBe('direct');
  });
});
