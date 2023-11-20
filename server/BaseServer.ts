import version from "../version.ts";
import { Globals } from "../global.ts";
import colors from "../colors.ts";
import { Promisable } from "../types.ts";
import { logger } from "../log.ts";
import { HookEmitter } from "../hooks.ts";

export type BaseServerOptions = Parameters<typeof Deno.listen>[0] & {
  verbose?: boolean;
};

const defaultOptions: Required<BaseServerOptions> = {
  hostname: "localhost",
  transport: "tcp",
  port: 0,
  verbose: true,
};

export type BaseServerHooks = {
  beforeStart(options: Required<BaseServerOptions>): void;
  start(options: Required<BaseServerOptions>): void;
  afterStart(options: Required<BaseServerOptions>): void;

  connection(connection: Deno.Conn): void;
  request(request: Request): Promisable<Request | Response | null | undefined>;
  response(
    request: Request,
    response: Response,
  ): Promisable<Response | null | undefined>;
};

export abstract class BaseServer {
  static hooks = new HookEmitter<BaseServerHooks>();

  protected server: Deno.Listener;
  readonly options: Readonly<Required<BaseServerOptions>>;

  constructor(options: BaseServerOptions) {
    this.server = Deno.listen(options);

    this.options = options = Object.assign<
      Required<BaseServerOptions>,
      BaseServerOptions
    >(defaultOptions, options);

    BaseServer.hooks.emitHook("beforeStart", [this.options]);

    if (options.verbose) {
      const startTime = (performance.now() - Globals._startTime).toFixed(2);
      const DenskyVersion = colors.cyan(colors.bold`Densky ` + version);
      const readyIn = colors.dim`ready in ${colors.bold(startTime)} ms`;
      const urlShow = colors.cyan`http://${options.hostname}:${
        colors.bold(options.port)
      }`;
      console.log(`
  ${DenskyVersion}  ${readyIn}
    ${colors.green`➧`} ${colors.bold`URL:`}   ${urlShow}
`);
    }
  }

  async start() {
    BaseServer.hooks.emitHook("start", [this.options]);
    BaseServer.hooks.emitHook("afterStart", [this.options]);
    for await (const conn of this.server) {
      // log("New Connection", "HTTP");
      this.handleConnection(conn).finally(() => conn.close()).catch((_) => {});
    }
  }

  handleServerError(
    request: Deno.RequestEvent,
    error: Error,
  ): Promisable<void> {
    logger.error(error);
    request.respondWith(new Response("Internal Server Error", { status: 500 }));
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    BaseServer.hooks.emitHook("connection", [conn]);

    for await (const request of Deno.serveHttp(conn)) {
      try {
        const req = request.request;

        const handled = this.handleHooks(req, conn);

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

  async handleHooks(req: Request, conn: Deno.Conn): Promise<Response> {
    const hookedRequest = await BaseServer.hooks.emitHook("request", [req]);

    if (hookedRequest instanceof Response) return hookedRequest;
    if (hookedRequest instanceof Request) req = hookedRequest;

    const response = await this.handleRequest(req, conn);

    const hookedResponse = await BaseServer.hooks.emitHook("response", [req, response]);

    if (hookedResponse instanceof Response) return hookedResponse;

    return response;
  }

  abstract handleRequest(
    request: Request,
    conn: Deno.Conn,
  ): Promisable<Response>;

}
