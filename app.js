const express = require("express");
const http = require("http");
const GAME = require("./game");

let games = [];

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
    if (!games.includes((game) => game.id === id)) {
        const game = new GAME(id);
        games.push(game);
        res.redirect("/game/" + game.id);
    } else {
        res.redirect("/home");
    }
});

app.get("/game/:id", (req, res) => {
    const id = req.params.id;
    const game = games.find((game) => game.id === id);
    if (game && !game.isFull()) {
        res.render("game", game);
    } else {
        res.redirect("/home");
    }
});

app.use((req, res) => {
    res.redirect("/home");
});

server.on("upgrade", (req, socket, head) => {
    const id = request.url.slice(1);
    const game = games.find((game) => game.id === id);
    game.server.handleUpgrade(req, socket, head, (ws) => {
        game.server.emit("connection", ws, socket);
    });
})

const port = 80;
server.listen(port, () => {
    console.log("Server running on port", port)
});