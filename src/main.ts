import http from "http";
import fs from "fs";
import path from "path";
import { logger } from "./common/functions/logger.js";

const PORT = 8080;

function setError(res: http.ServerResponse, err: NodeJS.ErrnoException) {
  logger(err.message, "warn");
  res.writeHead(500, { "Content-Type": "text/plain" });
  res.end("500 Internal Server Error");
}

function getContentType(fileSuffix: string) {
  switch (fileSuffix) {
    case "js":
      return `text/javascript`;
    case "html":
    case "css":
      return `text/${fileSuffix}`;
    default:
      return "text/plain"; // The browser may even default to this, if an improper mime type has been given (e.g. ico)
  }
}

async function main() {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      setError(res, new Error("improper req.url given"));
      return;
    }

    let filePath = path.join(import.meta.dirname, "/static", req.url);
    if (
      req.url &&
      (req.url.at(-1) === "/" || !req.url.split("/").at(-1)?.includes("."))
    )
      filePath = path.join(filePath, "index.html");

    const fileSuffix = filePath.split(".").at(-1);
    if (!fileSuffix) {
      setError(res, new Error("Improper file suffix given"));
      return;
    }
    const contentType = getContentType(fileSuffix);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        setError(res, err);
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
      });
      logger(`Sent ${filePath} successfully`, "info");
      res.end(data);
    });
  });

  server.listen(PORT, () => {
    logger(`Server is listening on port ${PORT}`, "debug");
  });
}

main();
