const button = document.getElementById("upgrade") as HTMLButtonElement;
button.onclick = handleSendingUpgradeReq;

function handleSendingUpgradeReq() {
  const socket = new WebSocket(
    location.href.replace("http", "ws").replace("https", "ws"),
  );

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
