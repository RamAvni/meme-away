function handleSendingUpgradeReq() {
  const socket = new WebSocket(location.href.replace(/http[s]?/, "ws"));

  socket.addEventListener("open", (event) => {
    socket.send("Hello Server!");
    console.log("Sent a socket back, with 'Hello Server!' ", event);
  });

  socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
    const playersContainer = document.getElementById("players");
    const playerArr = JSON.parse(event.data);
    if (Array.isArray(playerArr)) {
      const playerButtons = playerArr.map((player) => {
        const playerDiv = document.createElement("button");
        playerDiv.innerText = player.name;
        return playerDiv;
      });
      playersContainer?.replaceChildren(...playerButtons);
    }
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  return socket;
}

function main() {
  const socket = handleSendingUpgradeReq();

  const socketForm = document.getElementById("socket-form") as HTMLFormElement;
  socketForm.onsubmit = (e) => {
    e.preventDefault();
    const formInput = socketForm.children.namedItem(
      "socket-form-input",
    ) as HTMLInputElement;
    console.log(formInput);
    socket.send(JSON.stringify({ name: formInput.value }));
  };
}

main();
