const WebSocket = require("ws");

class GAME {
    constructor(id) {
        this.id = id;
        this.maxPlayers = 10;
        this.players = [];
        this.wss = new WebSocket.WebSocketServer({ noServer: true });
        this.HandleWSS(this.wss);
    }
    IsFull() { return this.players.length >= this.maxPlayers; }

    HandleWSS(wss) {
        wss.on("connection", (ws, socket) => {
            if (this.IsFull()) {
                console.log("Connection denied. Server is full!");
                socket.destroy();
            } else {
                console.log()
                const newPlayer = new PLAYER(ws);
                this.players.push(newPlayer);

                ws.on("close", () => {
                    console.log("Player left the server");
                    this.players.splice(this.players.findIndex((player) => player === newPlayer), 1);
                    if (this.players.length === 0) {
                        //Close the server here
                    }
                });

                ws.on("message", (message) => {
                    console.log(`(${this.id}) new message recieved: ${message}`);
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