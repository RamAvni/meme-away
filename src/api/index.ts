import { IncomingMessage, ServerResponse } from "node:http";
import { LOBBY_KEY_LENGTH } from "../common/consts/index.js";
import { Lobby } from "../common/types/index.js";

export function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  lobbies: Record<string, Lobby>,
) {
  if (req.url === "/api/lobby") {
    if (req.method === "GET") res.end(JSON.stringify(lobbies));
    else if (req.method === "POST") {
      const newLobbyId = Math.random()
        .toString(16)
        .substring(2, 2 + LOBBY_KEY_LENGTH);
      lobbies[newLobbyId] = {
        clients: [],
      };
      res.end(newLobbyId.toString());
    }
  }
}
