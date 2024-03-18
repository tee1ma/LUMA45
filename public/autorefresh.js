function ConnectToServer() {
  const host = window.location.hostname;
  const port = window.location.port;
  ws = new WebSocket(`ws://${host}:${port}`);

  ws.addEventListener("message", (event) => {
    console.log(event.data);
    const games = JSON.parse(event.data);
    UpdateGameList(games);
  });
}

function UpdateGameList(games) {
  
}

ConnectToServer();