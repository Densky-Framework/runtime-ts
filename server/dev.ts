import { relative as relativePath } from "https://deno.land/std@0.190.0/path/mod.ts";
import { Globals } from "../global.ts";
import { log, log_error } from "../log.ts";
import { HTTPRequest, HTTPResponse } from "../runtime.ts";
import type { CompileOptions, EntryController } from "../types.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";
import { join } from "https://deno.land/std@0.190.0/path/posix.ts";

type ManifestResolver = (req: HTTPRequest) => string | null;

export class DevServer extends BaseServer {
  lastId = 0;
  waitingRequests = new Map<number, Deno.RequestEvent>();

  manifestResolver: ManifestResolver | null = null;
  cache = new Map<string, EntryController>();

  constructor(
    options: BaseServerOptions,
    compileOptions: CompileOptions,
  ) {
    super(options);
    if (compileOptions.viewsPath) {
      HTTPResponse.viewsPath = join(Globals.cwd, "/.densky/views");
    }
  }

  importWithoutCache(url: string): Promise<unknown> {
    return import(
      "file://" + url + "?k=" +
        (Math.random() * 16000 | 0).toString(32)
    );
  }

  async importController(url: string): Promise<EntryController | null> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const controller = await this.importWithoutCache(url) as EntryController;
      this.cache.set(url, controller);

      return controller;
    } catch (e) {
      log_error(e);
      return null;
    }
  }

  async handleRequest(req: HTTPRequest) {
    if (!this.manifestResolver) {
      type ManifestResolverModule = { default: ManifestResolver };

      this.manifestResolver = await this.importWithoutCache(
        join(Globals.cwd, ".densky/manifest.ts"),
      ).then((m) => (m as ManifestResolverModule).default);
    }

    if (req.pathname === "/$/dev") {
      this.manifestResolver = null;
      for (const entry of await req.raw.json()) {
        this.cache.delete(entry[1]);
        log(
          relativePath(Globals.cwd, entry[1]),
          "WATCHER",
          entry[0].toUpperCase(),
        );
      }

      return (new Response("Updated!", { status: 200 }));
    }

    const controllerPath = this.manifestResolver!(req);
    if (controllerPath == null) {
      return new Response("Not Found", { status: 404 });
    }

    const controller = await this.importController(controllerPath);
    if (!controller) {
      return new Response("Controller doesn't exist: " + controllerPath, {
        status: 500,
      });
    }

    const entry = controller[req.method as keyof EntryController] ??
      controller.default;
    if (!entry) return new Response("Method not implemented", { status: 402 });

    return await entry(req) ?? new Response("Not found", { status: 404 });
  }
}
