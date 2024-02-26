const WebSocket = require("ws");

class GAME {
    constructor(id) {
        this.id = id;
        this.admin;
        this.maxPlayers = 10;

        this.hasStarted = false;
        this.round = null;

        this.server;
        this.players = [];

        this.wss = new WebSocket.WebSocketServer({ noServer: true });
        this.HandleWSS(this.wss);
    }
    isFull() { return this.players.length < this.maxPlayers; }

    HandleWSS(wss) {
        wss.on("connection", (ws, socket) => {
            if (this.isFull()) {
                console.log("Connection denied. Server is full!");
                socket.destroy();
            } else {
                console.log()
                const newPlayer = new PLAYER(ws);
                this.players.push(player);

                ws.on("close", () => {
                    console.log("Player left the server");
                    this.players.splice(this.players.findIndex((player) => player === newPlayer), 1);
                });

                ws.on("message", (message) => {
                    console.log("new message recieved:", message);
                });

            }
        })
    }
}
class PLAYER {
    constructor(ws){
        this.ws = ws;
    }
}

module.exports = GAME;