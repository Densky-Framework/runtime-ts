import colors, { EnchantedColor } from "./colors.ts";

export interface LoggerOptions {
  // FIXME: JSDOC
  defaultColor?: EnchantedColor;

  // FIXME: EXAMPLE
  /** Minimum level to show the log */
  level?: LoggerLevel;

  /**
   * Show a text before each log
   *
   * @example
   * ```typescript
   * import { colors, Logger } from "densky/plugin.ts";
   *
   * const logger = new Logger("logger", {
   *   prefix: colors.red`[SEE THIS]`
   * });
   *
   * logger.info("Hello World");
   * // -> [SEE THIS] [logger]  INFO  Hello World
   * ```
   */
  prefix?: string;
}

export enum LoggerLevel {
  AUTO = "auto",
  DEBUG = "debug",
  INFO = "info",
  SUCCESS = "success",
  WARN = "warn",
  ERROR = "error",
}

const loggerLevel = {
  [LoggerLevel.AUTO]: -1,
  [LoggerLevel.DEBUG]: 0,
  [LoggerLevel.INFO]: 1,
  [LoggerLevel.SUCCESS]: 2,
  [LoggerLevel.WARN]: 3,
  [LoggerLevel.ERROR]: 4,
};

export class Logger {
  // Options
  readonly defaultColor: EnchantedColor;
  readonly level: LoggerLevel;
  readonly prefix: string;

  constructor(readonly moduleName: string, options?: LoggerOptions) {
    this.defaultColor = options?.defaultColor ?? colors.reset;
    this.level = options?.level ?? LoggerLevel.AUTO;
    this.prefix = options?.prefix ?? "";
  }

  private mustLog(level: LoggerLevel): boolean {
    if (loggerLevel[level] > loggerLevel[this.level]) {
      return true;
    }

    return false;
  }

  private log(level: LoggerLevel, color: EnchantedColor, ...data: unknown[]) {
    if (!this.mustLog(level)) return;

    const label = color(colors.bold(level.toUpperCase()));

    const ts = colors.dim(timestamp());

    // {TS} {PREFIX} {MODULE} {LABEL} ...message
    const prefix = [
      ts,
      this.prefix,
      colors.cyan(colors.bold(this.moduleName)),
      label,
    ]
      .filter(Boolean)
      .join(
        " ",
      );

    const message = data.map((v) =>
      typeof v === "string"
        ? v.replaceAll("\n", "\n" + " ".repeat(prefix.length + 1))
        : v
    );

    console.log(prefix, ...message);
  }

  debug(...data: unknown[]) {
    this.log(LoggerLevel.DEBUG, colors.blue, ...data);
  }

  info(...data: unknown[]) {
    this.log(LoggerLevel.INFO, colors.cyan, ...data);
  }

  success(...data: unknown[]) {
    this.log(LoggerLevel.SUCCESS, colors.green, ...data);
  }

  warn(...data: unknown[]) {
    this.log(LoggerLevel.WARN, colors.yellow, ...data);
  }

  error(...data: unknown[]) {
    this.log(LoggerLevel.ERROR, colors.red, ...data);
  }
}

export function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const logger = new Logger("DENSKY");
