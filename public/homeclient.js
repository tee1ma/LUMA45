function ConnectToServer() {
  const host = window.location.hostname;
  const port = window.location.port;
  ws = new WebSocket(`ws://${host}:${port}`);

  ws.addEventListener("message", (event) => {
    console.log(event.data);
    const games = JSON.parse(event.data);
    UpdateGameList(games);
  });
  ws.addEventListener("open", () => {
    console.log("Successfully connected to the server");
  });
}

function UpdateGameList(games) {

  //Remove old game list
  const table = document.getElementById("ServerList");
  table.innerHTML = "";

  //Create updated list
  games.forEach(game => {
    if (!game[2]) {
      const tr = document.createElement("tr");
      table.appendChild(tr);

      const name = document.createElement("td");
      name.innerText = game[0];
      tr.appendChild(name);

      const players = document.createElement("td");
      players.innerText = game[1];
      tr.appendChild(players);

      const a = document.createElement("a");
      a.href = "/game/" + game[0];
      const join = document.createElement("button");
      join.innerText = "Join";
      tr.appendChild(document.createElement("td").appendChild(a.appendChild(join)));
    }
  });  
}

ConnectToServer();
