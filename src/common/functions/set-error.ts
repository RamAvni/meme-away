import { ServerResponse } from "http";
import { logger } from "./logger.js";

export function setError(res: ServerResponse, err: NodeJS.ErrnoException) {
  logger(err.message, "warn");
  res.writeHead(500, { "Content-Type": "text/plain" });
  res.end("Womp Womp, 500 Internal Server Error");
}
