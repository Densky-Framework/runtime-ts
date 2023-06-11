import { HTTPRequest } from "../mod.ts";
import { Promisable } from "../types.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";

type RequestHandler = (
  request: HTTPRequest,
  conn: Deno.Conn,
) => Promisable<Response>;

export class DevServer extends BaseServer {
  constructor(
    options: BaseServerOptions,
    readonly requestHandler: RequestHandler,
  ) {
    super(options);
  }

  async handleRequest(req: HTTPRequest, conn: Deno.Conn) {
    if (req.pathname === "/$/dev") {
      return new Response("Updated!", { status: 200 });
    }
    return await this.requestHandler(req, conn);
  }
}
