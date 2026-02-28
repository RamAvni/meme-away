const CANVAS_MAX_WIDTH = 200;
const CANVAS_MAX_HEIGHT = 500;

// https://stackoverflow.com/a/14731922
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

function initCanvasContext(ctx) {
  ctx.font = "28px serif";
  ctx.fillStyle = "white";
}

// import { getMemes } from "./get-memes";
// import { keyboardListener } from "./keyboard-listener";

const canvas = document.getElementById("canvas");
let ctx;
const textModeInput = document.getElementById("text-mode-checkbox");

let text = "";
const img = new Image();

const fileInput = document.getElementById("file-input");
fileInput.onchange = () => {
  textModeInput.removeAttribute("disabled");
  img.onload = () => {
    const { width, height } = calculateAspectRatioFit(
      img.width,
      img.height,
      CANVAS_MAX_WIDTH,
      CANVAS_MAX_HEIGHT,
    );

    canvas.width = width;
    canvas.height = height;

    // NOTE: canvas' context gets reset on width/height change, so we initialize here.
    ctx = canvas.getContext("2d");
    initCanvasContext(ctx);

    ctx.drawImage(img, 0, 0, width, height);
  };

  img.src = URL.createObjectURL(fileInput.files[0]); // Will trigger img onload
};

// ======================

function logKeyboard(event) {
  console.log(event.key);

  switch (event.key) {
    case "Backspace":
      text = text.slice(0, -1);
      // redraw, in order to remove previous text
      // TODO: find a better way?
      img.onload();
      ctx.fillText(text, 10, 50);
      break;
    case " ":
      event.preventDefault(); // Prevents stuff like space triggers file input
    // Falls through!
    default:
      if (event.key.match(/^([a-z]|[A-Z]|\s)$/)) {
        console.log("text", text);
        text += event.key;
        ctx.fillText(text, 10, 50);
      }
      break;
  }
}

textModeInput.addEventListener("change", () => {
  if (textModeInput.checked) document.addEventListener("keydown", logKeyboard);
  else document.removeEventListener("keydown", logKeyboard);
});

// ===============================

// async function getMemes() {
//   const res = await fetch("https://imgflip.com/memetemplates?page=1");
//   console.log(res);
// }
//
// getMemes();
