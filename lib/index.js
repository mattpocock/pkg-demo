import toHex from 'to-hex';
import chalk from 'chalk';
/**
 * Friendly logger that logs messages to the console
 * and writes to a stream with timestamps and colorized labels.
 *
 * @param logLevels - Log levels and associated colors
 * @param output - Stream to write log messages to
 */
export default function FriendlyLogger({ logLevels, output }) {
    const LogKeys = Object.keys(logLevels);
    const funcs = {};
    LogKeys.forEach(logLevel => {
        const timestamp = new Date().toISOString();
        const color = toHex(logLevels[logLevel]);
        function logger(message, extra) {
            try {
                const logMessage = `[${timestamp}] - ${logLevel.toUpperCase()}: ${message}`;
                console.log(color[0] === '#'
                    ? chalk.hex(color)(logMessage)
                    : chalk.hex(toHex(color))(logMessage));
                if (extra) {
                    const errorMessage = extra instanceof Error ? extra.message : String(extra);
                    if (output)
                        output.write(`${logMessage} - ${errorMessage}\n`);
                }
                else {
                    if (output)
                        output.write(`${logMessage}\n`);
                }
            }
            catch (error) {
                console.error('Error logging message:', error);
            }
        }
        funcs[logLevel] = logger;
    });
    return funcs;
}
