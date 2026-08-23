import type { IncomingMessage } from "http";
import type { Client, Lobby } from "../common/types/index.d.ts";
import { logger } from "../common/functions/logger.js";
import { getLobbyIdFromUrl } from "../web/index.js";
import { upgradeHttpToWebSocket } from "./upgrade-http.js";
import { parseSocketMessage, sendSocketMessage } from "./read-and-parse.js";
import { parse } from "path";
import { randomUUID } from "crypto";

export * from "./read-and-parse.js";
export * from "./upgrade-http.js";

export function onUpgrade(
  req: IncomingMessage,
  lobbies: Record<string, Lobby>,
) {
  const socket = req.socket;

  const lobbyId = req.url && getLobbyIdFromUrl(req.url);
  if (!lobbyId) {
    logger("An UPGRADE Request must happen from a lobby url", "error");
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return;
  }

  upgradeHttpToWebSocket(req);
  logger("upgraded a client to sockets", "info");

  const client: Client = {
    socket,
    id: crypto.randomUUID(),
    name: "Unknown",
    isPlaying: false,
  };
  lobbies[lobbyId].clients.push(client);
  logger(`A Socket has joined lobby: ${lobbyId}`, "info");

  // Initialie Listeners for that specific socket
  socket.on("data", (rawData) => {
    const parsed = parseSocketMessage(rawData as Buffer)?.toString("utf8");
    if (!parsed) {
      logger("could not parse the recieved data", "error");
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); // Ideally, a Sec-WebSocket-Version should be sent back.
      return;
    }
    let jsoned: Record<any, unknown> | undefined;
    try {
      jsoned = JSON.parse(parsed) as Record<any, unknown>;
    } catch (e) {
      logger(e, "error");
      return;
    }
    console.log(jsoned);
    // TODO: type guard
    if (jsoned.name && typeof jsoned.name === "string") {
      client.isPlaying = true;
      client.name = jsoned.name;

      const allPlayers = lobbies[lobbyId].clients
        .filter((c) => c.isPlaying)
        .map((player) => {
          const { socket, id, ...rest } = player;
          return rest;
        });
      lobbies[lobbyId].clients.forEach((client) => {
        sendSocketMessage(client.socket, JSON.stringify(allPlayers));
      });
    }
  });

  socket.on("end", () => {
    lobbies[lobbyId].clients = lobbies[lobbyId].clients.filter(
      (c) => c.socket !== socket,
    );
    logger(`Connection with ${socket.remoteAddress} has been shutdown`, "info");
  });
}
