import colors from "./colors.ts";

export function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatLog(
  msg: string,
  label?: string | null,
  sub?: string | null,
  noTimestamp?: boolean,
): string {
  const ts = noTimestamp ? "" : colors.dim(timestamp());
  const l = label ? colors.cyan(label) : "";
  const s = sub ? colors.green(sub) : "";

  const lg = [ts, colors.cyan(colors.bold("DENSKY")), l, s, msg].filter(Boolean)
    .join(
      " ",
    );

  return " " + lg;
}

export function log(
  msg: string,
  label?: string | null,
  sub?: string | null,
  noTimestamp?: boolean,
): void {
  console.log(formatLog(msg, label, sub, noTimestamp));
}

export const makeLog = (
  verbose: boolean,
  rawStr: string,
  color: typeof colors[keyof typeof colors],
) => {
  return verbose
    ? (...data: unknown[]) =>
      console.log(
        color(rawStr),
        ...data.map((v) =>
          typeof v === "string"
            ? v.replaceAll("\n", "\n" + " ".repeat(rawStr.length + 1))
            : v
        ),
      )
    : (..._: unknown[]) => {};
};

export type MakeLogFn = ReturnType<typeof makeLog>;

export const makeLog_info = (verbose: boolean): MakeLogFn =>
  makeLog(verbose, "[INFO]", colors.cyan);
export const makeLog_success_v = (verbose: boolean): MakeLogFn =>
  makeLog(verbose, "[INFO] ", colors.green);
export const log_success: MakeLogFn = makeLog(true, "", colors.green);
export const log_error: MakeLogFn = makeLog(true, "[ERROR]", colors.red);
export const log_warn: MakeLogFn = makeLog(true, "[WARN]", colors.yellow);
