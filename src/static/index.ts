const CANVAS_MAX_WIDTH = 200;
const CANVAS_MAX_HEIGHT = 500;

// https://stackoverflow.com/a/14731922
function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

function getMousePosRelativeToCanvas(canvas: HTMLCanvasElement, e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function initCanvasContext(ctx: CanvasRenderingContext2D) {
  ctx.font = "28px serif";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "blue";
}

function handleImageLoading(img: HTMLImageElement, canvas: HTMLCanvasElement) {
  const { width, height } = calculateAspectRatioFit(
    img.width,
    img.height,
    CANVAS_MAX_WIDTH,
    CANVAS_MAX_HEIGHT,
  );

  canvas.width = width;
  canvas.height = height;

  // NOTE: canvas' context gets reset on width/height change, so we initialize here.
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d canvas ctx found");

  initCanvasContext(ctx);

  ctx.drawImage(img, 0, 0, width, height);
}

// import { getMemes } from "./get-memes";
// import { keyboardListener } from "./keyboard-listener";

function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!canvas) return console.error("no canvas found");

  let text = "";
  const img = new Image();

  listeners(canvas, text, img);
}

// ======================

function handleTextMode(
  event: KeyboardEvent,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  text: string,
) {
  switch (event.key) {
    case "Backspace":
      text = text.slice(0, -1);
      break;
    case "\s":
      event.preventDefault(); // Prevents stuff like space triggers file input
    // Falls through!
    default:
      if (event.key.match(/^(\p{L}|\s)$/u)) text += event.key;
      break;
  }

  // redraw, in order to remove previous text
  // TODO: find a better way?
  // @ts-ignore -- We Expect that img.onload() does not take parameters.
  img.onload();
  ctx.fillText(text, 10, 50);
  console.log(text);
  return text;
}

main();

// ===============================

// async function getMemes() {
//   const res = await fetch("https://imgflip.com/memetemplates?page=1");
//   console.log(res);
// }
//
// getMemes();

function listeners(
  canvas: HTMLCanvasElement,
  text: string,
  img: HTMLImageElement,
) {
  const textModeInput = document.getElementById(
    "text-mode-checkbox",
  ) as HTMLInputElement | null;
  if (!textModeInput) return console.log("no text mode input found");
  textModeInput.addEventListener("change", () => {
    if (textModeInput.checked) {
      canvas.addEventListener("mousedown", (e) => {
        const { x, y } = getMousePosRelativeToCanvas(canvas, e);
        canvas.getContext("2d")?.strokeRect(x, y, 20, 20);
      });
      document.addEventListener(
        "keydown",
        (e) => (text = handleTextMode(e, canvas.getContext("2d")!, img, text)),
      );
    } else {
      canvas.removeEventListener("mousedown", (e) => {
        const { x, y } = getMousePosRelativeToCanvas(canvas, e);
        canvas.getContext("2d")?.strokeRect(x, y, 20, 20);
      });
      document.removeEventListener(
        "keydown",
        (e) => (text = handleTextMode(e, canvas.getContext("2d")!, img, text)),
      );
    }
  });

  const fileInput = document.getElementById(
    "file-input",
  ) as HTMLInputElement | null;
  if (!fileInput) return console.log("no file input found");

  fileInput.onchange = () => {
    textModeInput.removeAttribute("disabled");
    img.onload = () => handleImageLoading(img, canvas);

    if (!fileInput.files)
      return console.warn("fileInput on change called without a file uploaded");
    img.src = URL.createObjectURL(fileInput.files[0]); // Will trigger img onload
  };

  const button = document.getElementById("upgrade") as HTMLButtonElement;
  button.onclick = handleSendingUpgradeReq;
}

// ===============
function handleSendingUpgradeReq() {
  const socket = new WebSocket("ws://localhost:8080");

  socket.addEventListener("open", (event) => {
    socket.send("Hello Server!");
    console.log("Sent a socket back, with 'Hello Server!' ", event);
  });

  socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  const socketForm = document.getElementById("socket-form") as HTMLFormElement;
  socketForm.onsubmit = (e) => {
    e.preventDefault();
    const formInput = socketForm.children.namedItem(
      "socket-form-input",
    ) as HTMLInputElement;
    console.log(formInput);
    socket.send(formInput.value);
  };
}
