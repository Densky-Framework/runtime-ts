export class Globals {
  static _startTime = performance.now();
  static cwd: string;
}

export function setCWD(cwd: string) {
  Globals.cwd = cwd;
}
