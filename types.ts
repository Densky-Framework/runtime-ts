export type { BaseServerOptions } from "./server/BaseServer.ts";

export type CompileOptions = {
  routesPath: string;
  wsPath?: string | false;
  staticPath?: string | false;
  staticPrefix?: string;
  viewsPath?: string | false;
  outDir?: string;
  verbose?: boolean;
};

export type Promisable<T> = Promise<T> | T;
export type Awaited<T> = T extends Promise<infer R> ? R : T;

export type PrimitiveObject = {
  [x: string | number]: PrimitiveObject | string | number | boolean | undefined;
};
