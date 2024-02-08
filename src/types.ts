import type { WriteStream } from 'fs';

export type LogLevelValue =
  | 'trace'
  | 'debug'
  | 'info'
  | 'notice'
  | 'warn'
  | 'error'
  | 'verbose'
  | 'critical'
  | 'alert'
  | 'emergency';

interface LogLevel {
  level: LogLevelValue;
  color: string;
}

export interface FriendlyLoggerI {
  logLevels: {
    [x in LogLevelValue]?: string;
  };
  output?: WriteStream;
}
