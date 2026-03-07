import http from "http";
import { getLanIp, logger } from "./common/functions/index.js";
import { setError } from "./common/functions/set-error.js";
import { provideStaticResource } from "./web/index.js";
import type { Lobby } from "./common/types/index.d.ts";
import { PORT } from "./common/consts/index.js";
import { handleApiRequest } from "./api/index.js";
import { onUpgrade } from "./socket/index.js";

const lobbies: Record<string, Lobby> = {
  1111: { clients: [] }, // For dev
};

async function main() {
  const server = http.createServer();

  // On HTTP Request
  server.on("request", (req, res) => {
    if (!req.url) {
      setError(res, new Error("improper req.url given"));
      return;
    } else if (req.url.startsWith("/api")) {
      handleApiRequest(req, res, lobbies);
      return;
    } else if (req.method === "upgrade") {
      // TODO: you can just take req, because socket is already refrenced inside it.
      onUpgrade(req, req.socket, lobbies);
    } else {
      provideStaticResource(req.url, res, lobbies);
      return;
    }
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
