export class ServerCache<T, H = unknown> {
  private cache = new Map<string, T>();

  set(key: string, value: T) {
    this.cache.set(key, value);
  }

  get(key: string): T | null {
    return this.cache.get(key) ?? null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  private handler: ((v: H) => T) | null = null;

  setHandler(handler: (v: H) => T) {
    this.handler = handler;
  }

  handle(key: string, value: H) {
    if (!this.handler) throw new Error("Handler is not defined");

    this.cache.set(key, this.handler(value));
  }

  [Symbol.iterator]() {
    return this.cache[Symbol.iterator]();
  }
}
