/// <reference types="node" resolution-mode="require"/>
import type { WriteStream } from 'fs';
export type LogLevelValue = 'trace' | 'debug' | 'info' | 'notice' | 'warn' | 'error' | 'verbose' | 'critical' | 'alert' | 'emergency';
export interface FriendlyLoggerI {
    logLevels: {
        [x in LogLevelValue]?: string;
    };
    output?: WriteStream;
}
