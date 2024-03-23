const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const LOBBY = require("./lobby");

let games = [];
const homews = new WebSocket.WebSocketServer({ noServer: true });

function UpdateGameList() {
  let gameinfo = [];
  games.forEach(game => {
    gameinfo.push([game.id, game.players.length + "/" + game.maxPlayers, game.hasStarted]);
  });
  homews.clients.forEach(ws => {
    ws.send(JSON.stringify(gameinfo));
  });
}

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  console.log(`New ${req.method} request to ${req.path} by ${req.ip}`);
  next();
});

app.get("/home", (req, res) => {
  res.sendFile("./views/home.html", { root: __dirname });
});

app.post("/create", (req, res) => {
  const id = req.body.id.replaceAll(/\s/g, "").replaceAll(" ", "");
  const mode = req.body.mode;
  if (games.some(game => game.id === id) || games.length > 20 || id.length < 2 || id.length > 16 || id == null) {
    res.redirect("/home");
  } else {
    const game = new LOBBY(id, mode, games);
    console.log(`New game (${game.id}) created`);
    games.push(game);
    res.redirect("/game/" + game.id);
    UpdateGameList();
  }
});

app.get("/game/:id", (req, res) => {
  const id = req.params.id;
  const game = games.find((game) => game.id === id);
  if (game && !game.IsFull() && !game.hasStarted) {
    res.sendFile("./views/game.html", { root: __dirname });
  } else {
    res.redirect("/home");
  }
});

app.use((req, res) => {
  res.redirect("/home");
});

server.on("upgrade", (req, socket, head) => {
  const id = req.url.slice(1);
  const game = games.find((game) => game.id === id);
  if (game) {
    game.wss.handleUpgrade(req, socket, head, (ws) => {
      game.wss.emit("connection", ws, socket);
    });
    UpdateGameList();
  } else {
    homews.handleUpgrade(req, socket, head, (ws) => {});
    UpdateGameList();
  }
})

const port = 80;
server.listen(port, () => {
  console.log("Server running on port", port);
  setInterval(UpdateGameList, 10000);
});
