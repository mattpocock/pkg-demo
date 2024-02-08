import { FriendlyLoggerI } from "./types.js";
import toHex from "to-hex";
import chalk from "chalk";

/**
 * Friendly logger that logs messages to the console
 * and writes to a stream with timestamps and colorized labels.
 *
 * @param logLevels - Log levels and associated colors
 * @param output - Stream to write log messages to
 */
export default function FriendlyLogger({ logLevels, output }: FriendlyLoggerI) {
  const LogKeys = Object.keys(logLevels) as (keyof typeof logLevels)[];

  type Func = Record<
    keyof typeof logLevels,
    (message: string, extra?: Error | string) => void
  >;

  const funcs: Func = {} as Func;

  LogKeys.forEach((logLevel) => {
    const timestamp = new Date().toISOString();
    const color: string = toHex(logLevels[logLevel]);

    function logger(message: string, extra?: Error | string) {
      try {
        const logMessage = `[${timestamp}] - ${logLevel.toUpperCase()}: ${message}`;

        console.log(
          color[0] === "#"
            ? chalk.hex(color)(logMessage)
            : chalk.hex(toHex(color))(logMessage)
        );

        if (extra) {
          const errorMessage =
            extra instanceof Error ? extra.message : String(extra);
          if (output) output.write(`${logMessage} - ${errorMessage}\n`);
        } else {
          if (output) output.write(`${logMessage}\n`);
        }
      } catch (error) {
        console.error("Error logging message:", error);
      }
    }

    funcs[logLevel] = logger;
  });

  return funcs;
}
