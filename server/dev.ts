import { BaseServer, BaseServerOptions } from "./BaseServer.ts";
import { HookEmitter } from "../hooks.ts";
import { Promisable } from "../types.ts";

export type DevServerHooks = {
  beforeWatchUpdate(req: Request): void;
  watchUpdate(kind: string, path: string): void;
  request(request: Request): Promisable<Response | null>;
};

export class DevServer extends BaseServer {
  static hooks = new HookEmitter<DevServerHooks>();

  constructor(options: BaseServerOptions) {
    super(options);
  }

  async handleRequest(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/$/dev") {
      await DevServer.hooks.emitHook("beforeWatchUpdate", [req]);
      for (const entry of await req.json()) {
        await DevServer.hooks.emitHook("watchUpdate", [
          entry[0] as string,
          entry[1] as string,
        ]);
      }

      return (new Response("Updated!", { status: 200 }));
    }

    return await DevServer.hooks.emitHook("request", [req]) ??
      new Response("Not handled", { status: 404 });
  }
}
