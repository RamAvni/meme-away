import http from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { getLanIp, logger } from "./common/functions/index.js";
import {
  parseSocketMessage,
  sendSocketMessage,
  upgradeHttpToWebSocket,
} from "./common/functions/sockets/index.js";

const PORT = 8080;
const LOBBY_KEY_LENGTH = 6;

interface Lobby {
  clients: Client[];
}

interface Client {
  id: string;
  name: string;
  socket: net.Socket;
}

const clients: net.Socket[] = [];
const lobbies: Record<string, Lobby> = {
  1111: { clients: [] }, // For dev
};

function setError(res: http.ServerResponse, err: NodeJS.ErrnoException) {
  logger(err.message, "warn");
  res.writeHead(500, { "Content-Type": "text/plain" });
  res.end("Womp Womp, 500 Internal Server Error");
}

function getContentType(fileSuffix: string) {
  switch (fileSuffix) {
    case ".js":
      return `text/javascript`;
    case ".html":
    case ".css":
      return `text/${fileSuffix.replace(".", "")}`;
    default:
      return "text/plain"; // The browser may even default to this, if an improper mime type has been given (e.g. ico)
  }
}

function processRequestUrl(url: string, res: http.ServerResponse) {
  // Remove Special sub-paths (assuming the static folder follows suit)
  // NOTE: if "lobby" is not found, nothing will happen.
  const lobbyId = getLobbyIdFromUrl(url);
  if (lobbyId) {
    if (!lobbies[lobbyId]) return;
    url = url.replace("/" + lobbyId, "");
  }

  let filePath = path.join(import.meta.dirname, "/static", url);

  if (url.at(-1) === "/" || !url.split("/").at(-1)?.includes("."))
    filePath = path.join(filePath, "index.html");

  const fileSuffix = filePath.match(/\.\w+$/)?.[0];
  if (!fileSuffix) {
    setError(res, new Error("No file suffix found")); // Shouldn't happen due to the logic above.
    return;
  }

  return { filePath, fileSuffix };
}

function getLobbyIdFromUrl(url: string) {
  const endpointAfterLobby = url?.match(/(?<=\/lobby\/)[^/]+/)?.[0];
  if (
    endpointAfterLobby?.includes(".css") ||
    endpointAfterLobby?.includes(".js")
  )
    return;
  else return endpointAfterLobby;
}

function provideStaticResource(reqUrl: string, res: http.ServerResponse) {
  const processedUrl = processRequestUrl(reqUrl, res);
  if (!processedUrl) {
    setError(res, new Error("Error while processing request url"));
    return;
  }
  const { filePath, fileSuffix } = processedUrl;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      setError(res, err);
      return;
    }

    res.writeHead(200, {
      "Content-Type": getContentType(fileSuffix),
      "x-content-type-options": "no-sniff",
    });

    res.end(data, () => {
      logger(
        `Served ${filePath.replaceAll(import.meta.dirname, "")} successfully`,
        "info",
      );
    });
  });
}

async function main() {
  const server = http.createServer();

  // On HTTP Request
  server.on("request", (req, res) => {
    if (!req.url) {
      setError(res, new Error("improper req.url given"));
      return;
    } else if (req.url.startsWith("/api")) {
      // Handle API Logic
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
    } else if (req.method === "upgrade") {
      // Handle Socket - currently in server.on("upgrade")
    } else {
      provideStaticResource(req.url, res);
    }
  });

  // On ANY tcp/ip stream
  // server.on("connection", (socket) => {
  //   socket.on("data", (data) => {
  //     console.log(data.toString());
  //   });
  // });

  // On HTTP UPGRADE Request
  server.on("upgrade", async (httpReq, socket: net.Socket) => {
    console.log(httpReq.url);
    const lobbyId = httpReq.url && getLobbyIdFromUrl(httpReq.url); // An UPGRADE req must happen from a lobby url
    if (!lobbyId) {
      logger("could not find lobbyId, and perform UPGRADE", "error");
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }

    upgradeHttpToWebSocket(httpReq, socket);
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
      clients.splice(clients.indexOf(socket), 1);
      logger(
        `Connection with ${socket.remoteAddress} has been shutdown`,
        "info",
      );
    });
  });

  server.listen(PORT, () => {
    logger(`Server is listening on port ${PORT}`, "debug");
    logger(
      `You may access static files at: 
\t ${`http://localhost:${PORT}`}, or at:
\t http://${getLanIp()}:${PORT}`,
      "debug",
    );
  });
}

await main();
