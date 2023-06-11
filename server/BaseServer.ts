// import type { Promisable } from "../common.ts";
import { HTTPError } from "../http/error.ts";
import version from "../version.ts";
import { Globals } from "../global.ts";
import color from "../colors.ts";
import { Promisable } from "../types.ts";

import { log } from "../log.ts";
import { HTTPRequest } from "../http/request.ts";

export type BaseServerOptions = Parameters<typeof Deno.listen>[0] & {
  verbose?: boolean;
  watchMode?: boolean;
};

const defaultOptions: Required<BaseServerOptions> = {
  hostname: "localhost",
  transport: "tcp",
  port: 0,
  verbose: true,
  watchMode: false,
};

export abstract class BaseServer {
  protected server: Deno.Listener;
  readonly options: Readonly<Required<BaseServerOptions>>;

  constructor(options: BaseServerOptions) {
    this.server = Deno.listen(options);

    this.options = options = Object.assign<
      Required<BaseServerOptions>,
      BaseServerOptions
    >(defaultOptions, options);

    if (options.verbose) {
      const startTime = (performance.now() - Globals._startTime).toFixed(2);
      const DenskyVersion = color.cyan(color.bold`Densky ` + version);
      const readyIn = color.dim`ready in ${color.bold(startTime)} ms`;
      const urlShow = color.cyan`http://${options.hostname}:${
        color.bold(options.port)
      }`;
      console.log(`
  ${DenskyVersion}  ${readyIn}
    ${color.green`➧`} ${color.bold`URL:`}   ${urlShow}
`);
    }
  }

  async start() {
    for await (const conn of this.server) {
      log("New Connection", "HTTP");
      this.handleConnection(conn).catch((_) => conn.close());
    }
  }

  handleServerError(
    request: Deno.RequestEvent,
    error: Error,
  ): Promisable<void> {
    request.respondWith(HTTPError.fromError(error).toResponse());
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    for await (const request of Deno.serveHttp(conn)) {
      try {
        const req = new HTTPRequest(request);
        const handled = this.handleRequest(req, conn);

        // Handle Async
        if (typeof handled === "object" && "catch" in handled) {
          handled
            .then((res: Response) => request.respondWith(res))
            .catch((err: Error) =>
              this.handleServerError(request, err as Error)
            );

          continue;
        }

        // Handle Sync
        request.respondWith(handled);
      } catch (e) {
        this.handleServerError(request, e as Error);
      }
    }
  }

  abstract handleRequest(
    request: HTTPRequest,
    conn: Deno.Conn,
  ): Promisable<Response>;
}
