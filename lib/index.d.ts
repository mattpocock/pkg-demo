import { FriendlyLoggerI } from './types.js';
/**
 * Friendly logger that logs messages to the console
 * and writes to a stream with timestamps and colorized labels.
 *
 * @param logLevels - Log levels and associated colors
 * @param output - Stream to write log messages to
 */
export default function FriendlyLogger({ logLevels, output }: FriendlyLoggerI): Record<import("./types.js").LogLevelValue, (message: string, extra?: Error | string) => void>;
