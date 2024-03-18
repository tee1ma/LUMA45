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
  const tbody = document.getElementsByTagName("tbody")[0];
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  //Create updated list
  games.forEach(game => {
    if (game[2]) {
      const tr = document.createElement("tr");
      tbody.appendChild(tr);
      const name = document.createElement("td");
      name.innerText = game[0];
      tr.appendChild(name);
      const players = document.createElement("td");
      players.innerText = game[1];
      tr.appendChild(players);
      const link = document.createElement("a");
      link.innerText = "Join";
      link.href = "/game/" + game[0];
      tr.appendChild(document.createElement("td").appendChild(link));

    }
  });  
}

ConnectToServer();
