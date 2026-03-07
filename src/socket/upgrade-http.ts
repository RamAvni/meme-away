import { IncomingMessage } from "http";
import crypto from "crypto";
import { logger } from "../common/functions/logger.js";

export function upgradeHttpToWebSocket(req: IncomingMessage) {
  const socket = req.socket;
  const magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"; // Defined by W3C
  const {
    "sec-websocket-version": reqWcVersion,
    "sec-websocket-key": reqWcKey,
  } = req.headers;

  if (reqWcVersion !== "13") {
    logger("Requested Web Socket Version is NOT 13: " + reqWcVersion, "error");
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); // Ideally, a Sec-WebSocket-Version should be sent back.
  } else if (!reqWcKey) {
    logger("Requested Web Socket has not given a key", "error");
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return;
  }

  // Exact steps as mandated by the WebSocketAPI specification.
  const secWcAccept = crypto
    .createHash("sha1")
    .update(reqWcKey + magicString)
    .digest("base64");

  socket.write(
    "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
      "Upgrade: WebSocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${secWcAccept}\r\n` +
      "\r\n",
  );
}
