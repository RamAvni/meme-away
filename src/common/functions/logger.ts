type LogLevel = "info" | "debug" | "warn" | "error";
type EscapeCodeName =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "purple"
  | "cyan"
  | "white"
  | "reset"
  | "italic";

function getAnsiColor(colorName: EscapeCodeName) {
  switch (colorName) {
    case "black":
      return "\x1b[0;30m";
    case "red":
      return "\x1b[0;31m";
    case "green":
      return "\x1b[0;32m";
    case "yellow":
      return "\x1b[0;33m";
    case "blue":
      return "\x1b[0;34m";
    case "purple":
      return "\x1b[0;35m";
    case "cyan":
      return "\x1b[0;36m";
    case "white":
      return "\x1b[0;37m";
    case "reset":
      return "\x1b[0m";
    case "italic":
      return "\x1b[3m";
  }
}

export function logger(msg: string, logLevel: LogLevel) {
  const prefix = `[${logLevel.toUpperCase()}]:`;
  switch (logLevel) {
    case "info":
      console.info(`${getAnsiColor("blue")} ${prefix} ${msg}`);
    case "debug":
      console.debug(`${getAnsiColor("purple")} ${prefix} ${msg}`);
    case "warn":
      console.warn(`${getAnsiColor("yellow")} ${prefix} ${msg}`);
    case "error":
      console.error(`${getAnsiColor("red")} ${prefix} ${msg}`);
      console.trace(getAnsiColor("italic") + "Call Stack:");
  }
  console.log(getAnsiColor("reset")); // Clear color/format for further messages
}
