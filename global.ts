export class Globals {
  static readonly _startTime = performance.now();
  static readonly cwd: string;
}

export function setCWD(cwd: string) {
  // @ts-expect-error READONLY property
  Globals.cwd = cwd;
}
