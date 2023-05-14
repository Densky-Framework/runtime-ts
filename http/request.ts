import { HTTPMethodStr } from "../types.ts";
import { Cookies } from "../services/cookies/mod.ts";

type Accumulator = {
  readonly segments: string[];
  readonly path: string;
};

export class HTTPRequest {
  readonly raw: Request;
  readonly method: HTTPMethodStr;
  readonly headers: Headers;
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

  constructor(readonly event: Deno.RequestEvent) {
    this.raw = event.request;
    this.method = this.raw.method as HTTPMethodStr;
    this.headers = new Headers();
    this.cookies = new Cookies(this.raw.headers, this.headers);

    this.url = new URL(this.raw.url);
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
}
