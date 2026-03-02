import http from "http";
import fs from "fs";
import path from "path";
import { logger } from "../common/functions/logger.js";

const PORT = 8080;

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

function provideStaticResource(reqUrl: string, res: http.ServerResponse) {
  let filePath = path.join(import.meta.dirname, "/static", reqUrl);

  if (reqUrl.at(-1) === "/" || !reqUrl.split("/").at(-1)?.includes("."))
    filePath = path.join(filePath, "index.html");

  const fileSuffix = filePath.match(/\.\w+$/)?.[0];
  if (!fileSuffix) {
    setError(res, new Error("No file suffix found")); // Shouldn't happen due to the logic above.
    return;
  }

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
      logger(`Sent ${filePath} successfully`, "info");
    });
  });
}

async function main() {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      setError(res, new Error("improper req.url given"));
      return;
    } else if (req.url.startsWith("/api")) {
    } else {
      provideStaticResource(req.url, res);
    }
  });

  server.listen(PORT, () => {
    logger(`Server is listening on port ${PORT}`, "debug");
  });

  // Handle Socket requests
  // server.on("upgrade", (req, socket, head) => {
  //   socket.on("data", (data) => {
  //     console.log(data);
  //   });
  // });
}

main();
