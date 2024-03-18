const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const GAME = require("./game");

let games = [];
const homews = new WebSocket.WebSocketServer({ noServer: true });

function UpdateGameList() {
  homews.server.clients.forEach(ws => {
    console.log("Sent message to all clients");
    ws.send("HELLO MOTHERFUCKER");
  });
}

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  console.log(`New ${req.method} request to ${req.path} by ${req.ip}`);
  next();
});

app.get("/home", (req, res) => {
  res.render("home", { games });
});

app.post("/create", (req, res) => {
  const id = req.body.id.replaceAll(/\s/g, "").replaceAll(" ", "");
  if (games.some(game => game.id === id) || games.length > 20 || id.length < 2) {
    res.redirect("/home");
  } else {
    const game = new GAME(id, games);
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
    res.render("game", game);
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
  } else {
    homews.handleUpgrade(req, socket, head, (ws) => {
      homews.emit("connection", ws, socket);
    });
  }
})

const port = 80;
server.listen(port, () => {
  console.log("Server running on port", port)
});
