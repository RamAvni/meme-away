import { IncomingMessage } from "http";
import { logger } from "../common/functions/logger.js";
import { getLobbyIdFromUrl } from "../web/index.js";
import type { Duplex } from "stream";
import { upgradeHttpToWebSocket } from "./upgrade-http.js";
import { Socket } from "net";
import { parseSocketMessage, sendSocketMessage } from "./read-and-parse.js";
import { Lobby } from "../common/types/index.js";

export * from "./read-and-parse.js";
export * from "./upgrade-http.js";

export function onUpgrade(
  req: IncomingMessage,
  socket: Socket,
  lobbies: Record<string, Lobby>,
) {
  const lobbyId = req.url && getLobbyIdFromUrl(req.url); // An UPGRADE req must happen from a lobby url
  if (!lobbyId) {
    logger("could not find lobbyId, and perform UPGRADE", "error");
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return;
  }

  upgradeHttpToWebSocket(req, socket);
  logger("upgraded a client to sockets", "info");
  lobbies[lobbyId].clients.push({
    socket,
    id: crypto.randomUUID(),
    name: "Guest",
  });
  logger(`A Socket has joined lobby: ${lobbyId}`, "info");

  // Initialie Listeners for that specific socket
  socket.on("data", (data) => {
    lobbies[lobbyId].clients.forEach((client) => {
      if (client.socket !== socket) {
        // NOTE: the sender socket will get its own message back
        const parsed = parseSocketMessage(data)?.toString("utf8");
        if (!parsed) {
          logger("could not parse the recieved data", "error");
          socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); // Ideally, a Sec-WebSocket-Version should be sent back.
          return;
        }

        sendSocketMessage(client.socket, parsed);
      }
    });
  });

  socket.on("end", () => {
    lobbies[lobbyId].clients = lobbies[lobbyId].clients.filter(
      (c) => c.socket !== socket,
    );
    logger(`Connection with ${socket.remoteAddress} has been shutdown`, "info");
  });
}
