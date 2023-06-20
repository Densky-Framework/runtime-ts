import { relative as relativePath } from "https://deno.land/std@0.190.0/path/mod.ts";
import { Globals } from "../global.ts";
import { log } from "../log.ts";
import { HTTPRequest, HTTPResponse } from "../runtime.ts";
import type { CompileOptions, Promisable } from "../types.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";

export class DevServer extends BaseServer {
  worker: Worker | null = null;

  lastId = 0;
  waitingRequests = new Map<number, Deno.RequestEvent>();

  constructor(
    options: BaseServerOptions,
    _: CompileOptions,
  ) {
    super(options);
  }

  private getNextId() {
    let id = this.lastId++;
    while (this.waitingRequests.has(id)) {
      id = this.lastId++;
    }
    return id;
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    for await (const request of Deno.serveHttp(conn)) {
      try {
        if (new URL(request.request.url).pathname === "/$/dev") {
          this.worker = null;
          console.log("\x1B[2J\x1B[1;1H");
          for (const entry of await request.request.json()) {
            log(
              relativePath(Globals.cwd, entry[1]),
              "WATCHER",
              entry[0].toUpperCase(),
            );
          }
          request.respondWith(new Response("Updated!", { status: 200 }));
          continue;
        }

        this.processRequest(request);
      } catch (e) {
        this.handleServerError(request, e as Error);
      }
    }
  }

  private async processRequest(request: Deno.RequestEvent) {
    const req = await HTTPRequest.prepareForWorker(request);

    const id = this.getNextId();
    this.waitingRequests.set(id, request);

    if (this.worker) {
      this.worker.postMessage({ req, id });
      return;
    }

    const handlerPath = Globals.cwd + ".densky/worker.ts";
    this.worker = new Worker(
      "file://" + handlerPath + "?k=" +
        (Math.random() * 16000 | 0).toString(32),
      { type: "module" },
    );
    this.worker.onmessage = (e) => {
      const id: number = e.data.id;
      const res = e.data.res;

      // Set as free
      this.lastId = Math.min(this.lastId, id);

      const req = this.waitingRequests.get(id);
      req?.respondWith(HTTPResponse.fromWorker(res))
        // Prevent error from early connection close (abort)
        .catch(() => {});

      this.waitingRequests.delete(id);
    };

    this.worker!.postMessage({ id, req });
  }

  handleRequest(_: HTTPRequest, __: Deno.Conn): Promisable<Response> {
    return new Response("Unrecheable");
  }
}
