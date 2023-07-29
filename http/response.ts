// import { PrimitiveObject, StatusCode } from "../types.ts";
// import { DynamicHtmlTree } from "../dynamic-html/DynamicHtmlTree.ts";

export type HTTPResponseSerialized = {
  headers: [string, string][];
  status: number;
  body: ArrayBuffer;
};

export class HTTPResponse {
  // static viewsTree: DynamicHtmlTree;
  static viewsPath: string;

  // constructor(readonly event: Deno.RequestEvent) {}

  static async view(
    path: string,
    data?: unknown,
    init?: ResponseInit,
  ): Promise<Response> {
    const view = await import(this.viewsPath + "/" + path + ".ts");

    return new Response(view.default(data), {
      status: 200,
      ...init,
      headers: {
        "Content-Type": "text/html",
        ...init?.headers,
      },
    });
    // if (!this.viewsTree) {
    //   throw new Error(
    //     "You're trying to use views without its config. Please set 'viewsPath' config.",
    //   );
    // }
    //
    // const viewNode = await this.viewsTree.getNode(path);
    //
    // return viewNode.toResponse(data, init);
  }

  static fromWorker(res: HTTPResponseSerialized): Response {
    return new Response(res.body, {
      status: res.status,
      headers: new Headers(res.headers),
    });
  }

  static async prepareForWorker(
    res: Response,
  ): Promise<HTTPResponseSerialized> {
    return {
      headers: [...res.headers.entries()],
      status: res.status,
      body: await res.arrayBuffer(),
    };
  }
}
