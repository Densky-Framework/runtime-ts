import { HTTPMethodStr } from "../types.ts";
import { Cookies } from "../services/cookies/mod.ts";

type Accumulator = {
  readonly segments: string[];
  readonly path: string;
};

export type RequestSerialized = {
  url: string;
  headers: [string, string][];
  method: string;
  a: ArrayBuffer;
};

export class HTTPRequest {
  // readonly raw: Request;
  readonly method: HTTPMethodStr;
  readonly headers: Headers;
  readonly reqHeaders: Headers;
  readonly cookies: Cookies;

  readonly url: URL;
  readonly pathname: string;
  readonly params = new Map<string, string>();

  /** @internal */
  readonly __accumulator__: Accumulator;

  /** @internal */
  readonly segments: string[];

  readonly data = new Map<string, unknown>();

  private _prepared = false;

  constructor(raw: Request | RequestSerialized) {
    this.method = raw.method as HTTPMethodStr;
    this.headers = new Headers();
    if (!(raw instanceof Request)) {
      const rawHeaders = new Headers(raw.headers);
      this.reqHeaders = rawHeaders;
      this.cookies = new Cookies(rawHeaders, this.headers);
    } else {
      this.reqHeaders = raw.headers;
      this.cookies = new Cookies(raw.headers, this.headers);
    }

    this.url = new URL(raw.url);
    this.pathname = this.url.pathname;

    // By Parts
    {
      const targetParts = this.pathname.split("/");
      targetParts.shift();
      // Remove last if it's empty, handle "/my/path/"
      last_empty: {
        const last = targetParts.pop();
        if (last === undefined || last.length === 0) break last_empty;

        targetParts.push(last);
      }

      this.segments = targetParts;
    }

    this.__accumulator__ = {
      segments: this.segments,
      path: this.pathname.slice(1),
    };
  }

  async prepare() {
    if (this._prepared) return;

    await this.cookies.parse();
    this._prepared = true;
  }

  static async prepareForWorker(req: Deno.RequestEvent) {
    const raw = req.request;
    return {
      url: raw.url,
      headers: [...raw.headers.entries()],
      method: raw.method.toUpperCase(),
      a: await raw.arrayBuffer(),
    };
  }
}
