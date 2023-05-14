// import { PrimitiveObject, StatusCode } from "../types.ts";
// import { DynamicHtmlTree } from "../dynamic-html/DynamicHtmlTree.ts";

export class HTTPResponse {
  // static viewsTree: DynamicHtmlTree;
  static viewsPath: string;

  // constructor(readonly event: Deno.RequestEvent) {}

  static async view(
    path: string,
    data?: unknown,
    init?: ResponseInit,
  ): Promise<Response> {
    const view = await import(this.viewsPath + '/' + path + '.ts');

    return new Response(view.default(data), {
      status: 200,
      ...init,
      headers: {
        "Content-Type": "text/html",
        ...init?.headers
      }
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
}
