import { type ServerResponse } from "node:http";
import { join as joinPath } from "path";
import { logger } from "../common/functions/logger.js";
import { setError } from "../common/functions/set-error.js";
import { readFile } from "node:fs";
import { Lobby } from "../common/types/index.js";

export function getContentType(fileSuffix: string) {
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

export function processRequestUrl(
  url: string,
  res: ServerResponse,
  lobbyId?: string,
) {
  // Remove Special sub-paths (assuming the static folder follows suit)
  if (lobbyId) {
    url = url.replace("/" + lobbyId, "");
  }

  let filePath = joinPath(import.meta.dirname, "/static", url);

  if (url.at(-1) === "/" || !url.split("/").at(-1)?.includes("."))
    filePath = joinPath(filePath, "index.html");

  const fileSuffix = filePath.match(/\.\w+$/)?.[0];
  if (!fileSuffix) {
    setError(res, new Error("No file suffix found")); // Shouldn't happen due to the logic above.
    return;
  }

  return { filePath, fileSuffix };
}

export function getLobbyIdFromUrl(url: string) {
  const endpointAfterLobby = url?.match(/(?<=\/lobby\/)[^/]+/)?.[0];
  if (
    endpointAfterLobby?.includes(".css") ||
    endpointAfterLobby?.includes(".js")
  )
    return;
  else return endpointAfterLobby;
}

export function provideStaticResource(
  reqUrl: string,
  res: ServerResponse,
  lobbies: Record<string, Lobby>,
) {
  const lobbyId = getLobbyIdFromUrl(reqUrl);
  if (lobbyId && !lobbies[lobbyId]) {
    setError(
      res,
      new Error("LobbyId is present in the url, but Lobby doesn't exist"), // TODO: return lobby not found page
    );
    return;
  }

  const processedUrl = processRequestUrl(reqUrl, res, lobbyId);
  if (!processedUrl) {
    setError(res, new Error("Error while processing request url"));
    return;
  }
  const { filePath, fileSuffix } = processedUrl;

  readFile(filePath, "utf8", (err, data) => {
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
