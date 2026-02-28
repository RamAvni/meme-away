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

function initCanvasContext(ctx: CanvasRenderingContext2D) {
  ctx.font = "28px serif";
  ctx.fillStyle = "white";
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

  const textModeInput = document.getElementById(
    "text-mode-checkbox",
  ) as HTMLInputElement | null;
  if (!textModeInput) return console.log("no text mode input found");
  textModeInput.addEventListener("change", () => {
    if (textModeInput.checked)
      document.addEventListener(
        "keydown",
        (e) => (text = logKeyboard(e, canvas.getContext("2d")!, img, text)),
      );
    else
      document.removeEventListener(
        "keydown",
        (e) => (text = logKeyboard(e, canvas.getContext("2d")!, img, text)),
      );
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
}

// ======================

function logKeyboard(
  event: KeyboardEvent,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  text: string,
) {
  console.log(event.key);

  switch (event.key) {
    case "Backspace":
      text = text.slice(0, -1);
      // redraw, in order to remove previous text
      // TODO: find a better way?
      // @ts-ignore -- We Expect that img.onload() does not take parameters.
      img.onload();
      ctx.fillText(text, 10, 50);
      break;
    case " ":
      event.preventDefault(); // Prevents stuff like space triggers file input
    // Falls through!
    default:
      if (event.key.match(/^([a-z]|[A-Z]|\s)$/)) {
        text += event.key;
        ctx.fillText(text, 10, 50);
      }
      break;
  }
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
