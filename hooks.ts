// deno-lint-ignore-file no-explicit-any

export class HookEmitter<
  HOOKS extends Record<string, (...args: any[]) => unknown>,
> {
  private cloudHooks = new Map<keyof HOOKS, Set<HOOKS[keyof HOOKS]>>();

  registerHook<K extends keyof HOOKS>(name: K, fn: HOOKS[K]) {
    const hooks = this.cloudHooks.get(name) ?? new Set();
    hooks.add(fn);
    this.cloudHooks.set(name, hooks);
  }

  async emitHook<K extends keyof HOOKS>(
    name: K,
    args: Parameters<HOOKS[K]>,
  ): Promise<NonNullable<Awaited<ReturnType<HOOKS[K]>>> | null> {
    const hooks = this.cloudHooks.get(name) as Set<HOOKS[K]> ??
      new Set();

    let out = null;

    for (const hook of hooks) {
      if (out && name === "request" && out instanceof Request) {
        args[0] = out;
      } else if (out && name === "response" && out instanceof Response) {
        args[1] = out;
      }

      const res = await hook(...args);

      if (res) {
        out = res;
      }
    }

    return out as null;
  }
}
