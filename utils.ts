export function stripPrefix(target: string, prefix: string): string {
  if (target.startsWith(prefix)) {
    return target.slice(prefix.length);
  } else {
    return target;
  }
}


